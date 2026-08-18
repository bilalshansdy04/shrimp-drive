import { env } from '$env/dynamic/private';
import { error } from '@sveltejs/kit';

/**
 * Validates the ADMIN_MASTER_KEY from the request headers.
 * Throws a 401 error if unauthorized.
 */
export function requireAdminAuth(request: Request) {
	const authHeader = request.headers.get('Authorization');
	
	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		throw error(401, 'Unauthorized: Missing or invalid token');
	}

	const token = authHeader.split(' ')[1];
	
	if (token !== env.ADMIN_MASTER_KEY) {
		throw error(401, 'Unauthorized: Invalid master key');
	}
}
