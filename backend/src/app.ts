import 'reflect-metadata';
import express, { Express } from 'express';
import { config } from './config';
import { initializeDatabase, closeDatabase } from './database/connection';
import { initializeModels } from './services/ml/inference';
import { corsMiddleware } from './middleware/cors';
import { securityHeaders } from './middleware/securityHeaders';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import authRoutes from './routes/auth';
import diagnosisRoutes from './routes/diagnosis';
import prescriptionRoutes from './routes/prescription';
import reminderRoutes from './routes/reminders';
import doctorRoutes from './routes/doctor';
import { join } from 'path';

const app: Express = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(corsMiddleware);
app.use(securityHeaders);
app.use(requestLogger);

// Serve uploaded files
app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

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
      console.log('🚀 Server started');
      console.log(`📍 Environment: ${config.environment}`);
      console.log(`🌐 Server running at http://${config.host}:${config.port}`);
      console.log(`📡 API available at http://${config.host}:${config.port}${config.apiV1Prefix}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await closeDatabase();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await closeDatabase();
  process.exit(0);
});

// Start server if this file is run directly
if (require.main === module) {
  startServer();
}

export default app;

