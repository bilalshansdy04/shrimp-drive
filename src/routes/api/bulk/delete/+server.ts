import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { files, folders } from '$lib/server/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { hardDeleteFile } from '$lib/server/fileUtils';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { items } = body;

		const fileIds = items?.files || body.files || [];
		const folderIds = items?.folders || body.folders || [];

		if (!fileIds.length && !folderIds.length) {
			return json({ error: 'No items selected' }, { status: 400 });
		}

		// Delete files via hardDeleteFile (Telegram → DB, fail-hard)
		if (fileIds.length > 0) {
			const filesToDelete = await db.query.files.findMany({
				where: and(inArray(files.id, fileIds), eq(files.userId, locals.user.id))
			});
			for (const f of filesToDelete) {
				await hardDeleteFile(f.id, locals.user.id, locals.user.storageUsed);
			}
		}

		// Delete folders (and their contents)
		if (folderIds.length > 0) {
			await db.delete(folders).where(
				and(inArray(folders.id, folderIds), eq(folders.userId, locals.user.id))
			);
		}

		return json({ success: true });
	} catch (e: any) {
		console.error('Failed to bulk delete items:', e);
		return json({ error: e.message || 'Failed to delete items' }, { status: 500 });
	}
};
