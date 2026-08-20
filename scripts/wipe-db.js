import { createClient } from '@libsql/client';

if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
  console.error("Missing TURSO env vars");
  process.exit(1);
}

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
  const tables = [
    'playlist_items',
    'playlists',
    'files',
    'folders',
    'sessions',
    'invitation_codes',
    'email_verification_tokens',
    'password_reset_tokens',
    'users' // users last because of FKs
  ];

  try {
    for (const table of tables) {
      console.log(`Clearing ${table}...`);
      await client.execute(`DELETE FROM ${table}`);
    }
    console.log("All tables cleared successfully.");
  } catch (err) {
    console.error("Error wiping db:", err);
  }
}

main();
