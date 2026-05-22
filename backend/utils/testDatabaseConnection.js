import { getDatabaseConnectionInfo, getDatabasePool } from '../config/db.js';

export const testDatabaseConnection = async () => {
  const pool = getDatabasePool();
  const connectionInfo = getDatabaseConnectionInfo();

  try {
    const connection = await pool.getConnection();

    try {
      const [[healthCheck]] = await connection.query('SELECT 1 AS connection_ok');

      return {
        success: true,
        status: 'Connected',
        message: `Database Connected Successfully (${connectionInfo.originalHost} -> ${connectionInfo.host}:${connectionInfo.port}/${connectionInfo.database}, ssl=${connectionInfo.sslEnabled ? 'enabled' : 'disabled'})`,
        queryTest: healthCheck.connection_ok === 1,
      };
    } finally {
      connection.release();
    }
  } catch (error) {
    return {
      success: false,
      status: 'Disconnected',
      message: `Database connection failed: ${error.message}`,
      code: error.code || 'UNKNOWN_DATABASE_ERROR',
      details: {
        errno: error.errno ?? null,
        sqlState: error.sqlState ?? null,
        host: connectionInfo.host,
        originalHost: connectionInfo.originalHost,
        port: connectionInfo.port,
        database: connectionInfo.database,
        sslEnabled: connectionInfo.sslEnabled,
        connectTimeout: connectionInfo.connectTimeout,
      },
      queryTest: false,
    };
  }
};
