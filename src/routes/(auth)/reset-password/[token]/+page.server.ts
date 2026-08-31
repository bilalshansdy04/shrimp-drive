import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { users, passwordResetTokens } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, comparePassword } from '$lib/server/hash';

export const load: PageServerLoad = async ({ params }) => {
	const token = params.token;

	const tokenResult = await db
		.select()
		.from(passwordResetTokens)
		.where(eq(passwordResetTokens.token, token));

	if (tokenResult.length === 0) {
		return { error: 'Invalid or expired password reset link.' };
	}

	const resetToken = tokenResult[0];

	if (Date.now() > resetToken.expiresAt.getTime()) {
		await db.delete(passwordResetTokens).where(eq(passwordResetTokens.id, resetToken.id));
		return { error: 'Password reset link has expired. Please request a new one.' };
	}

	const userResult = await db.select({ 
		email: users.email,
		googleId: users.googleId,
		username: users.username
	}).from(users).where(eq(users.id, resetToken.userId));

	return { 
		token: resetToken.token,
		email: userResult.length > 0 ? userResult[0].email : '',
		username: userResult.length > 0 ? userResult[0].username : '',
		hasGoogleId: userResult.length > 0 ? userResult[0].googleId !== null : false
	};
};

export const actions: Actions = {
	default: async ({ request, params }) => {
		const token = params.token;
		const data = await request.formData();
		const authHash = data.get('authHash') as string;
		const encryptedVaultKey = data.get('encryptedVaultKey') as string;

		if (!authHash || !encryptedVaultKey) {
			return fail(400, { error: 'Cryptographic data missing.' });
		}

		const tokenResult = await db
			.select()
			.from(passwordResetTokens)
			.where(eq(passwordResetTokens.token, token));

		if (tokenResult.length === 0) {
			return fail(400, { error: 'Invalid or expired password reset link.' });
		}

		const resetToken = tokenResult[0];

		if (Date.now() > resetToken.expiresAt.getTime()) {
			await db.delete(passwordResetTokens).where(eq(passwordResetTokens.id, resetToken.id));
			return fail(400, { error: 'Password reset link has expired.' });
		}

		const passwordHash = await hashPassword(authHash);

		// Update user password and vault key
		await db.update(users).set({ 
			passwordHash,
			encryptedVaultKey
		}).where(eq(users.id, resetToken.userId));

		// Delete used token
		await db.delete(passwordResetTokens).where(eq(passwordResetTokens.id, resetToken.id));

		return { success: 'Your password and encryption key have been successfully reset! You can now login.' };
	}
};
