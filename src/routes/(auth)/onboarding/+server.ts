import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { users, invitationCodes, storageBonuses, telegramNodes } from '$lib/server/db/schema';
import { eq, like } from 'drizzle-orm';
import crypto from 'node:crypto';
import { recalculateUserStorageLimit } from '$lib/server/storage';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		if (!locals.user) {
			return json({ error: 'Unauthorized.' }, { status: 401 });
		}

		const data = await request.json();
		const { backendChoice, code, botToken, chatId, enableEncryption, authHash, encryptedVaultKey } = data;

		let finalNodeId: string | null = null;
		let finalEncryptionMode = 'flexible';
		let inviteCodeRecord: any = null;

		let bonusStorageToGrant = 0;

		// 1. Process Invitation Code (Optional)
		if (code) {
			const codeResult = await db
				.select()
				.from(invitationCodes)
				.where(eq(invitationCodes.code, code));
			if (codeResult.length === 0) {
				return json({ error: 'Invalid Invitation Code.' }, { status: 400 });
			}

			inviteCodeRecord = codeResult[0];
			if (inviteCodeRecord.isUsed && inviteCodeRecord.usedCount >= inviteCodeRecord.maxUses) {
				return json({ error: 'Invitation Code has already been used.' }, { status: 400 });
			}

			finalEncryptionMode = inviteCodeRecord.encryptionMode;
			bonusStorageToGrant = inviteCodeRecord.bonusAmount;
		}

		// 2. Assign Storage Node
		if (backendChoice === 'global') {
			// Find the Global Node
			// We look for a node named 'drive-global' or similar
			const globalNodes = await db
				.select()
				.from(telegramNodes)
				.where(like(telegramNodes.name, '%global%'));

			if (globalNodes.length === 0) {
				return json(
					{ error: 'Global Drive node is not configured by the administrator.' },
					{ status: 500 }
				);
			}
			finalNodeId = globalNodes[0].id;
		} else {
			// Custom Node Setup
			if (!botToken || !chatId) {
				return json(
					{ error: 'Bot Token and Chat ID are required for Custom Node.' },
					{ status: 400 }
				);
			}

			// Verify custom Bot Token
			const getMeRes = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
			const getMeData = await getMeRes.json();
			if (!getMeData.ok) {
				return json({ error: 'Invalid Telegram Bot Token.' }, { status: 400 });
			}

			// Verify custom Chat ID
			const getChatRes = await fetch(
				`https://api.telegram.org/bot${botToken}/getChat?chat_id=${chatId}`
			);
			const getChatData = await getChatRes.json();
			if (!getChatData.ok) {
				return json(
					{
						error: `Invalid Chat ID or Bot not added to channel. Telegram says: ${getChatData.description}`
					},
					{ status: 400 }
				);
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

		// 3. Update User
		const updateData: any = {
			telegramNodeId: finalNodeId,
			encryptionMode: finalEncryptionMode,
			isEncryptionActive: enableEncryption === true
		};

		if (authHash && encryptedVaultKey) {
			const bcrypt = await import('bcryptjs');
			updateData.passwordHash = await bcrypt.hash(authHash, 10);
			updateData.encryptedVaultKey = encryptedVaultKey;
		}

		await db
			.update(users)
			.set(updateData)
			.where(eq(users.id, locals.user.id));

		// 4. Handle Invite Code Rewards
		if (code && inviteCodeRecord) {
			// Grant Storage Bonus
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

			await db
				.update(invitationCodes)
				.set({
					isUsed: isFullyUsed,
					usedBy: locals.user.id,
					usedCount: newUsedCount
				})
				.where(eq(invitationCodes.code, code));
		}

		await recalculateUserStorageLimit(locals.user.id);

		return json({ success: true });
	} catch (error) {
		console.error('Error during onboarding:', error);
		return json({ error: 'Internal server error.' }, { status: 500 });
	}
};
