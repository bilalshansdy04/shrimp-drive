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

		await db.update(folders).set({ name }).where(eq(folders.id, folderId));

		return json({ success: true, name });
	} catch (e) {
		console.error('Failed to rename folder:', e);
		return json({ error: 'Internal Server Error' }, { status: 500 });
	}
};

import { hardDeleteFile } from '$lib/server/fileUtils';

export const DELETE: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const folderId = params.id;
	const userId = locals.user.id;

	try {
		// Ensure folder belongs to user
		const folder = await db.query.folders.findFirst({
			where: and(eq(folders.id, folderId), eq(folders.userId, userId))
		});

		if (!folder) {
			return json({ error: 'Folder not found' }, { status: 404 });
		}

		// Find all descendant folders using recursive CTE
		const descendantsResult = await db.all(sql`
			WITH RECURSIVE descendant_folders(id) AS (
				SELECT id FROM folders WHERE parent_id = ${folderId}
				UNION ALL
				SELECT f.id FROM folders f
				JOIN descendant_folders df ON f.parent_id = df.id
			)
			SELECT id FROM descendant_folders
		`);
		const folderIds = [folderId, ...descendantsResult.map((row: any) => row.id as string)];

		let currentStorage = locals.user.storageUsed;

		// For each folder, find all files and hard delete them
		for (const fid of folderIds) {
			const folderFiles = await db.select().from(files).where(eq(files.folderId, fid));
			for (const file of folderFiles) {
				try {
					currentStorage = await hardDeleteFile(file.id, userId, currentStorage);
				} catch (e) {
					console.error(`Failed to hard delete file ${file.id} in folder ${fid}:`, e);
				}
			}
			// Delete the folder itself from DB
			await db.delete(folders).where(eq(folders.id, fid));
		}

		return json({ success: true });
	} catch (e) {
		console.error('Failed to delete folder:', e);
		return json({ error: 'Internal Server Error' }, { status: 500 });
	}
};
