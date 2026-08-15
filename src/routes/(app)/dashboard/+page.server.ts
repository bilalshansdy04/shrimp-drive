import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { files, users } from '$lib/server/db/schema';
import { eq, desc, and, isNull } from 'drizzle-orm';
import { redirect, fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	const userId = locals.user.id;

	// 1. Fetch recent files
	const recentFilesResult = await db
		.select()
		.from(files)
		.where(and(eq(files.userId, userId), isNull(files.deletedAt)))
		.orderBy(desc(files.createdAt))
		.limit(10);

	// 2. Fetch category stats
	const allFiles = await db.select({
		fileType: files.fileType,
		fileSize: files.fileSize
	}).from(files).where(and(eq(files.userId, userId), isNull(files.deletedAt)));

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

export const actions = {
	delete: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const data = await request.formData();
		const fileId = data.get('fileId') as string;

		if (!fileId) {
			return fail(400, { error: 'File ID missing' });
		}

		const fileResult = await db
			.select()
			.from(files)
			.where(and(eq(files.id, fileId), eq(files.userId, locals.user.id)));

		if (fileResult.length === 0) {
			return fail(404, { error: 'File not found' });
		}

		const fileToDelete = fileResult[0];

		await db.update(files).set({ deletedAt: new Date() }).where(eq(files.id, fileId));

		const newStorageUsed = Math.max(0, locals.user.storageUsed - fileToDelete.fileSize);
		await db.update(users).set({ storageUsed: newStorageUsed }).where(eq(users.id, locals.user.id));

		return { success: true };
	}
};
