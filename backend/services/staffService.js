import { getDatabasePool } from '../config/db.js';
import { assertExists, assertUnique, buildAppError } from '../utils/dbGuards.js';
import { isValidEmail, isValidPhone, sanitizeString } from '../utils/security.js';

const pool = getDatabasePool();

const buildValidationError = (message, field = null) =>
  buildAppError(message, 400, field ? [{ field, message }] : []);

const validateId = (value, field = 'id') => {
  if (!Number.isInteger(value) || value <= 0) {
    throw buildValidationError(`${field} must be a positive integer`, field);
  }
};

const normalizeOptionalEmail = (value) => {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = sanitizeString(String(value));
  if (!normalized) {
    return null;
  }

  if (!isValidEmail(normalized)) {
    throw buildValidationError('email must be a valid email address', 'email');
  }

  return normalized;
};

const normalizeRequiredString = (value, field, maxLength) => {
  const normalized = sanitizeString(String(value ?? ''));
  if (!normalized) {
    throw buildValidationError(`${field} is required`, field);
  }

  if (maxLength && normalized.length > maxLength) {
    throw buildValidationError(`${field} must be at most ${maxLength} characters`, field);
  }

  return normalized;
};

const normalizePhone = (value) => {
  const normalized = normalizeRequiredString(value, 'phone', 20);
  if (!isValidPhone(normalized)) {
    throw buildValidationError('phone must be a valid phone number', 'phone');
  }
  return normalized;
};

const normalizeSalary = (value) => {
  const normalized = Number(value);
  if (!Number.isFinite(normalized) || normalized < 0) {
    throw buildValidationError('salary must be a non-negative number', 'salary');
  }
  return normalized;
};

const normalizeStaffPayload = (payload) => {
  const hostelId = Number(payload.hostel_id ?? payload.hostelId);
  validateId(hostelId, 'hostel_id');

  return {
    full_name: normalizeRequiredString(payload.full_name ?? payload.name, 'full_name', 100),
    role: normalizeRequiredString(payload.role, 'role', 60),
    phone: normalizePhone(payload.phone),
    email: normalizeOptionalEmail(payload.email),
    salary: normalizeSalary(payload.salary),
    hostel_id: hostelId,
  };
};

const staffSelect = `
  SELECT
    s.staff_id,
    s.full_name,
    s.role,
    s.phone,
    s.email,
    s.salary,
    s.hostel_id,
    h.hostel_name
  FROM Staff s
  LEFT JOIN Hostel h ON h.hostel_id = s.hostel_id
`;

const serializeStaff = (row) => ({
  staff_id: row.staff_id,
  full_name: row.full_name,
  role: row.role,
  phone: row.phone,
  email: row.email,
  salary: Number(row.salary),
  hostel_id: row.hostel_id,
  hostel_name: row.hostel_name,
  id: row.staff_id,
  name: row.full_name,
  hostelId: row.hostel_id,
  hostel: row.hostel_name,
});

const getStaffByIdInternal = async (connection, staffId) => {
  // SQL Injection Prevention Applied
  const [rows] = await connection.execute(`${staffSelect} WHERE s.staff_id = ?`, [staffId]);
  return rows[0] || null;
};

export const getStaff = async ({ hostelId = null, search = '' } = {}) => {
  const clauses = [];
  const params = [];
  const normalizedSearch = sanitizeString(String(search || '')).toLowerCase();

  if (hostelId !== null && hostelId !== undefined && hostelId !== '') {
    validateId(Number(hostelId), 'hostelId');
    clauses.push('s.hostel_id = ?');
    params.push(Number(hostelId));
  }

  if (normalizedSearch) {
    clauses.push(`
      (
        LOWER(s.full_name) LIKE ?
        OR LOWER(s.role) LIKE ?
        OR LOWER(COALESCE(s.email, '')) LIKE ?
        OR REPLACE(LOWER(s.phone), ' ', '') LIKE ?
      )
    `);
    params.push(`%${normalizedSearch}%`, `%${normalizedSearch}%`, `%${normalizedSearch}%`, `%${normalizedSearch.replace(/\s+/g, '')}%`);
  }

  const where = clauses.length ? ` WHERE ${clauses.join(' AND ')}` : '';

  // SQL Injection Prevention Applied
  const [rows] = await pool.query(`${staffSelect}${where} ORDER BY s.full_name ASC, s.staff_id DESC`, params);
  return rows.map(serializeStaff);
};

export const createStaff = async (payload) => {
  const normalizedPayload = normalizeStaffPayload(payload);

  await assertExists(pool, 'Hostel', 'hostel_id', normalizedPayload.hostel_id, 'Hostel');
  if (normalizedPayload.email) {
    await assertUnique(pool, 'Staff', 'email', normalizedPayload.email, 'Staff email');
  }

  // SQL Injection Prevention Applied
  const [result] = await pool.execute(
    `
      INSERT INTO Staff (
        full_name,
        role,
        phone,
        email,
        salary,
        shift,
        hostel_id
      ) VALUES (?, ?, ?, ?, ?, 'Morning', ?)
    `,
    [
      normalizedPayload.full_name,
      normalizedPayload.role,
      normalizedPayload.phone,
      normalizedPayload.email,
      normalizedPayload.salary,
      normalizedPayload.hostel_id,
    ],
  );

  return serializeStaff(await getStaffByIdInternal(pool, result.insertId));
};

export const updateStaff = async (staffId, payload) => {
  validateId(staffId, 'staff_id');
  const existingStaff = await getStaffByIdInternal(pool, staffId);

  if (!existingStaff) {
    throw buildAppError('Staff not found', 404, [{ field: 'staff_id', message: 'Staff not found' }]);
  }

  const normalizedPayload = normalizeStaffPayload(payload);
  await assertExists(pool, 'Hostel', 'hostel_id', normalizedPayload.hostel_id, 'Hostel');
  if (normalizedPayload.email) {
    await assertUnique(pool, 'Staff', 'email', normalizedPayload.email, 'Staff email', 'staff_id', staffId);
  }

  // SQL Injection Prevention Applied
  await pool.execute(
    `
      UPDATE Staff
      SET
        full_name = ?,
        role = ?,
        phone = ?,
        email = ?,
        salary = ?,
        hostel_id = ?
      WHERE staff_id = ?
    `,
    [
      normalizedPayload.full_name,
      normalizedPayload.role,
      normalizedPayload.phone,
      normalizedPayload.email,
      normalizedPayload.salary,
      normalizedPayload.hostel_id,
      staffId,
    ],
  );

  return serializeStaff(await getStaffByIdInternal(pool, staffId));
};

export const deleteStaff = async (staffId) => {
  validateId(staffId, 'staff_id');
  const existingStaff = await getStaffByIdInternal(pool, staffId);

  if (!existingStaff) {
    throw buildAppError('Staff not found', 404, [{ field: 'staff_id', message: 'Staff not found' }]);
  }

  // SQL Injection Prevention Applied
  await pool.execute('DELETE FROM Staff WHERE staff_id = ?', [staffId]);
  return serializeStaff(existingStaff);
};
