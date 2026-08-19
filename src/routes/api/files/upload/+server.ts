import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { users, files } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { uploadFileToTelegram } from '$lib/server/telegram';
import { parseBuffer } from 'music-metadata';
import crypto from 'crypto';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB soft limit

function getFileType(mimeType: string) {
	if (mimeType.startsWith('audio/')) return 'audio';
	if (mimeType.startsWith('video/')) return 'video';
	if (mimeType.startsWith('image/')) return 'image';
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

		const fileType = getFileType(file.type);
		
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
				return json({ error: `Cannot upload ${fileType} to a ${targetFolder.category} folder` }, { status: 400 });
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

		let metadata: any = {};

		if (fileType === 'audio') {
			try {
				const buffer = Buffer.from(await file.arrayBuffer());
				const audioMeta = await parseBuffer(buffer, file.type);
				metadata = {
					title: audioMeta.common.title,
					artist: audioMeta.common.artist,
					album: audioMeta.common.album,
					duration: audioMeta.format.duration,
					thumbnailUrl: null as string | null
				};
				
				if (audioMeta.common.picture && audioMeta.common.picture.length > 0) {
					const pic = audioMeta.common.picture[0];
					const picBlob = new Blob([pic.data as unknown as BlobPart], { type: pic.format });
					try {
						const picTgResult = await uploadFileToTelegram(
							locals.user.telegramBotToken,
							locals.user.telegramChatId,
							picBlob,
							'cover.jpg'
						);
						metadata.thumbnailUrl = `/api/files/thumbnail/${picTgResult.telegramFileId}`;
					} catch (e) {
						console.error('Failed to upload thumbnail to Telegram:', e);
					}
				}
			} catch (e) {
				console.error('Failed to extract audio metadata:', e);
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

		// Upload to Telegram
		const tgResult = await uploadFileToTelegram(
			locals.user.telegramBotToken,
			locals.user.telegramChatId,
			file,
			finalFileName
		);

		let fileId: string = crypto.randomUUID();

		if (conflictAction === 'replace' && replaceFileId) {
			const { and, eq } = await import('drizzle-orm');
			const existingFile = await db.query.files.findFirst({
				where: and(eq(files.id, replaceFileId), eq(files.userId, locals.user.id))
			});

			if (existingFile) {
				fileId = existingFile.id;
				await db.update(files).set({
					fileType: fileType,
					mimeType: file.type || 'application/octet-stream',
					fileSize: file.size,
					telegramFileId: tgResult.telegramFileId,
					title: metadata.title,
					artist: metadata.artist,
					album: metadata.album,
					duration: metadata.duration ? Math.round(metadata.duration) : null,
					thumbnailUrl: metadata.thumbnailUrl || null
				}).where(eq(files.id, fileId));

				const sizeDiff = file.size - existingFile.fileSize;
				await db.update(users).set({ storageUsed: locals.user.storageUsed + sizeDiff }).where(eq(users.id, locals.user.id));
				
				return json({ success: true, fileId });
			}
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
			thumbnailUrl: metadata.thumbnailUrl || null
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
