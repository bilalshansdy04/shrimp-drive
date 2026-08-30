import { json } from '@sveltejs/kit';
import { requireAdminAuth } from '$lib/server/adminAuth';
import { db } from '$lib/server/db';
import { users, storageBonuses, invitationCodes } from '$lib/server/db/schema';
import { desc, eq, sql } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request }) => {
	requireAdminAuth(request);

	const allUsers = await db
		.select({
			id: users.id,
			username: users.username,
			displayName: users.displayName,
			email: users.email,
			encryptionMode: users.encryptionMode,
			storageUsed: users.storageUsed,
			storageLimit: users.storageLimit,
			baseStorage: users.baseStorage,
			invitationBonusStorage: sql<number>`COALESCE(SUM(${storageBonuses.amount}), 0)`,
			invitationCodeUsed: sql<string>`MAX(${invitationCodes.code})`,
			customStorageBonus: users.customStorageBonus,
			isSuspended: users.isSuspended,
			isActive: users.isActive,
			telegramNodeId: users.telegramNodeId,
			googleId: users.googleId,
			createdAt: users.createdAt
		})
		.from(users)
		.leftJoin(storageBonuses, eq(users.id, storageBonuses.userId))
		.leftJoin(invitationCodes, eq(storageBonuses.invitationCodeId, invitationCodes.id))
		.groupBy(users.id)
		.orderBy(desc(users.createdAt));

	return json(allUsers);
};
