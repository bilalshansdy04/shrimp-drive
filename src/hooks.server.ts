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
	
	// Handle CORS for admin API
	if (pathname.startsWith('/api/admin/')) {
		if (event.request.method === 'OPTIONS') {
			return new Response(null, {
				headers: {
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
					'Access-Control-Allow-Headers': 'Content-Type, Authorization',
				}
			});
		}
	}
	
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
		if (event.locals.user.isSuspended) {
			if (pathname.startsWith('/api/')) {
				return new Response(JSON.stringify({ error: 'Account Suspended' }), {
					status: 403,
					headers: { 'Content-Type': 'application/json' }
				});
			} else {
				// Destroy session cookies if suspended user tries to navigate to normal pages
				event.cookies.delete('session_id', { path: '/' });
				throw redirect(303, '/login?error=suspended');
			}
		}

		if (isAuthRoute) {
			throw redirect(303, '/dashboard');
		}

		// If user is logged in but hasn't onboarded (telegram setup), force onboarding
		// Exclude onboarding route itself to prevent redirect loop
		if (!event.locals.user.telegramBotToken && pathname !== '/onboarding' && !pathname.startsWith('/api/')) {
			throw redirect(303, '/onboarding');
		}
	}

	const response = await resolve(event);

	// Attach CORS headers for admin API
	if (pathname.startsWith('/api/admin/')) {
		response.headers.set('Access-Control-Allow-Origin', '*');
		response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
		response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
	}

	return response;
};
