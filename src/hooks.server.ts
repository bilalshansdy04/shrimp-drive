import { validateSessionToken } from '$lib/server/auth';
import { redirect, type Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const sessionId = event.cookies.get('session_id');

	if (!sessionId) {
		event.locals.user = null;
		event.locals.session = null;
	} else {
		const { session, user } = await validateSessionToken(sessionId);
		if (session) {
			// Refresh cookie
			event.cookies.set('session_id', session.id, {
				path: '/',
				httpOnly: true,
				sameSite: 'lax',
				expires: session.expiresAt
			});
		} else {
			event.cookies.delete('session_id', { path: '/' });
		}
		event.locals.user = user;
		event.locals.session = session;
	}

	const pathname = event.url.pathname;
	const isAuthRoute = pathname === '/login' || pathname === '/onboarding';

	if (!event.locals.user && !isAuthRoute) {
		throw redirect(303, '/login');
	}

	if (event.locals.user && isAuthRoute) {
		throw redirect(303, '/dashboard');
	}

	return resolve(event);
};
