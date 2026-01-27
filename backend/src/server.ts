import { env } from './config/env';
import app from './app';
import { logger } from './lib/logger';

const PORT = env.PORT;

app.listen(PORT, () => {
  logger.info({ port: PORT, env: env.NODE_ENV }, 'Servidor iniciado');
  logger.info(`API: http://localhost:${PORT}/api`);
  logger.info(`Admin: http://localhost:${PORT}/admin`);
  logger.info(`Health: http://localhost:${PORT}/api/health`);
});
