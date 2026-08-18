import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// 1. Users Table (Tenant & Quota Management)
export const users = sqliteTable("users", {
  id: text("id").primaryKey(), // cuid or uuid
  username: text("username").notNull().unique(),
  displayName: text("display_name").notNull(),
  email: text("email").unique(),
  emailVerified: integer("email_verified").default(0).notNull(),
  googleId: text("google_id").unique(),
  passwordHash: text("password_hash"),
  telegramBotToken: text("telegram_bot_token"),
  telegramChatId: text("telegram_chat_id"),
  encryptionMode: text("encryption_mode"), // 'locked_on' | 'locked_off' | 'flexible'
  storageUsed: integer("storage_used").default(0).notNull(), // in Bytes
  storageLimit: integer("storage_limit").default(8589934592).notNull(), // Default 8 GB in Bytes
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

// 2. Folders Table (Virtual Directories)
export const folders = sqliteTable("folders", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(), // 'audio' | 'video' | 'image' | 'document'
  parentId: text("parent_id").references((): any => folders.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
});

// 3. Files Table (Global Asset Registry)
export const files = sqliteTable("files", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  folderId: text("folder_id")
    .references(() => folders.id, { onDelete: "set null" }),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(), // 'audio' | 'video' | 'image' | 'document'
  mimeType: text("mime_type").notNull(),
  fileSize: integer("file_size").notNull(), // in Bytes
  telegramFileId: text("telegram_file_id").notNull(),

  // Media Specific Metadata (Nullable)
  title: text("title"),
  artist: text("artist"),
  album: text("album"),
  duration: integer("duration"), // Seconds (Audio / Video)
  thumbnailUrl: text("thumbnail_url"),
  plainLyrics: text("plain_lyrics"),
  syncedLyrics: text("synced_lyrics"),
  romajiLyrics: text("romaji_lyrics"),
  lyricsSource: text("lyrics_source"), // 'embedded' | 'lrclib' | 'manual' | 'not_found'

  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
});

// 3. Playlists Table
export const playlists = sqliteTable("playlists", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

// 4. Playlist Items Table
export const playlistItems = sqliteTable("playlist_items", {
  id: text("id").primaryKey(),
  playlistId: text("playlist_id")
    .references(() => playlists.id, { onDelete: "cascade" })
    .notNull(),
  fileId: text("file_id")
    .references(() => files.id, { onDelete: "cascade" })
    .notNull(),
  order: integer("order").notNull(),
});

// 5. Sessions Table
export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(), // session token
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
});

// 6. Invitation Codes Table
export const invitationCodes = sqliteTable("invitation_codes", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  assignedBotToken: text("assigned_bot_token"),
  assignedChatId: text("assigned_chat_id"),
  encryptionMode: text("encryption_mode").notNull(), // 'locked_on' | 'locked_off' | 'flexible'
  storageLimit: integer("storage_limit").notNull(),
  type: text("type").notNull(), // 'friend_zero_setup' | 'regular_self_setup'
  isUsed: integer("is_used").default(0).notNull(), // 0 or 1
  usedBy: text("used_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

// 7. Email Verification Tokens
export const emailVerificationTokens = sqliteTable("email_verification_tokens", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  token: text("token").notNull().unique(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
});

// 8. Password Reset Tokens
export const passwordResetTokens = sqliteTable("password_reset_tokens", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  token: text("token").notNull().unique(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
});
