import { useEffect, useMemo, useState } from "react";
import { getDatabaseErrorMessage } from "../lib/databaseError";
import { supabase } from "../lib/supabase";
import { penilaianRaporService } from "../services/penilaianRaporService";
import type {
  CatatanWaliKelas,
  NilaiMapelWithDetail,
  RekapRaporDetail,
} from "../types/penilaian-rapor";

type SemesterOption = {
  id: number;
  semester: string | null;
  tahun_ajaran: string;
};

type KelasOption = {
  id: number;
  nama_kelas: string;
};

function formatScore(value: number | null | undefined): string {
  return value == null ? "-" : new Intl.NumberFormat("id-ID").format(value);
}

function sortReportsByParticipantNumber(reports: RekapRaporDetail[]): RekapRaporDetail[] {
  return [...reports].sort((a, b) =>
    (a.santri?.no_peserta ?? "").localeCompare(b.santri?.no_peserta ?? "", "id")
  );
}

async function getClassReportData(kelasId: number, semesterId: number) {
  const [reports, santriResult] = await Promise.all([
    penilaianRaporService.getRekapByKelas(kelasId, semesterId),
    supabase
      .from("santri")
      .select("id")
      .eq("kelas_id", kelasId)
      .eq("is_active", true),
  ]);
  if (santriResult.error) throw santriResult.error;
  return {
    reports,
    activeSantriIds: (santriResult.data ?? []).map((santri) => santri.id),
  };
}

export default function PanitiaCetakRaporPanel() {
  const [semester, setSemester] = useState<SemesterOption | null>(null);
  const [classes, setClasses] = useState<KelasOption[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [reports, setReports] = useState<RekapRaporDetail[]>([]);
  const [activeSantriIds, setActiveSantriIds] = useState<string[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [scores, setScores] = useState<NilaiMapelWithDetail[]>([]);
  const [attendance, setAttendance] = useState<CatatanWaliKelas | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const selectedReport = useMemo(
    () => reports.find((report) => report.id === selectedReportId) ?? null,
    [reports, selectedReportId]
  );
  const sortedReports = useMemo(
    () => sortReportsByParticipantNumber(reports),
    [reports]
  );

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setErrorMessage(null);

    Promise.all([
      supabase
        .from("semester")
        .select("id,semester,tahun_ajaran")
        .eq("is_active", true)
        .maybeSingle(),
      supabase
        .from("kelas")
        .select("id,nama_kelas")
        .eq("is_active", true)
        .order("nama_kelas", { ascending: true }),
    ])
      .then(([semesterResult, kelasResult]) => {
        if (semesterResult.error) throw semesterResult.error;
        if (kelasResult.error) throw kelasResult.error;
        if (!mounted) return;

        const activeSemester = semesterResult.data as SemesterOption | null;
        const activeClasses = (kelasResult.data ?? []) as KelasOption[];
        setSemester(activeSemester);
        setClasses(activeClasses);
        setSelectedClassId((current) =>
          current !== null && activeClasses.some((kelas) => kelas.id === current)
            ? current
            : activeClasses[0]?.id ?? null
        );
      })
      .catch((error: unknown) => {
        console.error("Gagal memuat data cetak rapor:", error);
        if (mounted) {
          setErrorMessage("Data semester atau kelas tidak dapat dimuat.");
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [reloadKey]);

  useEffect(() => {
    if (!semester || selectedClassId === null) {
      setReports([]);
      setActiveSantriIds([]);
      setSelectedReportId(null);
      setReportsLoading(false);
      return;
    }

    let mounted = true;
    setReportsLoading(true);
    setErrorMessage(null);
    setSelectedReportId(null);

    getClassReportData(selectedClassId, semester.id)
      .then(({ reports: data, activeSantriIds: santriIds }) => {
        if (!mounted) return;
        setReports(data);
        setActiveSantriIds(santriIds);
        setSelectedReportId(sortReportsByParticipantNumber(data)[0]?.id ?? null);
      })
      .catch((error: unknown) => {
        console.error("Gagal memuat rekap rapor:", error);
        if (mounted) {
          setReports([]);
          setActiveSantriIds([]);
          setErrorMessage("Rekap rapor kelas tidak dapat dimuat.");
        }
      })
      .finally(() => {
        if (mounted) setReportsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [reloadKey, selectedClassId, semester]);

  const rekapSantriIds = useMemo(
    () => new Set(reports.map((report) => report.santri_id)),
    [reports]
  );
  const missingSantriIds = useMemo(
    () => activeSantriIds.filter((santriId) => !rekapSantriIds.has(santriId)),
    [activeSantriIds, rekapSantriIds]
  );
  const hasLockedReports = reports.some(
    (report) => report.status_kunci || Boolean(report.disahkan_at)
  );

  useEffect(() => {
    if (!selectedReport || !semester) {
      setScores([]);
      setAttendance(null);
      setPreviewLoading(false);
      return;
    }

    let mounted = true;
    setPreviewLoading(true);
    setPreviewError(null);
    Promise.all([
      penilaianRaporService.getNilaiLengkapSantri(
        selectedReport.santri_id,
        semester.id
      ),
      penilaianRaporService.getCatatanBySantriIds(semester.id, [
        selectedReport.santri_id,
      ]),
    ])
      .then(([nilai, catatan]) => {
        if (!mounted) return;
        setScores(nilai);
        setAttendance(catatan[0] ?? null);
      })
      .catch((error: unknown) => {
        console.error("Gagal memuat rincian rapor santri:", error);
        if (mounted) {
          setScores([]);
          setAttendance(null);
          setPreviewError("Rincian nilai dan kehadiran tidak dapat dimuat.");
        }
      })
      .finally(() => {
        if (mounted) setPreviewLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [selectedReport, semester]);

  const handleGenerateRekap = async () => {
    if (!semester || selectedClassId === null) return;
    if (reports.length > 0 && hasLockedReports) {
      setErrorMessage(
        "Buka kunci semua rekap yang ada dan cabut pengesahan Mudir sebelum sinkronisasi ulang kelas."
      );
      return;
    }
    if (
      reports.length > 0 &&
      !window.confirm(
        `Sinkronisasi akan menjalankan ulang generator rekap untuk seluruh kelas ${
          classes.find((kelas) => kelas.id === selectedClassId)?.nama_kelas ?? ""
        }. Rekap yang sudah ada dan belum dikunci dapat dihitung ulang. Lanjutkan?`
      )
    ) {
      return;
    }

    setBusy(true);
    setErrorMessage(null);
    setNotice(null);
    try {
      await penilaianRaporService.generateRekapKelas(
        selectedClassId,
        semester.id
      );
      const refreshedData = await getClassReportData(selectedClassId, semester.id);
      const refreshedReportIds = new Set(
        refreshedData.reports.map((report) => report.santri_id)
      );
      const stillMissing = refreshedData.activeSantriIds.filter(
        (santriId) => !refreshedReportIds.has(santriId)
      );
      setReports(refreshedData.reports);
      setActiveSantriIds(refreshedData.activeSantriIds);
      setSelectedReportId((current) =>
        current !== null && refreshedData.reports.some((report) => report.id === current)
          ? current
          : sortReportsByParticipantNumber(refreshedData.reports)[0]?.id ?? null
      );
      setNotice(
        stillMissing.length === 0
          ? `Sinkronisasi selesai. Semua ${refreshedData.activeSantriIds.length} santri aktif sudah masuk rekap.`
          : `Sinkronisasi selesai, tetapi ${stillMissing.length} santri masih belum memiliki rekap. Periksa kelengkapan nilai.`
      );
    } catch (error) {
      console.error("Gagal membuat rekap rapor:", error);
      setErrorMessage(
        getDatabaseErrorMessage(
          error,
          "Sinkronisasi rekap gagal. Periksa kelengkapan nilai dan status kunci."
        )
      );
    } finally {
      setBusy(false);
    }
  };

  const handleToggleLock = async () => {
    if (!selectedReport) return;
    const nextStatus = !selectedReport.status_kunci;
    const action = nextStatus ? "mengunci" : "membuka kunci";
    if (!window.confirm(`Yakin ingin ${action} rapor ${selectedReport.santri?.nama_latin ?? ""}?`)) {
      return;
    }

    setBusy(true);
    setErrorMessage(null);
    setNotice(null);
    try {
      await penilaianRaporService.setKunciRaporSantri(
        selectedReport.id,
        nextStatus
      );
      setNotice(nextStatus ? "Rapor berhasil dikunci." : "Kunci rapor berhasil dibuka.");
      setReloadKey((key) => key + 1);
    } catch (error) {
      console.error("Gagal mengubah status kunci rapor:", error);
      setErrorMessage(
        getDatabaseErrorMessage(error, "Status kunci rapor gagal diperbarui:")
      );
    } finally {
      setBusy(false);
    }
  };

  const semesterLabel = semester
    ? `${semester.semester ?? "Semester"} · ${semester.tahun_ajaran}`
    : "Belum ada semester aktif";
  const student = selectedReport?.santri;

  return (
    <section className="panitia-print-page">
      <header className="panitia-header">
        <div className="panitia-header-ornament" aria-hidden="true" />
        <div className="panitia-header-text">
          <p className="panitia-eyebrow-light">RAPOR DIGITAL PESANTREN</p>
          <h1 className="panitia-title">Cetak Rapor Santri</h1>
          <p className="panitia-subtitle">{semesterLabel}</p>
        </div>
      </header>

      <section className="panitia-card panitia-print-controls" aria-label="Pilih rapor">
        <label className="panitia-print-field">
          <span>Kelas</span>
          <select
            value={selectedClassId ?? ""}
            onChange={(event) => setSelectedClassId(Number(event.target.value))}
            disabled={loading || classes.length === 0}
          >
            {classes.length === 0 && <option value="">Tidak ada kelas aktif</option>}
            {classes.map((kelas) => (
              <option key={kelas.id} value={kelas.id}>
                {kelas.nama_kelas}
              </option>
            ))}
          </select>
        </label>

        <label className="panitia-print-field">
          <span>
            Santri
            {activeSantriIds.length > 0 && (
              <small>{reports.length} dari {activeSantriIds.length} sudah direkap</small>
            )}
          </span>
          <select
            value={selectedReportId ?? ""}
            onChange={(event) =>
              setSelectedReportId(
                event.target.value ? Number(event.target.value) : null
              )
            }
            disabled={reportsLoading || reports.length === 0}
          >
            {reports.length === 0 && <option value="">Belum ada rekap rapor</option>}
            {sortedReports.map((report) => (
              <option key={report.id} value={report.id}>
                {report.santri?.no_peserta ?? "-"} · {report.santri?.nama_latin ?? "Santri"}
              </option>
            ))}
          </select>
        </label>

        <div className="panitia-print-actions">
          <div className="panitia-sync-controls">
            {semester && selectedClassId !== null && missingSantriIds.length > 0 && (
              <button
                type="button"
                className="panitia-primary-btn"
                onClick={handleGenerateRekap}
                disabled={
                  busy ||
                  loading ||
                  reportsLoading ||
                  activeSantriIds.length === 0 ||
                  hasLockedReports
                }
              >
                {busy
                  ? "Menyinkronkan..."
                  : reports.length === 0
                    ? "Buat Rekap Rapor"
                    : `Sinkronkan ${missingSantriIds.length} Santri Belum Direkap`}
              </button>
            )}
            {missingSantriIds.length > 0 && hasLockedReports && (
              <span className="panitia-sync-warning" role="status">
                Buka kunci atau cabut pengesahan rekap yang ada sebelum sinkronisasi ulang kelas.
              </span>
            )}
            {reports.length > 0 && missingSantriIds.length === 0 && (
              <span className="panitia-sync-complete" role="status">
                Semua santri aktif sudah masuk rekap
              </span>
            )}
          </div>
          {selectedReport && (
            <div className="panitia-report-actions">
              <button
                type="button"
                className="panitia-secondary-btn"
                onClick={handleToggleLock}
                disabled={busy || Boolean(selectedReport.disahkan_at)}
                title={
                  selectedReport.disahkan_at
                    ? "Cabut pengesahan melalui halaman Mudir sebelum membuka kunci rapor."
                    : undefined
                }
              >
                {selectedReport.disahkan_at
                  ? "Sudah Disahkan Mudir"
                  : selectedReport.status_kunci
                    ? "Buka Kunci Rapor"
                    : "Kunci Rapor"}
              </button>
              <button
                type="button"
                className="panitia-primary-btn"
                onClick={() => window.print()}
                disabled={previewLoading || previewError !== null}
              >
                Cetak / PDF
              </button>
            </div>
          )}
        </div>
      </section>

      {errorMessage && (
        <p className="panitia-feedback error" role="alert">
          {errorMessage}
          <button
            type="button"
            className="panitia-inline-retry"
            onClick={() => setReloadKey((key) => key + 1)}
          >
            Muat ulang
          </button>
        </p>
      )}
      {notice && <p className="panitia-feedback success" role="status">{notice}</p>}

      {loading || reportsLoading ? (
        <div className="panitia-card panitia-report-empty">Memuat data rapor...</div>
      ) : !semester ? (
        <div className="panitia-card panitia-report-empty">
          Aktifkan semester terlebih dahulu untuk melihat rapor.
        </div>
      ) : !selectedReport ? (
        <div className="panitia-card panitia-report-empty">
          Belum ada rekap untuk kelas ini. Buat rekap setelah nilai santri selesai diinput.
        </div>
      ) : (
        <>
          <article className="panitia-card panitia-report-preview">
            <div className="panitia-report-student">
              <div className="panitia-report-avatar">
                {(student?.nama_latin?.[0] ?? "S").toUpperCase()}
              </div>
              <div>
                <p className="panitia-eyebrow">RAPOR DIGITAL SANTRI</p>
                <h2>{student?.nama_latin ?? "Nama santri tidak tersedia"}</h2>
                <p>
                  {student?.no_peserta ?? "-"} · {student?.kelas?.nama_kelas ?? "-"}
                </p>
              </div>
              <span
                className={`panitia-report-lock ${
                  selectedReport.status_kunci ? "locked" : "unlocked"
                }`}
              >
                {selectedReport.status_kunci ? "Terkunci" : "Belum dikunci"}
              </span>
            </div>

            <div className="panitia-report-summary">
              <div>
                <span>Rata-rata</span>
                <strong>{formatScore(selectedReport.rata_rata)}</strong>
              </div>
              <div>
                <span>Ranking</span>
                <strong>{selectedReport.ranking ?? "-"}</strong>
              </div>
              <div>
                <span>Kehadiran</span>
                <strong>
                  {attendance
                    ? `${attendance.sakit + attendance.izin + attendance.alpa} hari`
                    : "Belum ada data"}
                </strong>
              </div>
              <div>
                <span>Status</span>
                <strong>{selectedReport.disahkan_at ? "Disahkan" : "Belum disahkan"}</strong>
              </div>
            </div>

            <div className="panitia-report-section-title">
              <h3>Rekap Nilai Akademik</h3>
              {previewLoading && <span>Memuat nilai...</span>}
            </div>
            <div className="panitia-report-table-wrap">
              <table className="panitia-report-table">
                <thead>
                  <tr>
                    <th>Mata Pelajaran</th>
                    <th>Tulis</th>
                    <th>Lisan</th>
                    <th>Nilai Rapor</th>
                  </tr>
                </thead>
                <tbody>
                  {scores.map((score) => (
                    <tr key={score.id}>
                      <td>
                        <span>{score.mata_pelajaran?.nama_latin ?? "-"}</span>
                        {score.mata_pelajaran?.nama_arab && (
                          <span className="panitia-arabic">
                            {score.mata_pelajaran.nama_arab}
                          </span>
                        )}
                      </td>
                      <td>{formatScore(score.nilai_tulis)}</td>
                      <td>{formatScore(score.nilai_lisan)}</td>
                      <td>{formatScore(score.nilai_akhir_display ?? score.nilai_akhir_asli)}</td>
                    </tr>
                  ))}
                  {scores.length === 0 && !previewLoading && (
                    <tr>
                      <td colSpan={4}>
                        {previewError ?? "Belum ada nilai untuk santri ini."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="panitia-report-notes">
              <h3>Kehadiran dan Catatan Wali Kelas</h3>
              <p>
                Sakit: {attendance?.sakit ?? "-"} · Izin: {attendance?.izin ?? "-"} ·
                Alpa: {attendance?.alpa ?? "-"}
              </p>
              <p>{attendance?.catatan || "Tidak ada catatan wali kelas."}</p>
            </div>
          </article>

          <article className="panitia-print-sheet">
            <header>
              <p>PONDOK PESANTREN NURUL HUDA</p>
              <h1>RAPOR DIGITAL SANTRI</h1>
              <p>{semesterLabel}</p>
            </header>
            <div className="panitia-print-identity">
              <p><strong>Nama:</strong> {student?.nama_latin ?? "-"}</p>
              <p><strong>No. Peserta:</strong> {student?.no_peserta ?? "-"}</p>
              <p><strong>Kelas:</strong> {student?.kelas?.nama_kelas ?? "-"}</p>
              <p><strong>Ranking:</strong> {selectedReport.ranking ?? "-"}</p>
              <p><strong>Rata-rata:</strong> {formatScore(selectedReport.rata_rata)}</p>
            </div>
            <table className="panitia-print-table">
              <thead>
                <tr>
                  <th>Mata Pelajaran</th>
                  <th>Tulis</th>
                  <th>Lisan</th>
                  <th>Nilai</th>
                </tr>
              </thead>
              <tbody>
                {scores.map((score) => (
                  <tr key={score.id}>
                    <td>{score.mata_pelajaran?.nama_latin ?? "-"}</td>
                    <td>{formatScore(score.nilai_tulis)}</td>
                    <td>{formatScore(score.nilai_lisan)}</td>
                    <td>{formatScore(score.nilai_akhir_display ?? score.nilai_akhir_asli)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="panitia-print-attendance">
              Kehadiran — Sakit: {attendance?.sakit ?? "-"}, Izin: {attendance?.izin ?? "-"},
              Alpa: {attendance?.alpa ?? "-"}
            </p>
            <p><strong>Catatan wali kelas:</strong> {attendance?.catatan || "-"}</p>
            <div className="panitia-print-signatures">
              <div>Wali Kelas</div>
              <div>Mudir Idaroh</div>
            </div>
          </article>
        </>
      )}
    </section>
  );
}
