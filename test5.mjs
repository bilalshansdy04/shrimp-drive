import 'dotenv/config';
import { db } from './src/lib/server/db/index.js';
import { users } from './src/lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
async function main() {
  const result = await db.select().from(users).limit(1);
  console.log(result[0]);
}
main();
