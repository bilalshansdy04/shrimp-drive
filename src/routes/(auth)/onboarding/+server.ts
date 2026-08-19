import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { users, invitationCodes } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { generateRandomKey } from '$lib/server/crypto';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		if (!locals.user) {
			return json({ error: 'Unauthorized.' }, { status: 401 });
		}

		const data = await request.json();
		const { code, botToken, chatId } = data;

		let finalBotToken = botToken;
		let finalChatId = chatId;
		let finalEncryptionMode = 'flexible';
		let finalStorageLimit = 8589934592; // 8GB default
		let inviteType = 'regular_self_setup';
		let finalEncryptionKey = generateRandomKey();
		let inviteCodeRecord: any = null;

		if (code) {
			// Verify Invitation Code
			const codeResult = await db.select().from(invitationCodes).where(eq(invitationCodes.code, code));
			if (codeResult.length === 0) {
				return json({ error: 'Invalid Invitation Code.' }, { status: 400 });
			}

			inviteCodeRecord = codeResult[0];
			if (inviteCodeRecord.isUsed) {
				return json({ error: 'Invitation Code has already been used.' }, { status: 400 });
			}

			finalEncryptionMode = inviteCodeRecord.encryptionMode;
			finalStorageLimit = inviteCodeRecord.storageLimit;
			inviteType = inviteCodeRecord.type;
			if (inviteCodeRecord.encryptionKey) {
				finalEncryptionKey = inviteCodeRecord.encryptionKey;
			}

			if (inviteCodeRecord.type === 'friend_zero_setup') {
				if (!inviteCodeRecord.assignedBotToken || !inviteCodeRecord.assignedChatId) {
					return json({ error: 'Invitation Code is invalid. Missing admin bot token.' }, { status: 400 });
				}
				finalBotToken = inviteCodeRecord.assignedBotToken;
				finalChatId = inviteCodeRecord.assignedChatId;
			}
		}

		if (!code || inviteType !== 'friend_zero_setup') {
			if (!finalBotToken || !finalChatId) {
				return json({ error: 'Bot Token and Chat ID are required.' }, { status: 400 });
			}
			// Verify custom Bot Token
			const getMeRes = await fetch(`https://api.telegram.org/bot${finalBotToken}/getMe`);
			const getMeData = await getMeRes.json();
			if (!getMeData.ok) {
				return json({ error: 'Invalid Telegram Bot Token.' }, { status: 400 });
			}

			// Verify custom Chat ID
			const getChatRes = await fetch(`https://api.telegram.org/bot${finalBotToken}/getChat?chat_id=${finalChatId}`);
			const getChatData = await getChatRes.json();
			if (!getChatData.ok) {
				return json({ error: `Invalid Chat ID or Bot not added to channel. Telegram says: ${getChatData.description}` }, { status: 400 });
			}
		}

		// Update User
		await db.update(users).set({
			telegramBotToken: finalBotToken,
			telegramChatId: finalChatId,
			encryptionMode: finalEncryptionMode,
			encryptionKey: finalEncryptionKey,
			storageLimit: finalStorageLimit
		}).where(eq(users.id, locals.user.id));

		if (code && inviteCodeRecord) {
			// Mark code as used
			const newUsedCount = inviteCodeRecord.usedCount + 1;
			const isFullyUsed = newUsedCount >= inviteCodeRecord.maxUses ? 1 : 0;
			
			await db.update(invitationCodes).set({
				isUsed: isFullyUsed,
				usedBy: locals.user.id,
				usedCount: newUsedCount
			}).where(eq(invitationCodes.code, code));
		}

		return json({ success: true });
	} catch (error) {
		console.error('Error during onboarding:', error);
		return json({ error: 'Internal server error.' }, { status: 500 });
	}
};
