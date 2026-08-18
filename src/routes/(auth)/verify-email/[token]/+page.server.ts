import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { users, emailVerificationTokens } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params }) => {
	const token = params.token;

	const tokenResult = await db.select().from(emailVerificationTokens).where(eq(emailVerificationTokens.token, token));

	if (tokenResult.length === 0) {
		return { success: false, message: 'Invalid or expired verification link.' };
	}

	const verificationToken = tokenResult[0];

	if (Date.now() > verificationToken.expiresAt.getTime()) {
		await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.id, verificationToken.id));
		return { success: false, message: 'Verification link has expired. Please register again or request a new link.' };
	}

	// Update user to verified
	await db.update(users).set({ emailVerified: 1 }).where(eq(users.id, verificationToken.userId));
	
	// Delete used token
	await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.id, verificationToken.id));

	return { success: true, message: 'Your email has been successfully verified!' };
};
