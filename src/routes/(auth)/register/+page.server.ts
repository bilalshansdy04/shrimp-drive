import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { users, emailVerificationTokens } from '$lib/server/db/schema';
import { eq, or } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { sendVerificationEmail } from '$lib/server/email';

export const load: PageServerLoad = async () => {
	return {};
};

export const actions: Actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const username = data.get('username') as string;
		const email = data.get('email') as string;
		const displayName = data.get('displayName') as string;
		const password = data.get('password') as string;

		if (!username || !email || !displayName || !password) {
			return fail(400, { error: 'All fields are required.' });
		}

		if (password.length < 8) {
			return fail(400, { error: 'Password must be at least 8 characters.' });
		}

		// Check if username or email already exists
		const existingUser = await db
			.select()
			.from(users)
			.where(or(eq(users.username, username), eq(users.email, email)));

		if (existingUser.length > 0) {
			return fail(400, { error: 'Username or Email already in use.' });
		}

		const passwordHash = await bcrypt.hash(password, 10);
		const userId = crypto.randomUUID();

		try {
			await db.insert(users).values({
				id: userId,
				username,
				email,
				displayName,
				passwordHash,
				emailVerified: 0
			});

			const token = crypto.randomBytes(32).toString('hex');
			// Token valid for 24 hours
			const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);

			await db.insert(emailVerificationTokens).values({
				id: crypto.randomUUID(),
				userId,
				token,
				expiresAt
			});

			// Attempt to send email but don't block registration if it fails (can add resend button later)
			await sendVerificationEmail(email, token);

			return { success: 'Registration successful! Please check your email to verify your account.' };
		} catch (error) {
			console.error('Error during registration:', error);
			return fail(500, { error: 'Failed to create account.' });
		}
	}
};
