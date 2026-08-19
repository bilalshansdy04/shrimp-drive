import { createClient } from '@libsql/client';
import fs from 'fs';

const env = fs.readFileSync('d:/Projects/drive/shrimp-drive/.env', 'utf-8');
const dbUrlMatch = env.match(/TURSO_DATABASE_URL=(.*)/);
const tokenMatch = env.match(/TURSO_AUTH_TOKEN=(.*)/);

const client = createClient({
  url: dbUrlMatch[1].trim(),
  authToken: tokenMatch[1].trim(),
});

async function main() {
  try {
    await client.execute(`ALTER TABLE users ADD is_encryption_active integer DEFAULT 0 NOT NULL;`);
    console.log("Migration successful!");
  } catch (error) {
    console.error("Migration failed:", error);
  }
}
main();
