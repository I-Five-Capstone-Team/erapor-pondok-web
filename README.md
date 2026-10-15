# Sistem E-Rapor Pondok Pesantren Nurul Huda Pasirwangi

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Framework](https://img.shields.io/badge/Frontend-React%20%2F%20PWA-blue.svg)](https://react.dev/)
[![Database](https://img.shields.io/badge/Backend%20%26%20DB-Supabase%20(PostgreSQL)-emerald.svg)](https://supabase.com/)
[![Institution](https://img.shields.io/badge/Institut%20Teknologi%20Garut-Teknik%20Informatika-1a365d.svg)](https://itg.ac.id/)

> **Proyek Integratif Informatika (Capstone Project - IFUWP7357)**  
> **Tahun Akademik:** 2026 / 2027  
> **Dosen Pengampu / Pembimbing:** Ridwan Setiawan, S.T., M.Kom.  
> **Mitra Studi Kasus:** Pondok Pesantren Nurul Huda Pasirwangi, Kabupaten Garut  

---

## 📖 Tentang Proyek

**Sistem E-Rapor Pondok** adalah aplikasi web progresif (*Progressive Web App* / PWA) yang dirancang khusus untuk mengelola, mengolah, mengarsipkan, dan mencetak rapor santri berbahasa Arab pada **Pondok Pesantren Nurul Huda Pasirwangi**. Sistem ini mencakup pengelolaan nilai sekitar 300 santri pada 11 kelas (tingkat SMP dan SMK di lingkungan pondok) dengan rata-rata 15 mata pelajaran per kelas.

### ⚠️ Latar Belakang & Masalah Riil Mitra
Sebelumnya, pengolahan rapor pondok masih menggunakan alur manual yang rentan kendala:
1. **Pembuatan Template Berulang:** Panitia harus membuat puluhan template spreadsheet terpisah untuk setiap guru dan kelas yang memakan waktu berhari-hari.
2. **Proses Salin Manual yang Rumit:** Nilai dari Google Spreadsheet harus disalin manual satu per satu ke Microsoft Excel lokal untuk mengonversi angka numerik ke teks bahasa Arab.
3. **Kerapuhan Rumus Formula:** Kolom teks Arab di Excel rawan merusak rumus rata-rata dan ranking (`#VALUE!`) jika tidak digeser manual dengan teliti.
4. **Kesalahan Mail Merge Word:** Pencetakan rapor menggunakan *Mail Merge* Microsoft Word sering mengalami kesalahan pemanggilan field (*mismatch* kolom nilai antarmata pelajaran).
5. **Inkonsistensi Nama Santri:** Perbedaan penulisan nama di Dapodik dan data internal pondok menyebabkan nomor absen bergeser dan nilai tertukar antarsantri jika diurutkan secara alfabetis.
6. **Beban Pengesahan Fisik:** Kepala sekolah dan mudir harus menandatangani sekitar 300 lembar rapor cetak secara manual satu per satu.

---

## ✨ Fitur Utama Sistem

* 🔐 **Autentikasi & Hak Akses Berbasis Peran (RBAC):** Membatasi akses 5 pengguna (*Admin, Guru Mapel, Panitia Rapor, Wali Kelas, dan Pimpinan*). Kerahasiaan nilai terjaga melalui *Row-Level Security* (RLS).
* 📱 **Mobile-First PWA (Progressive Web App):** Antarmuka responsif dan ringan yang dapat diinstal langsung di layar utama smartphone guru pengampu.
* 📝 **Input Nilai Fleksibel:** Mendukung pencatatan nilai ujian tulis (*tahriri*) dan ujian lisan (*syafahi*) oleh guru mapel maupun penguji khusus.
* ⚙️ **Kalkulasi Otomatis & Aturan Khusus Pondok:**
  * Sinkronisasi nilai akhir mapel umum dari e-Rapor sekolah.
  * Nilai akhir mapel pondok dihitung dari rata-rata ujian tulis dan lisan.
  * **Batas Tampil Nilai Minimum 40 (*Floor Score*):** Nilai santri di bawah 40 otomatis dicetak 40 pada lembar rapor, sementara nilai asli (*raw score*) tetap tersimpan utuh di basis data.
  * Perhitungan ranking kelas secara transparan untuk seluruh santri (posisi 1 s.d. terakhir).
* 🔤 **Modul Pemrosesan Teks Arab (*Tafqit*):** Algoritma berbasis aturan yang mengonversi angka numerik (0–100) menjadi teks terbilang bahasa Arab dan simbol angka Arab secara otomatis.
* 📊 **Dashboard Monitoring Real-Time:** Memantau status pengisian nilai per mata pelajaran dan mendeteksi keterlambatan input guru sebelum batas waktu 3 hari pasca-ujian.
* 🔒 **Validasi & Kunci Nilai Bertingkat:** Hak penguncian nilai (*lock*) dan pembukaan kunci revisi (*unlock*) terpusat pada Pengelola Nilai (Fahmi).
* 🖨️ **Generator Rapor PDF Standar A4:** Menghasilkan rapor pondok 1 lembar A4 siap cetak dengan tata letak presisi dwibahasa (Arab-Indonesia), dilengkapi stempel scan tanda tangan pimpinan dan cap resmi pondok.
* 🗄️ **Pengarsipan & Transkrip Terpusat:** Riwayat nilai santri tersimpan aman per semester dan dapat dicetak ulang sewaktu-waktu.

---

## 🛠️ Arsitektur & Teknologi

* **Frontend:** [React](https://react.dev/) / [Next.js](https://nextjs.org/) + [Tailwind CSS](https://tailwindcss.com/) + [Lucide Icons](https://lucide.dev/)
* **PWA Engine:** Service Worker & Web App Manifest
* **Backend & Database:** [Supabase](https://supabase.com/) (PostgreSQL dengan Row-Level Security)
* **Report Generation:** `@react-pdf/renderer` / `jsPDF` (Format Presisi A4)
* **Arabic Number Converter:** Rule-Based Algorithm (Tafqit Engine)
* **Version Control & CI/CD:** GitHub & Vercel Deployment

---

## 👥 Komposisi Tim Pengembang (Tim I-Five)

| No | Nama Mahasiswa | NIM | Konsentrasi | Peran Utama & Tanggung Jawab Modul |
| :---: | :--- | :---: | :--- | :--- |
| 1 | **Muhamad Ar Rasyid Rizki Oktavian** | 2306045 | RPL | **Project Leader & Lead System Analyst**<br>Manajemen proyek, SRS, pemodelan UML, perancangan UI Figma, dan koordinasi dokumen capstone. |
| 2 | **Irham Sugriantha** | 2306048 | RPL | **Backend & Database Architect**<br>Perancangan skema ERD PostgreSQL di Supabase, keamanan RBAC/RLS, API kalkulasi nilai & deployment. |
| 3 | **Muhamad Nadhief Rahmat Firdaus** | 2306104 | Sistem Cerdas | **Report Engine & Arabic Specialist**<br>Algoritma konversi angka ke teks Arab (*Tafqit*), engine PDF A4 dwibahasa, dan integrasi tanda tangan digital. |
| 4 | **Destian Muhammad Lutfi** | 2306111 | Sistem Cerdas | **Frontend & PWA Developer**<br>Antarmuka mobile-first React, modul input nilai guru, dashboard monitoring pimpinan, dan konfigurasi PWA. |
| 5 | **Abizar Algifari** | 2306117 | Sistem Cerdas | **Data Pipeline & QA Specialist**<br>Migrasi data master santri/mapel dari Excel, validasi binding ID, skenario pengujian Black-box, dan UAT mitra. |

---

## 📁 Struktur Repositori

```text
erapor-pondok-web/
├── public/                 # Aset statis, ikon PWA, manifest.json, logo pondok
├── src/
│   ├── assets/             # Font teks Arab, stempel/cap pondok, gambar
│   ├── components/         # Komponen UI modular (Navbar, Sidebar, Form, Modal)
│   ├── layouts/            # Tata letak halaman (DashboardLayout, AuthLayout)
│   ├── lib/                # Konfigurasi Supabase Client & API helper
│   ├── pages/              # Halaman aplikasi (Login, Guru, WaliKelas, Panitia, Mudir)
│   ├── reports/            # Template dan layout cetak PDF Rapor A4
│   ├── styles/             # Pengaturan Tailwind CSS dan font Arab (RTL)
│   └── utils/
│       ├── arabicConverter.ts  # Algoritma konversi angka numerik ke teks terbilang Arab (Tafqit)
│       └── scoreCalculator.ts  # Logika perhitungan nilai akhir, floor score 40, & ranking
├── supabase/
│   └── migrations/         # Skrip SQL DDL, skema tabel, fungsi, dan aturan RLS
├── tests/                  # Skenario pengujian fungsional dan unit test konversi Arab
├── .env.example            # Contoh konfigurasi variabel lingkungan
├── package.json            # Daftar dependensi modul Node.js
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
   Salin berkas `.env.example` menjadi `.env.local` dan isi kredensial Supabase Anda:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

4. **Jalankan server pengembangan lokal:**
   ```bash
   npm run dev
   ```
   Buka peramban di `http://localhost:5173` (atau port yang tertera di terminal).

---

## 📌 Tautan Penting Proyek

* 📁 **Google Drive Proyek:** [https://s.id/N94uN](https://s.id/N94uN)
* 📋 **Trello Board (Manajemen Sprint):** [[CAPSTONE] E-Rapor Ponpes Nurul Huda \| I-Five](https://trello.com/b/F7ODCbOb/capstone-e-rapor-ponpes-nurul-huda-i-five)

---

## 📄 Lisensi

Proyek ini didistribusikan di bawah lisensi **MIT License**. Lihat berkas [LICENSE](LICENSE) untuk informasi lebih lanjut.

---
*Dikembangkan dengan penuh dedikasi oleh **Tim I-Five** untuk kemajuan pendidikan Pondok Pesantren Nurul Huda Pasirwangi.*