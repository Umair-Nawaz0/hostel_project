const divider = '='.repeat(58);

export const formatStartupLog = ({ port, nodeEnv, dbStatus, dbMessage }) => {
  const startedAt = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  });
  const baseUrl = `http://localhost:${port}`;

  return [
    divider,
    'Hostel ERP Backend Started Successfully',
    divider,
    `Environment : ${nodeEnv}`,
    'Server Status : Running',
    `Database Status: ${dbStatus}`,
    `Database Info : ${dbMessage}`,
    `Server URL    : ${baseUrl}`,
    `API URL       : ${baseUrl}/api`,
    `Health Check  : ${baseUrl}/api/health`,
    `Started At  : ${startedAt}`,
    divider,
  ].join('\n');
};

export const formatShutdownLog = (signal) =>
  [
    divider,
    `Shutdown signal received: ${signal}`,
    'Closing server and database connections gracefully',
    divider,
  ].join('\n');
