import 'dotenv/config';
import { db } from './src/lib/server/db/index.js';
import { users, invitationCodes, storageBonuses } from './src/lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import crypto from 'node:crypto';
import { recalculateUserStorageLimit } from './src/lib/server/storage.js';

async function main() {
  const userId = crypto.randomUUID();
  await db.insert(users).values({
    id: userId,
    username: 'testuser',
    displayName: 'Test User',
    emailVerified: 1,
    baseStorage: 8589934592,
    customStorageBonus: 0
  });

  const codeId = crypto.randomUUID();
  await db.insert(invitationCodes).values({
    id: codeId,
    code: 'TESTCODE',
    type: 'registration',
    encryptionMode: 'default',
    bonusAmount: -1, 
    maxUses: 1
  });

  await db.insert(storageBonuses).values({
    id: crypto.randomUUID(),
    userId,
    invitationCodeId: codeId,
    amount: -1
  });

  await recalculateUserStorageLimit(userId);
  let u = await db.select().from(users).where(eq(users.id, userId));
  console.log('After use:', u[0].storageLimit);

  // simulate delete
  const affectedBonuses = await db.select().from(storageBonuses).where(eq(storageBonuses.invitationCodeId, codeId));
  const userIdsToRecalculate = [...new Set(affectedBonuses.map(b => b.userId).filter(Boolean))];
  
  await db.delete(invitationCodes).where(eq(invitationCodes.id, codeId));
  
  for (const uid of userIdsToRecalculate) {
    await recalculateUserStorageLimit(uid);
  }

  u = await db.select().from(users).where(eq(users.id, userId));
  console.log('After delete:', u[0].storageLimit);
  
  // cleanup
  await db.delete(storageBonuses).where(eq(storageBonuses.userId, userId));
  await db.delete(users).where(eq(users.id, userId));
  process.exit(0);
}
main();
