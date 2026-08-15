import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { files } from '$lib/server/db/schema';
import { eq, desc, and, isNull } from 'drizzle-orm';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	const userId = locals.user.id;

	const audioFiles = await db
		.select()
		.from(files)
		.where(and(eq(files.userId, userId), eq(files.fileType, 'audio'), isNull(files.deletedAt)))
		.orderBy(desc(files.createdAt));

	return {
		audioFiles
	};
};
