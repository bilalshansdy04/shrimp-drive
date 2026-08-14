# PROJECT SPECIFICATION & ARCHITECTURE DESIGN: TELE-CLOUD HUB

## 1. Executive Summary

**Shrimp Drive** adalah aplikasi _Personal Multi-Media Cloud Storage & Hub_ yang mengintegrasikan antarmuka web modern dengan infrastruktur backend terdistribusi berbiaya nol ($0/bln). Sistem memanfaatkan **Telegram Bot API** sebagai _Object Storage Engine_ (penyimpan file fisik tanpa batas) dan **Turso (libSQL/SQLite Serverless)** sebagai _Metadata & State Store_, diorkestrasi secara _fullstack_ menggunakan **SvelteKit** yang di-deploy ke **Vercel**.

Sistem menyediakan dua fungsi utama:

1. **Drive / Storage Admin Panel:** Manajemen berkas multi-format dengan pembatasan kuota (8 GB per user secara virtual di database).
2. **Dedicated Media Players & Viewers:** Pemutar audio terintegrasi (_music player with playlists/metadata_), pemutar video, galeri gambar, dan _document reader_ (PDF).

---

## 2. Tech Stack Blueprint

### Frontend & Core Engine

- **Framework:** SvelteKit (Svelte 5 / Runes mode)
- **Language:** TypeScript
- **Styling & Design System:** Tailwind CSS
- **UI Components:** `shadcn-svelte` / `bits-ui`
- **Icons:** `lucide-svelte`
- **Audio Engine:** HTML5 Audio API (Native Web Audio wrapper)

### Backend & Middleware

- **API Handlers:** SvelteKit Server Endpoints (`+server.ts` & `+page.server.ts`)
- **Metadata Parser:** `music-metadata` (Ekstraksi ID3 / AAC / M4A / MP4 / FLAC metadata)
- **HTTP Client:** Native `fetch` (Stream piping & multipart/form-data upload)

### Database & Storage

- **Database Engine:** Turso (libSQL / Serverless SQLite)
- **ORM & Migrations:** Drizzle ORM (`drizzle-orm`, `drizzle-kit`)
- **Driver:** `@libsql/client`
- **Physical Storage:** Telegram Bot API (Private Channels/Chats)

### Deployment & Infrastructure

- **Host Platform:** Vercel (Edge / Node.js Serverless Functions)
- **Adapter:** `@sveltejs/adapter-vercel`

---

## 3. Database Schema (Drizzle ORM / SQLite)

```typescript
// src/lib/server/db/schema.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// 1. Users Table (Tenant & Quota Management)
export const users = sqliteTable('users', {
	id: text('id').primaryKey(), // cuid or uuid
	username: text('username').notNull().unique(),
	passwordHash: text('password_hash').notNull(),
	telegramBotToken: text('telegram_bot_token').notNull(),
	telegramChatId: text('telegram_chat_id').notNull(),
	storageUsed: integer('storage_used').default(0).notNull(), // in Bytes
	storageLimit: integer('storage_limit').default(8589934592).notNull(), // Default 8 GB in Bytes
	createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
});

// 2. Files Table (Global Asset Registry)
export const files = sqliteTable('files', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.references(() => users.id, { onDelete: 'cascade' })
		.notNull(),
	fileName: text('file_name').notNull(),
	fileType: text('file_type').notNull(), // 'audio' | 'video' | 'image' | 'document'
	mimeType: text('mime_type').notNull(),
	fileSize: integer('file_size').notNull(), // in Bytes
	telegramFileId: text('telegram_file_id').notNull(),

	// Media Specific Metadata (Nullable)
	title: text('title'),
	artist: text('artist'),
	album: text('album'),
	duration: integer('duration'), // Seconds (Audio / Video)
	thumbnailUrl: text('thumbnail_url'),

	createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
});

// 3. Playlists Table
export const playlists = sqliteTable('playlists', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.references(() => users.id, { onDelete: 'cascade' })
		.notNull(),
	name: text('name').notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
});

// 4. Playlist Items Table
export const playlistItems = sqliteTable('playlist_items', {
	id: text('id').primaryKey(),
	playlistId: text('playlist_id')
		.references(() => playlists.id, { onDelete: 'cascade' })
		.notNull(),
	fileId: text('file_id')
		.references(() => files.id, { onDelete: 'cascade' })
		.notNull(),
	order: integer('order').notNull()
});
```

---

## 4. File Size Limits & Constraints

| Kategori    | Ekstensi                                          | Batas Ukuran (_Max Limit_) | Metode Handler Telegram      |
| ----------- | ------------------------------------------------- | -------------------------- | ---------------------------- |
| **Audio**   | `.aac`, `.m4a`, `.mp3`, `.flac`, `.alac`, `.wav`  | **50 MB**                  | `sendAudio` / `sendDocument` |
| **Gambar**  | `.jpg`, `.jpeg`, `.png`, `.webp`, `.svg`, `.gif`  | **20 MB**                  | `sendPhoto` / `sendDocument` |
| **Dokumen** | `.pdf`, `.docx`, `.xlsx`, `.pptx`, `.txt`, `.zip` | **100 MB**                 | `sendDocument`               |
| **Video**   | `.mp4`, `.mkv`, `.webm`                           | **200 MB – 500 MB**        | `sendVideo` / `sendDocument` |

---

## 5. End-to-End System Flows

### Flow 1: User Onboarding (Multi-Tenant Setup)

```text
[User] -> Register on Web App
       -> Open Telegram -> Chat with @BotFather -> Create Bot (/newbot) -> Get BOT_TOKEN
       -> Create Private Channel -> Add Bot as Admin -> Get CHAT_ID
       -> Input BOT_TOKEN & CHAT_ID into Web App Settings
       -> Backend verifies credentials via getMe & getChat API -> Setup Complete

```

### Flow 2: File Upload Pipeline

```text
[Client Web UI]
       │
       ▼ (1. Multipart Upload: File + Auth Session)
[SvelteKit API: /api/files/upload]
       │
       ├─► (2. Quota Check): If (user.storageUsed + file.size > user.storageLimit) -> Return 400 Bad Request
       │
       ├─► (3. Metadata Extraction):
       │       If mimeType == 'audio/*':
       │           Parse via music-metadata -> Get Title, Artist, Album, Duration
       │       Else:
       │           Extract base name and default MIME attributes
       │
       ├─► (4. Telegram Transmission):
       │       POST https://api.telegram.org/bot<TOKEN>/sendDocument
       │       Payload: chat_id=<CHAT_ID>, document=<BINARY_FILE>
       │       Receive Response -> Extract `file_id`
       │
       └─► (5. Database Transaction):
               - INSERT INTO files (...)
               - UPDATE users SET storageUsed = storageUsed + file.size
               -> Return JSON Success (200 OK)

```

### Flow 3: Media Streaming / Viewing Pipeline

```text
[Client Media Player / Viewer]
       │
       ▼ (1. GET /api/stream/[fileId])
[SvelteKit API: /api/stream/[fileId]]
       │
       ├─► (2. Resolve Telegram Path):
       │       GET https://api.telegram.org/bot<TOKEN>/getFile?file_id=<fileId>
       │       Receive Response -> Extract `file_path`
       │
       ├─► (3. Fetch Upstream Stream):
       │       GET https://api.telegram.org/file/bot<TOKEN>/<file_path>
       │
       └─► (4. Pipe Response Directly to Client):
               Return new Response(upstreamResponse.body, {
                   headers: {
                       'Content-Type': mimeType,
                       'Accept-Ranges': 'bytes',
                       'Cache-Control': 'public, max-age=31536000'
                   }
               })

```

---

## 6. Directory & Module Structure

```text
shrimp-drive/
├── drizzle/                     # Migration files generated by drizzle-kit
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   ├── admin/           # Storage meter, File Table, Multi-uploader
│   │   │   ├── audio/           # Music Hub, Persistent Bottom Player, Playlist Manager
│   │   │   ├── video/           # Custom HTML5 Video Player
│   │   │   ├── gallery/         # Image Lightbox & Grid
│   │   │   ├── docs/            # PDF Embed & Document Viewer
│   │   │   └── ui/              # Shadcn-svelte primitives (Buttons, Dialogs, Sliders)
│   │   ├── server/
│   │   │   ├── db/
│   │   │   │   ├── client.ts    # Turso libSQL connection initialization
│   │   │   │   └── schema.ts    # Drizzle schema definitions
│   │   │   ├── telegram.ts      # Telegram Bot API helper wrappers
│   │   │   └── metadata.ts      # music-metadata parser wrapper
│   │   └── stores/
│   │       ├── player.svelte.ts # Global audio state (Svelte 5 Runes)
│   │       └── storage.svelte.ts# Global storage usage state
│   └── routes/
│       ├── (auth)/              # Login, Register, Setup Wizard
│       ├── (app)/               # More description at route url.md
│       │   ├── +layout.svelte   # Main app layout with Persistent Bottom Player
│       │   ├── dashboard/       # Drive file manager & storage overview
│       │   ├── music/           # Music Hub (Tracks, Albums, Playlists)
│       │   ├── videos/          # Video Gallery & Player
│       │   ├── photos/          # Image Gallery
│       │   └── docs/            # Document Manager
│       └── api/
│           ├── files/
│           │   ├── upload/      # POST: File ingestion endpoint
│           │   └── [id]/        # DELETE: Soft/Hard delete handler
│           ├── stream/
│           │   └── [fileId]/    # GET: Direct binary streaming proxy
│           └── playlists/       # CRUD Playlist API
├── drizzle.config.ts
├── tailwind.config.js
├── svelte.config.js
└── package.json

```

---

## 7. Critical Technical Directives for Developers / AI Agents

1. **Memory Efficiency in Streaming:** Jangan pernah membaca seluruh buffer binary file ke dalam memori RAM Node.js saat _streaming_ media besar. Gunakan _pipe stream_ (`upstreamResponse.body` langsung ke `Response` SvelteKit).
2. **Serverless Execution Timeout:** Vercel _Hobby Plan_ memiliki batas durasi eksekusi function ~10-15 detik. Pastikan ukuran file unggahan via web dibatasi (rekomendasi: maksimal 50–100 MB per file lewat web).
3. **MIME Integrity:** Selalu simpan _MIME Type_ asli di database agar _response header_ saat streaming dapat diidentifikasi secara tepat oleh pemutar media browser (`audio/aac`, `audio/mp4`, `video/mp4`, `application/pdf`).
