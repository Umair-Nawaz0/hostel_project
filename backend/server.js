import express from 'express';
import cors from 'cors';

import apiRoutes from './routes/index.js';
import { closeDatabasePool } from './config/db.js';
import { notFoundMiddleware, errorMiddleware } from './middleware/errorMiddleware.js';
import { sanitizeRequestMiddleware } from './middleware/validationMiddleware.js';
import { env } from './config/env.js';
import { formatShutdownLog, formatStartupLog } from './utils/logger.js';
import { testDatabaseConnection } from './utils/testDatabaseConnection.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(sanitizeRequestMiddleware);

app.use('/api', apiRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

let httpServer;

const startServer = async () => {
  const databaseResult = await testDatabaseConnection();

  if (databaseResult.success) {
    console.log(databaseResult.message);
    console.log(`Connection Probe: SELECT 1 ${databaseResult.queryTest ? 'passed' : 'failed'}`);
  } else {
    console.error(databaseResult.message);
    console.error(
      `Database Error Details: code=${databaseResult.code}, errno=${databaseResult.details.errno}, sqlState=${databaseResult.details.sqlState}, host=${databaseResult.details.host}, port=${databaseResult.details.port}, database=${databaseResult.details.database}, sslEnabled=${databaseResult.details.sslEnabled}, connectTimeout=${databaseResult.details.connectTimeout}`,
    );
  }

  httpServer = app.listen(env.port, () => {
    console.log(
      formatStartupLog({
        port: env.port,
        nodeEnv: env.nodeEnv,
        dbStatus: databaseResult.status,
        dbMessage: databaseResult.message,
      }),
    );
  });

  httpServer.on('error', (error) => {
    console.error(`Server startup failed: ${error.message}`);
  });
};

const shutdownGracefully = async (signal) => {
  console.log(formatShutdownLog(signal));

  try {
    if (httpServer) {
      await new Promise((resolve, reject) => {
        httpServer.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });
    }

    await closeDatabasePool();
    console.log('Graceful shutdown completed');
  } catch (error) {
    console.error(`Graceful shutdown failed: ${error.message}`);
  } finally {
    process.exit(0);
  }
};

process.on('SIGINT', () => {
  void shutdownGracefully('SIGINT');
});

process.on('SIGTERM', () => {
  void shutdownGracefully('SIGTERM');
});

process.on('unhandledRejection', (error) => {
  console.error(`Unhandled promise rejection: ${error.message}`);
});

process.on('uncaughtException', (error) => {
  console.error(`Uncaught exception: ${error.message}`);
});

void startServer();
