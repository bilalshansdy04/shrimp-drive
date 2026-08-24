import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { users, sessions, files, folders } from './src/lib/server/db/schema';
import * as dotenv from 'dotenv';
dotenv.config();

const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});
const db = drizzle(client);

async function wipe() {
    console.log('Wiping sessions...');
    await db.delete(sessions);
    console.log('Wiping files...');
    await db.delete(files);
    console.log('Wiping folders...');
    await db.delete(folders);
    console.log('Wiping users...');
    await db.delete(users);
    console.log('Done!');
    process.exit(0);
}

wipe().catch(console.error);

