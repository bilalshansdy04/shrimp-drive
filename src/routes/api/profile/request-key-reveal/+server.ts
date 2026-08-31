import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { users, emailVerificationTokens } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, comparePassword } from '$lib/server/hash';
import crypto from 'node:crypto';
import { sendVerificationEmail } from '$lib/server/email';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		if (!locals.user) {
			return json({ error: 'Unauthorized.' }, { status: 401 });
		}

		const data = await request.json();
		const { authHash } = data;

		if (!authHash) {
			return json({ error: 'Password is required.' }, { status: 400 });
		}

		// Fetch user
		const userResult = await db.select().from(users).where(eq(users.id, locals.user.id));
		if (userResult.length === 0) {
			return json({ error: 'User not found.' }, { status: 404 });
		}

		const user = userResult[0];

		if (!user.passwordHash) {
			return json({ error: 'User does not have a password set.' }, { status: 400 });
		}

		// Verify authHash against stored passwordHash
		const isPasswordValid = await comparePassword(authHash, user.passwordHash);
		if (!isPasswordValid) {
			return json({ error: 'Incorrect password.' }, { status: 401 });
		}

		// Generate 6-digit OTP
		const token = Math.floor(100000 + Math.random() * 900000).toString();
		const expiresAt = new Date(Date.now() + 1000 * 60 * 15); // Valid for 15 mins

		// Delete any existing tokens for this user to prevent clutter
		await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.userId, user.id));

		await db.insert(emailVerificationTokens).values({
			id: crypto.randomUUID(),
			userId: user.id,
			token,
			expiresAt
		});

		if (process.env.NODE_ENV === 'development') {
			console.log(`[DEV MODE] Key Reveal OTP for ${user.email}: ${token}`);
		}

		if (user.email) {
			try {
				await sendVerificationEmail(user.email, token);
			} catch (e) {
				console.error('Failed to send email:', e);
				// Don't fail the request in development, but fail in production?
				if (process.env.NODE_ENV !== 'development') {
					return json({ error: 'Failed to send OTP email.' }, { status: 500 });
				}
			}
		}

		return json({ success: true });
	} catch (error) {
		console.error('Error during key reveal request:', error);
		return json({ error: 'Internal server error.' }, { status: 500 });
	}
};
