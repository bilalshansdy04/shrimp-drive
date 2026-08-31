import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { files } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const docId = params.id;
	const doc = await db.query.files.findFirst({
		where: and(eq(files.id, docId), eq(files.userId, locals.user.id))
	});

	if (!doc) {
		throw error(404, 'Document not found');
	}

	return {
		doc
	};
};
