import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { files } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	const userId = locals.user.id;

	// 1. Fetch recent files
	const recentFilesResult = await db
		.select()
		.from(files)
		.where(eq(files.userId, userId))
		.orderBy(desc(files.createdAt))
		.limit(10);

	// 2. Fetch category stats
	const allFiles = await db.select({
		fileType: files.fileType,
		fileSize: files.fileSize
	}).from(files).where(eq(files.userId, userId));

	const stats = {
		audio: { size: 0, count: 0 },
		video: { size: 0, count: 0 },
		document: { size: 0, count: 0 },
		image: { size: 0, count: 0 }
	};

	allFiles.forEach((file) => {
		const type = file.fileType as keyof typeof stats;
		if (stats[type]) {
			stats[type].size += file.fileSize;
			stats[type].count += 1;
		}
	});

	return {
		recentFiles: recentFilesResult,
		stats
	};
};
