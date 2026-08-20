import { json, error } from '@sveltejs/kit';
import { requireAdminAuth } from '$lib/server/adminAuth';
import { db } from '$lib/server/db';
import { invitationCodes, encryptionKeys } from '$lib/server/db/schema';
import { desc, eq } from 'drizzle-orm';
import crypto from 'node:crypto';
import type { RequestHandler } from './$types';
import { generateRandomKey } from '$lib/server/crypto';

export const GET: RequestHandler = async ({ request }) => {
	requireAdminAuth(request);

	const codes = await db
		.select({
			id: invitationCodes.id,
			code: invitationCodes.code,
			type: invitationCodes.type,
			encryptionMode: invitationCodes.encryptionMode,
			bonusAmount: invitationCodes.bonusAmount,
			usedCount: invitationCodes.usedCount,
			maxUses: invitationCodes.maxUses,
			isRevoked: invitationCodes.isRevoked,
			assignedNodeId: invitationCodes.assignedNodeId,
			encryptionKey: encryptionKeys.keyValue,
			createdAt: invitationCodes.createdAt
		})
		.from(invitationCodes)
		.leftJoin(encryptionKeys, eq(invitationCodes.encryptionKeyId, encryptionKeys.id))
		.orderBy(desc(invitationCodes.createdAt));

	return json(codes);
}

export const POST: RequestHandler = async ({ request }) => {
	requireAdminAuth(request);

	const body = await request.json();
	const { 
		code, type, encryptionMode, bonusAmount, 
		assignedNodeId, maxUses = 1 
	} = body;

	if (!type || !encryptionMode || bonusAmount === undefined) {
		throw error(400, 'Missing required fields: type, encryptionMode, bonusAmount');
	}

	const finalCode = code || crypto.randomBytes(3).toString('hex').toUpperCase();

	const newKeyId = crypto.randomUUID();
	await db.insert(encryptionKeys).values({
		id: newKeyId,
		keyValue: generateRandomKey()
	});

	const newCode = await db.insert(invitationCodes).values({
		id: crypto.randomUUID(),
		code: finalCode,
		type,
		encryptionMode,
		encryptionKeyId: newKeyId,
		bonusAmount,
		maxUses,
		assignedNodeId
	}).returning();

	return json(newCode[0]);
}
