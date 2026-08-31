import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { users, encryptionKeys } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, comparePassword } from '$lib/server/hash';
import crypto from 'node:crypto';
import { generateRandomKey } from '$lib/server/crypto';

export const load: PageServerLoad = async ({ locals }) => {
	return {
		user: {
			...locals.user
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



	toggleFlexibleEncryption: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { error: 'Unauthorized' });

		if (locals.user.encryptionMode !== 'flexible') {
			return fail(400, { error: 'You are not in flexible mode.' });
		}

		const data = await request.formData();
		const action = data.get('action') as string;

		const isActive = action === 'on';

		await db
			.update(users)
			.set({
				isEncryptionActive: isActive
			})
			.where(eq(users.id, locals.user.id));

		return {
			success: isActive
				? 'Encryption enabled for future uploads.'
				: 'Encryption disabled for future uploads.'
		};
	}
};
