import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { users, passwordResetTokens } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'node:crypto';
import { sendPasswordResetEmail } from '$lib/server/email';

export const load: PageServerLoad = async () => {
	return {};
};

export const actions: Actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const email = data.get('email') as string;

		if (!email) {
			return fail(400, { error: 'Email is required.' });
		}

		const userResult = await db.select().from(users).where(eq(users.email, email));
		
		if (userResult.length > 0) {
			const user = userResult[0];
			
			const token = crypto.randomBytes(32).toString('hex');
			// Token valid for 1 hour
			const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

			await db.insert(passwordResetTokens).values({
				id: crypto.randomUUID(),
				userId: user.id,
				token,
				expiresAt
			});

			await sendPasswordResetEmail(email, token);
		}

		// Always return success to prevent email enumeration
		return { success: 'If an account with that email exists, a reset link has been sent.' };
	}
};
