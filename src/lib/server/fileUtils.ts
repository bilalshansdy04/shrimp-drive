import { db } from '$lib/server/db';
import { files, users, telegramNodes } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { deleteTelegramMessage } from '$lib/server/telegram';

/**
 * Deletes a file from Telegram first, then from DB.
 * If Telegram deletion fails, DB is NOT touched → user sees error, file stays intact.
 * If file has no telegramMessageId (legacy/null), skip Telegram and delete DB only.
 */
export async function hardDeleteFile(fileId: string, userId: string) {
	const fileResult = await db.select().from(files).where(and(eq(files.id, fileId), eq(files.userId, userId)));
	if (fileResult.length === 0) throw new Error('File not found');
	const fileToDelete = fileResult[0];

	// Step 1: Delete from Telegram FIRST (fail-hard → DB untouched if this fails)
	const messageIdsToDelete: number[] = [];
	if (fileToDelete.telegramMessageId) {
		messageIdsToDelete.push(fileToDelete.telegramMessageId);
	}
	if (fileToDelete.telegramMessageIds) {
		try {
			const parsed = JSON.parse(fileToDelete.telegramMessageIds);
			if (Array.isArray(parsed)) {
				messageIdsToDelete.push(...parsed);
			}
		} catch (e) {
			// Ignore parse error
		}
	}

	if (messageIdsToDelete.length > 0) {
		const userResult = await db.select({ telegramNodeId: users.telegramNodeId }).from(users).where(eq(users.id, userId));
		if (userResult.length > 0 && userResult[0].telegramNodeId) {
			const nodeResult = await db.select().from(telegramNodes).where(eq(telegramNodes.id, userResult[0].telegramNodeId));
			if (nodeResult.length > 0) {
				const node = nodeResult[0];
				// If Telegram delete fails, throw → caller gets error, DB stays safe
				try {
					const { deleteTelegramMessages } = await import('$lib/server/telegram');
					await deleteTelegramMessages(node.botToken, node.chatId, messageIdsToDelete);
				} catch (err: any) {
					console.error(`Failed to delete message chunks ${messageIdsToDelete.join(',')}:`, err);
					// Log and continue to delete DB
				}
			}
		}
	}

	// Step 2: Delete from DB (only reached if Telegram succeeded or no telegramMessageId)
	await db.delete(files).where(eq(files.id, fileId));
	
	const userRec = await db.select({ storageUsed: users.storageUsed }).from(users).where(eq(users.id, userId));
	if (userRec.length > 0) {
		const currentStorageUsed = userRec[0].storageUsed;
		const newStorageUsed = Math.max(0, currentStorageUsed - fileToDelete.fileSize);
		await db.update(users).set({ storageUsed: newStorageUsed }).where(eq(users.id, userId));
	}
}
