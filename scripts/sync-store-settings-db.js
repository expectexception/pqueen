const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function syncSettings() {
  const jsonPath = path.join(__dirname, '..', 'data', 'store-settings.json');
  const rawData = fs.readFileSync(jsonPath, 'utf-8');
  const parsed = JSON.parse(rawData);

  const client = new Client({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL.');

    const res = await client.query(
      `INSERT INTO "SystemSetting" ("key", "value", "updatedAt", "createdAt")
       VALUES ($1, $2, NOW(), NOW())
       ON CONFLICT ("key") DO UPDATE
       SET "value" = $2, "updatedAt" = NOW()
       RETURNING *;`,
      ['store_settings', JSON.stringify(parsed)]
    );

    console.log('✓ Store settings synchronized into database SystemSetting table.');
  } catch (err) {
    console.error('Sync error:', err);
  } finally {
    await client.end();
  }
}

syncSettings();
