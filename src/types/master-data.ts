export type JenisKelamin = 'L' | 'P';
export type JenisKelaminArab = 'طالب' | 'الطالبة';
export type TipologiSantri = 'MONDOK' | 'ANSHOR';
export type JenisSemester = 'Ganjil' | 'Genap';
export type KategoriMataPelajaran = 'Pondok' | 'Umum';

export interface Semester {
  id: number;
  tahun_ajaran: string;
  semester: JenisSemester | null;
  is_active: boolean;
  created_at?: string;
}

export interface GuruProfileSummary {
  id: string;
  nama_lengkap: string;
  nama_arab: string | null;
  nip: string | null;
}

export interface Kelas {
  id: number;
  nama_kelas: string;
  nama_kelas_arab: string | null;
  jenjang: 'SMP' | 'SMK' | null;
  wali_kelas_id: string | null;
  is_active_raport: boolean | null;
  is_active: boolean | null;
  created_at?: string;
}

export interface KelasWithWali extends Kelas {
  wali_kelas?: GuruProfileSummary | null;
}

export interface MataPelajaran {
  id: number;
  kode: string;
  nama_latin: string;
  nama_arab: string | null;
  kategori: KategoriMataPelajaran | null;
  is_kitab_malam: boolean | null;
  ada_ujian_lisan: boolean | null;
  bobot_lisan: number | null;
  tingkat: string | null;
  is_active: boolean | null;
  created_at?: string;
}

export interface Santri {
  id: string;
  no_peserta: string;
  nis: string | null;
  nama_latin: string;
  nama_arab: string | null;
  jk: JenisKelamin | null;
  jk_arab: JenisKelaminArab | null;
  asal: string | null;
  daerah: string | null;
  tipologi_santri: TipologiSantri;
  kelas_id: number | null;
  is_active: boolean | null;
  created_at?: string;
}

export interface SantriWithKelas extends Santri {
  kelas?: Pick<Kelas, 'id' | 'nama_kelas' | 'nama_kelas_arab' | 'jenjang'> | null;
}

export interface SantriFilterParams {
  kelasId?: number;
  tipologi?: TipologiSantri;
  search?: string;
  onlyActive?: boolean;
  page?: number;
  limit?: number;
}

export type CreateKelasInput = Omit<Kelas, 'id' | 'created_at' | 'updated_at'>;
export type UpdateKelasInput = Partial<CreateKelasInput>;

export type CreateMapelInput = Omit<MataPelajaran, 'id' | 'created_at' | 'updated_at'>;
export type UpdateMapelInput = Partial<CreateMapelInput>;

export type CreateSantriInput = Omit<Santri, 'id' | 'created_at' | 'updated_at'>;
export type UpdateSantriInput = Partial<CreateSantriInput>;