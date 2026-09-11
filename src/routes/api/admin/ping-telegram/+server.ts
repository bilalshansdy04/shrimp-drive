import { json } from '@sveltejs/kit';
import { requireAdminAuth } from '$lib/server/adminAuth';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	requireAdminAuth(request);
	try {
		const { botToken, chatId } = await request.json();

		if (!botToken || !chatId) {
			return json({ success: false, error: 'Bot Token and Chat ID required' }, { status: 400 });
		}

		const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ chat_id: chatId, text: 'ping!!' })
		});

		const data = await response.json();
		return json({ success: data.ok, data });
	} catch (error: any) {
		return json({ success: false, error: error.message }, { status: 500 });
	}
};
