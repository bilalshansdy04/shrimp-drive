import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, comparePassword } from '$lib/server/hash';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ success: false, error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { currentAuthHash, newAuthHash, newEncryptedVaultKey } = await request.json();

		if (!newAuthHash || !newEncryptedVaultKey) {
			return json({ success: false, error: 'Missing required fields' }, { status: 400 });
		}

		const userResult = await db.select().from(users).where(eq(users.id, locals.user.id));
		if (userResult.length === 0) return json({ success: false, error: 'User not found' }, { status: 404 });

		const user = userResult[0];

		if (user.passwordHash) {
			if (!currentAuthHash) {
				return json({ success: false, error: 'Current password is required.' }, { status: 400 });
			}
			const isPasswordValid = await comparePassword(currentAuthHash, user.passwordHash);
			if (!isPasswordValid) {
				return json({ success: false, error: 'Incorrect current password.' }, { status: 400 });
			}
		}

		const passwordHash = await hashPassword(newAuthHash);
		
		await db
			.update(users)
			.set({ passwordHash, encryptedVaultKey: newEncryptedVaultKey })
			.where(eq(users.id, locals.user.id));

		return json({ success: true });
	} catch (e) {
		console.error('Password change error', e);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
};
