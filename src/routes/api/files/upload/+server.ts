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
			file.name
		);

		const fileId = crypto.randomUUID();

		await db.insert(files).values({
			id: fileId,
			userId: locals.user.id,
			fileName: file.name,
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
		return json({ error: error.message || 'Internal Server Error' }, { status: 500 });
	}
};
