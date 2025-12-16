import { DataSource } from 'typeorm';
import { config } from '../config';
import { User } from '../models/User';
import { Diagnosis } from '../models/Diagnosis';
import { Prescription } from '../models/Prescription';
import { Reminder } from '../models/Reminder';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: config.databaseUrl,
  entities: [User, Diagnosis, Prescription, Reminder],
  synchronize: config.isDevelopment, // Only in development
  logging: false, // Disable verbose SQL query logging
  migrations: ['src/database/migrations/*.ts'],
});

export async function initializeDatabase(): Promise<void> {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connection initialized');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    if (config.isProduction) {
      throw error;
    }
  }
}

export async function closeDatabase(): Promise<void> {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
    console.log('✅ Database connection closed');
  }
}

