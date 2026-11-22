import { useEffect, useMemo, useState, type FormEvent } from "react";
import { guruPenugasanService } from "../../services/guruPenugasanService";
import { masterDataService } from "../../services/masterDataService";
import type { GuruProfile, PenugasanGuruDetail } from "../../types/guru-penugasan";
import type { Kelas, MataPelajaran, Semester } from "../../types/master-data";

type AssignmentDraft = {
  guru_id: string;
  mapel_id: string;
  kelas_id: string;
};

const emptyDraft: AssignmentDraft = { guru_id: "", mapel_id: "", kelas_id: "" };

export default function AdminPenugasanPanel() {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [semesterId, setSemesterId] = useState("");
  const [classes, setClasses] = useState<Kelas[]>([]);
  const [subjects, setSubjects] = useState<MataPelajaran[]>([]);
  const [teachers, setTeachers] = useState<GuruProfile[]>([]);
  const [assignments, setAssignments] = useState<PenugasanGuruDetail[]>([]);
  const [draft, setDraft] = useState<AssignmentDraft>(emptyDraft);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const activeSemester = useMemo(
    () => semesters.find((semester) => semester.is_active) ?? null,
    [semesters]
  );

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    Promise.all([
      masterDataService.getSemesters(),
      masterDataService.getKelas(),
      masterDataService.getMataPelajaran(),
      guruPenugasanService.getAllGuruProfiles(),
    ]).then(([semesterData, classData, subjectData, teacherData]) => {
      if (!mounted) return;
      setSemesters(semesterData);
      setSemesterId((current) => current && semesterData.some((s) => String(s.id) === current)
        ? current
        : String(semesterData.find((s) => s.is_active)?.id ?? semesterData[0]?.id ?? ""));
      setClasses(classData);
      setSubjects(subjectData);
      setTeachers(teacherData);
    }).catch((error: unknown) => {
      console.error("Gagal memuat data penugasan:", error);
      if (mounted) setErrorMessage("Data semester, kelas, mapel, atau guru tidak dapat dimuat.");
    }).finally(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, [reloadKey]);

  useEffect(() => {
    if (!semesterId) {
      setAssignments([]);
      return;
    }
    let mounted = true;
    setLoading(true);
    guruPenugasanService.getPenugasanBySemester(Number(semesterId))
      .then((data) => { if (mounted) setAssignments(data); })
      .catch((error: unknown) => {
        console.error("Gagal memuat daftar penugasan guru:", error);
        if (mounted) setErrorMessage("Daftar penugasan guru tidak dapat dimuat.");
      })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [semesterId, reloadKey]);

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (!semesterId || !draft.guru_id || !draft.mapel_id || !draft.kelas_id) return;
    setSaving(true);
    setErrorMessage(null);
    setNotice(null);
    try {
      await guruPenugasanService.createPenugasan({
        guru_id: draft.guru_id,
        mapel_id: Number(draft.mapel_id),
        kelas_id: Number(draft.kelas_id),
        semester_id: Number(semesterId),
      });
      setDraft(emptyDraft);
      setNotice("Penugasan guru berhasil ditambahkan.");
      setReloadKey((key) => key + 1);
    } catch (error) {
      console.error("Gagal membuat penugasan guru:", error);
      setErrorMessage("Penugasan gagal disimpan. Periksa duplikasi dan izin akses.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (assignmentId: number) => {
    if (!window.confirm("Hapus penugasan guru ini?")) return;
    setSaving(true);
    setErrorMessage(null);
    setNotice(null);
    try {
      await guruPenugasanService.deletePenugasan(assignmentId);
      setNotice("Penugasan berhasil dihapus.");
      setReloadKey((key) => key + 1);
    } catch (error) {
      console.error("Gagal menghapus penugasan guru:", error);
      setErrorMessage("Penugasan gagal dihapus.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="admin-panel">
      <div className="admin-panel-heading">
        <div><h3>Penugasan Guru Pengampu</h3><p>Hubungkan guru, mata pelajaran, kelas, dan semester.</p></div>
      </div>
      {errorMessage && <p className="admin-feedback error" role="alert">{errorMessage}</p>}
      {notice && <p className="admin-feedback success" role="status">{notice}</p>}
      {activeSemester && <p className="admin-hint">Semester aktif: {activeSemester.semester} · {activeSemester.tahun_ajaran}</p>}

      <form className="card admin-form-grid" onSubmit={handleCreate}>
        <h4>Tambah Penugasan</h4>
        <label><span>Semester *</span><select required value={semesterId} onChange={(e) => setSemesterId(e.target.value)}><option value="">Pilih semester</option>{semesters.map((semester) => <option key={semester.id} value={semester.id}>{semester.tahun_ajaran} · {semester.semester ?? "-"}</option>)}</select></label>
        <label><span>Guru *</span><select required value={draft.guru_id} onChange={(e) => setDraft({ ...draft, guru_id: e.target.value })}><option value="">Pilih guru</option>{teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.nama_lengkap}</option>)}</select></label>
        <label><span>Mata Pelajaran *</span><select required value={draft.mapel_id} onChange={(e) => setDraft({ ...draft, mapel_id: e.target.value })}><option value="">Pilih mapel</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.kode} · {subject.nama_latin}</option>)}</select></label>
        <label><span>Kelas *</span><select required value={draft.kelas_id} onChange={(e) => setDraft({ ...draft, kelas_id: e.target.value })}><option value="">Pilih kelas</option>{classes.map((kelas) => <option key={kelas.id} value={kelas.id}>{kelas.nama_kelas}</option>)}</select></label>
        <div className="admin-form-actions"><button type="submit" className="btn-primary" disabled={saving || !semesterId}>{saving ? "Menyimpan..." : "Simpan Penugasan"}</button></div>
      </form>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Guru</th><th>Mata Pelajaran</th><th>Kelas</th><th>Aksi</th></tr></thead>
          <tbody>
            {assignments.map((assignment) => (
              <tr key={assignment.id}>
                <td>{assignment.guru?.nama_lengkap ?? "-"}</td>
                <td>{assignment.mata_pelajaran?.kode ?? "-"} · {assignment.mata_pelajaran?.nama_latin ?? "-"}</td>
                <td>{assignment.kelas?.nama_kelas ?? "-"}</td>
                <td><button type="button" className="btn-secondary btn-sm" onClick={() => handleDelete(assignment.id)} disabled={saving}>Hapus</button></td>
              </tr>
            ))}
            {!loading && assignments.length === 0 && <tr><td colSpan={4}>Belum ada penugasan pada semester ini.</td></tr>}
            {loading && <tr><td colSpan={4}>Memuat data...</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
