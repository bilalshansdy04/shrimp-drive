import { json, error } from '@sveltejs/kit';
import { requireAdminAuth } from '$lib/server/adminAuth';
import { db } from '$lib/server/db';
import { invitationCodes } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { generateRandomKey } from '$lib/server/crypto';

export const PATCH: RequestHandler = async ({ request, params }) => {
	requireAdminAuth(request);

	const body = await request.json();
	const updates: Partial<typeof invitationCodes.$inferInsert> = {};

	if (body.type !== undefined) updates.type = body.type;
	if (body.encryptionMode !== undefined) updates.encryptionMode = body.encryptionMode;
	if (body.maxUses !== undefined) updates.maxUses = body.maxUses;
	if (body.assignedBotToken !== undefined) updates.assignedBotToken = body.assignedBotToken;
	if (body.assignedChatId !== undefined) updates.assignedChatId = body.assignedChatId;
	if (body.storageLimit !== undefined) updates.storageLimit = body.storageLimit;
	if (body.isRevoked !== undefined) updates.isRevoked = body.isRevoked;

	if (Object.keys(updates).length === 0) {
		throw error(400, 'No valid fields provided for update');
	}

	const existingCode = await db.select().from(invitationCodes).where(eq(invitationCodes.code, params.code));
	if (existingCode.length === 0) {
		throw error(404, 'Invitation code not found');
	}
	
	if (!existingCode[0].encryptionKey) {
		updates.encryptionKey = generateRandomKey();
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
