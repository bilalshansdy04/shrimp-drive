import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { files, users } from '$lib/server/db/schema';
import { eq, desc, and, isNull } from 'drizzle-orm';
import { redirect, fail } from '@sveltejs/kit';

import { sql } from 'drizzle-orm';
import { folders } from '$lib/server/db/schema';
import crypto from 'crypto';

export const load: PageServerLoad = async ({ url, locals }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	const userId = locals.user.id;
	const folderId = url.searchParams.get('folder') || null;

	// Fetch current folder if not root
	let currentFolder = null;
	if (folderId) {
		currentFolder = await db.query.folders.findFirst({
			where: and(eq(folders.id, folderId), eq(folders.userId, userId))
		});
		if (!currentFolder) {
			throw redirect(302, '/drive');
		}
	}

	// 1.5 Fetch folders in current folder
	let childFolders = await db
		.select()
		.from(folders)
		.where(
			and(
				eq(folders.userId, userId),
				folderId ? eq(folders.parentId, folderId) : isNull(folders.parentId),
				isNull(folders.deletedAt)
			)
		)
		.orderBy(desc(folders.createdAt));

	// 1.5.1 Auto-create default root folders if missing
	if (!folderId) {
		const existingCategories = new Set(childFolders.map(f => f.category));
		const defaultFolders = [
			{ name: 'Music', category: 'audio' },
			{ name: 'Video', category: 'video' },
			{ name: 'Photo', category: 'image' },
			{ name: 'Docs', category: 'document' }
		] as const;

		let createdAny = false;
		for (const def of defaultFolders) {
			if (!existingCategories.has(def.category)) {
				await db.insert(folders).values({
					id: crypto.randomUUID(),
					userId,
					name: def.name,
					category: def.category,
					parentId: null
				});
				createdAny = true;
			}
		}

		if (createdAny) {
			childFolders = await db
				.select()
				.from(folders)
				.where(
					and(
						eq(folders.userId, userId),
						isNull(folders.parentId),
						isNull(folders.deletedAt)
					)
				)
				.orderBy(desc(folders.createdAt));
		}

		// 1.5.2 Auto-sort root files into default category folders
		const rootFiles = await db
			.select()
			.from(files)
			.where(and(eq(files.userId, userId), isNull(files.folderId), isNull(files.deletedAt)));
		
		if (rootFiles.length > 0) {
			const categoryToFolderId = new Map(childFolders.map(f => [f.category, f.id]));
			for (const file of rootFiles) {
				const targetFolderId = categoryToFolderId.get(file.fileType);
				if (targetFolderId) {
					await db.update(files).set({ folderId: targetFolderId }).where(eq(files.id, file.id));
				}
			}
		}
	}

	// 1. Fetch files in current folder
	const recentFilesResult = await db
		.select()
		.from(files)
		.where(
			and(
				eq(files.userId, userId),
				folderId ? eq(files.folderId, folderId) : isNull(files.folderId),
				isNull(files.deletedAt)
			)
		)
		.orderBy(desc(files.createdAt));


	// 1.6 Fetch Breadcrumbs using Recursive CTE
	let breadcrumbs: { id: string, name: string }[] = [];
	if (folderId) {
		const rows = await db.all(sql`
			WITH RECURSIVE parent_folders(id, name, parent_id, level) AS (
				SELECT id, name, parent_id, 0 as level FROM folders WHERE id = ${folderId}
				UNION ALL
				SELECT f.id, f.name, f.parent_id, pf.level + 1 FROM folders f
				JOIN parent_folders pf ON f.id = pf.parent_id
			)
			SELECT id, name FROM parent_folders ORDER BY level DESC
		`);
		breadcrumbs = rows as { id: string, name: string }[];
	}

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
		childFolders,
		currentFolder,
		breadcrumbs,
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
