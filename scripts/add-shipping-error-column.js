const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function main() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL database.');

    await client.query(`
      ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "shippingError" TEXT;
    `);
    console.log('✓ Successfully verified/added "shippingError" column to "Order" table.');
  } catch (e) {
    console.error('Database query error:', e.message);
  } finally {
    await client.end();
  }
}

main();
