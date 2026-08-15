import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { files } from '$lib/server/db/schema';
import { eq, and, desc, isNull } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	const docFiles = await db
		.select()
		.from(files)
		.where(
			and(
				eq(files.userId, locals.user.id),
				eq(files.fileType, 'document'),
				isNull(files.deletedAt)
			)
		)
		.orderBy(desc(files.createdAt));

	return {
		docFiles
	};
};
