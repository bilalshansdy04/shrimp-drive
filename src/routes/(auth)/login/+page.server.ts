import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq, count } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { createSession, generateSessionToken } from '$lib/server/auth';

export const load: PageServerLoad = async () => {
	const userCountResult = await db.select({ count: count() }).from(users);
	if (userCountResult[0].count === 0) {
		throw redirect(303, '/onboarding');
	}
	return {};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const username = data.get('username') as string;
		const password = data.get('password') as string;

		if (!username || !password) {
			return fail(400, { error: 'Username and password are required.' });
		}

		const result = await db.select().from(users).where(eq(users.username, username));
		if (result.length === 0) {
			return fail(401, { error: 'Invalid username or password.' });
		}

		const user = result[0];
		const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

		if (!isPasswordValid) {
			return fail(401, { error: 'Invalid username or password.' });
		}

		const token = generateSessionToken();
		const session = await createSession(token, user.id);

		cookies.set('session_id', token, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			expires: session.expiresAt
		});

		throw redirect(303, '/dashboard');
	}
};
