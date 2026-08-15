import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// 1. Users Table (Tenant & Quota Management)
export const users = sqliteTable("users", {
  id: text("id").primaryKey(), // cuid or uuid
  username: text("username").notNull().unique(),
  displayName: text("display_name").notNull(),
  passwordHash: text("password_hash").notNull(),
  telegramBotToken: text("telegram_bot_token").notNull(),
  telegramChatId: text("telegram_chat_id").notNull(),
  storageUsed: integer("storage_used").default(0).notNull(), // in Bytes
  storageLimit: integer("storage_limit").default(8589934592).notNull(), // Default 8 GB in Bytes
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

// 2. Files Table (Global Asset Registry)
export const files = sqliteTable("files", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
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
