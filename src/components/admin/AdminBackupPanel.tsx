import { useState } from "react";
import { supabase } from "../../lib/supabase";

const ACADEMIC_TABLES = [
  "semester",
  "kelas",
  "guru_profiles",
  "santri",
  "mata_pelajaran",
  "penugasan_guru",
  "ruangan_syafahi",
  "alokasi_santri_syafahi",
  "nilai_mapel",
  "catatan_wali_kelas",
  "rekap_rapor",
] as const;
const PAGE_SIZE = 500;

async function fetchTableRows(table: (typeof ACADEMIC_TABLES)[number]): Promise<Record<string, unknown>[]> {
  const rows: Record<string, unknown>[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .order("id", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(`Tabel ${table}: ${error.message}`);
    const pageRows = (data ?? []) as Record<string, unknown>[];
    rows.push(...pageRows);
    if (pageRows.length < PAGE_SIZE) break;
  }
  return rows;
}

export default function AdminBackupPanel() {
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const downloadBackup = async () => {
    setBusy(true);
    setErrorMessage(null);
    setNotice(null);
    try {
      const tables: Record<string, Record<string, unknown>[]> = {};
      for (const table of ACADEMIC_TABLES) {
        tables[table] = await fetchTableRows(table);
      }

      const payload = {
        format: "erapor-pondok-academic-backup",
        version: 1,
        created_at: new Date().toISOString(),
        note: "Tidak mencakup password atau data auth.users.",
        tables,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `erapor-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice("Backup akademik berhasil diunduh.");
    } catch (error) {
      console.error("Gagal membuat backup akademik:", error);
      setErrorMessage(error instanceof Error ? error.message : "Backup gagal dibuat.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="admin-panel">
      <div className="admin-panel-heading">
        <div><h3>Backup Data Akademik</h3><p>Ekspor data dari database ke satu berkas JSON.</p></div>
      </div>
      {errorMessage && <p className="admin-feedback error" role="alert">{errorMessage}</p>}
      {notice && <p className="admin-feedback success" role="status">{notice}</p>}
      <div className="card admin-backup-card">
        <p>Backup mencakup semester, kelas, profil guru, santri, mata pelajaran, penugasan, ruangan Syafahi, alokasi, nilai, catatan wali kelas, dan rekap rapor. Berkas tidak mencakup password atau data <code>auth.users</code>.</p>
        <button type="button" className="btn-primary" onClick={downloadBackup} disabled={busy}>
          {busy ? "Mengambil data..." : "Unduh Backup JSON"}
        </button>
      </div>
      <div className="card admin-backup-warning">
        Restore belum diaktifkan. Restore lewat browser dapat berhenti di tengah dan menghasilkan data parsial; perlu endpoint server transaksional agar aman.
      </div>
    </section>
  );
}
