import { useEffect, useMemo, useState, type FormEvent } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { useAuth } from "../lib/auth";
import { guruPenugasanService } from "../services/guruPenugasanService";
import { masterDataService } from "../services/masterDataService";
import { penilaianRaporService } from "../services/penilaianRaporService";
import type { PenugasanGuruDetail } from "../types/guru-penugasan";
import type { SantriWithKelas, Semester } from "../types/master-data";

const STUDENT_LIMIT = 1000;

export default function GuruTahririPage() {
  const { auth } = useAuth();
  const userId = auth?.user.id;
  const name = auth?.profileName || auth?.user.email || "Guru";
  const [semester, setSemester] = useState<Semester | null>(null);
  const [assignments, setAssignments] = useState<PenugasanGuruDetail[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | null>(null);
  const [students, setStudents] = useState<SantriWithKelas[]>([]);
  const [scoreDrafts, setScoreDrafts] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const selectedAssignment = useMemo(
    () => assignments.find((assignment) => assignment.id === selectedAssignmentId) ?? null,
    [assignments, selectedAssignmentId]
  );
  const classOptions = useMemo(() => {
    const classes = new Map<number, string>();
    for (const assignment of assignments) {
      if (assignment.kelas) classes.set(assignment.kelas_id, assignment.kelas.nama_kelas);
    }
    return Array.from(classes, ([id, nama]) => ({ id, nama }));
  }, [assignments]);
  const subjectOptions = useMemo(() => {
    if (!selectedAssignment) return [];
    const subjects = new Map<number, { kode: string; nama: string }>();
    for (const assignment of assignments) {
      const subject = assignment.mata_pelajaran;
      if (assignment.kelas_id === selectedAssignment.kelas_id && subject) {
        subjects.set(subject.id, { kode: subject.kode, nama: subject.nama_latin });
      }
    }
    return Array.from(subjects, ([id, subject]) => ({ id, ...subject }));
  }, [assignments, selectedAssignment]);
  const visibleStudents = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("id");
    if (!query) return students;
    return students.filter((student) =>
      `${student.no_peserta} ${student.nama_latin}`.toLocaleLowerCase("id").includes(query)
    );
  }, [search, students]);
  const completedCount = students.filter(
    (student) => scoreDrafts[student.id]?.trim() !== ""
  ).length;

  useEffect(() => {
    if (!userId) {
      setLoadingAssignments(false);
      setErrorMessage("Sesi pengguna tidak ditemukan.");
      return;
    }

    let mounted = true;
    setLoadingAssignments(true);
    setErrorMessage(null);
    (async () => {
      const activeSemester = await masterDataService.getActiveSemester();
      if (!mounted) return;
      setSemester(activeSemester);
      if (!activeSemester) {
        setAssignments([]);
        setSelectedAssignmentId(null);
        return;
      }

      const rows = await guruPenugasanService.getPenugasanBySemester(
        activeSemester.id,
        { guruId: userId }
      );
      if (!mounted) return;
      const validRows = rows.filter(
        (row) => row.guru_id === userId && row.kelas && row.mata_pelajaran
      );
      setAssignments(validRows);
      setSelectedAssignmentId((current) =>
        current !== null && validRows.some((row) => row.id === current)
          ? current
          : validRows[0]?.id ?? null
      );
    })()
      .catch((error: unknown) => {
        console.error("Gagal memuat penugasan Tahriri:", error);
        if (mounted) setErrorMessage("Penugasan kelas dan mata pelajaran tidak dapat dimuat.");
      })
      .finally(() => {
        if (mounted) setLoadingAssignments(false);
      });

    return () => {
      mounted = false;
    };
  }, [reloadKey, userId]);

  useEffect(() => {
    if (!semester || !selectedAssignment) {
      setStudents([]);
      setScoreDrafts({});
      return;
    }

    let mounted = true;
    setLoadingStudents(true);
    setErrorMessage(null);
    setStudents([]);
    setScoreDrafts({});
    (async () => {
      const result = await masterDataService.getSantri({
        kelasId: selectedAssignment.kelas_id,
        onlyActive: true,
        page: 1,
        limit: STUDENT_LIMIT,
      });
      if (!mounted) return;
      setStudents(result.data);

      const scores = await penilaianRaporService.getNilaiByMapelAndSantri(
        semester.id,
        selectedAssignment.mapel_id,
        result.data.map((student) => student.id)
      );
      if (!mounted) return;
      const scoreByStudent = new Map(
        scores.map((score) => [score.santri_id, score.nilai_tulis])
      );
      setScoreDrafts(
        Object.fromEntries(
          result.data.map((student) => {
            const score = scoreByStudent.get(student.id);
            return [student.id, score == null ? "" : String(score)];
          })
        )
      );
    })()
      .catch((error: unknown) => {
        console.error("Gagal memuat santri atau nilai Tahriri:", error);
        if (mounted) setErrorMessage("Daftar santri atau nilai Tahriri tidak dapat dimuat.");
      })
      .finally(() => {
        if (mounted) setLoadingStudents(false);
      });

    return () => {
      mounted = false;
    };
  }, [reloadKey, selectedAssignment, semester]);

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!semester || !selectedAssignment) return;

    const rows: {
      santri_id: string;
      mapel_id: number;
      semester_id: number;
      nilai_tulis: number;
    }[] = [];

    for (const student of students) {
      const rawValue = scoreDrafts[student.id]?.trim() ?? "";
      if (!rawValue) continue;
      const score = Number(rawValue);
      if (!Number.isFinite(score) || score < 0 || score > 100) {
        setErrorMessage(`Nilai ${student.nama_latin} harus berupa angka antara 0 dan 100.`);
        return;
      }
      rows.push({
        santri_id: student.id,
        mapel_id: selectedAssignment.mapel_id,
        semester_id: semester.id,
        nilai_tulis: score,
      });
    }

    if (rows.length === 0) {
      setErrorMessage("Isi nilai minimal untuk satu santri sebelum menyimpan.");
      return;
    }

    setSaving(true);
    setErrorMessage(null);
    setNotice(null);
    try {
      await penilaianRaporService.upsertNilaiTulis(rows);
      setNotice(`${rows.length} nilai Tahriri berhasil disimpan.`);
      setReloadKey((key) => key + 1);
    } catch (error: unknown) {
      console.error("Gagal menyimpan nilai Tahriri:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Penyimpanan nilai Tahriri gagal. Periksa izin akses dan coba kembali."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout role="guru_mapel" title="Nilai Tahriri">
      <section className="page tahriri-page">
        <header className="tahriri-heading">
          <div>
            <p className="tahriri-eyebrow">UJIAN TULIS · TAHRIRI</p>
            <h2>Input Nilai Tahriri</h2>
            <p>Selamat datang, <strong>{name}</strong>. Nilai dibatasi pada kelas dan mata pelajaran yang ditugaskan kepada Anda.</p>
          </div>
          <div className="tahriri-heading-actions">
            <span className="tahriri-semester">
              {semester ? `${semester.semester ?? "Semester"} · ${semester.tahun_ajaran}` : "Belum ada semester aktif"}
            </span>
            <button type="button" className="btn-secondary" onClick={() => { setNotice(null); setReloadKey((key) => key + 1); }} disabled={loadingAssignments || loadingStudents || saving}>
              Sinkronkan
            </button>
          </div>
        </header>

        {errorMessage && <p className="tahriri-feedback error" role="alert">{errorMessage}</p>}
        {notice && <p className="tahriri-feedback success" role="status">{notice}</p>}

        {loadingAssignments ? (
          <div className="card">Memuat penugasan Anda...</div>
        ) : !semester ? (
          <div className="card tahriri-empty">Belum ada semester aktif.</div>
        ) : assignments.length === 0 ? (
          <div className="card tahriri-empty">Belum ada penugasan kelas dan mata pelajaran pada semester aktif untuk akun Anda.</div>
        ) : (
          <>
            <section className="tahriri-controls">
              <label className="card tahriri-select-card">
                <span>Kelas / Rombel</span>
                <select
                  value={selectedAssignment?.kelas_id ?? ""}
                  onChange={(event) => {
                    const classId = Number(event.target.value);
                    const firstAssignment = assignments.find((assignment) => assignment.kelas_id === classId);
                    setSelectedAssignmentId(firstAssignment?.id ?? null);
                    setSearch("");
                    setNotice(null);
                  }}
                >
                  {classOptions.map((kelas) => <option key={kelas.id} value={kelas.id}>{kelas.nama}</option>)}
                </select>
              </label>
              <label className="card tahriri-select-card">
                <span>Mata Pelajaran yang Diampu</span>
                <select
                  value={selectedAssignment?.mapel_id ?? ""}
                  onChange={(event) => {
                    const mapelId = Number(event.target.value);
                    const assignment = assignments.find(
                      (item) => item.kelas_id === selectedAssignment?.kelas_id && item.mapel_id === mapelId
                    );
                    setSelectedAssignmentId(assignment?.id ?? null);
                    setNotice(null);
                  }}
                  disabled={!selectedAssignment}
                >
                  {subjectOptions.map((subject) => (
                    <option key={subject.id} value={subject.id}>{subject.kode} · {subject.nama}</option>
                  ))}
                </select>
              </label>
              <label className="card tahriri-select-card">
                <span>Cari santri di rombel</span>
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nama atau nomor peserta" />
              </label>
            </section>

            <section className="card tahriri-score-card">
              <header className="tahriri-score-heading">
                <div>
                  <p className="tahriri-eyebrow">DAFTAR NILAI</p>
                  <h3>{selectedAssignment?.mata_pelajaran?.nama_latin ?? "Mata Pelajaran"}</h3>
                  <p>{selectedAssignment?.kelas?.nama_kelas ?? "Kelas"} · {semester.tahun_ajaran} · Nilai terisi {completedCount}/{students.length}</p>
                </div>
                {selectedAssignment?.mata_pelajaran?.nama_arab && (
                  <span className="tahriri-arabic" lang="ar">{selectedAssignment.mata_pelajaran.nama_arab}</span>
                )}
              </header>

              {loadingStudents ? (
                <p className="tahriri-empty">Memuat santri dan nilai...</p>
              ) : students.length === 0 ? (
                <p className="tahriri-empty">Tidak ada santri aktif pada rombel yang ditugaskan.</p>
              ) : visibleStudents.length === 0 ? (
                <p className="tahriri-empty">Tidak ada santri yang cocok dengan pencarian.</p>
              ) : (
                <form onSubmit={handleSave}>
                  <div className="tahriri-student-list">
                    {visibleStudents.map((student, index) => (
                      <article key={student.id} className="tahriri-student-row">
                        <div className="tahriri-student-identity">
                          <span className="tahriri-row-number">{index + 1}</span>
                          <div>
                            <strong>{student.nama_latin}</strong>
                            {student.nama_arab && <span className="tahriri-arabic" lang="ar">{student.nama_arab}</span>}
                            <small>{student.no_peserta}{student.nis ? ` · NIS ${student.nis}` : ""}</small>
                          </div>
                        </div>
                        <label className="tahriri-score-field">
                          <span>Nilai</span>
                          <input
                            aria-label={`Nilai Tahriri ${student.nama_latin}`}
                            type="number"
                            inputMode="decimal"
                            min="0"
                            max="100"
                            step="0.01"
                            value={scoreDrafts[student.id] ?? ""}
                            onChange={(event) => {
                              setScoreDrafts((current) => ({ ...current, [student.id]: event.target.value }));
                              setNotice(null);
                            }}
                          />
                        </label>
                      </article>
                    ))}
                  </div>
                  <footer className="tahriri-save-row">
                    <span>Rentang nilai 0–100. Isian kosong tidak mengubah nilai yang tersimpan.</span>
                    <button type="submit" className="btn-primary" disabled={saving || loadingStudents || completedCount === 0}>
                      {saving ? "Menyimpan..." : "Simpan Nilai Tahriri"}
                    </button>
                  </footer>
                </form>
              )}
            </section>
          </>
        )}
      </section>
    </DashboardLayout>
  );
}
