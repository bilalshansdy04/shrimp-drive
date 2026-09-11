import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

// Safe debug: only reveals presence + length, never values
export const GET = async () => {
	return json({
		hasUsername: !!env.ADMIN_USERNAME,
		hasPassword: !!env.ADMIN_PASSWORD,
		hasMasterKey: !!env.ADMIN_MASTER_KEY,
		usernameLength: env.ADMIN_USERNAME?.length ?? 0,
		passwordLength: env.ADMIN_PASSWORD?.length ?? 0,
		masterKeyLength: env.ADMIN_MASTER_KEY?.length ?? 0
	});
};
