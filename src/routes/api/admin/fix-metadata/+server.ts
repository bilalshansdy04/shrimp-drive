import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { users, files } from '$lib/server/db/schema';
import { eq, and, isNull, or, inArray } from 'drizzle-orm';
import { getFileDownloadUrl, uploadFileToTelegram } from '$lib/server/telegram';
import { parseBuffer } from 'music-metadata';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const userId = locals.user.id;

	// Find all audio/video files that are missing a thumbnailUrl or duration
	const mediaFiles = await db
		.select()
		.from(files)
		.where(
			and(
				eq(files.userId, userId),
				inArray(files.fileType, ['audio', 'video']),
				isNull(files.deletedAt),
				or(isNull(files.thumbnailUrl), isNull(files.duration))
			)
		);

	let fixedCount = 0;
	let errors = [];

	for (const file of mediaFiles) {
		try {
			const tgUrl = await getFileDownloadUrl(locals.user.telegramBotToken, file.telegramFileId);
			const response = await fetch(tgUrl);
			
			if (!response.ok) {
				errors.push(`Failed to fetch file ${file.fileName} from Telegram`);
				continue;
			}
			
			const arrayBuffer = await response.arrayBuffer();
			const buffer = Buffer.from(arrayBuffer);
			
			const audioMeta = await parseBuffer(buffer, file.mimeType || 'audio/mpeg');
			
			let newThumbnailUrl = null;
			let title = file.title;
			let artist = file.artist;
			let album = file.album;
			let duration = file.duration;

			if (audioMeta.common.title) title = audioMeta.common.title;
			if (audioMeta.common.artist) artist = audioMeta.common.artist;
			if (audioMeta.common.album) album = audioMeta.common.album;
			if (audioMeta.format.duration) duration = Math.round(audioMeta.format.duration);

			if (audioMeta.common.picture && audioMeta.common.picture.length > 0) {
				const pic = audioMeta.common.picture[0];
				const picBlob = new Blob([pic.data as unknown as BlobPart], { type: pic.format });
				const picTgResult = await uploadFileToTelegram(
					locals.user.telegramBotToken,
					locals.user.telegramChatId,
					picBlob,
					'cover.jpg'
				);
				newThumbnailUrl = `/api/files/thumbnail/${picTgResult.telegramFileId}`;
			}

			await db
				.update(files)
				.set({
					thumbnailUrl: newThumbnailUrl,
					title,
					artist,
					album,
					duration
				})
				.where(eq(files.id, file.id));

			fixedCount++;
		} catch (err: any) {
			console.error(`Error fixing ${file.fileName}:`, err);
			errors.push(`Error on ${file.fileName}: ${err.message}`);
		}
	}

	return json({
		success: true,
		scanned: mediaFiles.length,
		fixed: fixedCount,
		errors
	});
};
