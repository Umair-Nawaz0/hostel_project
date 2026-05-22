import { getDatabasePool } from '../config/db.js';
import { assertUnique, buildAppError } from '../utils/dbGuards.js';
import { isValidCnic, isValidEmail, isValidPhone, sanitizeString } from '../utils/security.js';

const pool = getDatabasePool();

const buildValidationError = (message, field = null) =>
  buildAppError(message, 400, field ? [{ field, message }] : []);

const validateId = (value, field = 'id') => {
  if (!Number.isInteger(value) || value <= 0) {
    throw buildValidationError(`${field} must be a positive integer`, field);
  }
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

const normalizeWardenPayload = (payload) => {
  const fullName = normalizeRequiredString(payload.full_name ?? payload.name, 'full_name', 100);
  const email = normalizeRequiredString(payload.email, 'email', 100);
  const phone = normalizeRequiredString(payload.phone, 'phone', 20);
  const cnic = normalizeRequiredString(payload.cnic, 'cnic', 15);

  if (!isValidEmail(email)) {
    throw buildValidationError('email must be a valid email address', 'email');
  }

  if (!isValidPhone(phone)) {
    throw buildValidationError('phone must be a valid phone number', 'phone');
  }

  if (!isValidCnic(cnic)) {
    throw buildValidationError('cnic must be a valid CNIC', 'cnic');
  }

  return {
    full_name: fullName,
    email,
    phone,
    cnic,
  };
};

const wardenSelect = `
  SELECT
    w.warden_id,
    w.full_name,
    w.email,
    w.phone,
    w.cnic,
    h.hostel_id AS assigned_hostel_id,
    h.hostel_name AS assigned_hostel_name
  FROM Warden w
  LEFT JOIN Hostel h ON h.warden_id = w.warden_id
`;

const serializeWarden = (row) => ({
  warden_id: row.warden_id,
  full_name: row.full_name,
  email: row.email,
  phone: row.phone,
  cnic: row.cnic,
  assigned_hostel_id: row.assigned_hostel_id,
  assigned_hostel_name: row.assigned_hostel_name,
  warden_name: row.full_name,
  id: row.warden_id,
  name: row.full_name,
  assignedHostelId: row.assigned_hostel_id,
  assignedHostelName: row.assigned_hostel_name,
});

const getWardenByIdInternal = async (connection, wardenId) => {
  // SQL Injection Prevention Applied
  const [rows] = await connection.execute(`${wardenSelect} WHERE w.warden_id = ?`, [wardenId]);
  return rows[0] || null;
};

export const getWardens = async ({ hostelId = null, search = '' } = {}) => {
  const clauses = [];
  const params = [];
  const normalizedSearch = sanitizeString(String(search || '')).toLowerCase();

  if (hostelId !== null && hostelId !== undefined && hostelId !== '') {
    validateId(Number(hostelId), 'hostelId');
    clauses.push('h.hostel_id = ?');
    params.push(Number(hostelId));
  }

  if (normalizedSearch) {
    clauses.push(`
      (
        LOWER(w.full_name) LIKE ?
        OR LOWER(w.email) LIKE ?
        OR REPLACE(LOWER(w.phone), ' ', '') LIKE ?
        OR REPLACE(LOWER(w.cnic), '-', '') LIKE ?
      )
    `);
    params.push(
      `%${normalizedSearch}%`,
      `%${normalizedSearch}%`,
      `%${normalizedSearch.replace(/\s+/g, '')}%`,
      `%${normalizedSearch.replace(/[\s-]+/g, '')}%`,
    );
  }

  const where = clauses.length ? ` WHERE ${clauses.join(' AND ')}` : '';

  // SQL Injection Prevention Applied
  const [rows] = await pool.query(`${wardenSelect}${where} ORDER BY w.full_name ASC, w.warden_id DESC`, params);
  return rows.map(serializeWarden);
};

export const createWarden = async (payload) => {
  const normalizedPayload = normalizeWardenPayload(payload);
  await assertUnique(pool, 'Warden', 'email', normalizedPayload.email, 'Warden email');
  await assertUnique(pool, 'Warden', 'cnic', normalizedPayload.cnic, 'Warden CNIC');

  // SQL Injection Prevention Applied
  const [result] = await pool.execute(
    `
      INSERT INTO Warden (
        full_name,
        email,
        phone,
        cnic
      ) VALUES (?, ?, ?, ?)
    `,
    [
      normalizedPayload.full_name,
      normalizedPayload.email,
      normalizedPayload.phone,
      normalizedPayload.cnic,
    ],
  );

  return serializeWarden(await getWardenByIdInternal(pool, result.insertId));
};

export const updateWarden = async (wardenId, payload) => {
  validateId(wardenId, 'warden_id');
  const existingWarden = await getWardenByIdInternal(pool, wardenId);

  if (!existingWarden) {
    throw buildAppError('Warden not found', 404, [{ field: 'warden_id', message: 'Warden not found' }]);
  }

  const normalizedPayload = normalizeWardenPayload(payload);
  await assertUnique(pool, 'Warden', 'email', normalizedPayload.email, 'Warden email', 'warden_id', wardenId);
  await assertUnique(pool, 'Warden', 'cnic', normalizedPayload.cnic, 'Warden CNIC', 'warden_id', wardenId);

  // SQL Injection Prevention Applied
  await pool.execute(
    `
      UPDATE Warden
      SET
        full_name = ?,
        email = ?,
        phone = ?,
        cnic = ?
      WHERE warden_id = ?
    `,
    [
      normalizedPayload.full_name,
      normalizedPayload.email,
      normalizedPayload.phone,
      normalizedPayload.cnic,
      wardenId,
    ],
  );

  return serializeWarden(await getWardenByIdInternal(pool, wardenId));
};

export const deleteWarden = async (wardenId) => {
  validateId(wardenId, 'warden_id');
  const existingWarden = await getWardenByIdInternal(pool, wardenId);

  if (!existingWarden) {
    throw buildAppError('Warden not found', 404, [{ field: 'warden_id', message: 'Warden not found' }]);
  }

  // SQL Injection Prevention Applied
  await pool.execute('DELETE FROM Warden WHERE warden_id = ?', [wardenId]);
  return serializeWarden(existingWarden);
};
