export interface Role {
  id: number;
  nama_role: string;
}

export interface UserRole {
  user_id: string;
  role_id: number;
  roles?: Role;
}

export interface GuruProfile {
  id: string;
  nip: string | null;
  nama_lengkap: string;
  nama_arab: string | null;
  no_hp: string | null;
  created_at?: string;
}

export interface GuruWithRoles extends GuruProfile {
  user_roles?: {
    role_id: number;
    roles: Role | null;
  }[];
}

export interface PenugasanGuru {
  id: number;
  guru_id: string;
  mapel_id: number;
  kelas_id: number;
  semester_id: number;
}

export interface PenugasanGuruDetail extends PenugasanGuru {
  guru?: Pick<GuruProfile, 'id' | 'nama_lengkap' | 'nama_arab' | 'nip'> | null;
  mata_pelajaran?: {
    id: number;
    kode: string;
    nama_latin: string;
    nama_arab: string | null;
    kategori: string;
    ada_ujian_lisan: boolean;
    bobot_lisan: number;
  } | null;
  kelas?: {
    id: number;
    nama_kelas: string;
    nama_kelas_arab: string | null;
    jenjang: string;
  } | null;
}

export interface RuanganSyafahi {
  id: number;
  nama_ruangan: string;
  pj_guru_id: string | null;
  semester_id: number;
}

export interface RuanganSyafahiDetail extends RuanganSyafahi {
  pj_guru?: Pick<GuruProfile, 'id' | 'nama_lengkap' | 'nama_arab'> | null;
}

export interface AlokasiSantriSyafahi {
  id: number;
  ruangan_id: number;
  santri_id: string;
}

export interface AlokasiSantriDetail extends AlokasiSantriSyafahi {
  santri?: {
    id: string;
    no_peserta: string;
    nama_latin: string;
    nama_arab: string | null;
    jk: 'L' | 'P';
    is_active?: boolean | null;
    kelas?: {
      id: number;
      nama_kelas: string;
      jenjang?: string | null;
    } | null;
  } | null;
}