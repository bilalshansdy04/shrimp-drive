import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const GET = async ({ url }) => {
	console.log('Received check-username request:', url.searchParams.get('username'));
	const username = url.searchParams.get('username');
	if (!username) {
		return json({ available: false });
	}
	const existingUser = await db.select().from(users).where(eq(users.username, username));
	const available = existingUser.length === 0;
	console.log('Username available?', available);
	return json({ available });
};
