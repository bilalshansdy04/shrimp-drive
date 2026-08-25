import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import * as schema from '$lib/server/db/schema';
import { requireAdminAuth } from '$lib/server/adminAuth';

export const POST: RequestHandler = async ({ request }) => {
	try {
		// 1. Verify Admin
		requireAdminAuth(request);

		// 2. Parse Multipart form data
		const formData = await request.formData();
		const file = formData.get('file') as File;

		if (!file) {
			return json({ success: false, message: 'No backup file provided' }, { status: 400 });
		}

		// 3. Read and parse JSON content
		const text = await file.text();
		let backupData: Record<string, any[]>;
		try {
			backupData = JSON.parse(text);
		} catch (e) {
			return json({ success: false, message: 'Invalid JSON file format' }, { status: 400 });
		}

		// 4. Insert data into tables using onConflictDoNothing
		// Order matters due to foreign key constraints!
		const tablesInOrder = [
			{ key: 'encryptionKeys', table: schema.encryptionKeys },
			{ key: 'telegramNodes', table: schema.telegramNodes },
			{ key: 'users', table: schema.users },
			{ key: 'invitationCodes', table: schema.invitationCodes },
			{ key: 'storageBonuses', table: schema.storageBonuses },
			{ key: 'folders', table: schema.folders },
			{ key: 'files', table: schema.files },
			{ key: 'playlists', table: schema.playlists },
			{ key: 'playlistItems', table: schema.playlistItems },
			{ key: 'appSettings', table: schema.appSettings }
		];

		let restoredCounts: Record<string, number> = {};

		for (const { key, table } of tablesInOrder) {
			const rows = backupData[key];
			if (rows && rows.length > 0) {
				let count = 0;
				for (const row of rows) {
                    // Convert date strings back to Date objects if needed for sqlite
					if (row.createdAt && typeof row.createdAt === 'string') {
						row.createdAt = new Date(row.createdAt);
					}
					if (row.updatedAt && typeof row.updatedAt === 'string') {
						row.updatedAt = new Date(row.updatedAt);
					}
					if (row.deletedAt && typeof row.deletedAt === 'string') {
						row.deletedAt = new Date(row.deletedAt);
					}
					if (row.expiresAt && typeof row.expiresAt === 'string') {
						row.expiresAt = new Date(row.expiresAt);
					}

					try {
                        // @ts-ignore
						await db.insert(table).values(row).onConflictDoNothing();
						count++;
					} catch (err) {
                        console.error(`Error inserting row into ${key}:`, err);
					}
				}
				restoredCounts[key] = count;
			}
		}

		return json({
			success: true,
			message: 'Database restored successfully (skipped existing data).',
			details: restoredCounts
		});
	} catch (e: any) {
		console.error('Database restore error:', e);
		return json({ success: false, message: e.message || 'Internal Server Error' }, { status: 500 });
	}
};
