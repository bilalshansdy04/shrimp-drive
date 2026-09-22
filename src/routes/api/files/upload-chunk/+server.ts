import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { telegramNodes } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const formData = await request.formData();
		const chunk = formData.get('chunk') as Blob;
		const chunkIndex = formData.get('chunkIndex') as string;
		const fileName = formData.get('fileName') as string;

		if (!chunk || !chunkIndex || !fileName) {
			return json({ error: 'Missing chunk, chunkIndex, or fileName' }, { status: 400 });
		}

		// Fetch user's Telegram node
		const nodeResult = await db
			.select()
			.from(telegramNodes)
			.where(eq(telegramNodes.id, locals.user.telegramNodeId!));

		if (nodeResult.length === 0) {
			return json({ error: 'Telegram node not found' }, { status: 400 });
		}

		const node = nodeResult[0];

		// Create FormData for Telegram
		const tgFormData = new FormData();
		tgFormData.append('chat_id', node.chatId);
		tgFormData.append('document', chunk, `${crypto.randomUUID()}.dat`);

		// Upload to Telegram
		const tgUrl = `https://api.telegram.org/bot${node.botToken}/sendDocument`;
		const tgRes = await fetch(tgUrl, {
			method: 'POST',
			body: tgFormData
		});

		const tgData = await tgRes.json();

		if (!tgData.ok) {
			return json(
				{ error: 'Telegram upload failed', details: tgData.description },
				{ status: 502 }
			);
		}

		const fileObj = tgData.result.document;
		return json({
			success: true,
			telegramFileId: fileObj.file_id,
			telegramFileName: fileObj.file_name,
			telegramFileSize: fileObj.file_size,
			telegramMessageId: tgData.result.message_id
		});
	} catch (error: any) {
		console.error('Upload chunk error:', error);
		return json({ error: error.message || 'Internal Server Error' }, { status: 500 });
	}
};
