import { getDatabasePool } from '../config/db.js';
import { assertExists, assertUnique } from '../utils/dbGuards.js';
import { isNonEmpty, isValidEmail, isValidPhone, safeInteger } from '../utils/security.js';

const pool = getDatabasePool();
const HOSTEL_NAME_MIN_LENGTH = 3;
const HOSTEL_NAME_MAX_LENGTH = 120;
const CITY_MAX_LENGTH = 80;
const CONTACT_PHONE_MAX_LENGTH = 20;
const EMAIL_MAX_LENGTH = 100;

const hostelSelectQuery = `
  SELECT
    h.hostel_id,
    h.hostel_name,
    h.city,
    h.city AS location,
    h.address,
    h.total_rooms,
    h.total_rooms AS capacity,
    COALESCE(occupied_rooms_summary.occupied_rooms, 0) AS occupied_rooms,
    (h.total_rooms - COALESCE(occupied_rooms_summary.occupied_rooms, 0)) AS available_rooms,
    w.warden_id,
    w.full_name AS warden_name,
    w.phone AS warden_phone,
    w.email AS warden_email,
    h.contact_phone,
    h.email,
    h.established_yr
  FROM Hostel h
  LEFT JOIN Warden w ON w.warden_id = h.warden_id
  LEFT JOIN (
    SELECT
      r.hostel_id,
      COUNT(DISTINCT a.room_id) AS occupied_rooms
    FROM Allocation a
    INNER JOIN Room r ON r.room_id = a.room_id
    WHERE a.vacated_date IS NULL
    GROUP BY r.hostel_id
  ) AS occupied_rooms_summary ON occupied_rooms_summary.hostel_id = h.hostel_id
`;

const buildValidationError = (message) => Object.assign(new Error(message), { statusCode: 400 });
const buildNotFoundError = (message) => Object.assign(new Error(message), { statusCode: 404 });

const buildDatabaseError = (error) => {
  if (error.statusCode) {
    return error;
  }

  return Object.assign(new Error(`Database operation failed: ${error.message}`), { statusCode: 500 });
};

const normalizeOptionalText = (value) => {
  if (typeof value !== 'string') {
    return value ?? null;
  }

  const normalized = value.trim();
  return normalized ? normalized : null;
};

const serializeHostel = (hostel) => ({
  hostel_id: hostel.hostel_id,
  hostel_name: hostel.hostel_name,
  city: hostel.city,
  location: hostel.location,
  address: hostel.address,
  capacity: hostel.capacity,
  total_rooms: hostel.total_rooms,
  occupied_rooms: hostel.occupied_rooms,
  available_rooms: hostel.available_rooms,
  warden_id: hostel.warden_id,
  warden_name: hostel.warden_name,
  warden_phone: hostel.warden_phone,
  warden_email: hostel.warden_email,
  contact_phone: hostel.contact_phone,
  email: hostel.email,
  established_yr: hostel.established_yr,
  id: hostel.hostel_id,
  name: hostel.hostel_name,
  totalRooms: hostel.total_rooms,
  occupiedRooms: hostel.occupied_rooms,
  availableRooms: hostel.available_rooms,
  warden: hostel.warden_name,
  wardenPhone: hostel.warden_phone,
  wardenEmail: hostel.warden_email,
  contactPhone: hostel.contact_phone,
  establishedYear: hostel.established_yr,
});

const serializeWarden = (warden) => ({
  warden_id: warden.warden_id,
  warden_name: warden.warden_name,
  phone: warden.phone,
  assigned_hostel_id: warden.assigned_hostel_id,
  assigned_hostel_name: warden.assigned_hostel_name,
});

const validateHostelId = (hostelId) => {
  if (!Number.isInteger(hostelId) || hostelId <= 0) {
    throw buildValidationError('hostel id must be a positive integer');
  }
};

const normalizeHostelPayload = (payload, existingHostel = null) => {
  const normalizedWardenId = payload.warden_id === undefined
    ? existingHostel?.warden_id ?? null
    : (payload.warden_id === null || payload.warden_id === '' ? null : safeInteger(payload.warden_id));

  return {
    hostel_name: normalizeOptionalText(payload.hostel_name ?? payload.hostelName ?? payload.name) ?? existingHostel?.hostel_name ?? null,
    address: normalizeOptionalText(payload.address) ?? existingHostel?.address ?? null,
    city: normalizeOptionalText(payload.city ?? payload.location) ?? existingHostel?.city ?? null,
    total_rooms: Number(payload.total_rooms ?? payload.totalRooms ?? existingHostel?.total_rooms),
    contact_phone:
      normalizeOptionalText(payload.contact_phone ?? payload.contactPhone) ??
      existingHostel?.contact_phone ??
      null,
    email: normalizeOptionalText(payload.email) ?? existingHostel?.email ?? null,
    established_yr:
      payload.established_yr === undefined && payload.establishedYear === undefined
        ? existingHostel?.established_yr ?? null
        : (payload.established_yr ?? payload.establishedYear),
    warden_id: normalizedWardenId,
  };
};

const validateYear = (yearValue) => {
  if (yearValue === null || yearValue === undefined || yearValue === '') {
    return null;
  }

  const normalizedYear = Number(yearValue);

  if (!Number.isInteger(normalizedYear) || normalizedYear < 1901 || normalizedYear > 2155) {
    throw buildValidationError('established_yr must be a valid year');
  }

  return normalizedYear;
};

const validateHostelPayload = (payload) => {
  if (!isNonEmpty(payload.hostel_name || '')) {
    throw buildValidationError('hostel_name is required');
  }

  if (payload.hostel_name.length < HOSTEL_NAME_MIN_LENGTH || payload.hostel_name.length > HOSTEL_NAME_MAX_LENGTH) {
    throw buildValidationError(`hostel_name must be between ${HOSTEL_NAME_MIN_LENGTH} and ${HOSTEL_NAME_MAX_LENGTH} characters`);
  }

  if (!isNonEmpty(payload.address || '')) {
    throw buildValidationError('address is required');
  }

  if (!isNonEmpty(payload.city || '')) {
    throw buildValidationError('city is required');
  }

  if (payload.city.length > CITY_MAX_LENGTH) {
    throw buildValidationError(`city must be at most ${CITY_MAX_LENGTH} characters`);
  }

  if (!Number.isInteger(payload.total_rooms) || payload.total_rooms <= 0) {
    throw buildValidationError('total_rooms must be a positive integer');
  }

  if (!isNonEmpty(payload.contact_phone || '')) {
    throw buildValidationError('contact_phone is required');
  }

  if (payload.contact_phone.length > CONTACT_PHONE_MAX_LENGTH || !isValidPhone(payload.contact_phone)) {
    throw buildValidationError('contact_phone must be a valid phone number');
  }

  if (!isNonEmpty(payload.email || '')) {
    throw buildValidationError('email is required');
  }

  if (payload.email.length > EMAIL_MAX_LENGTH || !isValidEmail(payload.email)) {
    throw buildValidationError('email must be a valid email address');
  }

  if (payload.warden_id !== null && (!Number.isInteger(payload.warden_id) || payload.warden_id <= 0)) {
    throw buildValidationError('warden_id must be a positive integer or null');
  }

  payload.established_yr = validateYear(payload.established_yr);
};

const getHostelByIdInternal = async (connection, hostelId) => {
  const [rows] = await connection.query(`${hostelSelectQuery} WHERE h.hostel_id = ?`, [hostelId]);
  return rows[0] || null;
};

const assertValidWarden = async (connection, wardenId) => {
  if (wardenId === null) {
    return;
  }

  await assertExists(connection, 'Warden', 'warden_id', wardenId, 'Warden');
};

const assertWardenAvailability = async (connection, wardenId, hostelId = null) => {
  if (wardenId === null) {
    return;
  }

  const [rows] = await connection.execute(
    `
      SELECT hostel_id, hostel_name
      FROM Hostel
      WHERE warden_id = ?
        AND (? IS NULL OR hostel_id <> ?)
      LIMIT 1
    `,
    [wardenId, hostelId, hostelId],
  );

  if (rows.length > 0) {
    throw buildValidationError(`Selected warden is already assigned to ${rows[0].hostel_name}`);
  }
};

const assertRoomCapacityNotBelowOccupancy = async (connection, hostelId, totalRooms) => {
  const [rows] = await connection.execute(
    `
      SELECT COUNT(DISTINCT a.room_id) AS occupied_rooms
      FROM Allocation a
      INNER JOIN Room r ON r.room_id = a.room_id
      WHERE r.hostel_id = ?
        AND a.vacated_date IS NULL
    `,
    [hostelId],
  );

  const occupiedRooms = Number(rows[0]?.occupied_rooms || 0);

  if (totalRooms < occupiedRooms) {
    throw buildValidationError(`total_rooms cannot be less than occupied rooms (${occupiedRooms})`);
  }
};

export const getAllHostels = async () => {
  // SQL Injection Prevention Applied: parameterized reads remain used for filtered queries.
  const [rows] = await pool.query(`${hostelSelectQuery} ORDER BY h.hostel_id DESC`);
  return rows.map(serializeHostel);
};

export const getAvailableWardens = async () => {
  // SQL Injection Prevention Applied: read-only query with no string interpolation from user input.
  const [rows] = await pool.query(`
    SELECT
      w.warden_id,
      w.full_name AS warden_name,
      w.phone,
      h.hostel_id AS assigned_hostel_id,
      h.hostel_name AS assigned_hostel_name
    FROM Warden w
    LEFT JOIN Hostel h ON h.warden_id = w.warden_id
    ORDER BY w.full_name ASC
  `);

  return rows.map(serializeWarden);
};

export const getHostelById = async (hostelId) => {
  validateHostelId(hostelId);

  const hostel = await getHostelByIdInternal(pool, hostelId);

  if (!hostel) {
    throw buildNotFoundError('Hostel not found');
  }

  return serializeHostel(hostel);
};

export const createHostel = async (payload) => {
  const normalizedPayload = normalizeHostelPayload(payload);
  validateHostelPayload(normalizedPayload);

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    await assertUnique(connection, 'Hostel', 'email', normalizedPayload.email, 'Hostel email');
    await assertValidWarden(connection, normalizedPayload.warden_id);
    await assertWardenAvailability(connection, normalizedPayload.warden_id);

    // SQL Injection Prevention Applied: validated payload is inserted with mysql placeholders only.
    const [hostelResult] = await connection.execute(
      `
        INSERT INTO Hostel (
          hostel_name,
          address,
          city,
          total_rooms,
          contact_phone,
          email,
          established_yr,
          warden_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        normalizedPayload.hostel_name,
        normalizedPayload.address,
        normalizedPayload.city,
        normalizedPayload.total_rooms,
        normalizedPayload.contact_phone,
        normalizedPayload.email,
        normalizedPayload.established_yr,
        normalizedPayload.warden_id,
      ],
    );

    const createdHostel = await getHostelByIdInternal(connection, hostelResult.insertId);
    await connection.commit();

    return serializeHostel(createdHostel);
  } catch (error) {
    await connection.rollback();
    throw buildDatabaseError(error);
  } finally {
    connection.release();
  }
};

export const updateHostel = async (hostelId, payload) => {
  validateHostelId(hostelId);

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const existingHostel = await getHostelByIdInternal(connection, hostelId);

    if (!existingHostel) {
      throw buildNotFoundError('Hostel not found');
    }

    const normalizedPayload = normalizeHostelPayload(payload, existingHostel);
    validateHostelPayload(normalizedPayload);
    await assertUnique(connection, 'Hostel', 'email', normalizedPayload.email, 'Hostel email', 'hostel_id', hostelId);
    await assertValidWarden(connection, normalizedPayload.warden_id);
    await assertWardenAvailability(connection, normalizedPayload.warden_id, hostelId);
    await assertRoomCapacityNotBelowOccupancy(connection, hostelId, normalizedPayload.total_rooms);

    // Secure parameterized update query
    await connection.execute(
      `
        UPDATE Hostel
        SET
          hostel_name = ?,
          address = ?,
          city = ?,
          total_rooms = ?,
          contact_phone = ?,
          email = ?,
          established_yr = ?,
          warden_id = ?
        WHERE hostel_id = ?
      `,
      [
        normalizedPayload.hostel_name,
        normalizedPayload.address,
        normalizedPayload.city,
        normalizedPayload.total_rooms,
        normalizedPayload.contact_phone,
        normalizedPayload.email,
        normalizedPayload.established_yr,
        normalizedPayload.warden_id,
        hostelId,
      ],
    );

    const updatedHostel = await getHostelByIdInternal(connection, hostelId);
    await connection.commit();

    return serializeHostel(updatedHostel);
  } catch (error) {
    await connection.rollback();
    throw buildDatabaseError(error);
  } finally {
    connection.release();
  }
};

export const deleteHostel = async (hostelId) => {
  validateHostelId(hostelId);

  const [rows] = await pool.query(`${hostelSelectQuery} WHERE h.hostel_id = ?`, [hostelId]);
  const existingHostel = rows[0];

  if (!existingHostel) {
    throw buildNotFoundError('Hostel not found');
  }

  // SQL Injection Prevention Applied: delete uses a parameterized identifier value.
  await pool.execute('DELETE FROM Hostel WHERE hostel_id = ?', [hostelId]);
  return serializeHostel(existingHostel);
};
