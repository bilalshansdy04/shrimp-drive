import { json } from '@sveltejs/kit';
import { requireAdminAuth } from '$lib/server/adminAuth';
import { db } from '$lib/server/db';
import { users, invitationCodes, files } from '$lib/server/db/schema';
import { eq, desc, sum, count } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request }) => {
	requireAdminAuth(request);

	const activeUsersCount = await db
		.select({ count: count() })
		.from(users)
		.where(eq(users.isSuspended, false));

	const storageStats = await db
		.select({
			used: sum(users.storageUsed),
			limit: sum(users.storageLimit)
		})
		.from(users);

	const activeCodesCount = await db
		.select({ count: count() })
		.from(invitationCodes)
		.where(eq(invitationCodes.isRevoked, false));

	const recentUsers = await db
		.select({
			id: users.id,
			username: users.username,
			createdAt: users.createdAt
		})
		.from(users)
		.orderBy(desc(users.createdAt))
		.limit(5);

	const recentFiles = await db
		.select({
			id: files.id,
			fileName: files.fileName,
			fileSize: files.fileSize,
			createdAt: files.createdAt
		})
		.from(files)
		.orderBy(desc(files.createdAt))
		.limit(5);

	return json({
		totalActiveUsers: activeUsersCount[0].count,
		totalStorageUsed: storageStats[0].used || 0,
		totalStorageLimit: storageStats[0].limit || 0,
		activeInvitationCodes: activeCodesCount[0].count,
		recentActivity: {
			users: recentUsers,
			files: recentFiles
		}
	});
}
