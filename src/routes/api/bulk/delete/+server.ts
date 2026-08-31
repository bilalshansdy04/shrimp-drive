import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { files, folders } from '$lib/server/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { del } from '@vercel/blob';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { items } = body;
		
		// If they passed flat structure like the original single delete logic
		// wait, the client sends { files: [...], folders: [...] }
		const fileIds = items?.files || body.files || [];
		const folderIds = items?.folders || body.folders || [];

		if (!fileIds.length && !folderIds.length) {
			return json({ error: 'No items selected' }, { status: 400 });
		}

		// Delete files
		if (fileIds.length > 0) {
			const filesToDelete = await db.query.files.findMany({
				where: and(inArray(files.id, fileIds), eq(files.userId, locals.user.id))
			});

			for (const f of filesToDelete) {
				// Delete from Telegram/Blob (mocked or handled in background)
				// For now just delete DB record
				await db.delete(files).where(and(eq(files.id, f.id), eq(files.userId, locals.user.id)));
			}
		}
		
		// Delete folders (and their contents CASCADE)
		if (folderIds.length > 0) {
			await db.delete(folders).where(
				and(inArray(folders.id, folderIds), eq(folders.userId, locals.user.id))
			);
		}

		return json({ success: true });
	} catch (e) {
		console.error('Failed to bulk delete items:', e);
		return json({ error: 'Internal Server Error' }, { status: 500 });
	}
};
