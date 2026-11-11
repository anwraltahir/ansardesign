import fs from 'fs';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

async function runMigration() {
  console.log('🔄 Starting PostgreSQL Schema Migration for Ansar Smart Design Platform...');

  const schemaPath = path.join(process.cwd(), 'server', 'schema.sql');
  if (!fs.existsSync(schemaPath)) {
    console.error('❌ Schema file not found at:', schemaPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(schemaPath, 'utf-8');

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    host: process.env.PGHOST || '127.0.0.1',
    port: parseInt(process.env.PGPORT || '5432', 10),
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE || 'ansar_design_db',
  });

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL. Executing schema...');
    await client.query(sql);
    console.log('🎉 Database schema migration completed successfully!');
    await client.end();
  } catch (err: any) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

runMigration();
