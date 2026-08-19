import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { files } from '$lib/server/db/schema';
import { and, eq, inArray, isNull } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { folderId, fileNames } = await request.json();

		if (!Array.isArray(fileNames) || fileNames.length === 0) {
			return json({ conflicts: [] });
		}

		let query;
		if (folderId) {
			query = and(
				eq(files.userId, locals.user.id),
				eq(files.folderId, folderId),
				inArray(files.fileName, fileNames)
			);
		} else {
			query = and(
				eq(files.userId, locals.user.id),
				isNull(files.folderId),
				inArray(files.fileName, fileNames)
			);
		}

		const existingFiles = await db.query.files.findMany({
			where: query,
			columns: {
				id: true,
				fileName: true
			}
		});

		const conflicts = existingFiles.map(f => ({
			fileId: f.id,
			fileName: f.fileName
		}));

		return json({ conflicts });
	} catch (error: any) {
		console.error('Check conflicts error:', error);
		return json({ error: 'Internal Server Error' }, { status: 500 });
	}
};
