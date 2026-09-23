import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { users, files } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import { parseBuffer } from 'music-metadata';
import { uploadFileToTelegram } from '$lib/server/telegram';

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
		messageIds,
		conflictAction = 'rename',
		replaceFileId = null,
		title: audioTitle,
		artist: audioArtist,
		album: audioAlbum,
		duration: audioDuration,
		thumbnailUrl: audioThumbnailUrl
	} = body;

	if (!name || !size || !mimeType || !Array.isArray(parts) || parts.length === 0) {
		return json({ error: 'Missing required fields: name, size, mimeType, parts' }, { status: 400 });
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

	// Fetch user's Telegram node for metadata extraction
	const { telegramNodes } = await import('$lib/server/db/schema');
	const nodeResult = await db
		.select()
		.from(telegramNodes)
		.where(eq(telegramNodes.id, locals.user.telegramNodeId!));
	const node = nodeResult[0];

	// Extract audio metadata: use client-provided fields or parse from file
	let metadataTitle: string | null = audioTitle || null;
	let metadataArtist: string | null = audioArtist || null;
	let metadataAlbum: string | null = audioAlbum || null;
	let metadataDuration: number | null = audioDuration ? Math.round(parseFloat(String(audioDuration))) : null;
	let metadataThumbnailUrl: string | null = audioThumbnailUrl || null;

	if (fileType === 'audio' && node && (!metadataTitle || !metadataArtist || !metadataAlbum || !metadataDuration || !metadataThumbnailUrl)) {
		try {
			const tgUrl = `https://api.telegram.org/bot${node.botToken}/getFile?file_id=${parts[0]}`;
			const tgRes = await fetch(tgUrl);
			const tgData = await tgRes.json();
			if (!tgData.ok) throw new Error(tgData.description || 'Failed to get file from Telegram');

			const filePath = tgData.result.file_path;
			const downloadUrl = `https://api.telegram.org/file/bot${node.botToken}/${filePath}`;
			const resp = await fetch(downloadUrl);
			if (!resp.ok) throw new Error('Failed to download file from Telegram');

			const arrayBuffer = await resp.arrayBuffer();
			const buffer = Buffer.from(arrayBuffer);
			const parsed = await parseBuffer(buffer, mimeType);

			if (!metadataTitle && parsed.common?.title) metadataTitle = parsed.common.title;
			if (!metadataArtist && parsed.common?.artist) metadataArtist = parsed.common.artist;
			if (!metadataAlbum && parsed.common?.album) metadataAlbum = parsed.common.album;
			if (!metadataDuration && parsed.format?.duration) metadataDuration = Math.round(parsed.format.duration);
			if (!metadataThumbnailUrl && parsed.common?.picture && parsed.common.picture.length > 0) {
				const pic = parsed.common.picture[0];
				const picBlob = new Blob([pic.data as unknown as BlobPart], { type: pic.format || 'image/jpeg' });
				const picResult = await uploadFileToTelegram(node.botToken, node.chatId, picBlob, `${crypto.randomUUID()}.dat`);
				metadataThumbnailUrl = `/api/files/thumbnail/${picResult.telegramFileId}`;
				if (Array.isArray(messageIds)) {
					messageIds.push(picResult.telegramMessageId);
				}
			}
		} catch (e) {
			console.error('Failed to extract audio metadata in finalize:', e);
		}
	}

	// Build disaster recovery metadata
	const fileId = replaceFileId || crypto.randomUUID();
	const disasterRecoveryMetadata = {
		id: fileId,
		userId: locals.user.id,
		folderId,
		fileName: finalFileName,
		fileType,
		mimeType,
		fileSize: size,
		title: metadataTitle || null,
		artist: metadataArtist || null,
		album: metadataAlbum || null,
		duration: metadataDuration,
		thumbnailUrl: metadataThumbnailUrl,
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
				telegramFileId: parts[0],
				telegramFileIds: JSON.stringify(parts),
				isChunked: parts.length > 1 ? 1 : 0,
				telegramMessageId: null,
				telegramMessageIds: Array.isArray(messageIds) && messageIds.length > 0 ? JSON.stringify(messageIds) : null,
				isEncrypted: 0,
				title: metadataTitle,
				artist: metadataArtist,
				album: metadataAlbum,
				duration: metadataDuration,
				thumbnailUrl: metadataThumbnailUrl
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
			telegramMessageIds: Array.isArray(messageIds) && messageIds.length > 0 ? JSON.stringify(messageIds) : null,
			isEncrypted: 0,
			title: metadataTitle,
			artist: metadataArtist,
			album: metadataAlbum,
			duration: metadataDuration,
			thumbnailUrl: metadataThumbnailUrl
		});

		await db
			.update(users)
			.set({ storageUsed: locals.user.storageUsed + size })
			.where(eq(users.id, locals.user.id));
	}

	return json({ success: true, fileId });
};
