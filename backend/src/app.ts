import 'reflect-metadata';
import express, { Express } from 'express';
import { config } from './config';
import { initializeDatabase, closeDatabase } from './database/connection';
import { initializeModels } from './services/ml/inference';
import { corsMiddleware } from './middleware/cors';
import { securityHeaders } from './middleware/securityHeaders';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { apiRateLimiter } from './middleware/rateLimiter';
import { logger } from './utils/logger';
import authRoutes from './routes/auth';
import diagnosisRoutes from './routes/diagnosis';
import prescriptionRoutes from './routes/prescription';
import reminderRoutes from './routes/reminders';
import doctorRoutes from './routes/doctor';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const app: Express = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(corsMiddleware);
app.use(securityHeaders);
app.use(requestLogger);

// Ensure uploads and logs directories exist
const uploadsDir = join(process.cwd(), 'uploads');
const logsDir = join(process.cwd(), 'logs');
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
}
if (!existsSync(logsDir)) {
  mkdirSync(logsDir, { recursive: true });
}

// Serve uploaded files
app.use('/uploads', express.static(uploadsDir));

// Health check endpoint (before rate limiting)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.environment,
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
    },
  });
});

// Apply rate limiting to API routes only
app.use(apiRateLimiter);

// API routes
app.use(`${config.apiV1Prefix}/auth`, authRoutes);
app.use(`${config.apiV1Prefix}/diagnosis`, diagnosisRoutes);
app.use(`${config.apiV1Prefix}/prescription`, prescriptionRoutes);
app.use(`${config.apiV1Prefix}/reminders`, reminderRoutes);
app.use(`${config.apiV1Prefix}/doctor`, doctorRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Startup function
async function startServer(): Promise<void> {
  try {
    // Initialize database
    await initializeDatabase();

    // Initialize ML models
    await initializeModels();

    // Start server
    app.listen(config.port, config.host, () => {
      logger.info('🚀 Server started', {
        environment: config.environment,
        host: config.host,
        port: config.port,
        apiPrefix: config.apiV1Prefix,
      });
    });
  } catch (error) {
    logger.error('❌ Failed to start server', { error });
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  await closeDatabase();
  logger.info('Database connection closed');
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  await closeDatabase();
  logger.info('Database connection closed');
  process.exit(0);
});

// Start server if this file is run directly
if (require.main === module) {
  startServer();
}

export default app;

