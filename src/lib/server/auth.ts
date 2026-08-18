import { db } from './db';
import { sessions, users } from './db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'node:crypto';
import { Google } from 'arctic';
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, BASE_URL } from '$env/static/private';

// SvelteKit runs in environments where crypto.randomUUID is available.

export const googleAuth = new Google(
	GOOGLE_CLIENT_ID,
	GOOGLE_CLIENT_SECRET,
	`${BASE_URL}/login/google/callback`
);

const SESSION_EXPIRY = 1000 * 60 * 60 * 24 * 30; // 30 days

export function generateSessionToken(): string {
	// 32 random bytes -> 64 hex chars
	return crypto.randomBytes(32).toString('hex');
}

export async function createSession(token: string, userId: string) {
	const sessionId = token; // Use token directly for simple implementation. 
	// (For extra security, you could hash the token before storing, but for this app it's fine).
	const expiresAt = new Date(Date.now() + SESSION_EXPIRY);
	
	await db.insert(sessions).values({
		id: sessionId,
		userId,
		expiresAt
	});

	return {
		id: sessionId,
		userId,
		expiresAt
	};
}

export async function validateSessionToken(token: string) {
	const sessionId = token;
	const result = await db
		.select({ user: users, session: sessions })
		.from(sessions)
		.innerJoin(users, eq(sessions.userId, users.id))
		.where(eq(sessions.id, sessionId));

	if (result.length === 0) {
		return { session: null, user: null };
	}

	const { user, session } = result[0];

	if (Date.now() >= session.expiresAt.getTime()) {
		await db.delete(sessions).where(eq(sessions.id, session.id));
		return { session: null, user: null };
	}

	// Extend session if it's close to expiration (optional, standard practice)
	if (Date.now() >= session.expiresAt.getTime() - 1000 * 60 * 60 * 24 * 15) {
		session.expiresAt = new Date(Date.now() + SESSION_EXPIRY);
		await db
			.update(sessions)
			.set({ expiresAt: session.expiresAt })
			.where(eq(sessions.id, session.id));
	}

	return { session, user };
}

export async function invalidateSession(sessionId: string) {
	await db.delete(sessions).where(eq(sessions.id, sessionId));
}
