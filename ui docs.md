---

# BASE APP SHELL LAYOUT SPECIFICATION

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

## 1. Struktur Wireframe & Area Layout

Layout utama menggunakan struktur **2 Kolom Penuh (Sidebar Kiri Kaku + Area Konten Dinamis)** yang mengisi seluruh tinggi layar (_100vh_):

- **Kolom Kiri — Sticky Sidebar (Lebar: `260px`):**
- Area tetap (_fixed/sticky_) yang menampung seluruh navigasi utama, menu kategori media, dan indikator pemakaian penyimpanan Telegram.

- **Kolom Kanan — Dynamic Canvas (Lebar: `calc(100% - 260px)`):**
- Terbagi menjadi **Main Header Bar** di bagian atas dan **Main Content Canvas** di bagian bawah yang dapat di-_scroll_ secara independen (_overflow-y-auto_).

---

## 2. Rincian Komponen Per Area

### A. Sidebar Kiri (`w-[260px]`, `h-screen`, `bg-[#151921]`, `border-r border-[#2A3241]`)

1. **Header Brand:**

- Logo Ikon Udang (_Shrimp Outline Icon_ dengan aksen `#FF6B4A`) + Teks **Shrimp Drive**.

2. **Nav Links Utama:**

- 📊 **Overview / Dashboard** (`/dashboard`)
- 📁 **All Files / Drive** (`/drive`)

3. **Media Hubs (Dedicated Sections):**

- 🎵 **Music** (`/music`)
- 🎬 **Video** (`/video`)
- 🖼️ **Photo** (`/photo`)
- 📑 **Docs** (`/docs`)

4. **Footer Sidebar (Widget & Profil):**

- **Storage Meter Widget:** Progress bar pemakaian kuota Telegram (contoh: `2.4 GB / 8.0 GB Terpakai`).
- **User Profile & Settings:** Avatar pengguna, nama akun, serta tombol _Settings_ dan _Logout_.

---

### B. Main Header Bar (`h-[64px]`, `border-b border-[#2A3241]`, `bg-[#0B0E14]/80 backdrop-blur`)

- **Global Search Bar:** Input pencarian cepat untuk memfilter file atau metadata.
- **Filter Quick Chips:** Tombol filter cepat kategori (`All`, `Audio`, `Video`, `Photo`, `Docs`).
- **Primary Action:** Tombol upload utama (`+ Upload File`) dengan warna aksen `#FF6B4A`.

---

### C. Main Content Canvas (`flex-1`, `bg-[#0B0E14]`, `p-6`, `overflow-y-auto`)

- Area render konten yang dinamis mengikuti rute halaman yang sedang dibuka (`/dashboard`, `/drive`, `/music`, `/video`, `/photo`, atau `/docs`).
- Tidak ada elemen pemutar yang menghalangi bagian bawah kanvas, sehingga ruang tampilan konten menjadi maksimal dari atas hingga bawah.
