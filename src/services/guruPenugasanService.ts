import { supabase } from '../lib/supabase';
import type {
  AlokasiSantriDetail,
  GuruProfile,
  GuruWithRoles,
  PenugasanGuru,
  PenugasanGuruDetail,
  Role,
  RuanganSyafahi,
  RuanganSyafahiDetail,
  UserRole,
} from '../types/guru-penugasan';

export const guruPenugasanService = {
  // ==========================================================================
  // 1. MANAJEMEN PROFIL GURU, ROLE, & WALI KELAS (ADMIN)
  // ==========================================================================
  async getAllRoles(): Promise<Role[]> {
    const { data, error } = await supabase
      .from('roles')
      .select('id, nama_role')
      .order('id', { ascending: true });

    if (error) throw error;
    return data ?? [];
  },

  async getAllGuruWithRoles(): Promise<GuruWithRoles[]> {
    const { data, error } = await supabase
      .from('guru_profiles')
      .select(`
        *,
        user_roles (
          role_id,
          roles ( id, nama_role )
        )
      `)
      .order('nama_lengkap', { ascending: true });

    if (error) throw error;
    return (data as unknown as GuruWithRoles[]) ?? [];
  },

  async getAllGuruProfiles(): Promise<GuruProfile[]> {
    const { data, error } = await supabase
      .from('guru_profiles')
      .select('id,nama_lengkap,nama_arab,nip')
      .order('nama_lengkap', { ascending: true });

    if (error) throw error;
    return (data as GuruProfile[]) ?? [];
  },

  async getGuruProfilesPage(params: {
    page?: number;
    limit?: number;
  } = {}): Promise<{ data: GuruProfile[]; count: number }> {
    const { page = 1, limit = 25 } = params;
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const { data, error, count } = await supabase
      .from('guru_profiles')
      .select('id,nip,nama_lengkap,no_hp,nama_arab', { count: 'exact' })
      .order('nama_lengkap', { ascending: true })
      .order('id', { ascending: true })
      .range(from, to);

    if (error) throw error;
    return { data: (data as GuruProfile[]) ?? [], count: count ?? 0 };
  },

  async getAllGuruIds(): Promise<string[]> {
    const pageSize = 1000;
    const ids: string[] = [];
    let from = 0;
    while (true) {
      const { data, error } = await supabase
        .from('guru_profiles')
        .select('id')
        .order('id', { ascending: true })
        .range(from, from + pageSize - 1);

      if (error) throw error;
      const rows = (data as { id: string }[] | null) ?? [];
      if (rows.length === 0) break;
      ids.push(...rows.map((row) => row.id));
      from += rows.length;
    }
    return ids;
  },

  async getAllUserRoles(): Promise<UserRole[]> {
    const pageSize = 1000;
    const rows: UserRole[] = [];
    let from = 0;
    while (true) {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id,role_id,roles!user_roles_role_id_fkey(id,nama_role)')
        .order('user_id', { ascending: true })
        .order('role_id', { ascending: true })
        .range(from, from + pageSize - 1);

      if (error) throw error;
      const page = (data as unknown as UserRole[] | null) ?? [];
      if (page.length === 0) break;
      rows.push(...page);
      from += page.length;
    }
    return rows;
  },

  async updateGuruProfile(
    guruId: string,
    payload: Partial<Omit<GuruProfile, 'id' | 'created_at'>>
  ): Promise<GuruProfile> {
    const { data, error } = await supabase
      .from('guru_profiles')
      .update(payload)
      .eq('id', guruId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async assignRole(userId: string, roleId: number): Promise<void> {
    const { error } = await supabase
      .from('user_roles')
      .upsert({ user_id: userId, role_id: roleId }, { onConflict: 'user_id,role_id' });

    if (error) throw error;
  },

  async removeRole(userId: string, roleId: number): Promise<void> {
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role_id', roleId);

    if (error) throw error;
  },

  async setWaliKelas(kelasId: number, guruId: string | null): Promise<void> {
    const { error } = await supabase
      .from('kelas')
      .update({ wali_kelas_id: guruId })
      .eq('id', kelasId);

    if (error) throw error;
  },

  // ==========================================================================
  // 2. PENUGASAN GURU MENGAJAR (ADMIN & DASHBOARD GURU MAPEL)
  // ==========================================================================
  async getPenugasanBySemester(
    semesterId: number,
    filters?: { guruId?: string; kelasId?: number }
  ): Promise<PenugasanGuruDetail[]> {
    let query = supabase
      .from('penugasan_guru')
      .select(`
        *,
        guru:guru_profiles!penugasan_guru_guru_id_fkey ( id, nama_lengkap, nama_arab, nip ),
        mata_pelajaran:mata_pelajaran!penugasan_guru_mapel_id_fkey ( id, kode, nama_latin, nama_arab, kategori, ada_ujian_lisan, bobot_lisan ),
        kelas:kelas!penugasan_guru_kelas_id_fkey ( id, nama_kelas, nama_kelas_arab, jenjang )
      `)
      .eq('semester_id', semesterId)
      .order('kelas_id', { ascending: true });

    if (filters?.guruId) {
      query = query.eq('guru_id', filters.guruId);
    }
    if (filters?.kelasId) {
      query = query.eq('kelas_id', filters.kelasId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data as unknown as PenugasanGuruDetail[]) ?? [];
  },

  async getPenugasanBySemesterPage(
    semesterId: number,
    params: { page?: number; limit?: number; kelasId?: number } = {}
  ): Promise<{ data: PenugasanGuruDetail[]; count: number }> {
    const { page = 1, limit = 25, kelasId } = params;
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    let query = supabase
      .from('penugasan_guru')
      .select(`
        *,
        guru:guru_profiles!penugasan_guru_guru_id_fkey ( id, nama_lengkap, nama_arab, nip ),
        mata_pelajaran:mata_pelajaran!penugasan_guru_mapel_id_fkey ( id, kode, nama_latin, nama_arab, kategori, ada_ujian_lisan, bobot_lisan ),
        kelas:kelas!penugasan_guru_kelas_id_fkey ( id, nama_kelas, nama_kelas_arab, jenjang )
      `, { count: 'exact' })
      .eq('semester_id', semesterId)
      .order('kelas_id', { ascending: true })
      .order('mapel_id', { ascending: true })
      .order('id', { ascending: true })
      .range(from, to);

    if (kelasId) {
      query = query.eq('kelas_id', kelasId);
    }

    const { data, error, count } = await query;
    if (error) throw error;
    return { data: (data as unknown as PenugasanGuruDetail[]) ?? [], count: count ?? 0 };
  },

  async createPenugasan(payload: Omit<PenugasanGuru, 'id'>): Promise<PenugasanGuru> {
    const { data, error } = await supabase
      .from('penugasan_guru')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deletePenugasan(id: number): Promise<void> {
    const { error } = await supabase
      .from('penugasan_guru')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // ==========================================================================
  // 3. RUANGAN & ALOKASI UJIAN LISAN / SYAFAHI (PANITIA & PENGUJI LISAN)
  // ==========================================================================
  async getRuanganSyafahi(
    semesterId: number,
    pjGuruId?: string
  ): Promise<RuanganSyafahiDetail[]> {
    let query = supabase
      .from('ruangan_syafahi')
      .select(`
        *,
        pj_guru:pj_guru_id ( id, nama_lengkap, nama_arab )
      `)
      .eq('semester_id', semesterId)
      .order('nama_ruangan', { ascending: true });

    if (pjGuruId) {
      query = query.eq('pj_guru_id', pjGuruId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data as unknown as RuanganSyafahiDetail[]) ?? [];
  },

  async createRuanganSyafahi(payload: Omit<RuanganSyafahi, 'id'>): Promise<RuanganSyafahi> {
    const { data, error } = await supabase
      .from('ruangan_syafahi')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateRuanganSyafahi(
    id: number,
    payload: Partial<Omit<RuanganSyafahi, 'id'>>
  ): Promise<RuanganSyafahi> {
    const { data, error } = await supabase
      .from('ruangan_syafahi')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteRuanganSyafahi(id: number): Promise<void> {
    const { error } = await supabase
      .from('ruangan_syafahi')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getSantriByRuangan(ruanganId: number): Promise<AlokasiSantriDetail[]> {
    const { data, error } = await supabase
      .from('alokasi_santri_syafahi')
      .select(`
        *,
        santri:santri_id (
          id,
          no_peserta,
          nama_latin,
          nama_arab,
          jk,
          is_active,
          kelas:kelas_id ( id, nama_kelas, jenjang )
        )
      `)
      .eq('ruangan_id', ruanganId)
      .order('id', { ascending: true });

    if (error) throw error;
    return (data as unknown as AlokasiSantriDetail[]) ?? [];
  },

  async alokasiSantriKeRuangan(ruanganId: number, santriIds: string[]): Promise<void> {
    if (santriIds.length === 0) return;

    const { data: existingRows, error: existingError } = await supabase
      .from('alokasi_santri_syafahi')
      .select('santri_id')
      .eq('ruangan_id', ruanganId)
      .in('santri_id', santriIds);

    if (existingError) throw existingError;

    const existingSantriIds = new Set(
      (existingRows ?? []).map((row) => row.santri_id)
    );
    const rows = Array.from(new Set(santriIds))
      .filter((santri_id) => !existingSantriIds.has(santri_id))
      .map((santri_id) => ({
      ruangan_id: ruanganId,
      santri_id,
      }));

    if (rows.length === 0) return;

    const { error } = await supabase
      .from('alokasi_santri_syafahi')
      .insert(rows);

    if (error) throw error;
  },

  async removeSantriFromRuangan(alokasiId: number): Promise<void> {
    const { error } = await supabase
      .from('alokasi_santri_syafahi')
      .delete()
      .eq('id', alokasiId);

    if (error) throw error;
  },
};