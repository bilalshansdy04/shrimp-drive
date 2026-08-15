import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { files } from '$lib/server/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { getFileDownloadUrl } from '$lib/server/telegram';

export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const fileId = params.id;

	const result = await db
		.select()
		.from(files)
		.where(and(eq(files.id, fileId), eq(files.userId, locals.user.id), isNull(files.deletedAt)));

	if (result.length === 0) {
		throw error(404, 'File not found');
	}

	const file = result[0];

	try {
		const downloadUrl = await getFileDownloadUrl(locals.user.telegramBotToken, file.telegramFileId);
		
		const response = await fetch(downloadUrl);
		
		if (!response.ok || !response.body) {
			throw new Error('Failed to fetch file from Telegram');
		}

		return new Response(response.body, {
			headers: {
				'Content-Type': file.mimeType,
				'Content-Disposition': `attachment; filename="${file.fileName}"`,
				'Content-Length': file.fileSize.toString()
			}
		});
	} catch (err: any) {
		console.error('Download error:', err);
		throw error(500, err.message || 'Failed to download file');
	}
};
