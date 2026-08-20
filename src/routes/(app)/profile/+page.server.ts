import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { users, encryptionKeys } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { generateRandomKey } from '$lib/server/crypto';

export const load: PageServerLoad = async ({ locals }) => {
	let encryptionKeyStr: string | null = null;
	if (locals.user && locals.user.encryptionKeyId) {
		const keyResult = await db.select().from(encryptionKeys).where(eq(encryptionKeys.id, locals.user.encryptionKeyId));
		if (keyResult.length > 0) {
			encryptionKeyStr = keyResult[0].keyValue;
		}
	}
	
	return {
		user: {
			...locals.user,
			encryptionKey: encryptionKeyStr
		}
	};
};

export const actions: Actions = {
	updateProfile: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { error: 'Unauthorized' });

		const data = await request.formData();
		const displayName = data.get('displayName') as string;

		if (!displayName) {
			return fail(400, { error: 'Display Name is required.' });
		}

		await db.update(users).set({ displayName }).where(eq(users.id, locals.user.id));
		
		return { success: 'Profile updated successfully.' };
	},

	updatePassword: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { error: 'Unauthorized' });

		const data = await request.formData();
		const currentPassword = data.get('currentPassword') as string | null;
		const newPassword = data.get('newPassword') as string;
		const confirmPassword = data.get('confirmPassword') as string;

		if (!newPassword || !confirmPassword) {
			return fail(400, { error: 'New password and confirm password are required.' });
		}

		if (newPassword !== confirmPassword) {
			return fail(400, { error: 'New passwords do not match.' });
		}

		if (newPassword.length < 8) {
			return fail(400, { error: 'Password must be at least 8 characters.' });
		}

		const userResult = await db.select().from(users).where(eq(users.id, locals.user.id));
		if (userResult.length === 0) return fail(404, { error: 'User not found.' });

		const user = userResult[0];

		// If user already has a password, verify it
		if (user.passwordHash) {
			if (!currentPassword) {
				return fail(400, { error: 'Current password is required.' });
			}
			const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
			if (!isPasswordValid) {
				return fail(400, { error: 'Incorrect current password.' });
			}
		}

		const passwordHash = await bcrypt.hash(newPassword, 10);
		await db.update(users).set({ passwordHash }).where(eq(users.id, locals.user.id));

		return { success: 'Password updated successfully.' };
	},

	toggleFlexibleEncryption: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { error: 'Unauthorized' });

		if (locals.user.encryptionMode !== 'flexible') {
			return fail(400, { error: 'You are not in flexible mode.' });
		}

		const data = await request.formData();
		const action = data.get('action') as string;

		const isActive = action === 'on';

		let newKeyId: string | null = null;
		
		if (isActive && !locals.user.encryptionKeyId) {
			newKeyId = crypto.randomUUID();
			await db.insert(encryptionKeys).values({
				id: newKeyId,
				keyValue: generateRandomKey()
			});
		}

		await db.update(users).set({ 
			isEncryptionActive: isActive,
			...(newKeyId ? { encryptionKeyId: newKeyId } : {})
		}).where(eq(users.id, locals.user.id));

		return { success: isActive ? 'Encryption enabled for future uploads.' : 'Encryption disabled for future uploads.' };
	}
};

