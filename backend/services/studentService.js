import { getDatabasePool } from '../config/db.js';
import { assertUnique } from '../utils/dbGuards.js';
import { sanitizeString, isValidEmail, isValidPhone } from '../utils/security.js';
import { env } from '../config/env.js';

const pool = getDatabasePool();
const STUDENT_NAME_MIN_LENGTH = 2;
const STUDENT_NAME_MAX_LENGTH = 100;
const ROLL_NUMBER_MIN_LENGTH = 3;
const ROLL_NUMBER_MAX_LENGTH = 20;
const DEPARTMENT_MAX_LENGTH = 100;
const PROGRAM_MAX_LENGTH = 60;
const GUARDIAN_NAME_MAX_LENGTH = 100;
const PHONE_MAX_LENGTH = 20;

const buildError = (message, statusCode = 400, errors = []) => Object.assign(new Error(message), { statusCode, errors });
const buildDatabaseError = (error) => error.statusCode ? error : buildError(`Database operation failed: ${error.message}`, 500);

const studentSelect = `
  SELECT
    s.student_id,
    s.roll_number,
    s.full_name,
    s.email,
    s.phone,
    s.department,
    s.program,
    s.guardian_name,
    s.guardian_phone,
    s.join_date,
    s.status,
    r.room_id,
    r.room_number,
    h.hostel_id,
    h.hostel_name
  FROM Student s
  LEFT JOIN Allocation a ON a.student_id = s.student_id AND a.vacated_date IS NULL
  LEFT JOIN Room r ON r.room_id = a.room_id
  LEFT JOIN Hostel h ON h.hostel_id = r.hostel_id
`;

const normalizeRequiredText = (value, field, minLength = 1, maxLength = null) => {
  if (typeof value !== 'string') {
    throw buildError('Validation failed', 400, [{ field, message: `${field} is required` }]);
  }

  const normalized = sanitizeString(value).replace(/\s+/g, ' ').trim();
  if (!normalized) {
    throw buildError('Validation failed', 400, [{ field, message: `${field} cannot be blank` }]);
  }

  if (normalized.length < minLength) {
    throw buildError('Validation failed', 400, [{ field, message: `${field} must be at least ${minLength} characters` }]);
  }

  if (maxLength && normalized.length > maxLength) {
    throw buildError('Validation failed', 400, [{ field, message: `${field} must be at most ${maxLength} characters` }]);
  }

  return normalized;
};

const normalizeOptionalText = (value, maxLength, field) => {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    throw buildError('Validation failed', 400, [{ field, message: `${field} must be a string` }]);
  }

  const normalized = sanitizeString(value).replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return null;
  }

  if (normalized.length > maxLength) {
    throw buildError('Validation failed', 400, [{ field, message: `${field} must be at most ${maxLength} characters` }]);
  }

  return normalized;
};

const normalizeJoinDate = (value) => {
  if (typeof value !== 'string' || !value.trim()) {
    throw buildError('Validation failed', 400, [{ field: 'join_date', message: 'join_date is required' }]);
  }

  const normalized = value.trim();
  if (Number.isNaN(Date.parse(normalized))) {
    throw buildError('Validation failed', 400, [{ field: 'join_date', message: 'join_date must be a valid date' }]);
  }

  return normalized;
};

const parseEnumValues = (columnType) => {
  const matches = String(columnType).match(/'((?:[^'\\]|\\.)*)'/g) || [];
  return matches.map((value) => value.slice(1, -1).replace(/\\'/g, "'"));
};

const loadStudentStatusMetadata = async () => {
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
    [env.db.name, 'Student', 'status'],
  );

  let statuses = parseEnumValues(rows[0]?.column_type);

  if (!statuses.length) {
    // SQL Injection Prevention Applied
    const [fallbackRows] = await pool.query('SHOW COLUMNS FROM Student');
    statuses = parseEnumValues(fallbackRows.find((row) => row.Field === 'status')?.Type);
  }

  if (!statuses.length) {
    throw buildError('Student status metadata could not be loaded', 500);
  }

  return statuses;
};

const normalizeStatus = async (value) => {
  const statuses = await loadStudentStatusMetadata();

  if (!statuses.includes(value)) {
    throw buildError('Validation failed', 400, [{ field: 'status', message: `status must be one of: ${statuses.join(', ')}` }]);
  }

  return value;
};

const normalizePayload = async (payload) => {
  const rollNumber = normalizeRequiredText(payload.roll_number ?? payload.rollNumber, 'roll_number', ROLL_NUMBER_MIN_LENGTH, ROLL_NUMBER_MAX_LENGTH);
  const fullName = normalizeRequiredText(payload.full_name ?? payload.fullName ?? payload.name, 'full_name', STUDENT_NAME_MIN_LENGTH, STUDENT_NAME_MAX_LENGTH);
  const email = normalizeRequiredText(payload.email, 'email', 5, 100);
  const phone = normalizeRequiredText(payload.phone, 'phone', 7, PHONE_MAX_LENGTH);
  const department = normalizeRequiredText(payload.department, 'department', 2, DEPARTMENT_MAX_LENGTH);
  const program = normalizeRequiredText(payload.program, 'program', 2, PROGRAM_MAX_LENGTH);
  const guardianName = normalizeOptionalText(payload.guardian_name ?? payload.guardianName, GUARDIAN_NAME_MAX_LENGTH, 'guardian_name');
  const guardianPhone = normalizeOptionalText(payload.guardian_phone ?? payload.guardianPhone, PHONE_MAX_LENGTH, 'guardian_phone');
  const joinDate = normalizeJoinDate(payload.join_date ?? payload.joinDate ?? payload.checkInDate);
  const status = await normalizeStatus(payload.status);

  if (!isValidEmail(email)) {
    throw buildError('Validation failed', 400, [{ field: 'email', message: 'email must be a valid email address' }]);
  }

  if (!isValidPhone(phone)) {
    throw buildError('Validation failed', 400, [{ field: 'phone', message: 'phone must be a valid phone number' }]);
  }

  if (guardianPhone !== null && !isValidPhone(guardianPhone)) {
    throw buildError('Validation failed', 400, [{ field: 'guardian_phone', message: 'guardian_phone must be a valid phone number' }]);
  }

  return {
    roll_number: rollNumber,
    full_name: fullName,
    email,
    phone,
    department,
    program,
    guardian_name: guardianName,
    guardian_phone: guardianPhone,
    join_date: joinDate,
    status,
  };
};

const serializeStudent = (row) => ({
  student_id: row.student_id,
  roll_number: row.roll_number,
  full_name: row.full_name,
  email: row.email,
  phone: row.phone,
  department: row.department,
  program: row.program,
  guardian_name: row.guardian_name,
  guardian_phone: row.guardian_phone,
  join_date: row.join_date,
  status: row.status,
  hostel_id: row.hostel_id,
  hostel_name: row.hostel_name,
  room_id: row.room_id,
  room_number: row.room_number,
  id: row.student_id,
  name: row.full_name,
  hostelId: row.hostel_id,
  hostel: row.hostel_name,
  roomId: row.room_id,
  roomName: row.room_number,
  checkInDate: row.join_date,
});

const getStudentByIdInternal = async (connection, studentId) => {
  const [rows] = await connection.query(`${studentSelect} WHERE s.student_id = ?`, [studentId]);
  return rows[0] || null;
};

const validateId = (id, field = 'id') => {
  if (!Number.isInteger(id) || id <= 0) {
    throw buildError(`${field} must be a positive integer`);
  }
};

export const getStudentMetadata = async () => {
  return {
    statuses: await loadStudentStatusMetadata(),
  };
};

export const getStudents = async ({ hostelId, roomId }) => {
  const clauses = [];
  const params = [];

  if (hostelId) {
    validateId(hostelId, 'hostelId');
    clauses.push('h.hostel_id = ?');
    params.push(hostelId);
  }

  if (roomId) {
    validateId(roomId, 'roomId');
    clauses.push('r.room_id = ?');
    params.push(roomId);
  }

  const where = clauses.length ? ` WHERE ${clauses.join(' AND ')}` : '';

  // SQL Injection Prevention Applied
  const [rows] = await pool.query(`${studentSelect}${where} ORDER BY s.student_id DESC`, params);
  return rows.map(serializeStudent);
};

export const createStudent = async (payload) => {
  const normalizedPayload = await normalizePayload(payload);
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    await assertUnique(connection, 'Student', 'roll_number', normalizedPayload.roll_number, 'Student roll number');
    await assertUnique(connection, 'Student', 'email', normalizedPayload.email, 'Student email');

    // SQL Injection Prevention Applied
    const [result] = await connection.execute(
      `
        INSERT INTO Student (
          roll_number,
          full_name,
          email,
          phone,
          department,
          program,
          guardian_name,
          guardian_phone,
          join_date,
          status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        normalizedPayload.roll_number,
        normalizedPayload.full_name,
        normalizedPayload.email,
        normalizedPayload.phone,
        normalizedPayload.department,
        normalizedPayload.program,
        normalizedPayload.guardian_name,
        normalizedPayload.guardian_phone,
        normalizedPayload.join_date,
        normalizedPayload.status,
      ],
    );

    const createdStudent = await getStudentByIdInternal(connection, result.insertId);
    await connection.commit();
    return serializeStudent(createdStudent);
  } catch (error) {
    await connection.rollback();
    throw buildDatabaseError(error);
  } finally {
    connection.release();
  }
};

export const updateStudent = async (studentId, payload) => {
  validateId(studentId, 'student id');
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const existingStudent = await getStudentByIdInternal(connection, studentId);

    if (!existingStudent) {
      throw buildError('Student not found', 404);
    }

    const normalizedPayload = await normalizePayload(payload);

    await assertUnique(connection, 'Student', 'roll_number', normalizedPayload.roll_number, 'Student roll number', 'student_id', studentId);
    await assertUnique(connection, 'Student', 'email', normalizedPayload.email, 'Student email', 'student_id', studentId);

    // SQL Injection Prevention Applied
    await connection.execute(
      `
        UPDATE Student
        SET
          roll_number = ?,
          full_name = ?,
          email = ?,
          phone = ?,
          department = ?,
          program = ?,
          guardian_name = ?,
          guardian_phone = ?,
          join_date = ?,
          status = ?
        WHERE student_id = ?
      `,
      [
        normalizedPayload.roll_number,
        normalizedPayload.full_name,
        normalizedPayload.email,
        normalizedPayload.phone,
        normalizedPayload.department,
        normalizedPayload.program,
        normalizedPayload.guardian_name,
        normalizedPayload.guardian_phone,
        normalizedPayload.join_date,
        normalizedPayload.status,
        studentId,
      ],
    );

    const updatedStudent = await getStudentByIdInternal(connection, studentId);
    await connection.commit();
    return serializeStudent(updatedStudent);
  } catch (error) {
    await connection.rollback();
    throw buildDatabaseError(error);
  } finally {
    connection.release();
  }
};

export const deleteStudent = async (studentId) => {
  validateId(studentId, 'student id');
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const existingStudent = await getStudentByIdInternal(connection, studentId);

    if (!existingStudent) {
      throw buildError('Student not found', 404);
    }

    // SQL Injection Prevention Applied
    await connection.execute(
      'UPDATE Allocation SET vacated_date = CURDATE() WHERE student_id = ? AND vacated_date IS NULL',
      [studentId],
    );
    await connection.execute('DELETE FROM Student WHERE student_id = ?', [studentId]);

    await connection.commit();
    return serializeStudent(existingStudent);
  } catch (error) {
    await connection.rollback();
    throw buildDatabaseError(error);
  } finally {
    connection.release();
  }
};
