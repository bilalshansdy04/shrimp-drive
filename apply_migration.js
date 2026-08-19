import { createClient } from '@libsql/client';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
const dbUrlMatch = env.match(/TURSO_DATABASE_URL=(.*)/);
const tokenMatch = env.match(/TURSO_AUTH_TOKEN=(.*)/);

const client = createClient({
  url: dbUrlMatch[1].trim(),
  authToken: tokenMatch[1].trim(),
});

async function main() {
  try {
    await client.execute(`ALTER TABLE files ADD is_encrypted integer DEFAULT 0 NOT NULL;`);
    await client.execute(`ALTER TABLE invitation_codes ADD encryption_key text;`);
    await client.execute(`ALTER TABLE users ADD encryption_key text;`);
    console.log("Migration successful!");
  } catch (error) {
    console.error("Migration failed:", error);
  }
}
main();
