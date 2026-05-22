import { getDatabasePool } from '../config/db.js';
import { assertExists, buildAppError } from '../utils/dbGuards.js';
import { env } from '../config/env.js';

const pool = getDatabasePool();

const buildError = (message, statusCode = 400, errors = []) =>
  buildAppError(message, statusCode, errors);

const buildDatabaseError = (error) => {
  if (error?.code === 'ER_DUP_ENTRY') {
    const duplicateKey = String(error?.message || '');
    if (duplicateKey.includes('PRIMARY')) {
      return buildError('This student already has an allocation', 400, [
        { field: 'student_id', message: 'This student already has an allocation' },
      ]);
    }

    if (duplicateKey.includes('uq_room_bed')) {
      return buildError('This bed is already assigned in the selected room', 400, [
        { field: 'bed_id', message: 'This bed is already assigned in the selected room' },
      ]);
    }

    return buildError('Allocation already exists for this student or bed', 400, [
      { field: 'student_id', message: 'Allocation already exists for this student or bed' },
    ]);
  }

  if (error?.code === 'ER_NO_REFERENCED_ROW_2') {
    return buildError('The selected student or room does not exist', 400, [
      { field: 'student_id', message: 'The selected student or room does not exist' },
    ]);
  }

  return error.statusCode ? error : buildError(`Database operation failed: ${error.message}`, 500);
};

const validateId = (id, field = 'id') => {
  if (!Number.isInteger(id) || id <= 0) {
    throw buildError(`${field} must be a positive integer`, 400, [{ field, message: `${field} must be a positive integer` }]);
  }
};

const normalizeDate = (value, field, required = true) => {
  if (value === undefined || value === null || value === '') {
    if (required) {
      throw buildError(`${field} is required`, 400, [{ field, message: `${field} is required` }]);
    }
    return null;
  }

  const normalized = String(value).trim();
  if (Number.isNaN(Date.parse(normalized))) {
    throw buildError(`${field} must be a valid date`, 400, [{ field, message: `${field} must be a valid date` }]);
  }

  return normalized;
};

const parseEnumValues = (columnType) => {
  const matches = String(columnType).match(/'((?:[^'\\]|\\.)*)'/g) || [];
  return matches.map((item) => item.slice(1, -1).replace(/\\'/g, "'"));
};

const loadAllocationBedMetadataFromInformationSchema = async () => {
  // SQL Injection Prevention Applied
  const [rows] = await pool.execute(
    `
      SELECT column_type
      FROM information_schema.columns
      WHERE table_schema = ?
        AND table_name = ?
        AND column_name = ?
      LIMIT 1
    `,
    [env.db.name, 'Allocation', 'bed_id'],
  );

  return rows[0]?.column_type ? parseEnumValues(rows[0].column_type) : [];
};

const loadAllocationBedMetadataFromShowColumns = async () => {
  // SQL Injection Prevention Applied
  const [rows] = await pool.query('SHOW COLUMNS FROM Allocation');
  const bedColumn = rows.find((row) => row.Field === 'bed_id');
  return bedColumn ? parseEnumValues(bedColumn.Type) : [];
};

const getAllowedBeds = async () => {
  let bedIds = await loadAllocationBedMetadataFromInformationSchema();
  if (!bedIds.length) {
    bedIds = await loadAllocationBedMetadataFromShowColumns();
  }

  if (!bedIds.length) {
    throw buildError('Allocation bed metadata could not be loaded', 500);
  }

  return bedIds;
};

const normalizeBedId = (value, allowedBeds) => {
  const normalized = String(value ?? '').trim();
  if (!allowedBeds.includes(normalized)) {
    throw buildError(`bed_id must be one of: ${allowedBeds.join(', ')}`, 400, [{ field: 'bed_id', message: `bed_id must be one of: ${allowedBeds.join(', ')}` }]);
  }
  return normalized;
};

const normalizePayload = async (payload) => {
  const allowedBeds = await getAllowedBeds();
  const studentId = Number(payload.student_id ?? payload.studentId);
  const roomId = Number(payload.room_id ?? payload.roomId);
  const bedId = normalizeBedId(payload.bed_id ?? payload.bedId, allowedBeds);
  const allocatedDate = normalizeDate(payload.allocated_date ?? payload.date, 'allocated_date');
  const vacatedDate = normalizeDate(payload.vacated_date ?? payload.vacatedDate, 'vacated_date', false);
  const status = payload.status === 'Vacated' || vacatedDate ? 'Vacated' : 'Active';

  validateId(studentId, 'student_id');
  validateId(roomId, 'room_id');

  if (vacatedDate && new Date(vacatedDate) < new Date(allocatedDate)) {
    throw buildError('vacated_date cannot be earlier than allocated_date', 400, [{ field: 'vacated_date', message: 'vacated_date cannot be earlier than allocated_date' }]);
  }

  return {
    student_id: studentId,
    room_id: roomId,
    bed_id: bedId,
    allocated_date: allocatedDate,
    vacated_date: status === 'Vacated' ? (vacatedDate || new Date().toISOString().slice(0, 10)) : null,
    status,
  };
};

const select = `
  SELECT
    a.student_id,
    a.room_id,
    a.bed_id,
    a.allocated_date,
    a.vacated_date,
    s.full_name AS student_name,
    r.room_number,
    r.capacity,
    r.hostel_id,
    h.hostel_name
  FROM Allocation a
  LEFT JOIN Student s ON s.student_id = a.student_id
  LEFT JOIN Room r ON r.room_id = a.room_id
  LEFT JOIN Hostel h ON h.hostel_id = r.hostel_id
`;

const serialize = (row) => ({
  student_id: row.student_id,
  room_id: row.room_id,
  bed_id: row.bed_id,
  allocated_date: row.allocated_date,
  vacated_date: row.vacated_date,
  student_name: row.student_name,
  room_number: row.room_number,
  room_capacity: Number(row.capacity || 0),
  hostel_id: row.hostel_id,
  hostel_name: row.hostel_name,
  status: row.vacated_date ? 'Vacated' : 'Active',
  id: row.student_id,
  studentId: row.student_id,
  roomId: row.room_id,
  bedId: row.bed_id,
  date: row.allocated_date,
  student: row.student_name,
  room: row.room_number,
  hostelId: row.hostel_id,
});

const getAllocationByStudentId = async (connection, studentId) => {
  // SQL Injection Prevention Applied
  const [rows] = await connection.query(`${select} WHERE a.student_id = ?`, [studentId]);
  return rows[0] || null;
};

const assertRoomCapacityAllowsBed = async (connection, roomId, bedId) => {
  // SQL Injection Prevention Applied
  const [rows] = await connection.execute(
    `
      SELECT capacity
      FROM Room
      WHERE room_id = ?
      LIMIT 1
    `,
    [roomId],
  );

  const capacity = Number(rows[0]?.capacity || 0);
  if (!capacity) {
    throw buildError('Room does not exist', 400, [{ field: 'room_id', message: 'Room does not exist' }]);
  }

  if (Number(bedId) > capacity) {
    throw buildError(`bed_id ${bedId} exceeds this room's capacity (${capacity})`, 400, [{ field: 'bed_id', message: `bed_id ${bedId} exceeds this room's capacity (${capacity})` }]);
  }
};

const assertBedIsAvailable = async (connection, roomId, bedId, ignoreStudentId = null) => {
  const params = [roomId, bedId];
  let sql = `
    SELECT student_id
    FROM Allocation
    WHERE room_id = ?
      AND bed_id = ?
      AND vacated_date IS NULL
  `;

  if (ignoreStudentId !== null) {
    sql += ' AND student_id <> ?';
    params.push(ignoreStudentId);
  }

  sql += ' LIMIT 1';

  // SQL Injection Prevention Applied
  const [rows] = await connection.execute(sql, params);
  if (rows.length > 0) {
    throw buildError('This bed is already assigned in the selected room', 400, [{ field: 'bed_id', message: 'This bed is already assigned in the selected room' }]);
  }
};

const assertStudentCanBeAllocated = async (connection, studentId, ignoreExisting = false) => {
  const existing = await getAllocationByStudentId(connection, studentId);

  if (!existing) {
    return;
  }

  if (ignoreExisting) {
    return;
  }

  throw buildError('This student already has an allocation', 400, [{ field: 'student_id', message: 'This student already has an allocation' }]);
};

export const getAllocations = async ({ hostelId }) => {
  const params = [];
  let where = '';

  if (hostelId) {
    validateId(hostelId, 'hostelId');
    where = ' WHERE r.hostel_id = ?';
    params.push(hostelId);
  }

  // SQL Injection Prevention Applied
  const [rows] = await pool.query(`${select}${where} ORDER BY a.vacated_date IS NULL DESC, a.allocated_date DESC, a.student_id ASC`, params);
  return rows.map(serialize);
};

export const getAllocationMetadata = async () => ({
  bedIds: await getAllowedBeds(),
});

export const createAllocation = async (payload) => {
  const normalizedPayload = await normalizePayload(payload);
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    await assertExists(connection, 'Student', 'student_id', normalizedPayload.student_id, 'Student');
    await assertExists(connection, 'Room', 'room_id', normalizedPayload.room_id, 'Room');
    await assertStudentCanBeAllocated(connection, normalizedPayload.student_id, false);
    await assertRoomCapacityAllowsBed(connection, normalizedPayload.room_id, normalizedPayload.bed_id);
    await assertBedIsAvailable(connection, normalizedPayload.room_id, normalizedPayload.bed_id);

    // SQL Injection Prevention Applied
    await connection.execute(
      `
        INSERT INTO Allocation (
          student_id,
          room_id,
          bed_id,
          allocated_date,
          vacated_date
        ) VALUES (?, ?, ?, ?, ?)
      `,
      [
        normalizedPayload.student_id,
        normalizedPayload.room_id,
        normalizedPayload.bed_id,
        normalizedPayload.allocated_date,
        normalizedPayload.vacated_date,
      ],
    );

    const created = await getAllocationByStudentId(connection, normalizedPayload.student_id);
    await connection.commit();
    return serialize(created);
  } catch (error) {
    await connection.rollback();
    throw buildDatabaseError(error);
  } finally {
    connection.release();
  }
};

export const updateAllocation = async (studentId, payload) => {
  validateId(studentId, 'student_id');
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const current = await getAllocationByStudentId(connection, studentId);

    if (!current) {
      throw buildError('Allocation not found', 404, [{ field: 'student_id', message: 'Allocation not found' }]);
    }

    const normalizedPayload = await normalizePayload({
      student_id: studentId,
      room_id: payload.room_id ?? payload.roomId ?? current.room_id,
      bed_id: payload.bed_id ?? payload.bedId ?? current.bed_id,
      allocated_date: payload.allocated_date ?? payload.date ?? current.allocated_date,
      vacated_date: payload.vacated_date ?? payload.vacatedDate ?? current.vacated_date,
      status: payload.status ?? ((payload.vacated_date ?? payload.vacatedDate) ? 'Vacated' : (current.vacated_date ? 'Vacated' : 'Active')),
    });

    await assertExists(connection, 'Student', 'student_id', studentId, 'Student');
    await assertExists(connection, 'Room', 'room_id', normalizedPayload.room_id, 'Room');
    await assertRoomCapacityAllowsBed(connection, normalizedPayload.room_id, normalizedPayload.bed_id);
    await assertBedIsAvailable(connection, normalizedPayload.room_id, normalizedPayload.bed_id, studentId);

    // SQL Injection Prevention Applied
    await connection.execute(
      `
        UPDATE Allocation
        SET
          room_id = ?,
          bed_id = ?,
          allocated_date = ?,
          vacated_date = ?
        WHERE student_id = ?
      `,
      [
        normalizedPayload.room_id,
        normalizedPayload.bed_id,
        normalizedPayload.allocated_date,
        normalizedPayload.vacated_date,
        studentId,
      ],
    );

    const updated = await getAllocationByStudentId(connection, studentId);
    await connection.commit();
    return serialize(updated);
  } catch (error) {
    await connection.rollback();
    throw buildDatabaseError(error);
  } finally {
    connection.release();
  }
};

export const deleteAllocation = async (studentId) => {
  validateId(studentId, 'student_id');
  const connection = await pool.getConnection();

  try {
    const existing = await getAllocationByStudentId(connection, studentId);
    if (!existing) {
      throw buildError('Allocation not found', 404, [{ field: 'student_id', message: 'Allocation not found' }]);
    }

    // SQL Injection Prevention Applied
    await connection.execute('DELETE FROM Allocation WHERE student_id = ?', [studentId]);
    return serialize(existing);
  } catch (error) {
    throw buildDatabaseError(error);
  } finally {
    connection.release();
  }
};
