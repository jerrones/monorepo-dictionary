import { config } from "dotenv";
import { readFileSync } from "fs";
import { resolve } from "path";

config({ path: resolve(__dirname, "../../../../.env") });

import db from "../db.js";

const BATCH_SIZE = 1000;

async function seed(): Promise<void> {
  console.log("📖 Reading words dictionary...");

  const dictionaryPath = resolve(__dirname, "../../utils/words_dictionary.json");
  const raw = readFileSync(dictionaryPath, "utf-8");
  const dictionary: Record<string, number> = JSON.parse(raw);
  const words = Object.keys(dictionary);

  console.log(`📊 Found ${words.length} words to import`);

  const client = await db.connect();

  try {
    // Check if words already exist
    const existing = await client.query("SELECT COUNT(*) FROM words");
    const count = parseInt(existing.rows[0].count, 10);

    if (count > 0) {
      console.log(`⚠️  Words table already has ${count} entries. Skipping seed.`);
      return;
    }

    await client.query("BEGIN");

    let imported = 0;

    for (let i = 0; i < words.length; i += BATCH_SIZE) {
      const batch = words.slice(i, i + BATCH_SIZE);

      // Build bulk insert: INSERT INTO words (word) VALUES ($1), ($2), ...
      const placeholders = batch.map((_, idx) => `($${idx + 1})`).join(", ");
      const query = `INSERT INTO words (word) VALUES ${placeholders} ON CONFLICT (word) DO NOTHING`;

      await client.query(query, batch);

      imported += batch.length;

      if (imported % 10000 === 0 || imported === words.length) {
        console.log(`  ⏳ Imported ${imported}/${words.length} words...`);
      }
    }

    await client.query("COMMIT");
    console.log(`✅ Seed completed: ${imported} words imported`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Seed failed:", error);
    throw error;
  } finally {
    client.release();
  }
}

// Run directly: tsx src/database/seed.ts
seed()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
