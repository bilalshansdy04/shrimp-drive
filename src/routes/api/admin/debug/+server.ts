import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
export const GET = async () => {
    const allUsers = await db.select().from(users);
    return json(allUsers);
}
