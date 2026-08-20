import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// 1. Encryption Keys Table
export const encryptionKeys = sqliteTable("encryption_keys", {
  id: text("id").primaryKey(),
  keyValue: text("key_value").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

// 2. Users Table (Tenant & Quota Management)
export const users = sqliteTable("users", {
  id: text("id").primaryKey(), // cuid or uuid
  username: text("username").notNull().unique(),
  displayName: text("display_name").notNull(),
  email: text("email").unique(),
  emailVerified: integer("email_verified").default(0).notNull(),
  googleId: text("google_id").unique(),
  passwordHash: text("password_hash"),
  telegramNodeId: text("telegram_node_id").references(() => telegramNodes.id, { onDelete: 'set null' }),
  encryptionMode: text("encryption_mode"), // 'locked_on' | 'locked_off' | 'flexible'
  encryptionKeyId: text("encryption_key_id").references(() => encryptionKeys.id, { onDelete: 'set null' }),
  isEncryptionActive: integer("is_encryption_active", { mode: "boolean" }).default(false).notNull(),
  storageUsed: integer("storage_used").default(0).notNull(), // in Bytes
  storageLimit: integer("storage_limit").default(8589934592).notNull(), // Cached Total Storage Limit in Bytes
  baseStorage: integer("base_storage").default(8589934592).notNull(), // Default 8 GB in Bytes
  customStorageBonus: integer("custom_storage_bonus").default(0).notNull(), // Custom limit set by Admin in Bytes
  isSuspended: integer("is_suspended", { mode: "boolean" }).default(false).notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(), // Soft delete flag
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

// 3. Invitation Codes Table
export const invitationCodes = sqliteTable("invitation_codes", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  assignedNodeId: text("assigned_node_id").references(() => telegramNodes.id, { onDelete: 'set null' }),
  encryptionMode: text("encryption_mode").notNull(), // 'locked_on' | 'locked_off' | 'flexible'
  encryptionKeyId: text("encryption_key_id").references(() => encryptionKeys.id, { onDelete: 'set null' }),
  bonusAmount: integer("bonus_amount").notNull(), // Amount to grant when used
  type: text("type").notNull(), // 'friend_zero_setup' | 'regular_self_setup'
  isUsed: integer("is_used").default(0).notNull(), // 0 or 1
  usedBy: text("used_by").references(() => users.id, { onDelete: "set null" }),
  maxUses: integer("max_uses").default(1).notNull(),
  usedCount: integer("used_count").default(0).notNull(),
  isRevoked: integer("is_revoked", { mode: "boolean" }).default(false).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

// 4. Storage Bonuses Table
export const storageBonuses = sqliteTable("storage_bonuses", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: 'set null' }),
  invitationCodeId: text("invitation_code_id").references(() => invitationCodes.id, { onDelete: 'cascade' }),
  amount: integer("amount").notNull(), // Granted bonus in bytes
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

// 5. Folders Table (Virtual Directories)
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

// 6. Files Table (Global Asset Registry)
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
  isEncrypted: integer("is_encrypted", { mode: "boolean" }).default(false).notNull(),

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

// 7. Playlists Table
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

// 8. Playlist Items Table
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

// 9. Sessions Table
export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(), // session token
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
});

// 10. Email Verification Tokens
export const emailVerificationTokens = sqliteTable("email_verification_tokens", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  token: text("token").notNull().unique(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
});

// 11. Password Reset Tokens
export const passwordResetTokens = sqliteTable("password_reset_tokens", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  token: text("token").notNull().unique(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
});

// 12. Telegram Nodes (Storage Pools)
export const telegramNodes = sqliteTable("telegram_nodes", {
  id: text("id").primaryKey(), // cuid or uuid
  name: text("name").notNull(),
  botToken: text("bot_token").notNull(),
  chatId: text("chat_id").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

// 13. App Settings (Key-Value configuration)
export const appSettings = sqliteTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});
