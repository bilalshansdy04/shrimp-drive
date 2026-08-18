import { generateState, generateCodeVerifier } from 'arctic';
import { googleAuth } from '$lib/server/auth';
import type { RequestHandler } from './$types';
import { redirect } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ cookies }) => {
	const state = generateState();
	const codeVerifier = generateCodeVerifier();
	
	const url = await googleAuth.createAuthorizationURL(state, codeVerifier, ['profile', 'email']);

	cookies.set('google_oauth_state', state, {
		path: '/',
		secure: process.env.NODE_ENV === 'production',
		httpOnly: true,
		maxAge: 60 * 10,
		sameSite: 'lax'
	});

	cookies.set('google_oauth_code_verifier', codeVerifier, {
		path: '/',
		secure: process.env.NODE_ENV === 'production',
		httpOnly: true,
		maxAge: 60 * 10,
		sameSite: 'lax'
	});

	throw redirect(302, url.toString());
};
