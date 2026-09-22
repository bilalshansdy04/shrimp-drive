import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq, count, or } from 'drizzle-orm';
import { hashPassword, comparePassword } from '$lib/server/hash';
import { createSession, generateSessionToken } from '$lib/server/auth';

export const load: PageServerLoad = async ({ url }) => {
	const error = url.searchParams.get('error');
	let errorMessage = '';
	if (error === 'suspended') {
		errorMessage = 'Your account has been suspended or deactivated. Please contact the administrator.';
	}
	return { errorMessage };
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const username = data.get('username') as string;
		const password = data.get('password') as string;

		if (!username || !password) {
			return fail(400, { error: 'Username and password are required.' });
		}

		const result = await db
			.select()
			.from(users)
			.where(or(eq(users.username, username), eq(users.email, username)));
		if (result.length === 0) {
			return fail(401, { error: 'Invalid credentials.' });
		}

		const user = result[0];

		if (!user.passwordHash) {
			return fail(401, { error: 'Please login with Google.' });
		}

		if (user.emailVerified === 0) {
			return fail(403, { error: 'Please verify your email before logging in.' });
		}

		if (!user.isActive || user.isSuspended) {
			return fail(403, { error: 'Your account has been suspended or deactivated.' });
		}

		const isPasswordValid = await comparePassword(password, user.passwordHash);

		if (!isPasswordValid) {
			return fail(401, { error: 'Invalid credentials.' });
		}

		const token = generateSessionToken();
		const session = await createSession(token, user.id);

		cookies.set('session_id', token, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			expires: session.expiresAt
		});

		// Instead of redirecting immediately, return success so the client can unwrap the DEK first.
		return {
			success: true,
			actualUsername: user.username,
			redirectTo: '/dashboard'
		};
	}
};
