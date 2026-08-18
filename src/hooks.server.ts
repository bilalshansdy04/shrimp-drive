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
	
	const publicRoutes = [
		'/login',
		'/register',
		'/forgot-password',
		'/about',
		'/privacy',
		'/login/google',
		'/login/google/callback'
	];
	const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));
	const isVerifyEmailRoute = pathname.startsWith('/verify-email/');
	const isResetPasswordRoute = pathname.startsWith('/reset-password/');

	const isAuthRoute = pathname === '/login' || pathname === '/register';

	if (!event.locals.user && !isPublicRoute && !isVerifyEmailRoute && !isResetPasswordRoute) {
		throw redirect(303, '/login');
	}

	if (event.locals.user) {
		if (isAuthRoute) {
			throw redirect(303, '/dashboard');
		}

		// If user is logged in but hasn't onboarded (telegram setup), force onboarding
		// Exclude onboarding route itself to prevent redirect loop
		if (!event.locals.user.telegramBotToken && pathname !== '/onboarding' && !pathname.startsWith('/api/')) {
			throw redirect(303, '/onboarding');
		}
	}

	return resolve(event);
};
