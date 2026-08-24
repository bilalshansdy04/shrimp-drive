import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { emailVerificationTokens } from '$lib/server/db/schema';
import { eq, and, gt } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		if (!locals.user) {
			return json({ error: 'Unauthorized.' }, { status: 401 });
		}

		const data = await request.json();
		const { otp } = data;

		if (!otp) {
			return json({ error: 'OTP is required.' }, { status: 400 });
		}

		// Verify OTP
		const tokenResult = await db
			.select()
			.from(emailVerificationTokens)
			.where(
				and(
					eq(emailVerificationTokens.userId, locals.user.id),
					eq(emailVerificationTokens.token, otp),
					gt(emailVerificationTokens.expiresAt, new Date())
				)
			);

		if (tokenResult.length === 0) {
			return json({ error: 'Invalid or expired verification code.' }, { status: 400 });
		}

		// Valid OTP, delete it so it can't be reused
		await db
			.delete(emailVerificationTokens)
			.where(eq(emailVerificationTokens.id, tokenResult[0].id));

		return json({ success: true });
	} catch (error) {
		console.error('Error during key reveal verification:', error);
		return json({ error: 'Internal server error.' }, { status: 500 });
	}
};
