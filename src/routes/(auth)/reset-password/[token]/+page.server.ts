import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { users, passwordResetTokens } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export const load: PageServerLoad = async ({ params }) => {
	const token = params.token;

	const tokenResult = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.token, token));

	if (tokenResult.length === 0) {
		return { error: 'Invalid or expired password reset link.' };
	}

	const resetToken = tokenResult[0];

	if (Date.now() > resetToken.expiresAt.getTime()) {
		await db.delete(passwordResetTokens).where(eq(passwordResetTokens.id, resetToken.id));
		return { error: 'Password reset link has expired. Please request a new one.' };
	}

	return { token: resetToken.token };
};

export const actions: Actions = {
	default: async ({ request, params }) => {
		const token = params.token;
		const data = await request.formData();
		const password = data.get('password') as string;
		const confirmPassword = data.get('confirmPassword') as string;

		if (!password || !confirmPassword) {
			return fail(400, { error: 'All fields are required.' });
		}

		if (password !== confirmPassword) {
			return fail(400, { error: 'Passwords do not match.' });
		}

		if (password.length < 8) {
			return fail(400, { error: 'Password must be at least 8 characters.' });
		}

		const tokenResult = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.token, token));

		if (tokenResult.length === 0) {
			return fail(400, { error: 'Invalid or expired password reset link.' });
		}

		const resetToken = tokenResult[0];

		if (Date.now() > resetToken.expiresAt.getTime()) {
			await db.delete(passwordResetTokens).where(eq(passwordResetTokens.id, resetToken.id));
			return fail(400, { error: 'Password reset link has expired.' });
		}

		const passwordHash = await bcrypt.hash(password, 10);

		// Update user password
		await db.update(users).set({ passwordHash }).where(eq(users.id, resetToken.userId));
		
		// Delete used token
		await db.delete(passwordResetTokens).where(eq(passwordResetTokens.id, resetToken.id));

		return { success: 'Your password has been successfully reset! You can now login.' };
	}
};
