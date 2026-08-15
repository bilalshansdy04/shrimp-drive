import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { files, folders } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, params, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const fileId = params.id;

	try {
		const body = await request.json();
		const { targetFolderId } = body; // can be null (move to root)

		// Ensure file belongs to user
		const file = await db.query.files.findFirst({
			where: and(eq(files.id, fileId), eq(files.userId, locals.user.id))
		});

		if (!file) {
			return json({ error: 'File not found' }, { status: 404 });
		}

		// If moving to a specific folder, validate the folder
		if (targetFolderId) {
			const targetFolder = await db.query.folders.findFirst({
				where: and(eq(folders.id, targetFolderId), eq(folders.userId, locals.user.id))
			});

			if (!targetFolder) {
				return json({ error: 'Target folder not found' }, { status: 404 });
			}

			if (targetFolder.category !== file.fileType) {
				return json({ error: `Cannot move ${file.fileType} to a ${targetFolder.category} folder` }, { status: 400 });
			}
		}

		await db
			.update(files)
			.set({ folderId: targetFolderId || null })
			.where(eq(files.id, fileId));

		return json({ success: true });
	} catch (e) {
		console.error('Failed to move file:', e);
		return json({ error: 'Internal Server Error' }, { status: 500 });
	}
};
