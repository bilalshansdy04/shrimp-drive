import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { files } from '$lib/server/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { getFileDownloadUrl } from '$lib/server/telegram';
import { createDecryptionStream } from '$lib/server/crypto';
import { Readable } from 'node:stream';

export const GET: RequestHandler = async ({ request, params, locals }) => {
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
		
		const requestHeaders = new Headers();
		const range = request.headers.get('Range');
		if (range) {
			requestHeaders.set('Range', range);
		}
		
		const response = await fetch(downloadUrl, { headers: requestHeaders });
		
		if (!response.ok || !response.body) {
			throw new Error('Failed to fetch file from Telegram');
		}

		const responseHeaders = new Headers();
		responseHeaders.set('Content-Type', file.mimeType);
		
		const urlObj = new URL(request.url);
		const isDownload = urlObj.searchParams.has('download');
		const encodedFilename = encodeURIComponent(file.fileName);
		responseHeaders.set('Content-Disposition', `${isDownload ? 'attachment' : 'inline'}; filename*=UTF-8''${encodedFilename}`);
		
		responseHeaders.set('Accept-Ranges', 'bytes');
		if (response.headers.has('Content-Length')) {
			responseHeaders.set('Content-Length', response.headers.get('Content-Length')!);
		} else {
			responseHeaders.set('Content-Length', file.fileSize.toString());
		}

		if (response.headers.has('Content-Range')) {
			responseHeaders.set('Content-Range', response.headers.get('Content-Range')!);
		}

		let finalBody: any = response.body;

		if (file.isEncrypted) {
			if (!locals.user.encryptionKey) {
				throw new Error('Encryption key not found');
			}
			let offset = 0;
			if (range) {
				const match = range.match(/bytes=(\d+)-/);
				if (match && match[1]) {
					offset = parseInt(match[1], 10);
				}
			}
			const nodeReadable = Readable.fromWeb(response.body as any);
			const decipher = createDecryptionStream(locals.user.encryptionKey, file.id, offset);
			
			// Prevent unhandled error crashes when client disconnects
			nodeReadable.on('error', (err) => {
				decipher.destroy(err);
			});
			decipher.on('error', () => {
				// Swallow error to prevent crash
			});

			const decryptedNodeStream = nodeReadable.pipe(decipher);
			
			decryptedNodeStream.on('error', () => {
				// Swallow error to prevent crash
			});

			finalBody = Readable.toWeb(decryptedNodeStream);
		}

		return new Response(finalBody, {
			status: response.status,
			headers: responseHeaders
		});
	} catch (err: any) {
		console.error('Download error:', err);
		throw error(500, err.message || 'Failed to download file');
	}
};
