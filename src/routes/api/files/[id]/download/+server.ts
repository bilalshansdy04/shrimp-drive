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
		// Fetch Telegram Node
		const { telegramNodes, encryptionKeys } = await import('$lib/server/db/schema');
		const nodeResult = await db
			.select()
			.from(telegramNodes)
			.where(eq(telegramNodes.id, locals.user.telegramNodeId!));
		if (nodeResult.length === 0) {
			throw new Error('Telegram node not found');
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

		// Parse Telegram file IDs
		let tgIds: string[] = [];
		if (file.telegramFileIds) {
			try {
				tgIds = JSON.parse(file.telegramFileIds);
			} catch {
				if (file.telegramFileId) tgIds = [file.telegramFileId];
			}
		} else if (file.telegramFileId) {
			tgIds = [file.telegramFileId];
		}

		if (tgIds.length === 0) {
			throw error(404, 'No file content found');
		}

		const responseHeaders = new Headers();
		responseHeaders.set('Content-Type', file.mimeType);

		const urlObj = new URL(request.url);
		const isDownload = urlObj.searchParams.has('download');
		const encodedFilename = encodeURIComponent(file.fileName);
		responseHeaders.set(
			'Content-Disposition',
			`${isDownload ? 'attachment' : 'inline'}; filename*=UTF-8''${encodedFilename}`
		);

		if (tgIds.length === 1) {
			// Single chunk: pass through Range requests
			const downloadUrl = await getFileDownloadUrl(node.botToken, tgIds[0]);

			const requestHeaders = new Headers();
			const range = request.headers.get('Range');
			if (range) {
				requestHeaders.set('Range', range);
			}

			const response = await fetch(downloadUrl, { headers: requestHeaders });

			if (!response.ok || !response.body) {
				throw new Error('Failed to fetch file from Telegram');
			}

			responseHeaders.set('Accept-Ranges', 'bytes');
			if (response.headers.has('Content-Length')) {
				responseHeaders.set('Content-Length', response.headers.get('Content-Length')!);
			} else {
				responseHeaders.set('Content-Length', file.fileSize.toString());
			}

			if (response.headers.has('Content-Range')) {
				responseHeaders.set('Content-Range', response.headers.get('Content-Range')!);
			}

			return new Response(response.body, {
				status: response.status,
				headers: responseHeaders
			});
		} else {
			// Multiple chunks: return full concatenated stream, ignore Range requests (status 200)
			responseHeaders.set('Content-Length', file.fileSize.toString());

			const stream = new ReadableStream({
				async start(controller) {
					try {
						for (const tgId of tgIds) {
							const downloadUrl = await getFileDownloadUrl(node.botToken, tgId);
							const response = await fetch(downloadUrl);
							if (!response.ok || !response.body) {
								throw new Error(`Failed to fetch chunk ${tgId}`);
							}
							const reader = response.body.getReader();
							while (true) {
								const { done, value } = await reader.read();
								if (done) break;
								controller.enqueue(value);
							}
						}
						controller.close();
					} catch (err) {
						controller.error(err);
					}
				}
			});

			return new Response(stream, {
				status: 200,
				headers: responseHeaders
			});
		}
	} catch (err: any) {
		console.error('Download error:', err);
		throw error(500, err.message || 'Failed to download file');
	}
};
