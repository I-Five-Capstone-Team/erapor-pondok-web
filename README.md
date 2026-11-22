# Sistem E-Rapor Pondok Pesantren Nurul Huda Pasirwangi Berbasis Progressive Web App dengan Tanda Tangan Digital Kriptografis dan Generator PDF Arab

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Framework](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite%20%2F%20PWA-blue.svg)](https://react.dev/)
[![Database](https://img.shields.io/badge/Backend%20%26%20DB-Supabase%20(PostgreSQL)-emerald.svg)](https://supabase.com/)
[![Deployment](https://img.shields.io/badge/Pilot%20Staging-Vercel%20Edge-black.svg)](https://vercel.com/)
[![Institution](https://img.shields.io/badge/Institut%20Teknologi%20Garut-Teknik%20Informatika-1a365d.svg)](https://itg.ac.id/)

> **Proyek Integratif Informatika (Capstone Project - IFUWP7357)**  
> **Tahun Akademik:** 2026 / 2027  
> **Dosen Pengampu / Pembimbing:** Ridwan Setiawan, S.T., M.Kom.  
> **Mitra Studi Kasus:** Pondok Pesantren Nurul Huda, Kp. Malati, Desa Padaasih, Kec. Pasirwangi, Kab. Garut (44161)

---

## 📖 Tentang Proyek

**Sistem E-Rapor Pondok** adalah aplikasi web progresif (*Progressive Web App* / PWA) yang dirancang khusus untuk mengelola, mengolah, mengesahkan secara kriptografis, dan mencetak rapor santri berbahasa Arab pada **Pondok Pesantren Nurul Huda Pasirwangi**. Sistem ini berfokus pada pengelolaan **Kurikulum *Kulliyatul Ulum Al-Islamiyyah* (KUI)** yang mencakup ~300 santri aktif pada 11 rombongan belajar (**Kelas 1–5 KUI serta Kelas 1 Intensif / `1 INT`**), sementara Kelas 6 KUI dikecualikan karena mengikuti *Ujian Nihai* (Ijazah Pondok Mandiri).

### ⚠️ Latar Belakang & Masalah Riil Mitra
Sebelumnya, pengolahan rapor pondok masih menggunakan alur manual (>40 berkas Excel terpisah via WhatsApp) yang rentan kendala:
1. **Pembuatan Template Berulang:** Panitia harus membuat puluhan template spreadsheet terpisah untuk setiap guru (*Tahriri*) dan penguji lisan (*Syafahi*) yang memakan waktu >10 hari kerja.
2. **Proses Salin Manual & Kerapuhan Formula:** Nilai harus disalin manual untuk konversi teks Arab; kolom teks Arab di Excel rawan memicu galat rumus (`#VALUE!`).
3. **Ketidakadilan Ranking Santri Ansor:** Santri non-mukim (*Ansor*) tidak mengikuti mapel kitab malam (`NULL`), sehingga perankingan berbasis total nilai menjadi tidak adil jika disamakan dengan santri mukim (*Mondok*).
4. **Kesalahan Mail Merge & *Page Overflow*:** Pencetakan dengan *Mail Merge* Microsoft Word sering merusak harakat dan membuat tata letak teks Arab meluber keluar halaman (*page overflow*).
5. **Inkonsistensi Nama Santri:** Perbedaan penulisan nama antara Dapodik sekolah umum dan data internal pondok berisiko menukar nilai antarsantri saat pengurutan alfabetis.
6. **Kerentanan Pengesahan Fisik:** Tanda tangan fisik atau gambar *scan* rentan manipulasi tanpa mekanisme verifikasi keaslian publik.

---

## ✨ Fitur Utama Sistem (SRS v1.2 — FR-01 s.d. FR-12)

* 🔐 **Autentikasi & Hak Akses Berbasis Peran (7 Role RBAC):** Mengatur isolasi akses secara ketat via *Row-Level Security* (RLS) PostgreSQL untuk **7 peran pengguna**:
  1. **Admin Pondok**
  2. **Panitia Rapor / Pengelola Nilai**
  3. **Guru Mata Pelajaran (*Tahriri*)**
  4. **PJ Ruangan Ujian Lisan (*Syafahi* — 4 kategori)**
  5. **Wali Kelas** (Presensi & catatan santri)
  6. **Mudir Idaroh / Pimpinan**
  7. **Publik / Wali Santri** (Verifikator keabsahan QR Code tanpa login)
* 📱 **Mobile-First PWA (Progressive Web App):** Antarmuka ringan dan responsif dengan dukungan *offline caching* (Service Worker & Web App Manifest) yang dapat diinstal di layar utama smartphone dewan asatidz.
* ⚙️ **Mesin Hitung Nilai & Aturan Khusus Pondok:**
  * Pengikatan nilai berbasis **UUID Unik Santri** permanen (mencegah nilai tertukar).
  * **Batas Tampil Nilai Minimum 40 (*Floor Score*):** Nilai di bawah 40 dicetak 40 pada rapor, sementara nilai riil (*raw score*) tetap tersimpan utuh di basis data.
  * **Keadilan Ranking Santri Mondok vs Ansor:** Nilai mapel kitab malam santri Ansor bernilai `NULL` (bukan `0`), dan peringkat terbuka (1 s.d. terakhir) dihitung **berbasis rata-rata nilai tertinggi**.
* 🔤 **Modul Pemrosesan Teks Arab (*Tafqit* Engine):** Mengonversi angka numerik Latin (0–100) menjadi teks terbilang bahasa Arab (*Tafqit*) dan angka masrik (١٢٣) secara otomatis.
* 📊 **Dashboard Monitoring Real-Time & Kunci Bertingkat:** Memantau progres input nilai per mata pelajaran/ruangan serta mengunci (*lock/unlock*) revisi nilai secara terpusat.
* 🖨️ **Generator Rapor PDF A4 Arab (Amiri RTL):** Menghasilkan dokumen rapor tepat **1 lembar kertas A4 bolak-balik berbahasa Arab** menggunakan font **Amiri** dengan orientasi *Right-to-Left* (RTL) presisi tanpa *page overflow*.
* 🛡️ **Tanda Tangan Digital Kriptografis (SHA-256) & Verifikasi Publik QR Code:** Pengesahan nilai oleh Mudir menghasilkan *cryptographic hash* SHA-256 yang disematkan dalam **QR Code** pada lembar rapor untuk verifikasi keaslian publik melalui portal `/verify/:hash` tanpa perlu login.

---

## 🛠️ Arsitektur, Metodologi & Teknologi

* **Metodologi Pengembangan:** **Agile Scrum** (4 Sprint dalam 16 Minggu)
* **Frontend & PWA:** [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vite.dev/) + [Tailwind CSS](https://tailwindcss.com/) + Web App Manifest
* **Backend & Database:** [Supabase](https://supabase.com/) (`@supabase/supabase-js`, PostgreSQL dengan *Row-Level Security* & JWT Auth)
* **Deployment (*Pilot Staging*):** **Cloud Serverless Free-Tier** ([Vercel](https://vercel.com/) Edge & Supabase) sebagai fase uji coba adaptasi mitra (*Zero OpEx*) serta ketersediaan endpoint publik verifikasi QR Code
* **Testing:** [Vitest](https://vitest.dev/) (Unit Testing & Black-Box Validation)
* **Arabic & Crypto Engine:** Rule-Based *Tafqit Engine* (`src/utils/arabicConverter.ts`), Font Amiri RTL, & **SHA-256** Digital Signature + QR Code

---

## 👥 Komposisi Tim Pengembang (Tim I-Five)

| No | Nama Mahasiswa | NIM | Konsentrasi | Peran Utama & Tanggung Jawab Modul |
| :---: | :--- | :---: | :--- | :--- |
| 1 | **Muhamad Ar Rasyid Rizki Oktavian** | 2306045 | RPL | **Project Leader & Lead System Analyst**<br>Manajemen proyek Agile Scrum, penyusunan SRS v1.2, pemodelan UML, koordinasi mitra/dosen pembimbing, serta integrasi logika TTD Digital SHA-256. |
| 2 | **Irham Sugriantha** | 2306048 | RPL | **Backend & Database Engineer**<br>Perancangan skema DDL PostgreSQL di Supabase, keamanan 7 Role RBAC/RLS, API kalkulasi nilai & ranking rata-rata, serta pipeline deployment Vercel. |
| 3 | **Muhamad Nadhief Rahmat Firdaus** | 2306104 | Sistem Cerdas | **Report Engine & Arabic Developer**<br>Algoritma konversi angka ke teks terbilang Arab (*Tafqit* / `arabicConverter.ts`), engine rendering PDF A4 RTL font Amiri, dan tata letak rapor. |
| 4 | **Destian Muhammad Lutfi** | 2306111 | Sistem Cerdas | **Frontend & Mobile PWA Developer**<br>Perancangan UI/UX Figma 7 peran pengguna, slicing antarmuka *mobile-first* React/Tailwind CSS, form nilai Tahriri & Syafahi, dan konfigurasi PWA. |
| 5 | **Abizar Algifari** | 2306117 | Sistem Cerdas | **Data Migration & QA Engineer**<br>Audit data master Excel mitra, penyusunan kamus data & dataset *dummy* 11 rombel (Mondok/Ansor), skenario uji *Black-Box*, dan UAT (SUS). |

---

## 📁 Struktur Repositori

```text
erapor-pondok-web/
├── public/
│   └── manifest.json       # Web App Manifest PWA & ikon aplikasi
├── src/
│   ├── assets/             # Font Arab Amiri (.ttf), aset grafis & stempel pondok
│   ├── components/         # Komponen UI modular (Navbar, Sidebar, MobileDrawer)
│   ├── layouts/            # Tata letak halaman (DashboardLayout)
│   ├── lib/
│   │   └── supabase.ts     # Inisialisasi Supabase Client
│   ├── pages/              # Halaman aplikasi per peran (7 Role RBAC & /verify/:hash)
│   ├── reports/            # Template dan engine generator PDF Rapor A4 Arab RTL
│   ├── styles/
│   │   └── index.css       # Pengaturan Tailwind CSS dan tipografi Arab (RTL)
│   ├── utils/
│   │   ├── arabicConverter.ts  # Algoritma konversi angka Latin ke teks Arab (Tafqit) & angka masrik
│   │   └── scoreCalculator.ts  # Logika nilai akhir, floor score 40, & ranking rata-rata
│   ├── App.tsx             # Root komponen aplikasi
│   └── main.tsx            # Entry point React
├── supabase/
│   └── migrations/         # Skrip SQL DDL, skema tabel relasional, fungsi, dan kebijakan RLS
├── tests/                  # Skenario pengujian Vitest & unit test modul konversi Arab
├── index.html              # Entry HTML Vite
├── package.json            # Daftar dependensi modul Node.js
├── vite.config.ts          # Konfigurasi Vite
├── LICENSE                 # Lisensi MIT proyek
└── README.md               # Dokumentasi utama proyek
```

---

## 🚀 Panduan Memulai (Development Setup)

### Prasyarat:
* [Node.js](https://nodejs.org/) (versi 18.x atau lebih baru)
* Akun dan Project aktif di [Supabase](https://supabase.com/)

### Langkah Instalasi:

1. **Clone repositori ini:**
   ```bash
   git clone https://github.com/I-Five-Capstone-Team/erapor-pondok-web.git
   cd erapor-pondok-web
   ```

2. **Pasang seluruh dependensi:**
   ```bash
   npm install
   ```

3. **Konfigurasi Environment Variables:**
   Buat berkas `.env.local` di root proyek dan isi kredensial publik Supabase tim (tersedia pada kartu *Central Links* di Trello):
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-publishable-anon-key-here
   ```
   > ⚠️ **Catatan Keamanan:** `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` adalah kunci publik sisi *client* yang aman digunakan karena akses data dilindungi oleh *Row-Level Security* (RLS). **Jangan pernah** menaruh `SUPABASE_SERVICE_ROLE_KEY` ke dalam variabel `VITE_*` atau melakukan *commit* berkas `.env.local` ke GitHub.

4. **Jalankan server pengembangan lokal:**
   ```bash
   npm run dev
   ```
   Buka peramban di `http://localhost:5173`.

5. **Jalankan pengujian unit (*unit tests*):**
   ```bash
   npm test
   ```

### Login dan hak akses awal

Login menggunakan email dan password akun Supabase Auth. Setelah berhasil masuk,
aplikasi membaca role dari `public.user_roles` melalui relasi ke
`public.roles.nama_role`. Pastikan setiap pengguna memiliki role yang sesuai dan
kebijakan RLS mengizinkan pengguna membaca penugasan role miliknya. Role yang
didukung saat ini adalah Admin Pondok, Panitia Rapor, Guru Mata Pelajaran,
PJ Syafahi, Wali Kelas, dan Mudir Idaroh.

Pembatasan halaman di frontend mengatur navigasi, bukan pengganti keamanan data.
Terapkan kebijakan RLS yang membatasi akses data untuk setiap role di database.
Halaman UI portal verifikasi tersedia di `/verify/:hash`. Pemeriksaan hash dan
pemuatan data rapor belum diintegrasikan.

---

## 📌 Tautan Penting Proyek

* 🌐 **Live Demo (Pilot Staging Vercel):** [https://eraporpondok.vercel.app/](https://eraporpondok.vercel.app/)
* 📁 **Google Drive Proyek:** [https://s.id/N94uN](https://s.id/N94uN)
* 📋 **Trello Board (Manajemen Sprint):** [[CAPSTONE] E-Rapor Ponpes Nurul Huda | I-Five](https://trello.com/b/P7ODCbOb)

---

## 📄 Lisensi

Proyek ini didistribusikan di bawah lisensi **MIT License**. Lihat berkas [LICENSE](LICENSE) untuk informasi lebih lanjut.

---
*Dikembangkan dengan penuh dedikasi oleh **Tim I-Five** untuk kemajuan pendidikan Pondok Pesantren Nurul Huda Pasirwangi.*
