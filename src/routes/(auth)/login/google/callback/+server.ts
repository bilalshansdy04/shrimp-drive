import { OAuth2RequestError } from 'arctic';
import { googleAuth } from '$lib/server/auth';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { createSession, generateSessionToken } from '$lib/server/auth';
import crypto from 'node:crypto';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	
	const storedState = cookies.get('google_oauth_state');
	const storedCodeVerifier = cookies.get('google_oauth_code_verifier');

	if (!code || !state || !storedState || !storedCodeVerifier || state !== storedState) {
		return new Response(null, {
			status: 400
		});
	}

	try {
		const tokens = await googleAuth.validateAuthorizationCode(code, storedCodeVerifier);
		const response = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
			headers: {
				Authorization: `Bearer ${tokens.accessToken}`
			}
		});
		const googleUser: {
			sub: string;
			name: string;
			email: string;
			picture: string;
		} = await response.json();

		const existingUserResult = await db.select().from(users).where(eq(users.googleId, googleUser.sub));
		let userId = '';

		if (existingUserResult.length > 0) {
			const existingUser = existingUserResult[0];
			userId = existingUser.id;
		} else {
			// Check if email is already registered via standard registration
			const existingEmailResult = await db.select().from(users).where(eq(users.email, googleUser.email));
			if (existingEmailResult.length > 0) {
				const existingEmailUser = existingEmailResult[0];
				userId = existingEmailUser.id;
				// Link google account
				await db.update(users).set({ googleId: googleUser.sub, emailVerified: 1 }).where(eq(users.id, userId));
			} else {
				// Create new user
				userId = crypto.randomUUID();
				let username = googleUser.email.split('@')[0];
				
				// Ensure username is unique
				let isUnique = false;
				let counter = 0;
				while (!isUnique) {
					const checkUsername = counter === 0 ? username : `${username}${counter}`;
					const check = await db.select().from(users).where(eq(users.username, checkUsername));
					if (check.length === 0) {
						username = checkUsername;
						isUnique = true;
					} else {
						counter++;
					}
				}

				await db.insert(users).values({
					id: userId,
					googleId: googleUser.sub,
					email: googleUser.email,
					username: username,
					displayName: googleUser.name,
					emailVerified: 1, // Google emails are pre-verified
				});
			}
		}

		const token = generateSessionToken();
		const session = await createSession(token, userId);

		cookies.set('session_id', token, {
			path: '/',
			secure: process.env.NODE_ENV === 'production',
			httpOnly: true,
			maxAge: 60 * 60 * 24 * 30,
			sameSite: 'lax'
		});

		return new Response(null, {
			status: 302,
			headers: {
				Location: '/dashboard'
			}
		});
	} catch (e) {
		if (e instanceof OAuth2RequestError) {
			return new Response(null, {
				status: 400
			});
		}
		console.error('OAuth error:', e);
		return new Response(null, {
			status: 500
		});
	}
};
