import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { users, files } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const body = await request.json();
	const {
		name,
		size,
		mimeType,
		fileType = 'document',
		folderId = null,
		parts,
		conflictAction = 'rename',
		replaceFileId = null
	} = body;

	if (!name || !size || !mimeType || !Array.isArray(parts) || parts.length === 0) {
		return json({ error: 'Missing required fields: name, size, mimeType, parts' }, { status: 400 });
	}

	// Validate storage limit
	if (locals.user.storageLimit !== -1 && locals.user.storageUsed + size > locals.user.storageLimit) {
		return json({ error: 'Storage Limit Exceeded' }, { status: 403 });
	}

	// Validate folder if provided
	if (folderId) {
		const { folders } = await import('$lib/server/db/schema');
		const targetFolder = await db.query.folders.findFirst({
			where: eq(folders.id, folderId)
		});
		if (!targetFolder) {
			return json({ error: 'Folder not found' }, { status: 404 });
		}
	}

	// Handle file conflict
	let finalFileName = name;
	if (conflictAction !== 'replace' && replaceFileId == null) {
		let counter = 1;
		const lastDotIdx = name.lastIndexOf('.');
		let nameBase = lastDotIdx > 0 ? name.substring(0, lastDotIdx) : name;
		let nameExt = lastDotIdx > 0 ? name.substring(lastDotIdx) : '';

		while (true) {
			const existing = await db.query.files.findFirst({
				where: eq(files.fileName, finalFileName)
			});
			if (!existing) break;
			finalFileName = `${nameBase}(${counter})${nameExt}`;
			counter++;
		}
	}

	// Validate folder category if folder provided
	if (folderId) {
		const { folders } = await import('$lib/server/db/schema');
		const targetFolder = await db.query.folders.findFirst({
			where: eq(folders.id, folderId)
		});
		if (targetFolder && targetFolder.category !== fileType) {
			return json(
				{ error: `Cannot upload ${fileType} to a ${targetFolder.category} folder` },
				{ status: 400 }
			);
		}
	}

	// Build disaster recovery metadata (same as existing upload handler)
	const fileId = replaceFileId || crypto.randomUUID();
	const disasterRecoveryMetadata = {
		id: fileId,
		userId: locals.user.id,
		folderId,
		fileName: finalFileName,
		fileType,
		mimeType,
		fileSize: size,
		isEncrypted: 0,
		cem: null
	};

	const { env } = await import('$env/dynamic/private');
	const adminKey = env.ADMIN_MASTER_KEY || 'default-fallback-key-32chars-min-!!';
	const keyBuffer = crypto.createHash('sha256').update(adminKey).digest();
	const iv = crypto.randomBytes(16);
	const cipher = crypto.createCipheriv('aes-256-cbc', keyBuffer, iv);
	let encryptedMeta = cipher.update(JSON.stringify(disasterRecoveryMetadata), 'utf8', 'base64');
	encryptedMeta += cipher.final('base64');
	const finalCaption = `SD_REC|${iv.toString('base64')}|${encryptedMeta}`;

	let existingFile: any = null;
	if (replaceFileId) {
		existingFile = await db.query.files.findFirst({
			where: eq(files.id, replaceFileId)
		});
	}

	// Insert/update file record
	if (existingFile) {
		// Replace existing file
		await db
			.update(files)
			.set({
				fileName: finalFileName,
				fileType,
				mimeType,
				fileSize: size,
				telegramFileId: parts[0], // Primary chunk file_id
				telegramFileIds: JSON.stringify(parts), // All chunk file_ids
				isChunked: parts.length > 1 ? 1 : 0,
				telegramMessageId: null, // Reset for new chunks
				isEncrypted: 0
			})
			.where(eq(files.id, fileId));

		const sizeDiff = size - existingFile.fileSize;
		await db
			.update(users)
			.set({ storageUsed: locals.user.storageUsed + sizeDiff })
			.where(eq(users.id, locals.user.id));
	} else {
		// New file
		await db.insert(files).values({
			id: fileId,
			userId: locals.user.id,
			folderId,
			fileName: finalFileName,
			fileType,
			mimeType,
			fileSize: size,
			telegramFileId: parts[0],
			telegramFileIds: JSON.stringify(parts),
			isChunked: parts.length > 1 ? 1 : 0,
			telegramMessageId: null,
			isEncrypted: 0
		});

		await db
			.update(users)
			.set({ storageUsed: locals.user.storageUsed + size })
			.where(eq(users.id, locals.user.id));
	}

	return json({ success: true, fileId });
};
