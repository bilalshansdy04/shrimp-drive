import { json, error } from '@sveltejs/kit';
import { requireAdminAuth } from '$lib/server/adminAuth';
import { db } from '$lib/server/db';
import { invitationCodes } from '$lib/server/db/schema';
import { desc } from 'drizzle-orm';
import crypto from 'crypto';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request }) => {
	requireAdminAuth(request);

	const codes = await db
		.select({
			id: invitationCodes.id,
			code: invitationCodes.code,
			type: invitationCodes.type,
			encryptionMode: invitationCodes.encryptionMode,
			storageLimit: invitationCodes.storageLimit,
			usedCount: invitationCodes.usedCount,
			maxUses: invitationCodes.maxUses,
			isRevoked: invitationCodes.isRevoked,
			assignedChatId: invitationCodes.assignedChatId, // frontend can censor this if needed
			createdAt: invitationCodes.createdAt
		})
		.from(invitationCodes)
		.orderBy(desc(invitationCodes.createdAt));

	return json(codes);
}

export const POST: RequestHandler = async ({ request }) => {
	requireAdminAuth(request);

	const body = await request.json();
	const { 
		code, type, encryptionMode, storageLimit, 
		assignedBotToken, assignedChatId, maxUses = 1 
	} = body;

	if (!type || !encryptionMode || !storageLimit) {
		throw error(400, 'Missing required fields: type, encryptionMode, storageLimit');
	}

	const finalCode = code || crypto.randomBytes(3).toString('hex').toUpperCase();

	const newCode = await db.insert(invitationCodes).values({
		id: crypto.randomUUID(),
		code: finalCode,
		type,
		encryptionMode,
		storageLimit,
		maxUses,
		assignedBotToken,
		assignedChatId
	}).returning();

	return json(newCode[0]);
}
