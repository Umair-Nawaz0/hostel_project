import 'dotenv/config';
import { lookup } from 'node:dns/promises';
import mysql from 'mysql2/promise';

const { address: resolvedHost } = await lookup(process.env.DB_HOST, { family: 4 });

const baseConfig = {
  host: resolvedHost,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectTimeout: 10000,
};

const connectionConfig =
  process.env.DB_SSL === 'true'
    ? {
        ...baseConfig,
        ssl: { rejectUnauthorized: true },
      }
    : baseConfig;

let connection;

try {
  console.log(`Resolved IPv4: ${resolvedHost}`);
  connection = await mysql.createConnection(connectionConfig);
  const [[result]] = await connection.query('SELECT 1 AS connection_ok');

  if (result.connection_ok === 1) {
    console.log('RDS connection successful: SELECT 1 passed');
  } else {
    console.error('RDS test failed: unexpected SELECT 1 result');
    process.exitCode = 1;
  }
} catch (error) {
  console.error(`Resolved IPv4: ${resolvedHost}`);
  console.error(`RDS connection failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  if (connection) {
    await connection.end();
  }
}
