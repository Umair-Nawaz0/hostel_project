import { getDatabasePool } from '../config/db.js';
import { assertCompositeUnique, assertExists, assertUnique, buildAppError } from '../utils/dbGuards.js';
import { sanitizeString } from '../utils/security.js';
import { env } from '../config/env.js';

const pool = getDatabasePool();

const buildError = (message, statusCode = 400, errors = []) =>
  buildAppError(message, statusCode, errors);

const buildDatabaseError = (error) => {
  if (error?.code === 'ER_DUP_ENTRY') {
    const duplicateKey = String(error?.message || '');
    if (duplicateKey.includes('uq_room_number')) {
      return buildError('Room number already exists in another hostel', 400, [{ field: 'room_number', message: 'Room number already exists in another hostel' }]);
    }

    if (duplicateKey.includes('uq_room')) {
      return buildError('Room number already exists for the selected hostel', 400, [{ field: 'room_number', message: 'Room number already exists for the selected hostel' }]);
    }

    return buildError('Room number already exists', 400, [{ field: 'room_number', message: 'Room number already exists' }]);
  }

  if (error?.code === 'ER_ROW_IS_REFERENCED_2') {
    return buildError('This room cannot be deleted because allocation records still reference it', 400, [{ field: 'room_id', message: 'This room cannot be deleted because allocation records still reference it' }]);
  }

  if (error?.code === 'ER_NO_REFERENCED_ROW_2') {
    return buildError('The selected hostel does not exist', 400, [{ field: 'hostel_id', message: 'The selected hostel does not exist' }]);
  }

  return error.statusCode ? error : buildError(`Database operation failed: ${error.message}`, 500);
};

const validateId = (id, field = 'id') => {
  if (!Number.isInteger(id) || id <= 0) {
    throw buildError(`${field} must be a positive integer`, 400, [{ field, message: `${field} must be a positive integer` }]);
  }
};

const parseEnumValues = (columnType) => {
  const matches = String(columnType).match(/'((?:[^'\\]|\\.)*)'/g) || [];
  return matches.map((value) => value.slice(1, -1).replace(/\\'/g, "'"));
};

const loadRoomEnumMetadataFromInformationSchema = async () => {
  // SQL Injection Prevention Applied
  const [rows] = await pool.execute(
    `
      SELECT column_name, column_type
      FROM information_schema.columns
      WHERE table_schema = ?
        AND table_name = ?
        AND column_name IN (?, ?)
      ORDER BY column_name ASC
    `,
    [env.db.name, 'Room', 'room_type', 'status'],
  );

  return rows.reduce((accumulator, row) => {
    accumulator[row.column_name] = parseEnumValues(row.column_type);
    return accumulator;
  }, {});
};

const loadRoomEnumMetadataFromShowColumns = async () => {
  // SQL Injection Prevention Applied
  const [rows] = await pool.query('SHOW COLUMNS FROM Room');

  return rows.reduce((accumulator, row) => {
    if (row.Field === 'room_type' || row.Field === 'status') {
      accumulator[row.Field] = parseEnumValues(row.Type);
    }
    return accumulator;
  }, {});
};

const getRoomEnumMetadata = async () => {
  try {
    let metadata = await loadRoomEnumMetadataFromInformationSchema();
    let roomTypes = Array.isArray(metadata.room_type) ? metadata.room_type : [];
    let roomStatuses = Array.isArray(metadata.status) ? metadata.status : [];

    if (!roomStatuses.length || !roomTypes.length) {
      metadata = await loadRoomEnumMetadataFromShowColumns();
      roomTypes = Array.isArray(metadata.room_type) ? metadata.room_type : [];
      roomStatuses = Array.isArray(metadata.status) ? metadata.status : [];
    }

    if (!roomStatuses.length) {
      throw buildError('Room status metadata could not be loaded', 500);
    }

    return { roomTypes, roomStatuses };
  } catch (error) {
    throw buildDatabaseError(error);
  }
};

const normalizeRoomSearch = (value) => {
  if (typeof value !== 'string') {
    return '';
  }

  return sanitizeString(value).replace(/\s+/g, '').toUpperCase();
};

const ROOM_NUMBER_REGEX = /^[A-Z]-\d{3}$/;

const normalizeRoomNumber = (value) => {
  const normalized = sanitizeString(String(value ?? ''))
    .toUpperCase()
    .replace(/\s*-\s*/g, '-')
    .replace(/\s+/g, '')
    .trim();

  if (!ROOM_NUMBER_REGEX.test(normalized)) {
    throw buildError('room_number must follow the format A-101', 400, [{ field: 'room_number', message: 'room_number must follow the format A-101' }]);
  }

  return normalized;
};

const parseRequiredInteger = (value, field, { min = 0 } = {}) => {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < min) {
    throw buildError(`${field} must be an integer`, 400, [{ field, message: `${field} must be an integer` }]);
  }

  return parsed;
};

const parsePositiveInteger = (value, field) => {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw buildError(`${field} must be a positive integer`, 400, [{ field, message: `${field} must be a positive integer` }]);
  }

  return parsed;
};

const parseMonthlyFee = (value) => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw buildError('monthly_fee must be a non-negative number', 400, [{ field: 'monthly_fee', message: 'monthly_fee must be a non-negative number' }]);
  }

  return parsed;
};

const normalizeOptionalRoomType = (value, allowedRoomTypes) => {
  if (value === undefined || value === null || String(value).trim() === '') {
    return null;
  }

  const normalized = sanitizeString(String(value));
  if (!allowedRoomTypes.includes(normalized)) {
    throw buildError(`room_type must be one of: ${allowedRoomTypes.join(', ')}`, 400, [{ field: 'room_type', message: `room_type must be one of: ${allowedRoomTypes.join(', ')}` }]);
  }

  return normalized;
};

const normalizeRequiredStatus = (value, allowedStatuses) => {
  const normalized = sanitizeString(String(value ?? ''));
  if (!allowedStatuses.includes(normalized)) {
    throw buildError(`status must be one of: ${allowedStatuses.join(', ')}`, 400, [{ field: 'status', message: `status must be one of: ${allowedStatuses.join(', ')}` }]);
  }

  return normalized;
};

const normalizePayload = async (payload) => {
  const { roomTypes, roomStatuses } = await getRoomEnumMetadata();
  const hostelId = parsePositiveInteger(payload.hostel_id ?? payload.hostelId, 'hostel_id');
  const roomNumber = normalizeRoomNumber(payload.room_number ?? payload.roomNumber);
  const floor = parseRequiredInteger(payload.floor, 'floor', { min: 0 });

  return {
    hostel_id: hostelId,
    room_number: roomNumber,
    floor,
    room_type: normalizeOptionalRoomType(payload.room_type ?? payload.roomType, roomTypes),
    capacity: parsePositiveInteger(payload.capacity, 'capacity'),
    monthly_fee: parseMonthlyFee(payload.monthly_fee ?? payload.monthlyFee),
    status: normalizeRequiredStatus(payload.status, roomStatuses),
  };
};

const roomSelect = `
  SELECT
    r.room_id,
    r.room_number,
    r.floor,
    r.room_type,
    r.capacity,
    r.monthly_fee,
    r.status,
    r.hostel_id,
    h.hostel_name,
    COUNT(DISTINCT CASE WHEN a.vacated_date IS NULL THEN a.student_id END) AS occupied_beds
  FROM Room r
  LEFT JOIN Hostel h ON h.hostel_id = r.hostel_id
  LEFT JOIN Allocation a ON a.room_id = r.room_id
`;

const roomGroup = `
  GROUP BY
    r.room_id,
    r.room_number,
    r.floor,
    r.room_type,
    r.capacity,
    r.monthly_fee,
    r.status,
    r.hostel_id,
    h.hostel_name
`;

const serialize = (row) => {
  const occupiedBeds = Number(row.occupied_beds || 0);
  const capacity = Number(row.capacity || 0);
  const availableBeds = Math.max(capacity - occupiedBeds, 0);

  return {
    room_id: row.room_id,
    room_number: row.room_number,
    floor: Number(row.floor),
    room_type: row.room_type,
    capacity,
    monthly_fee: Number(row.monthly_fee),
    status: row.status,
    hostel_id: row.hostel_id,
    hostel_name: row.hostel_name,
    occupied_beds: occupiedBeds,
    available_beds: availableBeds,
    id: row.room_id,
    hostelId: row.hostel_id,
    hostel: row.hostel_name,
    roomNumber: row.room_number,
    roomType: row.room_type,
    monthlyFee: Number(row.monthly_fee),
    occupiedBeds,
    availableBeds,
  };
};

const getByIdInternal = async (connection, roomId) => {
  // SQL Injection Prevention Applied
  const [rows] = await connection.query(`${roomSelect} WHERE r.room_id = ?${roomGroup}`, [roomId]);
  return rows[0] || null;
};

const assertRoomOccupancyFitsCapacity = async (connection, roomId, capacity) => {
  // SQL Injection Prevention Applied
  const [rows] = await connection.execute(
    `
      SELECT COUNT(DISTINCT student_id) AS occupied_beds
      FROM Allocation
      WHERE room_id = ?
        AND vacated_date IS NULL
    `,
    [roomId],
  );

  const occupiedBeds = Number(rows[0]?.occupied_beds || 0);
  if (capacity < occupiedBeds) {
    throw buildError(`capacity cannot be less than occupied beds (${occupiedBeds})`, 400, [{ field: 'capacity', message: `capacity cannot be less than occupied beds (${occupiedBeds})` }]);
  }
};

export const getRooms = async ({ hostelId, search }) => {
  const clauses = [];
  const params = [];

  if (hostelId) {
    validateId(hostelId, 'hostelId');
    clauses.push('r.hostel_id = ?');
    params.push(hostelId);
  }

  const normalizedSearch = normalizeRoomSearch(search);
  if (normalizedSearch) {
    clauses.push("REPLACE(UPPER(TRIM(r.room_number)), ' ', '') LIKE ?");
    params.push(`%${normalizedSearch}%`);
  }

  const where = clauses.length ? ` WHERE ${clauses.join(' AND ')}` : '';

  // SQL Injection Prevention Applied
  const [rows] = await pool.query(`${roomSelect}${where}${roomGroup} ORDER BY r.room_number ASC, r.room_id ASC`, params);
  return rows.map(serialize);
};

export const getRoomMetadata = async () => {
  const metadata = await getRoomEnumMetadata();
  return {
    roomTypes: metadata.roomTypes,
    roomStatuses: metadata.roomStatuses,
  };
};

export const createRoom = async (payload) => {
  const normalizedPayload = await normalizePayload(payload);

  try {
    await assertExists(pool, 'Hostel', 'hostel_id', normalizedPayload.hostel_id, 'Hostel');
    await assertUnique(pool, 'Room', 'room_number', normalizedPayload.room_number, 'Room number');
    await assertCompositeUnique(pool, 'Room', ['hostel_id', 'room_number'], [normalizedPayload.hostel_id, normalizedPayload.room_number], 'Room number');

    // SQL Injection Prevention Applied
    const [result] = await pool.execute(
      `
        INSERT INTO Room (
          room_number,
          floor,
          room_type,
          capacity,
          monthly_fee,
          status,
          hostel_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        normalizedPayload.room_number,
        normalizedPayload.floor,
        normalizedPayload.room_type,
        normalizedPayload.capacity,
        normalizedPayload.monthly_fee,
        normalizedPayload.status,
        normalizedPayload.hostel_id,
      ],
    );

    return serialize(await getByIdInternal(pool, result.insertId));
  } catch (error) {
    throw buildDatabaseError(error);
  }
};

export const updateRoom = async (roomId, payload) => {
  validateId(roomId, 'room_id');

  try {
    const existingRoom = await getByIdInternal(pool, roomId);
    if (!existingRoom) {
      throw buildError('Room not found', 404, [{ field: 'room_id', message: 'Room not found' }]);
    }

    const normalizedPayload = await normalizePayload(payload);

    await assertExists(pool, 'Hostel', 'hostel_id', normalizedPayload.hostel_id, 'Hostel');
    await assertUnique(pool, 'Room', 'room_number', normalizedPayload.room_number, 'Room number', 'room_id', roomId);
    await assertCompositeUnique(
      pool,
      'Room',
      ['hostel_id', 'room_number'],
      [normalizedPayload.hostel_id, normalizedPayload.room_number],
      'Room number',
      'room_id',
      roomId,
    );
    await assertRoomOccupancyFitsCapacity(pool, roomId, normalizedPayload.capacity);

    // SQL Injection Prevention Applied
    await pool.execute(
      `
        UPDATE Room
        SET
          room_number = ?,
          floor = ?,
          room_type = ?,
          capacity = ?,
          monthly_fee = ?,
          status = ?,
          hostel_id = ?
        WHERE room_id = ?
      `,
      [
        normalizedPayload.room_number,
        normalizedPayload.floor,
        normalizedPayload.room_type,
        normalizedPayload.capacity,
        normalizedPayload.monthly_fee,
        normalizedPayload.status,
        normalizedPayload.hostel_id,
        roomId,
      ],
    );

    return serialize(await getByIdInternal(pool, roomId));
  } catch (error) {
    throw buildDatabaseError(error);
  }
};

export const deleteRoom = async (roomId) => {
  validateId(roomId, 'room_id');

  try {
    const existingRoom = await getByIdInternal(pool, roomId);
    if (!existingRoom) {
      throw buildError('Room not found', 404, [{ field: 'room_id', message: 'Room not found' }]);
    }

    // SQL Injection Prevention Applied
    await pool.execute('DELETE FROM Room WHERE room_id = ?', [roomId]);
    return serialize(existingRoom);
  } catch (error) {
    throw buildDatabaseError(error);
  }
};
