# E-Rapor Pondok Web

Aplikasi e-rapor untuk pondok pesantren.

## Struktur Proyek

- `public/` - Aset statis, ikon PWA, `manifest.json`, logo pondok
- `src/assets/` - Font teks Arab, stempel/cap pondok, gambar
- `src/components/` - Komponen UI modular (Navbar, Sidebar, Form, Modal)
- `src/layouts/` - Tata letak halaman (DashboardLayout, AuthLayout)
- `src/lib/` - Konfigurasi Supabase Client & API helper
- `src/pages/` - Halaman aplikasi (Login, Guru, WaliKelas, Panitia, Mudir)
- `src/reports/` - Template dan layout cetak PDF Rapor A4
- `src/styles/` - Pengaturan Tailwind CSS dan font Arab (RTL)
- `src/utils/` - Utilitas
  - `arabicConverter.ts` - Konversi angka numerik ke teks terbilang Arab (Tafqit)
  - `scoreCalculator.ts` - Perhitungan nilai akhir, floor score 40, & ranking
- `supabase/migrations/` - Skrip SQL DDL, skema tabel, fungsi, dan aturan RLS
- `tests/` - Skenario pengujian fungsional dan unit test

## Konfigurasi

Salin `.env.example` menjadi `.env` dan isi variabel lingkungan yang diperlukan.
