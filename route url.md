---

# BASE APP SHELL & ROUTE MAP SPECIFICATION

```text
┌────────────────────────────────────────────────────────────────────────┐
│ [Sidebar 260px] │ [Main Header Bar: Search, Filter, Profile]           │
│                 │──────────────────────────────────────────────────────│
│ - Brand Logo    │                                                      │
│ - Nav Links     │                 MAIN CONTENT CANVAS                  │
│ - Media Hubs    │             (Sesuai Route Halaman Aktif)             │
│ - Storage Meter │                                                      │
│ - User Profile  │                                                      │
└─────────────────┴──────────────────────────────────────────────────────┘

```

---

## 1. Pemetaan Route SvelteKit (Folder Structure)

Berikut adalah struktur direktori rute di dalam proyek SvelteKit (`src/routes/(app)/`):

```text
src/routes/
├── (auth)/
│   └── onboarding/
│       └── +page.svelte              # /onboarding (Setup wizard 4 langkah)
└── (app)/
    ├── +layout.svelte                # App Shell Utama (Sidebar + Header + Slot Canvas)
    │
    ├── dashboard/
    │   └── +page.svelte              # /dashboard (Overview kuota, analitik, & recent files)
    │
    ├── drive/
    │   └── +page.svelte              # /drive (File manager lengkap, all categories)
    │
    ├── music/
    │   └── +page.svelte              # /music (Music Hub & player internal)
    │
    ├── video/
    │   ├── +page.svelte              # /video (Koleksi / grid kartu video)
    │   └── [id]/
    │       └── +page.svelte          # /video/[id] (Cinema Player khusus video yang diputar)
    │
    ├── photo/
    │   ├── +page.svelte              # /photo (Masonry gallery foto/gambar)
    │   └── [id]/
    │       └── +page.svelte          # /photo/[id] (Full-view / Lightbox zoom foto)
    │
    └── docs/
        ├── +page.svelte              # /docs (Daftar dokumen + trigger gooey toast non-PDF)
        └── [id]/
            └── +page.svelte          # /docs/[id] (Dedicated in-browser PDF Viewer)

```

---

## 2. Rincian Hubungan Menu Sidebar ke Tiap Route

| Label Menu di Sidebar | URL Route SvelteKit | Sub-Route Detail (Child Page) | Fungsi Halaman                                                                                                                                      |
| --------------------- | ------------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Overview**          | `/dashboard`        | —                             | Ringkasan pemakaian kuota 8 GB, kartu metrik media, dan unggah cepat.                                                                               |
| **Drive**             | `/drive`            | —                             | Manajemen file global (_list/grid view_, sortir, rename, dan bulk delete).                                                                          |
| **Music**             | `/music`            | —                             | Manajemen koleksi audio + panel pemutar internal di sisi kanan.                                                                                     |
| **Video**             | `/video`            | `/video/[id]`                 | Grid galeri video $\rightarrow$ Masuk ke `/video/[id]` untuk memutar video di layar penuh (_Cinema Mode_).                                          |
| **Photo**             | `/photo`            | `/photo/[id]`                 | Masonry grid gambar $\rightarrow$ Masuk ke `/photo/[id]` untuk melihat foto resolusi penuh dengan kontrol zoom.                                     |
| **Docs**              | `/docs`             | `/docs/[id]` _(PDF Only)_     | Tabel dokumen $\rightarrow$ Masuk ke `/docs/[id]` khusus PDF. Jika membuka format selain PDF, tetap di `/docs` dan memunculkan _gooey toast error_. |

```

```
