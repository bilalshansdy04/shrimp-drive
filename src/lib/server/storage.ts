import { db } from './db';
import { users, storageBonuses } from './db/schema';
import { eq, sum } from 'drizzle-orm';

/**
 * Recalculates and updates the total storage limit for a user.
 * 
 * Formula: baseStorage + customStorageBonus + sum(storageBonuses)
 * If any of these values are -1, the total storage limit is -1 (unlimited).
 */
export async function recalculateUserStorageLimit(userId: string) {
	// 1. Get the user's base and custom storage
	const userResult = await db.select({
		baseStorage: users.baseStorage,
		customStorageBonus: users.customStorageBonus
	}).from(users).where(eq(users.id, userId));

	if (userResult.length === 0) return;
	const user = userResult[0];

	// 2. Get all bonuses for the user
	const bonuses = await db.select({
		amount: storageBonuses.amount
	}).from(storageBonuses).where(eq(storageBonuses.userId, userId));

	// 3. Check for -1 (unlimited) in any component
	let isUnlimited = user.baseStorage === -1 || user.customStorageBonus === -1;
	
	let totalBonusFromCodes = 0;
	for (const bonus of bonuses) {
		if (bonus.amount === -1) {
			isUnlimited = true;
			break;
		}
		totalBonusFromCodes += bonus.amount;
	}

	// 4. Calculate final limit
	const newLimit = isUnlimited ? -1 : (user.baseStorage + user.customStorageBonus + totalBonusFromCodes);

	// 5. Update user
	await db.update(users).set({
		storageLimit: newLimit
	}).where(eq(users.id, userId));
}
