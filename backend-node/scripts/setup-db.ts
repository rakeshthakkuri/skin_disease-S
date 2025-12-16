import { Client } from 'pg';
import { config } from '../src/config';

async function setupDatabase() {
  // Extract database name from DATABASE_URL
  const dbUrl = config.databaseUrl;
  const dbName = dbUrl.split('/').pop()?.split('?')[0];
  
  if (!dbName) {
    console.error('❌ Could not extract database name from DATABASE_URL');
    process.exit(1);
  }

  // Connect to default 'postgres' database to create our database
  const adminUrl = dbUrl.replace(/\/[^/]*$/, '/postgres');
  const adminClient = new Client({
    connectionString: adminUrl,
  });

  try {
    await adminClient.connect();
    console.log('✅ Connected to PostgreSQL server');

    // Check if database exists
    const checkRes = await adminClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    if (checkRes.rowCount === 0) {
      console.log(`Creating database: ${dbName}...`);
      await adminClient.query(`CREATE DATABASE "${dbName}"`);
      console.log(`✅ Database "${dbName}" created successfully.`);
    } else {
      console.log(`✅ Database "${dbName}" already exists.`);
    }
  } catch (error: any) {
    console.error('❌ Database setup failed:', error.message);
    if (error.code === '42P04') {
      console.log(`   Database "${dbName}" already exists.`);
    } else {
      process.exit(1);
    }
  } finally {
    await adminClient.end();
  }
}

setupDatabase();

