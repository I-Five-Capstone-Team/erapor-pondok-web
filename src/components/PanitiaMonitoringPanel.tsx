import { useEffect, useMemo, useState } from "react";
import { getDatabaseErrorMessage } from "../lib/databaseError";
import { guruPenugasanService } from "../services/guruPenugasanService";
import { masterDataService } from "../services/masterDataService";
import { penilaianRaporService } from "../services/penilaianRaporService";
import type { PenugasanGuruDetail } from "../types/guru-penugasan";
import type { Semester } from "../types/master-data";

type MonitorItem = {
  id: string;
  className: string;
  subjectCode: string;
  subjectName: string;
  teachers: string[];
  completed: number;
  total: number;
};

const STUDENT_PAGE_SIZE = 1000;

async function getActiveStudentIdsByClass(kelasId: number): Promise<string[]> {
  const firstPage = await masterDataService.getSantri({
    kelasId,
    onlyActive: true,
    page: 1,
    limit: STUDENT_PAGE_SIZE,
  });
  const studentIds = firstPage.data.map((student) => student.id);

  for (
    let page = 2;
    studentIds.length < firstPage.count;
    page += 1
  ) {
    const result = await masterDataService.getSantri({
      kelasId,
      onlyActive: true,
      page,
      limit: STUDENT_PAGE_SIZE,
    });
    if (result.data.length === 0) break;
    studentIds.push(...result.data.map((student) => student.id));
  }

  return studentIds;
}

function ProgressRing({ percent }: { percent: number }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="panitia-ring" aria-label={`Progres ${percent}%`}>
      <svg viewBox="0 0 100 100" className="panitia-ring-svg">
        <circle className="panitia-ring-track" cx="50" cy="50" r={radius} />
        <circle
          className="panitia-ring-fill"
          cx="50"
          cy="50"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (percent / 100) * circumference}
        />
      </svg>
      <div className="panitia-ring-center">
        <div className="panitia-ring-value">{percent}%</div>
        <div className="panitia-ring-label">TERISI</div>
      </div>
    </div>
  );
}

function buildMonitorItems(
  assignments: PenugasanGuruDetail[],
  studentIdsByClass: Map<number, string[]>,
  completedScores: Set<string>
): MonitorItem[] {
  const groups = new Map<
    string,
    {
      kelasId: number;
      mapelId: number;
      className: string;
      subjectCode: string;
      subjectName: string;
      teachers: Set<string>;
    }
  >();

  for (const assignment of assignments) {
    const subject = assignment.mata_pelajaran;
    const kelas = assignment.kelas;
    if (!subject || !kelas) continue;

    const id = `${assignment.kelas_id}:${assignment.mapel_id}`;
    const group = groups.get(id) ?? {
      kelasId: assignment.kelas_id,
      mapelId: assignment.mapel_id,
      className: kelas.nama_kelas,
      subjectCode: subject.kode,
      subjectName: subject.nama_latin,
      teachers: new Set<string>(),
    };
    group.teachers.add(assignment.guru?.nama_lengkap ?? "Guru belum ditentukan");
    groups.set(id, group);
  }

  return Array.from(groups, ([id, group]) => {
    const studentIds = studentIdsByClass.get(group.kelasId) ?? [];
    return {
      id,
      className: group.className,
      subjectCode: group.subjectCode,
      subjectName: group.subjectName,
      teachers: Array.from(group.teachers),
      total: studentIds.length,
      completed: studentIds.filter((studentId) =>
        completedScores.has(`${studentId}:${group.mapelId}`)
      ).length,
    };
  }).sort((a, b) =>
    a.className.localeCompare(b.className, "id", { numeric: true }) ||
    a.subjectName.localeCompare(b.subjectName, "id")
  );
}

export default function PanitiaMonitoringPanel() {
  const [semester, setSemester] = useState<Semester | null>(null);
  const [items, setItems] = useState<MonitorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setErrorMessage(null);

    (async () => {
      const activeSemester = await masterDataService.getActiveSemester();
      if (!mounted) return;
      setSemester(activeSemester);
      if (!activeSemester) {
        setItems([]);
        return;
      }

      const assignments = await guruPenugasanService.getPenugasanBySemester(
        activeSemester.id
      );
      const validAssignments = assignments.filter(
        (assignment) => assignment.mata_pelajaran && assignment.kelas
      );
      const classIds = Array.from(
        new Set(validAssignments.map((assignment) => assignment.kelas_id))
      );
      const studentIdEntries = await Promise.all(
        classIds.map(async (kelasId) => [
          kelasId,
          await getActiveStudentIdsByClass(kelasId),
        ] as const)
      );
      const studentIdsByClass = new Map(studentIdEntries);
      const studentIds = Array.from(
        new Set(studentIdEntries.flatMap(([, ids]) => ids))
      );
      const mapelIds = Array.from(
        new Set(validAssignments.map((assignment) => assignment.mapel_id))
      );
      const scoreRows = await penilaianRaporService.getNilaiTulisBySemester(
        activeSemester.id,
        mapelIds,
        studentIds
      );
      if (!mounted) return;

      const completedScores = new Set(
        scoreRows
          .filter((row) => row.nilai_tulis !== null)
          .map((row) => `${row.santri_id}:${row.mapel_id}`)
      );
      setItems(
        buildMonitorItems(validAssignments, studentIdsByClass, completedScores)
      );
    })()
      .catch((error: unknown) => {
        console.error("Gagal memuat monitoring nilai panitia:", error);
        if (mounted) {
          setItems([]);
          setErrorMessage(
            getDatabaseErrorMessage(error, "Monitoring nilai tidak dapat dimuat.")
          );
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [reloadKey]);

  const totals = useMemo(
    () =>
      items.reduce(
        (result, item) => ({
          completed: result.completed + item.completed,
          total: result.total + item.total,
        }),
        { completed: 0, total: 0 }
      ),
    [items]
  );
  const percent =
    totals.total === 0 ? 0 : Math.round((totals.completed / totals.total) * 100);
  const incompleteCount = items.filter(
    (item) => item.total === 0 || item.completed < item.total
  ).length;
  const semesterLabel = semester
    ? `${semester.semester ?? "Semester"} · ${semester.tahun_ajaran}`
    : "Belum ada semester aktif";

  return (
    <section className="panitia-monitoring">
      <header className="panitia-header">
        <div className="panitia-header-ornament" aria-hidden="true" />
        <div className="panitia-header-text">
          <p className="panitia-eyebrow-light">RAPOR DIGITAL PESANTREN</p>
          <h1 className="panitia-title">Monitoring Nilai Rapor</h1>
          <p className="panitia-subtitle">{semesterLabel}</p>
        </div>
        <button
          type="button"
          className="panitia-header-refresh"
          onClick={() => setReloadKey((key) => key + 1)}
          disabled={loading}
        >
          {loading ? "Memuat..." : "Muat Ulang"}
        </button>
      </header>

      {errorMessage && (
        <p className="panitia-feedback error" role="alert">
          {errorMessage}
        </p>
      )}

      {loading ? (
        <div className="panitia-card panitia-report-empty" aria-live="polite">
          Memuat status nilai...
        </div>
      ) : !semester ? (
        <div className="panitia-card panitia-report-empty">
          Aktifkan semester terlebih dahulu untuk melihat status nilai.
        </div>
      ) : items.length === 0 ? (
        <div className="panitia-card panitia-report-empty">
          Belum ada penugasan guru pada semester aktif.
        </div>
      ) : (
        <>
          <section className="panitia-card panitia-progress-card">
            <div className="panitia-progress-accent" aria-hidden="true" />
            <ProgressRing percent={percent} />
            <div className="panitia-progress-info">
              <p className="panitia-eyebrow">PROGRES NILAI TAHRIRI</p>
              <h2 className="panitia-card-title">Nilai Terkumpul</h2>
              <p className="panitia-muted">
                {totals.completed} dari {totals.total} nilai santri sudah diinput.
              </p>
            </div>
          </section>

          {incompleteCount > 0 && (
            <section className="panitia-warning" role="status">
              <div className="panitia-warning-body">
                <div className="panitia-warning-head">
                  <h3>Ada nilai yang belum lengkap</h3>
                  <span className="panitia-warning-badge">TINDAK LANJUT</span>
                </div>
                <p>
                  {incompleteCount} penugasan belum memiliki nilai lengkap untuk
                  seluruh santri aktif.
                </p>
              </div>
            </section>
          )}

          <div className="panitia-section-head">
            <div>
              <p className="panitia-eyebrow">STATUS GURU</p>
              <h2 className="panitia-section-title">Pengumpulan Nilai</h2>
            </div>
            <span className="panitia-monitoring-count">
              {items.length} penugasan
            </span>
          </div>

          <div className="panitia-teacher-list">
            {items.map((item, index) => {
              const progress =
                item.total === 0
                  ? 0
                  : Math.round((item.completed / item.total) * 100);
              const barColor = progress === 100 ? "emerald" : "amber";
              const tone = ["teal", "sky", "amber", "violet"][index % 4];
              return (
                <article key={item.id} className="panitia-teacher-card">
                  <div className={`panitia-subject-icon tone-${tone}`}>
                    <span aria-hidden="true">{item.subjectCode.slice(0, 2)}</span>
                  </div>
                  <div className="panitia-teacher-main">
                    <div className="panitia-teacher-top">
                      <div>
                        <h3 className="panitia-subject-name">
                          {item.subjectName} · {item.className}
                        </h3>
                        <p className="panitia-teacher-name">
                          {item.teachers.join(", ")}
                        </p>
                      </div>
                      <strong className="panitia-monitoring-score">
                        {item.completed}/{item.total}
                      </strong>
                    </div>
                    <div className="panitia-progress-row">
                      <div
                        className="panitia-bar-track"
                        role="progressbar"
                        aria-label={`Progres nilai ${item.subjectName} ${item.className}`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={progress}
                      >
                        <div
                          className={`panitia-bar-fill ${barColor}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="panitia-percent">{progress}%</div>
                    </div>
                    <div
                      className={`panitia-status-text ${
                        progress === 100 ? "locked" : "open"
                      }`}
                    >
                      {item.total === 0
                        ? "Belum ada santri aktif"
                        : progress === 100
                          ? "Nilai lengkap"
                          : "Menunggu input nilai"}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
