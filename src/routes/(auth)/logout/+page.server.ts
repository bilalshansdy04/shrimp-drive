import { invalidateSession } from '$lib/server/auth';
import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async (event) => {
		if (event.locals.session) {
			await invalidateSession(event.locals.session.id);
		}
		event.cookies.delete('session_id', { path: '/' });
		throw redirect(303, '/login');
	}
};
