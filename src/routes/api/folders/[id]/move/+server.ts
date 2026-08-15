import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { folders } from '$lib/server/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, params, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const folderId = params.id;

	try {
		const body = await request.json();
		const { targetFolderId } = body; // can be null (move to root)

		// Ensure folder belongs to user
		const folder = await db.query.folders.findFirst({
			where: and(eq(folders.id, folderId), eq(folders.userId, locals.user.id))
		});

		if (!folder) {
			return json({ error: 'Folder not found' }, { status: 404 });
		}

		if (targetFolderId === folderId) {
			return json({ error: 'Cannot move a folder into itself' }, { status: 400 });
		}

		// Validate target folder
		if (targetFolderId) {
			const targetFolder = await db.query.folders.findFirst({
				where: and(eq(folders.id, targetFolderId), eq(folders.userId, locals.user.id))
			});

			if (!targetFolder) {
				return json({ error: 'Target folder not found' }, { status: 404 });
			}

			if (targetFolder.category !== folder.category) {
				return json({ error: `Cannot move a ${folder.category} folder into a ${targetFolder.category} folder` }, { status: 400 });
			}

			// Circular Reference Guard: Ensure targetFolderId is not a descendant of folderId
			const descendantsResult = await db.all(sql`
				WITH RECURSIVE descendant_folders(id) AS (
					SELECT id FROM folders WHERE parent_id = ${folderId}
					UNION ALL
					SELECT f.id FROM folders f
					JOIN descendant_folders df ON f.parent_id = df.id
				)
				SELECT id FROM descendant_folders WHERE id = ${targetFolderId}
			`);

			const isDescendant = descendantsResult.length > 0;
			
			if (isDescendant) {
				return json({ error: 'Cannot move a folder into its own sub-folder (Circular reference)' }, { status: 400 });
			}
		}

		await db
			.update(folders)
			.set({ parentId: targetFolderId || null })
			.where(eq(folders.id, folderId));

		return json({ success: true });
	} catch (e) {
		console.error('Failed to move folder:', e);
		return json({ error: 'Internal Server Error' }, { status: 500 });
	}
};
