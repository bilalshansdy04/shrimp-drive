import 'dotenv/config';
import { db } from './src/lib/server/db/index.js';
import { recalculateUserStorageLimit } from './src/lib/server/storage.js';
import { users } from './src/lib/server/db/schema.js';
import { eq } from 'drizzle-orm';

async function main() {
  const userId = 'a925be16-8a9f-4fa9-829f-cc1f9aa0c3e3';
  await recalculateUserStorageLimit(userId);
  const result = await db.select().from(users).where(eq(users.id, userId));
  console.log(result[0].storageLimit);
}
main();
