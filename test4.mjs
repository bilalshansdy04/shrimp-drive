import 'dotenv/config';
import { createClient } from '@libsql/client';
async function main() {
  const c = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });
  const result = await c.execute("SELECT id, display_name, storage_limit FROM users");
  console.log(result.rows);
}
main();
