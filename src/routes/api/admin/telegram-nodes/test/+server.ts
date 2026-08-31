import { json } from '@sveltejs/kit';
import { requireAdminAuth } from '$lib/server/adminAuth';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	requireAdminAuth(request);
	try {
		const body = await request.json();
		const { botToken, chatId } = body;

		if (!botToken || !chatId) {
			return json(
				{ success: false, error: 'Bot Token and Chat ID are required' },
				{ status: 400 }
			);
		}

		const response = await fetch(`https://api.telegram.org/bot${botToken}/getChat?chat_id=${chatId}`);
		const data = await response.json();

		if (!response.ok || !data.ok) {
			return json({
				success: false,
				error: data.description || 'Invalid Bot Token or Chat ID'
			});
		}

		return json({
			success: true,
			data: {
				chatTitle: data.result.title || data.result.username || 'Unknown Chat'
			}
		});
	} catch (error: any) {
		return json({ success: false, error: error.message }, { status: 500 });
	}
};
