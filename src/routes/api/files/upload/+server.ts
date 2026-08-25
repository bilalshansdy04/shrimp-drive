import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { users, files } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { uploadFileToTelegram } from '$lib/server/telegram';
import { parseBuffer } from 'music-metadata';
import crypto from 'crypto';
import { encryptBuffer } from '$lib/server/crypto';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB soft limit

function getFileType(mimeType: string, fileName: string) {
	const ext = fileName.split('.').pop()?.toLowerCase().trim();
	
	const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'heic', 'svg', 'tiff', 'raw'];
	const videoExts = ['mp4', 'mkv', 'webm', 'avi', 'mov', 'flv', 'wmv'];
	const audioExts = ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'];

	if (mimeType.startsWith('audio/') || (ext && audioExts.includes(ext))) return 'audio';
	if (mimeType.startsWith('video/') || (ext && videoExts.includes(ext))) return 'video';
	if (mimeType.startsWith('image/') || (ext && imageExts.includes(ext))) return 'image';
	return 'document';
}

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const formData = await request.formData();
		const file = formData.get('file') as File;

		if (!file || !(file instanceof File)) {
			return json({ error: 'No valid file provided' }, { status: 400 });
		}

		if (file.size > MAX_FILE_SIZE) {
			return json({ error: 'File size exceeds 20MB limit.' }, { status: 400 });
		}

		if (locals.user.storageUsed + file.size > locals.user.storageLimit) {
			return json({ error: 'Storage Limit Exceeded' }, { status: 403 });
		}

		const fileType = getFileType(file.type, file.name);

		const folderId = formData.get('folderId') as string | null;

		// Validate folder if provided
		if (folderId) {
			const { folders } = await import('$lib/server/db/schema');
			const { and, eq } = await import('drizzle-orm');

			const targetFolder = await db.query.folders.findFirst({
				where: and(eq(folders.id, folderId), eq(folders.userId, locals.user.id))
			});

			if (!targetFolder) {
				return json({ error: 'Target folder not found' }, { status: 404 });
			}

			if (targetFolder.category !== fileType) {
				return json(
					{ error: `Cannot upload ${fileType} to a ${targetFolder.category} folder` },
					{ status: 400 }
				);
			}
		}

		const conflictAction = formData.get('conflictAction') as string | null;
		const replaceFileId = formData.get('replaceFileId') as string | null;

		let finalFileName = file.name;
		if (conflictAction !== 'replace') {
			let counter = 1;
			let nameBase = file.name;
			let nameExt = '';
			const lastDotIdx = file.name.lastIndexOf('.');
			if (lastDotIdx > 0) {
				nameBase = file.name.substring(0, lastDotIdx);
				nameExt = file.name.substring(lastDotIdx);
			}

			const { and, eq, isNull } = await import('drizzle-orm');
			while (true) {
				const existing = await db.query.files.findFirst({
					where: and(
						eq(files.userId, locals.user.id),
						folderId ? eq(files.folderId, folderId) : isNull(files.folderId),
						eq(files.fileName, finalFileName)
					)
				});
				if (!existing) break;
				finalFileName = `${nameBase}(${counter})${nameExt}`;
				counter++;
			}
		}

		// Fetch Telegram Node
		const { telegramNodes, encryptionKeys } = await import('$lib/server/db/schema');
		const nodeResult = await db
			.select()
			.from(telegramNodes)
			.where(eq(telegramNodes.id, locals.user.telegramNodeId!));
		if (nodeResult.length === 0) {
			return json({ error: 'Telegram node not found' }, { status: 400 });
		}
		const node = nodeResult[0];

		// Fetch Encryption Key if needed
		let encryptionKeyStr: string | null = null;
		if (locals.user.encryptionKeyId) {
			const keyResult = await db
				.select()
				.from(encryptionKeys)
				.where(eq(encryptionKeys.id, locals.user.encryptionKeyId));
			if (keyResult.length > 0) {
				encryptionKeyStr = keyResult[0].keyValue;
			}
		}

		let metadata: any = {};

		if (fileType === 'audio') {
			const audioTitle = formData.get('audioTitle') as string | null;
			const audioArtist = formData.get('audioArtist') as string | null;
			const audioAlbum = formData.get('audioAlbum') as string | null;
			const audioDuration = formData.get('audioDuration') as string | null;
			const audioThumbnail = formData.get('audioThumbnail') as Blob | null;

			if (audioTitle) metadata.title = audioTitle;
			if (audioArtist) metadata.artist = audioArtist;
			if (audioAlbum) metadata.album = audioAlbum;
			if (audioDuration) metadata.duration = parseFloat(audioDuration);

			if (audioThumbnail) {
				try {
					const picTgResult = await uploadFileToTelegram(
						node.botToken,
						node.chatId,
						audioThumbnail,
						'cover.jpg'
					);
					metadata.thumbnailUrl = `/api/files/thumbnail/${picTgResult.telegramFileId}`;
				} catch (e) {
					console.error('Failed to upload thumbnail to Telegram:', e);
				}
			}
		} else if (fileType === 'video') {
			const videoThumbnail = formData.get('videoThumbnail') as string | null;
			const videoDuration = formData.get('videoDuration') as string | null;
			if (videoThumbnail) {
				metadata.thumbnailUrl = videoThumbnail;
			}
			if (videoDuration) {
				metadata.duration = parseFloat(videoDuration);
			}
		} else if (fileType === 'image') {
			const imageThumbnail = formData.get('imageThumbnail') as string | null;
			if (imageThumbnail) {
				metadata.thumbnailUrl = imageThumbnail;
			}
		}

		let fileId: string = crypto.randomUUID();
		let existingFile: any = null;

		if (conflictAction === 'replace' && replaceFileId) {
			existingFile = await db.query.files.findFirst({
				where: and(eq(files.id, replaceFileId), eq(files.userId, locals.user.id))
			});
			if (existingFile) {
				fileId = existingFile.id;
			}
		}

		const isEncrypted = formData.get('isEncryptedClientSide') === 'true';
		const clientEncryptedMetadata = formData.get('encryptedMetadata') as string | null;
		
		const tgFileName = isEncrypted ? `${crypto.randomUUID().replace(/-/g, '')}.txt` : finalFileName;

		// --- DISASTER RECOVERY: Self-Healing Metadata Injection ---
		// We encrypt the full database record into the caption.
		const disasterRecoveryMetadata = {
			id: fileId,
			userId: locals.user.id,
			folderId: folderId || null,
			fileName: finalFileName,
			fileType: fileType,
			mimeType: file.type || 'application/octet-stream',
			fileSize: file.size,
			title: metadata.title || null,
			artist: metadata.artist || null,
			album: metadata.album || null,
			duration: metadata.duration ? Math.round(metadata.duration) : null,
			thumbnailUrl: metadata.thumbnailUrl || null,
			isEncrypted: isEncrypted ? 1 : 0,
			cem: clientEncryptedMetadata // include client-side encrypted metadata if any
		};

		// Simple AES-256-CBC encryption using ADMIN_MASTER_KEY
		let finalCaption: string | undefined = undefined;
		try {
			const { env } = await import('$env/dynamic/private');
			const adminKey = env.ADMIN_MASTER_KEY || 'default-fallback-key-32chars-min-!!';
			// Ensure key is 32 bytes
			const keyBuffer = crypto.createHash('sha256').update(adminKey).digest();
			const iv = crypto.randomBytes(16);
			const cipher = crypto.createCipheriv('aes-256-cbc', keyBuffer, iv);
			let encrypted = cipher.update(JSON.stringify(disasterRecoveryMetadata), 'utf8', 'base64');
			encrypted += cipher.final('base64');
			const ivBase64 = iv.toString('base64');
			finalCaption = `SD_REC|${ivBase64}|${encrypted}`;
		} catch (e) {
			console.error('Failed to encrypt self-healing metadata:', e);
			// Fallback to client's encrypted metadata or none
			finalCaption = clientEncryptedMetadata || undefined;
		}

		// Upload to Telegram
		const tgResult = await uploadFileToTelegram(
			node.botToken, 
			node.chatId, 
			file, 
			tgFileName,
			finalCaption
		);

		if (conflictAction === 'replace' && replaceFileId && existingFile) {
			await db
				.update(files)
				.set({
					fileType: fileType,
					mimeType: file.type || 'application/octet-stream',
					fileSize: file.size,
					telegramFileId: tgResult.telegramFileId,
					title: metadata.title,
					artist: metadata.artist,
					album: metadata.album,
					duration: metadata.duration ? Math.round(metadata.duration) : null,
					thumbnailUrl: metadata.thumbnailUrl || null,
					telegramMessageId: tgResult.telegramMessageId,
					isEncrypted
				})
				.where(eq(files.id, fileId));

			const sizeDiff = file.size - existingFile.fileSize;
			await db
				.update(users)
				.set({ storageUsed: locals.user.storageUsed + sizeDiff })
				.where(eq(users.id, locals.user.id));

			return json({ success: true, fileId });
		}

		await db.insert(files).values({
			id: fileId,
			userId: locals.user.id,
			folderId: folderId || null,
			fileName: finalFileName,
			fileType: fileType,
			mimeType: file.type || 'application/octet-stream',
			fileSize: file.size,
			telegramFileId: tgResult.telegramFileId,
			title: metadata.title,
			artist: metadata.artist,
			album: metadata.album,
			duration: metadata.duration ? Math.round(metadata.duration) : null,
			thumbnailUrl: metadata.thumbnailUrl || null,
			telegramMessageId: tgResult.telegramMessageId,
			isEncrypted
		});

		const newStorageUsed = locals.user.storageUsed + file.size;
		await db.update(users).set({ storageUsed: newStorageUsed }).where(eq(users.id, locals.user.id));

		return json({ success: true, fileId });
	} catch (error: any) {
		console.error('Upload error:', error);
		if (error.retryAfter) {
			return json({ error: error.message, retryAfter: error.retryAfter }, { status: 429 });
		}
		return json({ error: error.message || 'Internal Server Error' }, { status: 500 });
	}
};
