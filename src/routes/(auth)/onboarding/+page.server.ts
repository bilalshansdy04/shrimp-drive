import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	return {
		hasPassword: !!locals.user.passwordHash,
		hasEncryptedVaultKey: !!locals.user.encryptedVaultKey,
		email: locals.user.email
	};
};

