import { useEffect, useMemo, useState, type FormEvent } from "react";
import { guruPenugasanService } from "../../services/guruPenugasanService";
import { masterDataService } from "../../services/masterDataService";
import type { PenugasanGuruDetail } from "../../types/guru-penugasan";
import type {
  CreateMapelInput,
  KelasWithWali,
  MataPelajaran,
  Semester,
} from "../../types/master-data";

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
  const [classes, setClasses] = useState<KelasWithWali[]>([]);
  const [activeSemester, setActiveSemester] = useState<Semester | null>(null);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [classAssignments, setClassAssignments] = useState<PenugasanGuruDetail[]>([]);
  const [draft, setDraft] = useState<CreateMapelInput>(emptyDraft);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mappingLoading, setMappingLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setErrorMessage(null);
    Promise.all([
      masterDataService.getMataPelajaran(false),
      masterDataService.getKelas(),
      masterDataService.getActiveSemester(),
    ]).then(([subjectData, classData, semesterData]) => {
      if (!mounted) return;
      setSubjects(subjectData);
      setClasses(classData);
      setActiveSemester(semesterData);
    }).catch((error: unknown) => {
      console.error("Gagal memuat mata pelajaran:", error);
      if (mounted) setErrorMessage("Master mata pelajaran tidak dapat dimuat.");
    }).finally(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, [reloadKey]);

  const activeSemesterId = activeSemester?.id ?? null;

  useEffect(() => {
    if (!selectedClassId || !activeSemesterId) {
      setClassAssignments([]);
      setMappingLoading(false);
      return;
    }
    let mounted = true;
    setClassAssignments([]);
    setMappingLoading(true);
    guruPenugasanService.getPenugasanBySemester(activeSemesterId, {
      kelasId: Number(selectedClassId),
    }).then((data) => {
      if (mounted) setClassAssignments(data);
    }).catch((error: unknown) => {
      console.error("Gagal memuat pemetaan mapel kelas:", error);
      if (mounted) setErrorMessage("Pemetaan mata pelajaran kelas tidak dapat dimuat.");
    }).finally(() => {
      if (mounted) setMappingLoading(false);
    });
    return () => { mounted = false; };
  }, [selectedClassId, activeSemesterId, reloadKey]);

  const selectedClass = useMemo(
    () => classes.find((kelas) => String(kelas.id) === selectedClassId) ?? null,
    [classes, selectedClassId]
  );

  const teacherNamesByMapel = useMemo(() => {
    const map = new Map<number, string[]>();
    for (const assignment of classAssignments) {
      const names = map.get(assignment.mapel_id) ?? [];
      const name = assignment.guru?.nama_lengkap;
      if (name && !names.includes(name)) names.push(name);
      map.set(assignment.mapel_id, names);
    }
    return map;
  }, [classAssignments]);

  const visibleSubjects = useMemo(() => {
    if (!selectedClassId) return subjects;
    return subjects.filter((subject) => teacherNamesByMapel.has(subject.id));
  }, [subjects, selectedClassId, teacherNamesByMapel]);

  const columnCount = selectedClassId ? 7 : 6;

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
        <div>
          <h3>Master Mata Pelajaran</h3>
          <p>
            {subjects.length} mata pelajaran terdaftar.
            {selectedClass && (mappingLoading
              ? " Memuat pemetaan kelas..."
              : ` Menampilkan ${visibleSubjects.length} mapel untuk kelas ${selectedClass.nama_kelas}.`)}
          </p>
        </div>
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

      <div className="admin-filters">
        <label>
          <span>Filter kelas</span>
          <select value={selectedClassId} onChange={(event) => setSelectedClassId(event.target.value)}>
            <option value="">Semua kelas</option>
            {classes.map((kelas) => <option key={kelas.id} value={kelas.id}>{kelas.nama_kelas}</option>)}
          </select>
        </label>
      </div>
      {selectedClassId && (
        <p className="admin-hint">
          {activeSemester
            ? `Pemetaan mengikuti semester aktif: ${activeSemester.semester ?? "-"} · ${activeSemester.tahun_ajaran}. Hanya mapel yang memiliki penugasan di kelas ini yang ditampilkan.`
            : "Belum ada semester aktif. Pemetaan kelas tidak dapat ditampilkan."}
        </p>
      )}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Kode</th>
              <th>Nama</th>
              <th>Kategori</th>
              {selectedClassId && <th>Guru Pengampu</th>}
              <th>Lisan</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {!mappingLoading && visibleSubjects.map((subject) => (
              <tr key={subject.id}>
                <td>{subject.kode}</td>
                <td>{subject.nama_latin}</td>
                <td>{subject.kategori ?? "-"}</td>
                {selectedClassId && <td>{teacherNamesByMapel.get(subject.id)?.join(", ") || "-"}</td>}
                <td>{subject.ada_ujian_lisan ? `${subject.bobot_lisan ?? 0}%` : "Tidak"}</td>
                <td>{subject.is_active === false ? "Nonaktif" : "Aktif"}</td>
                <td><button type="button" className="btn-secondary btn-sm" onClick={() => startEdit(subject)} disabled={loading}>Ubah</button></td>
              </tr>
            ))}
            {!loading && !mappingLoading && visibleSubjects.length === 0 && (
              <tr>
                <td colSpan={columnCount}>
                  {selectedClassId
                    ? (activeSemester
                      ? "Belum ada penugasan mata pelajaran untuk kelas ini pada semester aktif."
                      : "Belum ada semester aktif.")
                    : "Belum ada mata pelajaran."}
                </td>
              </tr>
            )}
            {(loading || mappingLoading) && <tr><td colSpan={columnCount}>Memuat data...</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
