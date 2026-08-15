import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { folders } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { name, category, parentId } = body;

		if (!name || typeof name !== 'string') {
			return json({ error: 'Name is required' }, { status: 400 });
		}

		if (!['audio', 'video', 'image', 'document'].includes(category)) {
			return json({ error: 'Invalid category' }, { status: 400 });
		}

		// Validate parentId if provided
		if (parentId) {
			const parentFolder = await db.query.folders.findFirst({
				where: and(eq(folders.id, parentId), eq(folders.userId, locals.user.id))
			});

			if (!parentFolder) {
				return json({ error: 'Parent folder not found' }, { status: 404 });
			}

			if (parentFolder.category !== category) {
				return json({ error: 'Category mismatch with parent folder' }, { status: 400 });
			}
		}

		const newFolder = {
			id: crypto.randomUUID(),
			userId: locals.user.id,
			name,
			category,
			parentId: parentId || null
		};

		await db.insert(folders).values(newFolder);

		return json({ success: true, folder: newFolder });
	} catch (e) {
		console.error('Failed to create folder:', e);
		return json({ error: 'Internal Server Error' }, { status: 500 });
	}
};

export const GET: RequestHandler = async ({ request, url, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const category = url.searchParams.get('category');
	
	try {
		let conditions = [eq(folders.userId, locals.user.id)];
		if (category) {
			conditions.push(eq(folders.category, category));
		}
		
		const allFolders = await db.query.folders.findMany({
			where: and(...conditions)
		});

		return json({ folders: allFolders });
	} catch (e) {
		console.error('Failed to fetch folders:', e);
		return json({ error: 'Internal Server Error' }, { status: 500 });
	}
};
