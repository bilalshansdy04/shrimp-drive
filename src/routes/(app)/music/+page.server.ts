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

export const actions = {
	delete: async ({ request, locals }) => {
		if (!locals.user) {
			return { status: 401, error: 'Unauthorized' };
		}
		const data = await request.formData();
		const fileId = data.get('fileId') as string;
		if (!fileId) return { status: 400, error: 'File ID missing' };

		try {
			const { hardDeleteFile } = await import('$lib/server/fileUtils');
			await hardDeleteFile(fileId, locals.user.id, locals.user.storageUsed);
			return { success: true };
		} catch (e: any) {
			console.error('DELETE ERROR:', e);
			return { status: 404, error: e.message || 'File not found' };
		}
	}
};
