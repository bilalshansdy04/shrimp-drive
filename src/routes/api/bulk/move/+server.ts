import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { files, folders } from '$lib/server/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { items, targetFolderId } = body;
		
		if (!items || (!items.files?.length && !items.folders?.length)) {
			return json({ error: 'No items selected' }, { status: 400 });
		}

		if (items.files && items.files.length > 0) {
			await db.update(files)
				.set({ folderId: targetFolderId || null })
				.where(and(
					inArray(files.id, items.files),
					eq(files.userId, locals.user.id)
				));
		}
		
		if (items.folders && items.folders.length > 0) {
			if (targetFolderId && items.folders.includes(targetFolderId)) {
				return json({ error: 'Cannot move a folder into itself' }, { status: 400 });
			}
			
			await db.update(folders)
				.set({ parentId: targetFolderId || null })
				.where(and(
					inArray(folders.id, items.folders),
					eq(folders.userId, locals.user.id)
				));
		}

		return json({ success: true });
	} catch (e) {
		console.error('Failed to move bulk items:', e);
		return json({ error: 'Internal Server Error' }, { status: 500 });
	}
};
