import { useEffect, useState, type FormEvent } from "react";
import { masterDataService } from "../../services/masterDataService";
import type {
  KelasWithWali,
  SantriWithKelas,
  TipologiSantri,
} from "../../types/master-data";

const PAGE_SIZE = 25;

type SantriDraft = {
  no_peserta: string;
  nis: string;
  nama_latin: string;
  nama_arab: string;
  jk: "L" | "P";
  asal: string;
  daerah: string;
  kelas_id: string;
  tipologi_santri: TipologiSantri;
  is_active: boolean;
};

const emptyDraft: SantriDraft = {
  no_peserta: "",
  nis: "",
  nama_latin: "",
  nama_arab: "",
  jk: "L",
  asal: "",
  daerah: "",
  kelas_id: "",
  tipologi_santri: "MONDOK",
  is_active: true,
};

export default function AdminSantriPanel() {
  const [students, setStudents] = useState<SantriWithKelas[]>([]);
  const [classes, setClasses] = useState<KelasWithWali[]>([]);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [draft, setDraft] = useState<SantriDraft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let mounted = true;
    masterDataService.getKelas(false).then((data) => {
      if (mounted) setClasses(data);
    }).catch((error: unknown) => {
      console.error("Gagal memuat kelas untuk data santri:", error);
      if (mounted) setErrorMessage("Daftar kelas tidak dapat dimuat.");
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setErrorMessage(null);
    masterDataService.getSantri({
      onlyActive: false,
      search,
      kelasId: classFilter ? Number(classFilter) : undefined,
      page,
      limit: PAGE_SIZE,
    }).then((result) => {
      if (!mounted) return;
      setStudents(result.data);
      setCount(result.count);
    }).catch((error: unknown) => {
      console.error("Gagal memuat master santri:", error);
      if (mounted) setErrorMessage("Data santri tidak dapat dimuat.");
    }).finally(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, [classFilter, page, reloadKey, search]);

  const openNewForm = () => {
    setEditingId(null);
    setDraft(emptyDraft);
    setFormOpen(true);
    setErrorMessage(null);
    setNotice(null);
  };

  const openEditForm = (student: SantriWithKelas) => {
    setEditingId(student.id);
    setDraft({
      no_peserta: student.no_peserta,
      nis: student.nis ?? "",
      nama_latin: student.nama_latin,
      nama_arab: student.nama_arab ?? "",
      jk: student.jk ?? "L",
      asal: student.asal ?? "",
      daerah: student.daerah ?? "",
      kelas_id: student.kelas_id == null ? "" : String(student.kelas_id),
      tipologi_santri: student.tipologi_santri,
      is_active: student.is_active !== false,
    });
    setFormOpen(true);
    setErrorMessage(null);
    setNotice(null);
  };

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setErrorMessage(null);
    setNotice(null);
    const payload = {
      no_peserta: draft.no_peserta.trim(),
      nis: draft.nis.trim() || null,
      nama_latin: draft.nama_latin.trim(),
      nama_arab: draft.nama_arab.trim() || null,
      jk: draft.jk,
      jk_arab: draft.jk === "L" ? "طالب" as const : "الطالبة" as const,
      asal: draft.asal.trim() || null,
      daerah: draft.daerah.trim() || null,
      kelas_id: draft.kelas_id ? Number(draft.kelas_id) : null,
      tipologi_santri: draft.tipologi_santri,
      is_active: draft.is_active,
    };

    try {
      if (editingId) {
        await masterDataService.updateSantri(editingId, payload);
        setNotice("Data santri berhasil diperbarui.");
      } else {
        await masterDataService.createSantri(payload);
        setNotice("Santri berhasil ditambahkan.");
      }
      setFormOpen(false);
      setReloadKey((key) => key + 1);
    } catch (error) {
      console.error("Gagal menyimpan data santri:", error);
      setErrorMessage("Data santri gagal disimpan. Periksa nomor peserta/NIS dan izin akses.");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (student: SantriWithKelas) => {
    setSaving(true);
    setErrorMessage(null);
    setNotice(null);
    try {
      await masterDataService.setSantriActive(student.id, student.is_active === false);
      setNotice(student.is_active === false ? "Santri diaktifkan." : "Santri dinonaktifkan.");
      setReloadKey((key) => key + 1);
    } catch (error) {
      console.error("Gagal mengubah status santri:", error);
      setErrorMessage("Status santri gagal diperbarui.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="admin-panel">
      <div className="admin-panel-heading">
        <div>
          <h3>Master Santri</h3>
          <p>{count} santri terdaftar. Data ditampilkan per 25 baris.</p>
        </div>
        <button type="button" className="btn-primary" onClick={openNewForm}>
          Tambah Santri
        </button>
      </div>

      {errorMessage && <p className="admin-feedback error" role="alert">{errorMessage}</p>}
      {notice && <p className="admin-feedback success" role="status">{notice}</p>}

      {formOpen && (
        <form className="card admin-form-grid" onSubmit={handleSave}>
          <h4>{editingId ? "Ubah Data Santri" : "Tambah Santri"}</h4>
          <label><span>No. Peserta *</span><input required value={draft.no_peserta} onChange={(e) => setDraft({ ...draft, no_peserta: e.target.value })} /></label>
          <label><span>NIS</span><input value={draft.nis} onChange={(e) => setDraft({ ...draft, nis: e.target.value })} /></label>
          <label><span>Nama Latin *</span><input required value={draft.nama_latin} onChange={(e) => setDraft({ ...draft, nama_latin: e.target.value })} /></label>
          <label><span>Nama Arab</span><input value={draft.nama_arab} onChange={(e) => setDraft({ ...draft, nama_arab: e.target.value })} /></label>
          <label><span>Jenis Kelamin *</span><select value={draft.jk} onChange={(e) => setDraft({ ...draft, jk: e.target.value as "L" | "P" })}><option value="L">Laki-laki</option><option value="P">Perempuan</option></select></label>
          <label><span>Kelas</span><select value={draft.kelas_id} onChange={(e) => setDraft({ ...draft, kelas_id: e.target.value })}><option value="">Belum ditentukan</option>{classes.map((kelas) => <option key={kelas.id} value={kelas.id}>{kelas.nama_kelas}</option>)}</select></label>
          <label><span>Status Santri *</span><select value={draft.tipologi_santri} onChange={(e) => setDraft({ ...draft, tipologi_santri: e.target.value as TipologiSantri })}><option value="MONDOK">Mondok</option><option value="ANSHOR">Ansor</option></select></label>
          <label><span>Asal</span><input value={draft.asal} onChange={(e) => setDraft({ ...draft, asal: e.target.value })} /></label>
          <label><span>Daerah</span><input value={draft.daerah} onChange={(e) => setDraft({ ...draft, daerah: e.target.value })} /></label>
          <label className="admin-checkbox"><input type="checkbox" checked={draft.is_active} onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })} /><span>Santri aktif</span></label>
          <div className="admin-form-actions">
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</button>
            <button type="button" className="btn-secondary" onClick={() => setFormOpen(false)} disabled={saving}>Batal</button>
          </div>
        </form>
      )}

      <div className="admin-filters">
        <label><span>Cari santri</span><input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Nama atau nomor peserta" /></label>
        <label><span>Filter kelas</span><select value={classFilter} onChange={(e) => { setClassFilter(e.target.value); setPage(1); }}><option value="">Semua kelas</option>{classes.map((kelas) => <option key={kelas.id} value={kelas.id}>{kelas.nama_kelas}</option>)}</select></label>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>No. Peserta</th><th>Nama</th><th>Kelas</th><th>Status Santri</th><th>Aktif</th><th>Aksi</th></tr></thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id}>
                <td>{student.no_peserta}</td>
                <td>{student.nama_latin}</td>
                <td>{student.kelas?.nama_kelas ?? "-"}</td>
                <td>{student.tipologi_santri === "ANSHOR" ? "Ansor" : "Mondok"}</td>
                <td>{student.is_active === false ? "Tidak" : "Ya"}</td>
                <td className="admin-actions">
                  <button type="button" className="btn-secondary btn-sm" onClick={() => openEditForm(student)}>Ubah</button>
                  <button type="button" className="btn-secondary btn-sm" onClick={() => toggleActive(student)} disabled={saving}>{student.is_active === false ? "Aktifkan" : "Nonaktifkan"}</button>
                </td>
              </tr>
            ))}
            {!loading && students.length === 0 && <tr><td colSpan={6}>Tidak ada data santri.</td></tr>}
            {loading && <tr><td colSpan={6}>Memuat data...</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="admin-pagination">
        <span>Halaman {page} dari {Math.max(1, Math.ceil(count / PAGE_SIZE))}</span>
        <div>
          <button type="button" className="btn-secondary btn-sm" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1 || loading}>Sebelumnya</button>
          <button type="button" className="btn-secondary btn-sm" onClick={() => setPage((current) => current + 1)} disabled={loading || page >= Math.ceil(count / PAGE_SIZE)}>Berikutnya</button>
        </div>
      </div>
    </section>
  );
}
