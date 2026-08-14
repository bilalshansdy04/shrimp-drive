import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { createSession, generateSessionToken } from '$lib/server/auth';
import bcrypt from 'bcryptjs';

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const data = await request.json();
		const { displayName, username, password, botToken, chatId } = data;

		if (!displayName || !username || !password || !botToken || !chatId) {
			return json({ error: 'All fields are required.' }, { status: 400 });
		}

		// 1. Verify Telegram Bot Token
		const getMeRes = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
		const getMeData = await getMeRes.json();
		if (!getMeData.ok) {
			return json({ error: 'Invalid Telegram Bot Token.' }, { status: 400 });
		}

		// 2. Verify Telegram Chat ID and bot access
		const getChatRes = await fetch(`https://api.telegram.org/bot${botToken}/getChat?chat_id=${chatId}`);
		const getChatData = await getChatRes.json();
		if (!getChatData.ok) {
			return json({ error: `Invalid Chat ID or Bot not added to channel. Telegram says: ${getChatData.description}` }, { status: 400 });
		}

		// 3. Hash Password
		const passwordHash = await bcrypt.hash(password, 10);

		// 4. Create User
		const userId = crypto.randomUUID();
		try {
			await db.insert(users).values({
				id: userId,
				username,
				displayName,
				passwordHash,
				telegramBotToken: botToken,
				telegramChatId: chatId
			});
		} catch (err: any) {
			// e.g. unique constraint failed for username
			return json({ error: 'Username already exists or database error.' }, { status: 400 });
		}

		// 5. Create Session
		const token = generateSessionToken();
		const session = await createSession(token, userId);

		cookies.set('session_id', token, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			expires: session.expiresAt
		});

		return json({ success: true });
	} catch (error) {
		console.error(error);
		return json({ error: 'Internal server error.' }, { status: 500 });
	}
};
