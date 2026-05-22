import { getDatabasePool } from '../config/db.js';
import { assertExists, buildAppError } from '../utils/dbGuards.js';

const pool = getDatabasePool();

const err = (message, statusCode = 400, errors = []) =>
  buildAppError(message, statusCode, errors);

const validateId = (id, field = 'id') => {
  if (!Number.isInteger(id) || id <= 0) {
    throw err(`${field} must be a positive integer`, 400, [{ field, message: `${field} must be a positive integer` }]);
  }
};

const select = `
  SELECT
    p.payment_id,
    p.student_id,
    p.amount,
    p.payment_date,
    p.due_date,
    p.month_year,
    p.method,
    p.status,
    p.remarks,
    s.full_name AS student_name,
    h.hostel_id,
    h.hostel_name
  FROM FeePayment p
  LEFT JOIN Student s ON s.student_id = p.student_id
  LEFT JOIN Allocation a ON a.student_id = s.student_id
  LEFT JOIN Room r ON r.room_id = a.room_id
  LEFT JOIN Hostel h ON h.hostel_id = r.hostel_id
`;

const serialize = (row) => ({
  payment_id: row.payment_id,
  student_id: row.student_id,
  amount: Number(row.amount),
  payment_date: row.payment_date,
  due_date: row.due_date,
  month_year: row.month_year,
  method: row.method,
  status: row.status,
  remarks: row.remarks,
  student_name: row.student_name,
  hostel_id: row.hostel_id,
  hostel_name: row.hostel_name,
  id: row.payment_id,
  date: row.payment_date,
  studentId: row.student_id,
  studentName: row.student_name,
  hostelId: row.hostel_id,
  hostelName: row.hostel_name,
});

export const getPayments = async ({ hostelId, status }) => {
  const clauses = [];
  const params = [];

  if (hostelId) {
    validateId(hostelId, 'hostelId');
    clauses.push('h.hostel_id = ?');
    params.push(hostelId);
  }

  if (status) {
    clauses.push('p.status = ?');
    params.push(status);
  }

  const where = clauses.length ? ` WHERE ${clauses.join(' AND ')}` : '';

  // SQL Injection Prevention Applied
  const [rows] = await pool.query(`${select}${where} ORDER BY p.payment_id DESC`, params);
  return rows.map(serialize);
};

export const createPayment = async (payload) => {
  const studentId = Number(payload.student_id ?? payload.studentId);
  validateId(studentId, 'student_id');

  const amount = Number(payload.amount);
  if (Number.isNaN(amount) || amount <= 0) {
    throw err('amount must be greater than zero', 400, [{ field: 'amount', message: 'amount must be greater than zero' }]);
  }

  const payDate = payload.payment_date || payload.date || new Date().toISOString().slice(0, 10);
  await assertExists(pool, 'Student', 'student_id', studentId, 'Student');

  // SQL Injection Prevention Applied
  const [res] = await pool.execute(
    `
      INSERT INTO FeePayment (
        student_id,
        amount,
        payment_date,
        due_date,
        month_year,
        method,
        status,
        remarks
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      studentId,
      amount,
      payDate,
      payload.due_date || payDate,
      payload.month_year || payDate.slice(0, 7),
      payload.method || 'Cash',
      payload.status || 'Paid',
      payload.remarks || null,
    ],
  );

  // SQL Injection Prevention Applied
  const [rows] = await pool.query(`${select} WHERE p.payment_id = ?`, [res.insertId]);
  return serialize(rows[0]);
};

export const updatePayment = async (id, payload) => {
  validateId(id, 'payment_id');

  // SQL Injection Prevention Applied
  const [rows] = await pool.query(`${select} WHERE p.payment_id = ?`, [id]);
  const current = rows[0];
  if (!current) {
    throw err('Payment not found', 404, [{ field: 'payment_id', message: 'Payment not found' }]);
  }

  const studentId = Number(payload.student_id ?? payload.studentId ?? current.student_id);
  validateId(studentId, 'student_id');
  await assertExists(pool, 'Student', 'student_id', studentId, 'Student');

  // SQL Injection Prevention Applied
  await pool.execute(
    `
      UPDATE FeePayment
      SET
        student_id = ?,
        amount = ?,
        payment_date = ?,
        due_date = ?,
        month_year = ?,
        method = ?,
        status = ?,
        remarks = ?
      WHERE payment_id = ?
    `,
    [
      studentId,
      Number(payload.amount ?? current.amount),
      payload.payment_date || payload.date || current.payment_date,
      payload.due_date || current.due_date,
      payload.month_year || current.month_year,
      payload.method || current.method,
      payload.status || current.status,
      payload.remarks ?? current.remarks,
      id,
    ],
  );

  // SQL Injection Prevention Applied
  const [updated] = await pool.query(`${select} WHERE p.payment_id = ?`, [id]);
  return serialize(updated[0]);
};

export const deletePayment = async (id) => {
  validateId(id, 'payment_id');

  // SQL Injection Prevention Applied
  const [rows] = await pool.query(`${select} WHERE p.payment_id = ?`, [id]);
  if (!rows[0]) {
    throw err('Payment not found', 404, [{ field: 'payment_id', message: 'Payment not found' }]);
  }

  // SQL Injection Prevention Applied
  await pool.execute('DELETE FROM FeePayment WHERE payment_id = ?', [id]);
  return serialize(rows[0]);
};
