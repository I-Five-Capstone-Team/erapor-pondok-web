import { supabase } from '../lib/supabase';
import type {
  CreateKelasInput,
  CreateMapelInput,
  CreateSantriInput,
  Kelas,
  KelasWithWali,
  MataPelajaran,
  Santri,
  SantriFilterParams,
  SantriWithKelas,
  Semester,
  UpdateKelasInput,
  UpdateMapelInput,
  UpdateSantriInput,
} from '../types/master-data';

export const masterDataService = {
  // ==================== SEMESTER ====================
  async getSemesters(): Promise<Semester[]> {
    const { data, error } = await supabase
      .from('semester')
      .select('*')
      .order('tahun_ajaran', { ascending: false });

    if (error) throw error;
    return data ?? [];
  },

  async getActiveSemester(): Promise<Semester | null> {
    const { data, error } = await supabase
      .from('semester')
      .select('*')
      .eq('is_active', true)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async createSemester(
    payload: Pick<Semester, 'tahun_ajaran' | 'semester'>
  ): Promise<Semester> {
    const { data, error } = await supabase
      .from('semester')
      .insert({ ...payload, is_active: false })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async setActiveSemester(id: number): Promise<void> {
    const { error: deactivateError } = await supabase
      .from('semester')
      .update({ is_active: false })
      .neq('id', id);

    if (deactivateError) throw deactivateError;

    const { error } = await supabase
      .from('semester')
      .update({ is_active: true })
      .eq('id', id);

    if (error) throw error;
  },

  // ==================== KELAS ====================
  async getKelas(onlyActive = true): Promise<KelasWithWali[]> {
    let query = supabase
      .from('kelas')
      .select(`
        *,
        wali_kelas:guru_profiles (
          id,
          nama_lengkap,
          nama_arab,
          nip
        )
      `)
      .order('nama_kelas', { ascending: true });

    if (onlyActive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data as KelasWithWali[]) ?? [];
  },

  async getKelasByWali(guruId: string): Promise<KelasWithWali[]> {
    const { data, error } = await supabase
      .from('kelas')
      .select(`
        *,
        wali_kelas:guru_profiles (
          id,
          nama_lengkap,
          nama_arab,
          nip
        )
      `)
      .eq('wali_kelas_id', guruId)
      .eq('is_active', true)
      .order('nama_kelas', { ascending: true });

    if (error) throw error;
    return (data as KelasWithWali[]) ?? [];
  },

  async createKelas(payload: CreateKelasInput): Promise<Kelas> {
    const { data, error } = await supabase
      .from('kelas')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateKelas(id: number, payload: UpdateKelasInput): Promise<Kelas> {
    const { data, error } = await supabase
      .from('kelas')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // ==================== MATA PELAJARAN ====================
  async getMataPelajaran(onlyActive = true): Promise<MataPelajaran[]> {
    let query = supabase
      .from('mata_pelajaran')
      .select('*')
      .order('kode', { ascending: true });

    if (onlyActive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  },

  async createMataPelajaran(payload: CreateMapelInput): Promise<MataPelajaran> {
    const { data, error } = await supabase
      .from('mata_pelajaran')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateMataPelajaran(id: number, payload: UpdateMapelInput): Promise<MataPelajaran> {
    const { data, error } = await supabase
      .from('mata_pelajaran')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // ==================== SANTRI ====================
  async getSantri(params: SantriFilterParams = {}): Promise<{ data: SantriWithKelas[]; count: number }> {
    const {
      kelasId,
      tipologi,
      search,
      onlyActive = true,
      page = 1,
      limit = 50,
    } = params;

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('santri')
      .select(
        `
        *,
        kelas:kelas (
          id,
          nama_kelas,
          nama_kelas_arab,
          jenjang
        )
      `,
        { count: 'exact' }
      )
      .order('no_peserta', { ascending: true })
      .range(from, to);

    if (onlyActive) {
      query = query.eq('is_active', true);
    }
    if (kelasId) {
      query = query.eq('kelas_id', kelasId);
    }
    if (tipologi) {
      query = query.eq('tipologi_santri', tipologi);
    }
    if (search && search.trim() !== '') {
      const q = search.trim();
      query = query.or(`nama_latin.ilike.%${q}%,no_peserta.ilike.%${q}%`);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return {
      data: (data as SantriWithKelas[]) ?? [],
      count: count ?? 0,
    };
  },

  async createSantri(payload: CreateSantriInput): Promise<Santri> {
    const { data, error } = await supabase
      .from('santri')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateSantri(id: string, payload: UpdateSantriInput): Promise<Santri> {
    const { data, error } = await supabase
      .from('santri')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async setSantriActive(id: string, isActive: boolean): Promise<Santri> {
    return this.updateSantri(id, { is_active: isActive });
  },
};