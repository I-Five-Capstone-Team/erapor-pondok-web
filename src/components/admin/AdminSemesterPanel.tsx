import { useEffect, useState, type FormEvent } from "react";
import { masterDataService } from "../../services/masterDataService";
import type { JenisSemester, Semester } from "../../types/master-data";

export default function AdminSemesterPanel() {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [tahunAjaran, setTahunAjaran] = useState("");
  const [semesterName, setSemesterName] = useState<JenisSemester>("Ganjil");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    masterDataService.getSemesters().then((data) => {
      if (mounted) setSemesters(data);
    }).catch((error: unknown) => {
      console.error("Gagal memuat semester:", error);
      if (mounted) setErrorMessage("Data semester tidak dapat dimuat.");
    }).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [reloadKey]);

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    const year = tahunAjaran.trim();
    if (!year) return;
    if (semesters.some((item) => item.tahun_ajaran.toLowerCase() === year.toLowerCase() && item.semester === semesterName)) {
      setErrorMessage("Semester tersebut sudah terdaftar.");
      return;
    }

    setSaving(true);
    setErrorMessage(null);
    setNotice(null);
    try {
      await masterDataService.createSemester({
        tahun_ajaran: year,
        semester: semesterName,
      });
      setTahunAjaran("");
      setNotice("Semester berhasil ditambahkan.");
      setReloadKey((key) => key + 1);
    } catch (error) {
      console.error("Gagal menambahkan semester:", error);
      setErrorMessage("Semester gagal ditambahkan. Periksa izin akses dan data yang diisi.");
    } finally {
      setSaving(false);
    }
  };

  const activate = async (semester: Semester) => {
    setSaving(true);
    setErrorMessage(null);
    setNotice(null);
    try {
      await masterDataService.setActiveSemester(semester.id);
      setNotice(`${semester.tahun_ajaran} · ${semester.semester ?? "-"} menjadi semester aktif.`);
      setReloadKey((key) => key + 1);
    } catch (error) {
      console.error("Gagal mengaktifkan semester:", error);
      setErrorMessage("Semester aktif gagal diubah. Periksa izin update pada tabel semester.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="admin-panel">
      <div className="admin-panel-heading">
        <div><h3>Konfigurasi Tahun Ajaran</h3><p>Kelola semester dan pilih satu semester aktif.</p></div>
      </div>
      {errorMessage && <p className="admin-feedback error" role="alert">{errorMessage}</p>}
      {notice && <p className="admin-feedback success" role="status">{notice}</p>}

      <form className="card admin-form-grid" onSubmit={handleCreate}>
        <h4>Tambah Semester</h4>
        <label><span>Tahun Ajaran *</span><input required value={tahunAjaran} onChange={(e) => setTahunAjaran(e.target.value)} placeholder="2026/2027" /></label>
        <label><span>Semester *</span><select value={semesterName} onChange={(e) => setSemesterName(e.target.value as JenisSemester)}><option value="Ganjil">Ganjil</option><option value="Genap">Genap</option></select></label>
        <div className="admin-form-actions"><button type="submit" className="btn-primary" disabled={saving}>{saving ? "Menyimpan..." : "Tambah Semester"}</button></div>
      </form>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Tahun Ajaran</th><th>Semester</th><th>Status</th><th>Aksi</th></tr></thead>
          <tbody>
            {semesters.map((semester) => (
              <tr key={semester.id}>
                <td>{semester.tahun_ajaran}</td><td>{semester.semester ?? "-"}</td>
                <td>{semester.is_active ? "Aktif" : "Tidak aktif"}</td>
                <td>{semester.is_active ? <span className="admin-status">Semester aktif</span> : <button type="button" className="btn-secondary btn-sm" onClick={() => activate(semester)} disabled={saving}>Jadikan Aktif</button>}</td>
              </tr>
            ))}
            {!loading && semesters.length === 0 && <tr><td colSpan={4}>Belum ada semester.</td></tr>}
            {loading && <tr><td colSpan={4}>Memuat data...</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="admin-hint">Aktivasi dilakukan dengan menonaktifkan semester lain lalu mengaktifkan pilihan. Jika izin database menolak salah satu langkah, tampilkan pesan gagal dan periksa status semester.</p>
    </section>
  );
}
