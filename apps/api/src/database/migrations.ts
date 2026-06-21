import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../../../../.env") });

import db from "../db.js";

export async function runMigrations(): Promise<void> {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    // Enable uuid-ossp extension
    await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Words table
    await client.query(`
      CREATE TABLE IF NOT EXISTS words (
        id SERIAL PRIMARY KEY,
        word VARCHAR(255) UNIQUE NOT NULL
      )
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_words_word ON words (word)
    `);

    // Favorites table
    await client.query(`
      CREATE TABLE IF NOT EXISTS favorites (
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        word VARCHAR(255) NOT NULL,
        added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (user_id, word)
      )
    `);

    // History table
    await client.query(`
      CREATE TABLE IF NOT EXISTS history (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        word VARCHAR(255) NOT NULL,
        added_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_history_user_id ON history (user_id, added_at DESC)
    `);

    await client.query("COMMIT");
    console.log("✅ Migrations executed successfully");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    client.release();
  }
}

// Allow running directly: tsx src/database/migrations.ts
if (process.argv[1]?.includes("migrations")) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
