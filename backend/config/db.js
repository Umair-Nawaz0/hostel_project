import { lookup } from 'node:dns/promises';
import mysql from 'mysql2/promise';

import { env } from './env.js';

const { address: resolvedHost } = await lookup(env.db.host, { family: 4 });

const basePoolConfig = {
  host: resolvedHost,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.name,
  connectTimeout: 10000,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

const poolConfig = env.db.ssl
  ? {
      ...basePoolConfig,
      ssl: { rejectUnauthorized: true },
    }
  : basePoolConfig;

export const dbPool = mysql.createPool(poolConfig);

export const getDatabasePool = () => dbPool;

export const getDatabaseConnectionInfo = () => ({
  host: resolvedHost,
  originalHost: env.db.host,
  port: env.db.port,
  database: env.db.name,
  sslEnabled: env.db.ssl,
  connectTimeout: poolConfig.connectTimeout,
});

export const closeDatabasePool = async () => {
  await dbPool.end();
};
