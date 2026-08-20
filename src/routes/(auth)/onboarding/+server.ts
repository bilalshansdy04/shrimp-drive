import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { users, invitationCodes, encryptionKeys, storageBonuses, telegramNodes } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { generateRandomKey } from '$lib/server/crypto';
import crypto from 'node:crypto';
import { recalculateUserStorageLimit } from '$lib/server/storage';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		if (!locals.user) {
			return json({ error: 'Unauthorized.' }, { status: 401 });
		}

		const data = await request.json();
		const { code, botToken, chatId } = data;

		let finalNodeId: string | null = null;
		let finalEncryptionMode = 'flexible';
		let inviteType = 'regular_self_setup';
		let inviteCodeRecord: any = null;
		
		let finalEncryptionKeyId: string | null = null;
		let bonusStorageToGrant = 0;

		if (code) {
			// Verify Invitation Code
			const codeResult = await db.select().from(invitationCodes).where(eq(invitationCodes.code, code));
			if (codeResult.length === 0) {
				return json({ error: 'Invalid Invitation Code.' }, { status: 400 });
			}

			inviteCodeRecord = codeResult[0];
			if (inviteCodeRecord.isUsed && inviteCodeRecord.usedCount >= inviteCodeRecord.maxUses) {
				return json({ error: 'Invitation Code has already been used.' }, { status: 400 });
			}

			finalEncryptionMode = inviteCodeRecord.encryptionMode;
			bonusStorageToGrant = inviteCodeRecord.bonusAmount;
			inviteType = inviteCodeRecord.type;
			
			if (inviteCodeRecord.encryptionKeyId) {
				finalEncryptionKeyId = inviteCodeRecord.encryptionKeyId;
			}

			if (inviteCodeRecord.type === 'friend_zero_setup') {
				if (!inviteCodeRecord.assignedNodeId) {
					return json({ error: 'Invitation Code is invalid. Missing admin storage node.' }, { status: 400 });
				}
				finalNodeId = inviteCodeRecord.assignedNodeId;
			}
		}

		if (!code || inviteType !== 'friend_zero_setup') {
			if (!botToken || !chatId) {
				return json({ error: 'Bot Token and Chat ID are required.' }, { status: 400 });
			}
			// Verify custom Bot Token
			const getMeRes = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
			const getMeData = await getMeRes.json();
			if (!getMeData.ok) {
				return json({ error: 'Invalid Telegram Bot Token.' }, { status: 400 });
			}

			// Verify custom Chat ID
			const getChatRes = await fetch(`https://api.telegram.org/bot${botToken}/getChat?chat_id=${chatId}`);
			const getChatData = await getChatRes.json();
			if (!getChatData.ok) {
				return json({ error: `Invalid Chat ID or Bot not added to channel. Telegram says: ${getChatData.description}` }, { status: 400 });
			}
			
			// Create a personal telegram node for the user
			finalNodeId = crypto.randomUUID();
			await db.insert(telegramNodes).values({
				id: finalNodeId,
				name: `Personal Node - ${locals.user.username}`,
				botToken,
				chatId,
				isActive: true
			});
		}

		// If no encryption key provided by invite code (or flexible mode), generate a new one
		// Only locked_off should NOT have an encryption key
		if (!finalEncryptionKeyId && finalEncryptionMode !== 'locked_off') {
			finalEncryptionKeyId = crypto.randomUUID();
			await db.insert(encryptionKeys).values({
				id: finalEncryptionKeyId,
				keyValue: generateRandomKey()
			});
		}

		// Update User
		await db.update(users).set({
			telegramNodeId: finalNodeId,
			encryptionMode: finalEncryptionMode,
			encryptionKeyId: finalEncryptionKeyId
		}).where(eq(users.id, locals.user.id));

		if (code && inviteCodeRecord) {
			// Grant Storage Bonus in the new table
			if (bonusStorageToGrant > 0 || bonusStorageToGrant === -1) {
				await db.insert(storageBonuses).values({
					id: crypto.randomUUID(),
					userId: locals.user.id,
					invitationCodeId: inviteCodeRecord.id,
					amount: bonusStorageToGrant
				});
			}

			// Mark code as used
			const newUsedCount = inviteCodeRecord.usedCount + 1;
			const isFullyUsed = newUsedCount >= inviteCodeRecord.maxUses ? 1 : 0;
			
			await db.update(invitationCodes).set({
				isUsed: isFullyUsed,
				usedBy: locals.user.id,
				usedCount: newUsedCount
			}).where(eq(invitationCodes.code, code));
		}

		await recalculateUserStorageLimit(locals.user.id);

		return json({ success: true });
	} catch (error) {
		console.error('Error during onboarding:', error);
		return json({ error: 'Internal server error.' }, { status: 500 });
	}
};
