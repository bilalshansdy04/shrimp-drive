import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { files } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { getFileDownloadUrl } from '$lib/server/telegram';

export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { fileId } = params;

	// Fetch file record
	const fileRecord = await db.query.files.findFirst({
		where: eq(files.id, fileId)
	});

	if (!fileRecord) {
		return json({ error: 'File not found' }, { status: 404 });
	}

	// Parse Telegram file IDs (JSON array)
	let tgIds: string[] = [];
	if (fileRecord.telegramFileIds) {
		try {
			// stored as JSON text
			tgIds = JSON.parse(fileRecord.telegramFileIds);
		} catch {
			// fallback if single id stored in telegramFileId column
			if (fileRecord.telegramFileId) tgIds = [fileRecord.telegramFileId];
		}
	} else if (fileRecord.telegramFileId) {
		 tgIds = [fileRecord.telegramFileId];
	}

	if (tgIds.length === 0) {
		return json({ error: 'No Telegram file IDs associated' }, { status: 500 });
	}

	// Fetch each chunk from Telegram
	const buffers: Uint8Array[] = [];
	for (const tgId of tgIds) {
		const url = await getFileDownloadUrl(process.env.TELEGRAM_BOT_TOKEN!, tgId);
		const res = await fetch(url);
		if (!res.ok) {
			return json({ error: `Failed to fetch chunk ${tgId}` }, { status: 502 });
		}
		const arrayBuffer = await res.arrayBuffer();
		buffers.push(new Uint8Array(arrayBuffer));
	}

	// Concatenate buffers
	let totalLength = 0;
	for (const b of buffers) totalLength += b.byteLength;
	const combined = new Uint8Array(totalLength);
	let offset = 0;
	for (const b of buffers) {
		combined.set(b, offset);
		offset += b.byteLength;
	}

	return new Response(combined, {
		status: 200,
		headers: {
			'Content-Type': fileRecord.mimeType || 'application/octet-stream',
			'Content-Disposition': `attachment; filename="${fileRecord.fileName}"`
		}
	});
};
