import { json, error } from '@sveltejs/kit';
import { requireAdminAuth } from '$lib/server/adminAuth';
import { db } from '$lib/server/db';
import { users, files, storageBonuses } from '$lib/server/db/schema';
import { eq, sum, sql } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { recalculateUserStorageLimit } from '$lib/server/storage';

export const GET: RequestHandler = async ({ request, params }) => {
	requireAdminAuth(request);

	const userResult = await db
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
			customStorageBonus: users.customStorageBonus,
			isSuspended: users.isSuspended,
			isActive: users.isActive,
			telegramNodeId: users.telegramNodeId,
			createdAt: users.createdAt
		})
		.from(users)
		.leftJoin(storageBonuses, eq(users.id, storageBonuses.userId))
		.where(eq(users.id, params.id))
		.groupBy(users.id);

	if (userResult.length === 0) {
		throw error(404, 'User not found');
	}
	const user = userResult[0];

	const storageByCategory = await db
		.select({
			category: files.fileType,
			used: sum(files.fileSize)
		})
		.from(files)
		.where(eq(files.userId, user.id))
		.groupBy(files.fileType);

	return json({
		...user,
		storageByCategory
	});
}

import bcryptjs from 'bcryptjs';

export const PATCH: RequestHandler = async ({ request, params }) => {
	requireAdminAuth(request);

	const body = await request.json();
	const updates: Partial<typeof users.$inferInsert> = {};

	if (body.storageLimit !== undefined) updates.storageLimit = body.storageLimit;
	if (body.isSuspended !== undefined) updates.isSuspended = body.isSuspended;
	if (body.isActive !== undefined) updates.isActive = body.isActive;
	
	if (body.customStorageBonus !== undefined) {
		updates.customStorageBonus = body.customStorageBonus;
	}
	
	if (body.password) {
		updates.passwordHash = await bcryptjs.hash(body.password, 10);
	}
	if (body.displayName !== undefined) updates.displayName = body.displayName;
	if (body.username !== undefined) updates.username = body.username;

	if (Object.keys(updates).length === 0) {
		throw error(400, 'No valid fields provided for update');
	}

	const updatedUser = await db
		.update(users)
		.set(updates)
		.where(eq(users.id, params.id))
		.returning();

	if (updatedUser.length === 0) {
		throw error(404, 'User not found');
	}

	if (body.customStorageBonus !== undefined || body.storageLimit !== undefined) {
		await recalculateUserStorageLimit(params.id);
	}

	// Refetch to get the updated values
	const finalUser = await db.select().from(users).where(eq(users.id, params.id));

	return json(finalUser[0]);
}

export const DELETE: RequestHandler = async ({ request, params }) => {
	requireAdminAuth(request);

	const deletedUser = await db
		.delete(users)
		.where(eq(users.id, params.id))
		.returning();

	if (deletedUser.length === 0) {
		throw error(404, 'User not found');
	}

	return json({ success: true, deletedId: params.id });
}
