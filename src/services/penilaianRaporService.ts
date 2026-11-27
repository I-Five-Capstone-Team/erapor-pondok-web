import { supabase } from "../lib/supabase";
import type {
  CatatanWaliKelas,
  NilaiMapelWithDetail,
  RekapRaporDetail,
} from "../types/penilaian-rapor";

export type NilaiTulisRecord = {
  santri_id: string;
  nilai_tulis: number | null;
};

export type NilaiLisanRecord = {
  santri_id: string;
  mapel_id: number;
  nilai_lisan: number | null;
  mata_pelajaran?:
    | { kode: string; nama_latin: string }
    | { kode: string; nama_latin: string }[]
    | null;
};

export type NilaiTulisProgressRecord = {
  santri_id: string;
  mapel_id: number;
  nilai_tulis: number | null;
};

export const penilaianRaporService = {
  async getNilaiTulisBySemester(
    semesterId: number,
    mapelIds: number[],
    santriIds: string[]
  ): Promise<NilaiTulisProgressRecord[]> {
    if (mapelIds.length === 0 || santriIds.length === 0) return [];

    const rows: NilaiTulisProgressRecord[] = [];
    const pageSize = 1000;
    for (let from = 0; ; from += pageSize) {
      const { data, error } = await supabase
        .from("nilai_mapel")
        .select("santri_id,mapel_id,nilai_tulis")
        .eq("semester_id", semesterId)
        .in("mapel_id", mapelIds)
        .in("santri_id", santriIds)
        .range(from, from + pageSize - 1);

      if (error) throw error;
      const page = (data ?? []) as NilaiTulisProgressRecord[];
      rows.push(...page);
      if (page.length < pageSize) return rows;
    }
  },

  async getNilaiLisanBySantriIdsAndSemester(
    semesterId: number,
    santriIds: string[]
  ): Promise<NilaiLisanRecord[]> {
    if (santriIds.length === 0) return [];

    const { data, error } = await supabase
      .from("nilai_mapel")
      .select("santri_id,mapel_id,nilai_lisan,mata_pelajaran:mapel_id(kode,nama_latin)")
      .eq("semester_id", semesterId)
      .in("santri_id", santriIds);

    if (error) throw error;
    return (data ?? []) as NilaiLisanRecord[];
  },

  async getNilaiByMapelAndSantri(
    semesterId: number,
    mapelId: number,
    santriIds: string[]
  ): Promise<NilaiTulisRecord[]> {
    if (santriIds.length === 0) return [];

    const { data, error } = await supabase
      .from("nilai_mapel")
      .select("santri_id,nilai_tulis")
      .eq("semester_id", semesterId)
      .eq("mapel_id", mapelId)
      .in("santri_id", santriIds);

    if (error) throw error;
    return (data ?? []) as NilaiTulisRecord[];
  },

  async upsertNilaiTulis(
    rows: {
      santri_id: string;
      mapel_id: number;
      semester_id: number;
      nilai_tulis: number;
    }[]
  ): Promise<void> {
    if (rows.length === 0) return;

    for (const row of rows) {
      if (
        !Number.isFinite(row.nilai_tulis) ||
        row.nilai_tulis < 0 ||
        row.nilai_tulis > 100
      ) {
        throw new Error("Nilai tulis harus berada di antara 0 dan 100.");
      }
    }

    const uniqueRows = Array.from(
      new Map(
        rows.map((row) => [
          `${row.santri_id}:${row.mapel_id}:${row.semester_id}`,
          row,
        ])
      ).values()
    );
    const { data, error } = await supabase
      .from("nilai_mapel")
      .upsert(uniqueRows, { onConflict: "santri_id,mapel_id,semester_id" })
      .select("santri_id");

    if (error) throw error;
    if (data?.length !== uniqueRows.length) {
      throw new Error(
        "Sebagian nilai tulis tidak tersimpan. Periksa izin akses dan RLS."
      );
    }
  },

  async upsertNilaiLisan(
    rows: {
      santri_id: string;
      mapel_id: number;
      semester_id: number;
      nilai_lisan: number;
    }[]
  ): Promise<void> {
    if (rows.length === 0) return;

    for (const row of rows) {
      if (
        !Number.isFinite(row.nilai_lisan) ||
        row.nilai_lisan < 0 ||
        row.nilai_lisan > 100
      ) {
        throw new Error("Nilai lisan harus berada di antara 0 dan 100.");
      }
    }

    const uniqueRows = Array.from(
      new Map(
        rows.map((row) => [
          `${row.santri_id}:${row.mapel_id}:${row.semester_id}`,
          row,
        ])
      ).values()
    );
    const { data, error } = await supabase
      .from("nilai_mapel")
      .upsert(uniqueRows, { onConflict: "santri_id,mapel_id,semester_id" })
      .select("santri_id");

    if (error) throw error;
    if (data?.length !== uniqueRows.length) {
      throw new Error(
        "Sebagian nilai lisan tidak tersimpan. Periksa izin akses dan RLS."
      );
    }
  },

  async getNilaiLengkapSantri(
    santriId: string,
    semesterId: number
  ): Promise<NilaiMapelWithDetail[]> {
    const { data, error } = await supabase
      .from("nilai_mapel")
      .select(`
        *,
        mata_pelajaran:mapel_id (
          id, kode, nama_latin, nama_arab, kategori, is_kitab_malam, ada_ujian_lisan, bobot_lisan
        )
      `)
      .eq("santri_id", santriId)
      .eq("semester_id", semesterId)
      .order("mapel_id", { ascending: true });

    if (error) throw error;
    return (data as unknown as NilaiMapelWithDetail[]) ?? [];
  },

  async getCatatanBySantriIds(
    semesterId: number,
    santriIds: string[]
  ): Promise<CatatanWaliKelas[]> {
    if (santriIds.length === 0) return [];

    const { data, error } = await supabase
      .from("catatan_wali_kelas")
      .select("*")
      .eq("semester_id", semesterId)
      .in("santri_id", santriIds);

    if (error) throw error;
    return (data ?? []) as CatatanWaliKelas[];
  },

  async generateRekapKelas(kelasId: number, semesterId: number): Promise<void> {
    const { error } = await supabase.rpc("hitung_rekap_rapor", {
      p_semester_id: semesterId,
      p_kelas_id: kelasId,
    });

    if (error) throw error;
  },

  async getRekapByKelas(
    kelasId: number,
    semesterId: number
  ): Promise<RekapRaporDetail[]> {
    const { data, error } = await supabase
      .from("rekap_rapor")
      .select(`
        *,
        santri:santri_id!inner (
          id,
          no_peserta,
          nis,
          nama_latin,
          nama_arab,
          jk,
          jk_arab,
          asal,
          daerah,
          kelas_id,
          kelas:kelas_id (
            id,
            nama_kelas,
            nama_kelas_arab,
            jenjang,
            wali_kelas:wali_kelas_id ( nama_lengkap, nama_arab, nip )
          )
        )
      `)
      .eq("semester_id", semesterId)
      .eq("santri.kelas_id", kelasId)
      .order("ranking", { ascending: true });

    if (error) throw error;
    return (data as unknown as RekapRaporDetail[]) ?? [];
  },

  async setKunciRaporSantri(
    rekapId: number,
    statusKunci: boolean
  ): Promise<void> {
    const { data, error } = await supabase
      .from("rekap_rapor")
      .update({ status_kunci: statusKunci })
      .eq("id", rekapId)
      .is("disahkan_at", null)
      .select("id");

    if (error) throw error;
    if (!data?.length) {
      throw new Error(
        "Rapor sudah disahkan atau tidak dapat diakses untuk perubahan status kunci."
      );
    }
  },

};
