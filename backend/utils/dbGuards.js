import { schemaDefinition } from '../config/schemaDefinition.js';

// SQL Injection Prevention Applied:
// Guard queries use parameterized placeholders only, and identifier access is
// restricted to a fixed allowlist derived from the schema definition.

const TABLE_COLUMNS = {
  Hostel: ['hostel_id', ...schemaDefinition.Hostel.required, ...schemaDefinition.Hostel.nullable],
  Warden: ['warden_id', ...schemaDefinition.Warden.required, ...schemaDefinition.Warden.nullable],
  Student: ['student_id', ...schemaDefinition.Student.required, ...schemaDefinition.Student.nullable],
  Room: ['room_id', ...schemaDefinition.Room.required, ...schemaDefinition.Room.nullable],
  Staff: ['staff_id', ...schemaDefinition.Staff.required, ...schemaDefinition.Staff.nullable, 'shift'],
  FeePayment: ['payment_id', ...schemaDefinition.FeePayment.required, ...schemaDefinition.FeePayment.nullable],
  Allocation: ['student_id', 'room_id', 'bed_id', 'allocated_date', 'vacated_date'],
};

const assertValidIdentifier = (table, columns) => {
  if (!TABLE_COLUMNS[table]) {
    throw buildAppError('Unsupported database guard table', 500);
  }

  columns.forEach((column) => {
    if (!TABLE_COLUMNS[table].includes(column)) {
      throw buildAppError('Unsupported database guard column', 500);
    }
  });
};

export const buildAppError = (message, statusCode = 400, errors = []) =>
  Object.assign(new Error(message), { statusCode, errors });

export const assertExists = async (connection, table, idColumn, idValue, label) => {
  assertValidIdentifier(table, [idColumn]);
  const [rows] = await connection.execute(
    `SELECT 1 AS record_exists FROM ${table} WHERE ${idColumn} = ? LIMIT 1`,
    [idValue],
  );
  if (rows.length === 0) {
    throw buildAppError(`${label} does not exist`, 400, [{ field: idColumn, message: `${label} does not exist` }]);
  }
};

export const assertUnique = async (connection, table, column, value, label, ignoreIdColumn = null, ignoreIdValue = null) => {
  assertValidIdentifier(table, ignoreIdColumn ? [column, ignoreIdColumn] : [column]);
  let sql = `SELECT 1 AS record_exists FROM ${table} WHERE ${column} = ?`;
  const params = [value];
  if (ignoreIdColumn && ignoreIdValue) {
    sql += ` AND ${ignoreIdColumn} <> ?`;
    params.push(ignoreIdValue);
  }
  sql += ' LIMIT 1';
  const [rows] = await connection.execute(sql, params);
  if (rows.length > 0) {
    throw buildAppError(`${label} already exists`, 400, [{ field: column, message: `${label} already exists` }]);
  }
};

export const assertCompositeUnique = async (
  connection,
  table,
  columns,
  values,
  label,
  ignoreIdColumn = null,
  ignoreIdValue = null,
) => {
  assertValidIdentifier(table, ignoreIdColumn ? [...columns, ignoreIdColumn] : columns);
  let sql = `SELECT 1 AS record_exists FROM ${table} WHERE ${columns.map((column) => `${column} = ?`).join(' AND ')}`;
  const params = [...values];
  if (ignoreIdColumn && ignoreIdValue) {
    sql += ` AND ${ignoreIdColumn} <> ?`;
    params.push(ignoreIdValue);
  }
  sql += ' LIMIT 1';
  const [rows] = await connection.execute(sql, params);
  if (rows.length > 0) {
    throw buildAppError(`${label} already exists`, 400, [{ field: columns.join(','), message: `${label} already exists` }]);
  }
};
