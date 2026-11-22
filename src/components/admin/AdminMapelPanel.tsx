import { useEffect, useState, type FormEvent } from "react";
import { masterDataService } from "../../services/masterDataService";
import type { CreateMapelInput, MataPelajaran } from "../../types/master-data";

const emptyDraft: CreateMapelInput = {
  kode: "",
  nama_latin: "",
  nama_arab: null,
  kategori: "Pondok",
  is_kitab_malam: false,
  ada_ujian_lisan: false,
  bobot_lisan: 0,
  tingkat: null,
  is_active: true,
};

export default function AdminMapelPanel() {
  const [subjects, setSubjects] = useState<MataPelajaran[]>([]);
  const [draft, setDraft] = useState<CreateMapelInput>(emptyDraft);
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
    masterDataService.getMataPelajaran(false).then((data) => {
      if (mounted) setSubjects(data);
    }).catch((error: unknown) => {
      console.error("Gagal memuat mata pelajaran:", error);
      if (mounted) setErrorMessage("Master mata pelajaran tidak dapat dimuat.");
    }).finally(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, [reloadKey]);

  const startEdit = (subject: MataPelajaran) => {
    setEditingId(subject.id);
    setDraft({
      kode: subject.kode,
      nama_latin: subject.nama_latin,
      nama_arab: subject.nama_arab,
      kategori: subject.kategori ?? "Pondok",
      is_kitab_malam: subject.is_kitab_malam ?? false,
      ada_ujian_lisan: subject.ada_ujian_lisan ?? false,
      bobot_lisan: subject.bobot_lisan ?? 0,
      tingkat: subject.tingkat,
      is_active: subject.is_active !== false,
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
      kode: draft.kode.trim(),
      nama_latin: draft.nama_latin.trim(),
      nama_arab: draft.nama_arab?.trim() || null,
      tingkat: draft.tingkat?.trim() || null,
      bobot_lisan: draft.ada_ujian_lisan ? Number(draft.bobot_lisan ?? 0) : 0,
    };
    try {
      if (editingId === null) {
        await masterDataService.createMataPelajaran(payload);
        setNotice("Mata pelajaran berhasil ditambahkan.");
      } else {
        await masterDataService.updateMataPelajaran(editingId, payload);
        setNotice("Mata pelajaran berhasil diperbarui.");
      }
      setFormOpen(false);
      setReloadKey((key) => key + 1);
    } catch (error) {
      console.error("Gagal menyimpan mata pelajaran:", error);
      setErrorMessage("Mata pelajaran gagal disimpan. Periksa kode unik dan izin akses.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="admin-panel">
      <div className="admin-panel-heading">
        <div><h3>Master Mata Pelajaran</h3><p>{subjects.length} mata pelajaran terdaftar.</p></div>
        <button type="button" className="btn-primary" onClick={() => { setEditingId(null); setDraft(emptyDraft); setFormOpen(true); setErrorMessage(null); setNotice(null); }}>Tambah Mapel</button>
      </div>
      {errorMessage && <p className="admin-feedback error" role="alert">{errorMessage}</p>}
      {notice && <p className="admin-feedback success" role="status">{notice}</p>}

      {formOpen && (
        <form className="card admin-form-grid" onSubmit={handleSave}>
          <h4>{editingId === null ? "Tambah Mata Pelajaran" : "Ubah Mata Pelajaran"}</h4>
          <label><span>Kode *</span><input required value={draft.kode} onChange={(e) => setDraft({ ...draft, kode: e.target.value })} /></label>
          <label><span>Nama Latin *</span><input required value={draft.nama_latin} onChange={(e) => setDraft({ ...draft, nama_latin: e.target.value })} /></label>
          <label><span>Nama Arab</span><input value={draft.nama_arab ?? ""} onChange={(e) => setDraft({ ...draft, nama_arab: e.target.value || null })} /></label>
          <label><span>Kategori</span><select value={draft.kategori ?? "Pondok"} onChange={(e) => setDraft({ ...draft, kategori: e.target.value as "Pondok" | "Umum" })}><option value="Pondok">Pondok</option><option value="Umum">Umum</option></select></label>
          <label><span>Tingkat</span><input value={draft.tingkat ?? ""} onChange={(e) => setDraft({ ...draft, tingkat: e.target.value || null })} /></label>
          <label><span>Bobot Lisan</span><input type="number" min="0" max="100" step="0.01" value={draft.bobot_lisan ?? 0} onChange={(e) => setDraft({ ...draft, bobot_lisan: Number(e.target.value) })} /></label>
          <label className="admin-checkbox"><input type="checkbox" checked={draft.is_kitab_malam ?? false} onChange={(e) => setDraft({ ...draft, is_kitab_malam: e.target.checked })} /><span>Kitab malam</span></label>
          <label className="admin-checkbox"><input type="checkbox" checked={draft.ada_ujian_lisan ?? false} onChange={(e) => setDraft({ ...draft, ada_ujian_lisan: e.target.checked })} /><span>Ada ujian lisan</span></label>
          <label className="admin-checkbox"><input type="checkbox" checked={draft.is_active !== false} onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })} /><span>Mata pelajaran aktif</span></label>
          <div className="admin-form-actions">
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</button>
            <button type="button" className="btn-secondary" onClick={() => setFormOpen(false)} disabled={saving}>Batal</button>
          </div>
        </form>
      )}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Kode</th><th>Nama</th><th>Kategori</th><th>Lisan</th><th>Status</th><th>Aksi</th></tr></thead>
          <tbody>
            {subjects.map((subject) => (
              <tr key={subject.id}>
                <td>{subject.kode}</td><td>{subject.nama_latin}</td><td>{subject.kategori ?? "-"}</td>
                <td>{subject.ada_ujian_lisan ? `${subject.bobot_lisan ?? 0}%` : "Tidak"}</td>
                <td>{subject.is_active === false ? "Nonaktif" : "Aktif"}</td>
                <td><button type="button" className="btn-secondary btn-sm" onClick={() => startEdit(subject)}>Ubah</button></td>
              </tr>
            ))}
            {!loading && subjects.length === 0 && <tr><td colSpan={6}>Belum ada mata pelajaran.</td></tr>}
            {loading && <tr><td colSpan={6}>Memuat data...</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
