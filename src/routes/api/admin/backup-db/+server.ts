import { json, type RequestHandler } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import * as schema from '$lib/server/db/schema';
import { uploadFileToTelegram } from '$lib/server/telegram';
import { requireAdminAuth } from '$lib/server/adminAuth';

export const POST: RequestHandler = async ({ request }) => {
	try {
		// 1. Verify Admin
		requireAdminAuth(request);
		
		let { botToken, chatId, nodeId } = await request.json();
		
		if (nodeId) {
			// Fetch botToken and chatId from the database using nodeId
			const nodeRes = await db.select().from(schema.telegramNodes).where(eq(schema.telegramNodes.id, nodeId));
			if (nodeRes.length === 0) {
				return json({ success: false, message: 'Node not found' }, { status: 404 });
			}
			botToken = nodeRes[0].botToken;
			chatId = nodeRes[0].chatId;
		} else if (!botToken || !chatId) {
			return json({ success: false, message: 'Bot Token and Chat ID (or Node ID) are required' }, { status: 400 });
		}

		// 2. Dump entire database to JSON
		const backupData: Record<string, any> = {};
		
		// We have exactly these tables based on schema
		backupData['encryptionKeys'] = await db.select().from(schema.encryptionKeys);
		backupData['telegramNodes'] = await db.select().from(schema.telegramNodes);
		backupData['users'] = await db.select().from(schema.users);
		backupData['invitationCodes'] = await db.select().from(schema.invitationCodes);
		backupData['storageBonuses'] = await db.select().from(schema.storageBonuses);
		backupData['folders'] = await db.select().from(schema.folders);
		backupData['files'] = await db.select().from(schema.files);
		backupData['playlists'] = await db.select().from(schema.playlists);
		backupData['playlistItems'] = await db.select().from(schema.playlistItems);
		backupData['appSettings'] = await db.select().from(schema.appSettings);

		const jsonString = JSON.stringify(backupData, null, 2);
		
		// 3. Convert to File (Blob)
		const blob = new Blob([jsonString], { type: 'application/json' });
		const file = new File([blob], `shrimp_drive_backup_${new Date().toISOString().split('T')[0]}.json`, { type: 'application/json' });

		// 4. Send to Telegram
		const caption = `Shrimp Drive DB Backup\nDate: ${new Date().toISOString()}`;
		await uploadFileToTelegram(botToken, chatId, file, file.name, caption);
		
		// If it reaches here, upload was successful (uploadFileToTelegram throws on error)

		return json({ success: true, message: 'Database backed up successfully!' });
	} catch (e: any) {
		console.error('Backup error:', e);
		return json({ success: false, message: e.message }, { status: 500 });
	}
};
