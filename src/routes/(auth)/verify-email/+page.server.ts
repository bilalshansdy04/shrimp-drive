import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { users, emailVerificationTokens } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import crypto from 'node:crypto';
import { sendVerificationEmail } from '$lib/server/email';

export const load: PageServerLoad = async () => {
	return {};
};

export const actions: Actions = {
	verify: async ({ request }) => {
		const data = await request.formData();
		const email = data.get('email') as string;
		const otpRaw = data.get('otp') as string;
		const otp = otpRaw ? otpRaw.replace(/\s+/g, '') : '';

		if (!email || !otp) {
			return fail(400, { error: 'Email and OTP are required.' });
		}

		const userResult = await db.select().from(users).where(eq(users.email, email));
		if (userResult.length === 0) {
			return fail(400, { error: 'User not found.' });
		}

		const user = userResult[0];

		if (user.emailVerified === 1) {
			return fail(400, { error: 'Email is already verified. You can proceed to login.' });
		}

		const tokenResult = await db.select().from(emailVerificationTokens).where(eq(emailVerificationTokens.userId, user.id)).orderBy(desc(emailVerificationTokens.expiresAt));
		
		if (tokenResult.length === 0) {
			return fail(400, { error: 'No verification code found. Please resend the code.' });
		}

		// Check if any of the valid tokens match the OTP
		const activeTokens = tokenResult.filter(t => Date.now() <= t.expiresAt.getTime());
		
		if (activeTokens.length === 0) {
			// Clean up expired tokens
			await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.userId, user.id));
			return fail(400, { error: 'Your verification code has expired. Please resend a new one.' });
		}

		const matchingToken = activeTokens.find(t => t.token === otp);

		if (!matchingToken) {
			return fail(400, { error: 'Invalid OTP code. Please try again.' });
		}

		// Update user to verified
		await db.update(users).set({ emailVerified: 1 }).where(eq(users.id, user.id));
		
		// Delete all tokens for this user
		await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.userId, user.id));

		return { success: true };
	},

	resend: async ({ request }) => {
		const data = await request.formData();
		const email = data.get('email') as string;

		if (!email) {
			return fail(400, { error: 'Email is required to resend OTP.' });
		}

		const userResult = await db.select().from(users).where(eq(users.email, email));
		if (userResult.length === 0) {
			return fail(400, { error: 'User not found.' });
		}

		const user = userResult[0];

		if (user.emailVerified === 1) {
			return fail(400, { error: 'Email is already verified. You can proceed to login.' });
		}

		// Delete old tokens
		await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.userId, user.id));

		// Generate new 6-digit OTP
		const newToken = Math.floor(100000 + Math.random() * 900000).toString();
		const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);

		await db.insert(emailVerificationTokens).values({
			id: crypto.randomUUID(),
			userId: user.id,
			token: newToken,
			expiresAt
		});

		await sendVerificationEmail(email, newToken);

		return { resendSuccess: 'A new OTP code has been sent to your email.' };
	}
};
