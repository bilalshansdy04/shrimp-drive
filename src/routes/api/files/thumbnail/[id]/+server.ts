import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getFileDownloadUrl } from '$lib/server/telegram';

export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const telegramFileId = params.id;
	if (!telegramFileId) {
		throw error(400, 'Thumbnail ID required');
	}

	try {
		const { telegramNodes } = await import('$lib/server/db/schema');
		const { db } = await import('$lib/server/db');
		const { eq } = await import('drizzle-orm');

		const nodeResult = await db.select().from(telegramNodes).where(eq(telegramNodes.id, locals.user.telegramNodeId!));
		if (nodeResult.length === 0) {
			throw error(400, 'Telegram node not found');
		}
		const node = nodeResult[0];

		const tgDownloadUrl = await getFileDownloadUrl(node.botToken, telegramFileId);
		const tgResponse = await fetch(tgDownloadUrl);

		if (!tgResponse.ok) {
			throw error(tgResponse.status, 'Failed to fetch thumbnail from Telegram');
		}

		// Provide far future cache headers since telegram file IDs are immutable for the same file content
		const headers = new Headers();
		headers.set('Cache-Control', 'public, max-age=31536000, immutable');
		headers.set('Content-Type', tgResponse.headers.get('Content-Type') || 'image/jpeg');
		headers.set('Content-Length', tgResponse.headers.get('Content-Length') || '');

		return new Response(tgResponse.body, {
			status: 200,
			headers
		});
	} catch (err: any) {
		console.error('Thumbnail download error:', err);
		throw error(500, err.message || 'Internal Server Error');
	}
};
