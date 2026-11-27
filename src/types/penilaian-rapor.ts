export interface NilaiMapel {
  id: number;
  santri_id: string;
  mapel_id: number;
  semester_id: number;
  nilai_tulis: number | null;
  nilai_lisan: number | null;
  nilai_akhir_asli: number | null;
  nilai_akhir_display: number | null;
  created_at?: string;
}

export interface NilaiMapelWithDetail extends NilaiMapel {
  santri?: {
    id: string;
    no_peserta: string;
    nama_latin: string;
    nama_arab: string | null;
    jk: 'L' | 'P';
  } | null;
  mata_pelajaran?: {
    id: number;
    kode: string;
    nama_latin: string;
    nama_arab: string | null;
    kategori: string;
    is_kitab_malam: boolean;
    ada_ujian_lisan: boolean;
    bobot_lisan: number;
  } | null;
}

export interface CatatanWaliKelas {
  id: number;
  santri_id: string;
  semester_id: number;
  sakit: number;
  izin: number;
  alpa: number;
  kebersihan: string | null;
  keaktifan: string | null;
  kepribadian: string | null;
  catatan: string | null;
}

export interface RekapRapor {
  id: number;
  santri_id: string;
  semester_id: number;
  total_nilai: number;
  rata_rata: number;
  ranking: number | null;
  status_kunci: boolean;
  qr_hash_sha256: string | null;
  disahkan_at: string | null;
  created_at?: string;
}

export interface RekapRaporDetail extends RekapRapor {
  santri?: {
    id: string;
    no_peserta: string;
    nis: string | null;
    nama_latin: string;
    nama_arab: string | null;
    jk: 'L' | 'P';
    jk_arab: string | null;
    asal: string | null;
    daerah: string | null;
    kelas?: {
      id: number;
      nama_kelas: string;
      nama_kelas_arab: string | null;
      jenjang: string;
      wali_kelas?: {
        nama_lengkap: string;
        nama_arab: string | null;
        nip: string | null;
      } | null;
    } | null;
  } | null;
}