import { json, error } from '@sveltejs/kit';
import { requireAdminAuth } from '$lib/server/adminAuth';
import { db } from '$lib/server/db';
import { users, files } from '$lib/server/db/schema';
import { eq, sum } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request, params }) => {
	requireAdminAuth(request);

	const user = await db.query.users.findFirst({
		where: eq(users.id, params.id)
	});

	if (!user) {
		throw error(404, 'User not found');
	}

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

export const PATCH: RequestHandler = async ({ request, params }) => {
	requireAdminAuth(request);

	const body = await request.json();
	const updates: Partial<typeof users.$inferInsert> = {};

	if (body.storageLimit !== undefined) updates.storageLimit = body.storageLimit;
	if (body.isSuspended !== undefined) updates.isSuspended = body.isSuspended;

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

	return json(updatedUser[0]);
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
