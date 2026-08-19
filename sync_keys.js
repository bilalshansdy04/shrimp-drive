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
    await client.execute(`UPDATE users SET encryption_key = (SELECT encryption_key FROM invitation_codes WHERE used_by = users.id LIMIT 1) WHERE id IN (SELECT used_by FROM invitation_codes WHERE used_by IS NOT NULL)`);
    console.log("Sync successful!");
  } catch (error) {
    console.error("Sync failed:", error);
  }
}
main();
