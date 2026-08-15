import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { folders, files } from '$lib/server/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export const PATCH: RequestHandler = async ({ request, params, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const folderId = params.id;

	try {
		const body = await request.json();
		const { name } = body;

		if (!name || typeof name !== 'string') {
			return json({ error: 'Name is required' }, { status: 400 });
		}

		// Ensure folder belongs to user
		const folder = await db.query.folders.findFirst({
			where: and(eq(folders.id, folderId), eq(folders.userId, locals.user.id))
		});

		if (!folder) {
			return json({ error: 'Folder not found' }, { status: 404 });
		}

		await db
			.update(folders)
			.set({ name })
			.where(eq(folders.id, folderId));

		return json({ success: true, name });
	} catch (e) {
		console.error('Failed to rename folder:', e);
		return json({ error: 'Internal Server Error' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const folderId = params.id;

	try {
		// Ensure folder belongs to user
		const folder = await db.query.folders.findFirst({
			where: and(eq(folders.id, folderId), eq(folders.userId, locals.user.id))
		});

		if (!folder) {
			return json({ error: 'Folder not found' }, { status: 404 });
		}

		const now = new Date();

		// Soft delete the folder itself
		await db
			.update(folders)
			.set({ deletedAt: now })
			.where(eq(folders.id, folderId));

		// Soft delete all child files
		await db
			.update(files)
			.set({ deletedAt: now })
			.where(eq(files.folderId, folderId));

		// Note: To properly cascade soft-delete to deeply nested descendants
		// we use a recursive CTE
		const descendantsResult = await db.all(sql`
			WITH RECURSIVE descendant_folders(id) AS (
				SELECT id FROM folders WHERE parent_id = ${folderId} AND deleted_at IS NULL
				UNION ALL
				SELECT f.id FROM folders f
				JOIN descendant_folders df ON f.parent_id = df.id
				WHERE f.deleted_at IS NULL
			)
			SELECT id FROM descendant_folders
		`);

		// LibSQL returns rows in descendantsResult
		const descendantFolderIds = descendantsResult.map((row: any) => row.id as string);
		
		if (descendantFolderIds.length > 0) {
			for (const id of descendantFolderIds) {
				await db.update(folders).set({ deletedAt: now }).where(eq(folders.id, id));
				await db.update(files).set({ deletedAt: now }).where(eq(files.folderId, id));
			}
		}

		return json({ success: true });
	} catch (e) {
		console.error('Failed to delete folder:', e);
		return json({ error: 'Internal Server Error' }, { status: 500 });
	}
};
