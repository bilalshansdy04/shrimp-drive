import { createClient } from '@libsql/client';
const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
  try {
    // 1. Add new columns to users
    await client.execute(`ALTER TABLE users ADD COLUMN email text;`);
    await client.execute(`ALTER TABLE users ADD COLUMN email_verified integer DEFAULT 0 NOT NULL;`);
    await client.execute(`ALTER TABLE users ADD COLUMN google_id text;`);
    await client.execute(`ALTER TABLE users ADD COLUMN encryption_mode text;`);
    
    // Add unique constraints
    await client.execute(`CREATE UNIQUE INDEX users_email_unique ON users (email);`);
    await client.execute(`CREATE UNIQUE INDEX users_google_id_unique ON users (google_id);`);

    // 2. Create new tables
    await client.execute(`
      CREATE TABLE invitation_codes (
        id text PRIMARY KEY NOT NULL,
        code text NOT NULL,
        assigned_bot_token text,
        assigned_chat_id text,
        encryption_mode text NOT NULL,
        storage_limit integer NOT NULL,
        type text NOT NULL,
        is_used integer DEFAULT 0 NOT NULL,
        used_by text,
        created_at integer,
        FOREIGN KEY (used_by) REFERENCES users(id) ON UPDATE no action ON DELETE set null
      );
    `);
    await client.execute(`CREATE UNIQUE INDEX invitation_codes_code_unique ON invitation_codes (code);`);

    await client.execute(`
      CREATE TABLE email_verification_tokens (
        id text PRIMARY KEY NOT NULL,
        user_id text NOT NULL,
        token text NOT NULL,
        expires_at integer NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE no action ON DELETE cascade
      );
    `);
    await client.execute(`CREATE UNIQUE INDEX email_verification_tokens_token_unique ON email_verification_tokens (token);`);

    await client.execute(`
      CREATE TABLE password_reset_tokens (
        id text PRIMARY KEY NOT NULL,
        user_id text NOT NULL,
        token text NOT NULL,
        expires_at integer NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE no action ON DELETE cascade
      );
    `);
    await client.execute(`CREATE UNIQUE INDEX password_reset_tokens_token_unique ON password_reset_tokens (token);`);

    console.log("Migration successful!");
  } catch (error) {
    console.error("Migration failed:", error);
  }
}

main();
