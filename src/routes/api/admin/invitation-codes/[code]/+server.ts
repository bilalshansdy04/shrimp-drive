import { json, error } from '@sveltejs/kit';
import { requireAdminAuth } from '$lib/server/adminAuth';
import { db } from '$lib/server/db';
import { invitationCodes } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ request, params }) => {
	requireAdminAuth(request);

	const body = await request.json();
	const updates: Partial<typeof invitationCodes.$inferInsert> = {};

	if (body.isRevoked !== undefined) updates.isRevoked = body.isRevoked;

	if (Object.keys(updates).length === 0) {
		throw error(400, 'No valid fields provided for update');
	}

	const updatedCode = await db
		.update(invitationCodes)
		.set(updates)
		.where(eq(invitationCodes.code, params.code))
		.returning();

	if (updatedCode.length === 0) {
		throw error(404, 'Invitation code not found');
	}

	return json(updatedCode[0]);
}

export const DELETE: RequestHandler = async ({ request, params }) => {
	requireAdminAuth(request);

	const deletedCode = await db
		.delete(invitationCodes)
		.where(eq(invitationCodes.code, params.code))
		.returning();

	if (deletedCode.length === 0) {
		throw error(404, 'Invitation code not found');
	}

	return json({ success: true, deletedCode: params.code });
}
