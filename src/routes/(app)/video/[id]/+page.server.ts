import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { files } from '$lib/server/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { error, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	const fileId = params.id;
	const userId = locals.user.id;

	const [videoFile] = await db
		.select()
		.from(files)
		.where(and(eq(files.id, fileId), eq(files.userId, userId), isNull(files.deletedAt)))
		.limit(1);

	if (!videoFile || videoFile.fileType !== 'video') {
		throw error(404, 'Video not found');
	}

	return {
		videoFile
	};
};
