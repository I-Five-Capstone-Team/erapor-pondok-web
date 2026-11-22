import { useEffect, useState, type FormEvent } from "react";
import { guruPenugasanService } from "../../services/guruPenugasanService";
import { masterDataService } from "../../services/masterDataService";
import type { CreateKelasInput, KelasWithWali } from "../../types/master-data";
import type { GuruProfile } from "../../types/guru-penugasan";

const emptyDraft: CreateKelasInput = {
  nama_kelas: "",
  nama_kelas_arab: null,
  jenjang: "SMP",
  wali_kelas_id: null,
  is_active_raport: true,
  is_active: true,
};

export default function AdminKelasPanel() {
  const [classes, setClasses] = useState<KelasWithWali[]>([]);
  const [teachers, setTeachers] = useState<GuruProfile[]>([]);
  const [draft, setDraft] = useState<CreateKelasInput>(emptyDraft);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    Promise.all([
      masterDataService.getKelas(false),
      guruPenugasanService.getAllGuruProfiles(),
    ]).then(([kelasData, guruData]) => {
      if (!mounted) return;
      setClasses(kelasData);
      setTeachers(guruData);
    }).catch((error: unknown) => {
      console.error("Gagal memuat master kelas:", error);
      if (mounted) setErrorMessage("Data kelas atau wali kelas tidak dapat dimuat.");
    }).finally(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, [reloadKey]);

  const startNew = () => {
    setEditingId(null);
    setDraft(emptyDraft);
    setFormOpen(true);
    setErrorMessage(null);
    setNotice(null);
  };

  const startEdit = (kelas: KelasWithWali) => {
    setEditingId(kelas.id);
    setDraft({
      nama_kelas: kelas.nama_kelas,
      nama_kelas_arab: kelas.nama_kelas_arab,
      jenjang: kelas.jenjang,
      wali_kelas_id: kelas.wali_kelas_id,
      is_active_raport: kelas.is_active_raport !== false,
      is_active: kelas.is_active !== false,
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
      ...draft,
      nama_kelas: draft.nama_kelas.trim(),
      nama_kelas_arab: draft.nama_kelas_arab?.trim() || null,
      wali_kelas_id: draft.wali_kelas_id || null,
    };
    try {
      if (editingId === null) {
        await masterDataService.createKelas(payload);
        setNotice("Kelas berhasil ditambahkan.");
      } else {
        await masterDataService.updateKelas(editingId, payload);
        setNotice("Data kelas berhasil diperbarui.");
      }
      setFormOpen(false);
      setReloadKey((key) => key + 1);
    } catch (error) {
      console.error("Gagal menyimpan master kelas:", error);
      setErrorMessage("Kelas gagal disimpan. Periksa nama kelas, jenjang, dan izin akses.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="admin-panel">
      <div className="admin-panel-heading">
        <div>
          <h3>Master Kelas / Rombel</h3>
          <p>{classes.filter((kelas) => kelas.is_active !== false).length} kelas aktif dari {classes.length} data.</p>
        </div>
        <button type="button" className="btn-primary" onClick={startNew}>Tambah Kelas</button>
      </div>
      <p className="admin-hint">Nama rombel seperti KUI dan INT/Intensif dikelola pada kolom Nama Kelas.</p>
      {errorMessage && <p className="admin-feedback error" role="alert">{errorMessage}</p>}
      {notice && <p className="admin-feedback success" role="status">{notice}</p>}

      {formOpen && (
        <form className="card admin-form-grid" onSubmit={handleSave}>
          <h4>{editingId === null ? "Tambah Kelas" : "Ubah Kelas"}</h4>
          <label><span>Nama Kelas *</span><input required value={draft.nama_kelas} onChange={(e) => setDraft({ ...draft, nama_kelas: e.target.value })} /></label>
          <label><span>Nama Kelas Arab</span><input value={draft.nama_kelas_arab ?? ""} onChange={(e) => setDraft({ ...draft, nama_kelas_arab: e.target.value || null })} /></label>
          <label><span>Jenjang</span><select value={draft.jenjang ?? ""} onChange={(e) => setDraft({ ...draft, jenjang: e.target.value ? e.target.value as "SMP" | "SMK" : null })}><option value="">Tidak ditentukan</option><option value="SMP">SMP</option><option value="SMK">SMK</option></select></label>
          <label><span>Wali Kelas</span><select value={draft.wali_kelas_id ?? ""} onChange={(e) => setDraft({ ...draft, wali_kelas_id: e.target.value || null })}><option value="">Belum ditentukan</option>{teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.nama_lengkap}</option>)}</select></label>
          <label className="admin-checkbox"><input type="checkbox" checked={draft.is_active !== false} onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })} /><span>Kelas aktif</span></label>
          <label className="admin-checkbox"><input type="checkbox" checked={draft.is_active_raport !== false} onChange={(e) => setDraft({ ...draft, is_active_raport: e.target.checked })} /><span>Ditampilkan pada rapor</span></label>
          <div className="admin-form-actions">
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</button>
            <button type="button" className="btn-secondary" onClick={() => setFormOpen(false)} disabled={saving}>Batal</button>
          </div>
        </form>
      )}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Nama Kelas</th><th>Jenjang</th><th>Wali Kelas</th><th>Status</th><th>Aksi</th></tr></thead>
          <tbody>
            {classes.map((kelas) => (
              <tr key={kelas.id}>
                <td>{kelas.nama_kelas}</td>
                <td>{kelas.jenjang ?? "-"}</td>
                <td>{kelas.wali_kelas?.nama_lengkap ?? "-"}</td>
                <td>{kelas.is_active === false ? "Nonaktif" : "Aktif"}</td>
                <td><button type="button" className="btn-secondary btn-sm" onClick={() => startEdit(kelas)}>Ubah</button></td>
              </tr>
            ))}
            {!loading && classes.length === 0 && <tr><td colSpan={5}>Belum ada data kelas.</td></tr>}
            {loading && <tr><td colSpan={5}>Memuat data...</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
