import { db } from '$lib/server/db';
import { files, users, telegramNodes } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { deleteTelegramMessage } from '$lib/server/telegram';

export async function hardDeleteFile(fileId: string, userId: string, currentStorageUsed: number) {
	const fileResult = await db.select().from(files).where(and(eq(files.id, fileId), eq(files.userId, userId)));
	if (fileResult.length === 0) throw new Error('File not found');
	const fileToDelete = fileResult[0];

	const userResult = await db.select({ telegramNodeId: users.telegramNodeId }).from(users).where(eq(users.id, userId));
	if (userResult.length > 0 && userResult[0].telegramNodeId && fileToDelete.telegramMessageId) {
		const nodeResult = await db.select().from(telegramNodes).where(eq(telegramNodes.id, userResult[0].telegramNodeId));
		if (nodeResult.length > 0) {
			const node = nodeResult[0];
			try {
				await deleteTelegramMessage(node.botToken, node.chatId, fileToDelete.telegramMessageId);
			} catch (err) {
				console.error('Failed to delete from telegram, but will delete from DB anyway', err);
			}
		}
	}

	await db.delete(files).where(eq(files.id, fileId));
	const newStorageUsed = Math.max(0, currentStorageUsed - fileToDelete.fileSize);
	await db.update(users).set({ storageUsed: newStorageUsed }).where(eq(users.id, userId));
}
