import { DataSource } from 'typeorm';
import { config } from '../src/config';
import { User } from '../src/models/User';
import { Diagnosis } from '../src/models/Diagnosis';
import { Prescription } from '../src/models/Prescription';
import { Reminder } from '../src/models/Reminder';

/**
 * Reset database - drops all tables and recreates them
 * WARNING: This will delete all data!
 */
async function resetDatabase(): Promise<void> {
  // Create a minimal DataSource just for dropping tables
  const tempDataSource = new DataSource({
    type: 'postgres',
    url: config.databaseUrl,
    synchronize: false, // Don't synchronize on init
    logging: false,
  });

  try {
    await tempDataSource.initialize();
    console.log('✅ Connected to database');

    // Drop all tables using raw SQL
    console.log('🗑️  Dropping all tables...');
    const queryRunner = tempDataSource.createQueryRunner();
    
    // Drop tables in correct order (respecting foreign keys)
    const tables = ['reminders', 'prescriptions', 'diagnoses', 'users'];
    
    for (const table of tables) {
      try {
        await queryRunner.query(`DROP TABLE IF EXISTS "${table}" CASCADE`);
        console.log(`   ✓ Dropped table: ${table}`);
      } catch (error: any) {
        console.log(`   ⚠ Table ${table}: ${error.message}`);
      }
    }
    
    await queryRunner.release();
    await tempDataSource.destroy();
    console.log('✅ All tables dropped');

    // Now create fresh DataSource and synchronize
    console.log('🔨 Creating tables...');
    const freshDataSource = new DataSource({
      type: 'postgres',
      url: config.databaseUrl,
      entities: [User, Diagnosis, Prescription, Reminder],
      synchronize: true, // Now synchronize to create tables
      logging: false,
    });

    await freshDataSource.initialize();
    console.log('✅ All tables created');
    await freshDataSource.destroy();
    
    console.log('✅ Database reset complete');
  } catch (error: any) {
    console.error('❌ Database reset failed:', error.message);
    if (tempDataSource.isInitialized) {
      await tempDataSource.destroy();
    }
    process.exit(1);
  }
}

// Run reset
resetDatabase()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Reset failed:', error);
    process.exit(1);
  });

