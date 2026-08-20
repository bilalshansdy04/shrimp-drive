import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";

dotenv.config();

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  console.error("TURSO_DATABASE_URL is missing");
  process.exit(1);
}

const client = createClient({ url, authToken });

async function reset() {
  console.log("Dropping tables...");
  
  const tables = [
    "storage_bonuses",
    "playlist_items",
    "playlists",
    "files",
    "folders",
    "email_verification_tokens",
    "password_reset_tokens",
    "sessions",
    "invitation_codes",
    "users",
    "encryption_keys",
    "telegram_nodes",
    "app_settings"
  ];

  for (const table of tables) {
    try {
      await client.execute(`DROP TABLE IF EXISTS ${table};`);
      console.log(`Dropped ${table}`);
    } catch (e) {
      console.error(`Failed to drop ${table}`, e);
    }
  }

  console.log("All tables dropped! You can now run drizzle-kit push.");
  process.exit(0);
}

reset();
