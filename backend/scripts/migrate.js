import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrate() {
  try {
    console.log('🔄 Running database migrations...');
    
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schema = await fs.readFile(schemaPath, 'utf-8');

    // Execute the schema in one batch to preserve function/triggers blocks
    await pool.query(schema);

    console.log('✅ Database migrations completed successfully');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
