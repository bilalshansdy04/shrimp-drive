import { json, error } from '@sveltejs/kit';
import { requireAdminAuth } from '$lib/server/adminAuth';
import { db } from '$lib/server/db';
import { invitationCodes, storageBonuses, users, encryptionKeys } from '$lib/server/db/schema';
import { eq, inArray } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { generateRandomKey } from '$lib/server/crypto';
import crypto from 'node:crypto';
import { recalculateUserStorageLimit } from '$lib/server/storage';

export const PATCH: RequestHandler = async ({ request, params }) => {
	requireAdminAuth(request);

	const body = await request.json();
	const updates: Partial<typeof invitationCodes.$inferInsert> = {};

	if (body.type !== undefined) updates.type = body.type;
	if (body.encryptionMode !== undefined) updates.encryptionMode = body.encryptionMode;
	if (body.maxUses !== undefined) updates.maxUses = body.maxUses;
	if (body.assignedNodeId !== undefined) updates.assignedNodeId = body.assignedNodeId;
	if (body.bonusAmount !== undefined) updates.bonusAmount = body.bonusAmount;
	if (body.isRevoked !== undefined) updates.isRevoked = body.isRevoked;

	if (Object.keys(updates).length === 0) {
		throw error(400, 'No valid fields provided for update');
	}

	const existingCode = await db.select().from(invitationCodes).where(eq(invitationCodes.code, params.code));
	if (existingCode.length === 0) {
		throw error(404, 'Invitation code not found');
	}

	if (!existingCode[0].encryptionKeyId) {
		const newKeyId = crypto.randomUUID();
		await db.insert(encryptionKeys).values({
			id: newKeyId,
			keyValue: generateRandomKey()
		});
		updates.encryptionKeyId = newKeyId;
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

	const existingCode = await db.select().from(invitationCodes).where(eq(invitationCodes.code, params.code));
	if (existingCode.length === 0) {
		throw error(404, 'Invitation code not found');
	}

	// Find affected bonuses to update users' storage limit
	const affectedBonuses = await db.select().from(storageBonuses).where(eq(storageBonuses.invitationCodeId, existingCode[0].id));
	
	for (const bonus of affectedBonuses) {
		if (bonus.userId) {
			// Instead of manual math, just call the recalculate helper AFTER deleting the bonus.
			// But wait, the bonus is deleted by cascade below.
			// So we need to store the userIds, delete the code (which deletes bonuses), then recalculate.
		}
	}

	const userIdsToRecalculate = [...new Set(affectedBonuses.map(b => b.userId).filter(Boolean))] as string[];

	// This will cascade delete the storage_bonuses rows due to foreign key
	const deletedCode = await db
		.delete(invitationCodes)
		.where(eq(invitationCodes.code, params.code))
		.returning();

	// Now that bonuses are deleted, recalculate limits
	for (const uId of userIdsToRecalculate) {
		await recalculateUserStorageLimit(uId);
	}

	return json({ success: true, deletedCode: params.code });
}
