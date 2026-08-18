import { json } from '@sveltejs/kit';
import { requireAdminAuth } from '$lib/server/adminAuth';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { desc } from 'drizzle-orm';
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
			isSuspended: users.isSuspended,
			createdAt: users.createdAt
		})
		.from(users)
		.orderBy(desc(users.createdAt));

	return json(allUsers);
}
