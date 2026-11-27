import { useEffect, useMemo, useState, type FormEvent } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { useAuth } from "../lib/auth";
import { getDatabaseErrorMessage } from "../lib/databaseError";
import { guruPenugasanService } from "../services/guruPenugasanService";
import { masterDataService } from "../services/masterDataService";
import { penilaianRaporService } from "../services/penilaianRaporService";
import type {
  AlokasiSantriDetail,
  RuanganSyafahiDetail,
} from "../types/guru-penugasan";
import type { KelasWithWali, MataPelajaran, SantriWithKelas } from "../types/master-data";
import {
  filterMataPelajaranByJenjang,
  matchesMataPelajaranLevel,
} from "../utils/syafahiSubjects";

const classCollator = new Intl.Collator("id", {
  numeric: true,
  sensitivity: "base",
});

export default function PJSyafahiPage() {
  const { auth } = useAuth();
  const name = auth?.profileName || auth?.user.email || "PJ Syafahi";
  const userId = auth?.user.id;
  const [semesterId, setSemesterId] = useState<number | null>(null);
  const [semesterLabel, setSemesterLabel] = useState("Belum ada semester aktif");
  const [rooms, setRooms] = useState<RuanganSyafahiDetail[]>([]);
  const [oralSubjectOptions, setOralSubjectOptions] = useState<MataPelajaran[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [participants, setParticipants] = useState<AlokasiSantriDetail[]>([]);
  const [participantPage, setParticipantPage] = useState(1);
  const [classes, setClasses] = useState<KelasWithWali[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [classSantri, setClassSantri] = useState<SantriWithKelas[]>([]);
  const [savedOralScores, setSavedOralScores] = useState<
    {
      santri_id: string;
      mapel_id: number;
      nilai_lisan: number | null;
      mata_pelajaran?:
        | { kode: string; nama_latin: string }
        | { kode: string; nama_latin: string }[]
        | null;
    }[]
  >([]);
  const [selectedMapelId, setSelectedMapelId] = useState<number | null>(null);
  const [scoreDrafts, setScoreDrafts] = useState<Record<string, string>>({});
  const [manageParticipants, setManageParticipants] = useState(false);
  const [selectedSantriIds, setSelectedSantriIds] = useState<string[]>([]);
  const [santriSearch, setSantriSearch] = useState("");
  const [classLoading, setClassLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [scoresLoading, setScoresLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [allocationSaving, setAllocationSaving] = useState(false);
  const [candidateLoading, setCandidateLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [scoreReloadKey, setScoreReloadKey] = useState(0);
  const [participantsReloadKey, setParticipantsReloadKey] = useState(0);
  const [roomsReloadKey, setRoomsReloadKey] = useState(0);

  const scoreDraftStorageKey =
    userId && semesterId !== null && selectedRoomId !== null && selectedMapelId !== null
      ? `erapor:syafahi-draft:${userId}:${semesterId}:${selectedRoomId}:${selectedMapelId}`
      : null;

  useEffect(() => {
    if (!scoreDraftStorageKey) {
      setScoreDrafts({});
      return;
    }
    try {
      const storedDraft = window.localStorage.getItem(scoreDraftStorageKey);
      const parsedDraft: unknown = storedDraft ? JSON.parse(storedDraft) : {};
      if (
        parsedDraft &&
        typeof parsedDraft === "object" &&
        !Array.isArray(parsedDraft) &&
        Object.values(parsedDraft).every((value) => typeof value === "string")
      ) {
        setScoreDrafts(parsedDraft as Record<string, string>);
      } else {
        setScoreDrafts({});
      }
    } catch {
      setScoreDrafts({});
      setErrorMessage("Draft lokal tidak dapat dibaca dari penyimpanan perangkat.");
    }
  }, [scoreDraftStorageKey]);

  const selectedRoom = rooms.find((room) => room.id === selectedRoomId) ?? null;
  const allocatedSantriIds = useMemo(
    () => new Set(participants.map((allocation) => allocation.santri_id)),
    [participants]
  );
  const availableSantri = useMemo(
    () => classSantri.filter((santri) => !allocatedSantriIds.has(santri.id)),
    [classSantri, allocatedSantriIds]
  );
  const filteredAvailableSantri = useMemo(() => {
    const query = santriSearch.trim().toLocaleLowerCase("id");
    return availableSantri
      .filter((santri) => {
        const searchableText =
          `${santri.no_peserta} ${santri.nis ?? ""} ${santri.nama_latin}`
            .toLocaleLowerCase("id");
        return !query || searchableText.includes(query);
      })
      .sort(
        (a, b) =>
          classCollator.compare(a.nama_latin, b.nama_latin) ||
          classCollator.compare(a.no_peserta, b.no_peserta)
      );
  }, [availableSantri, santriSearch]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      setErrorMessage("Sesi pengguna tidak ditemukan.");
      return;
    }

    let mounted = true;
    setLoading(true);
    setErrorMessage(null);
    setNotice(null);

    (async () => {
      const activeSemester = await masterDataService.getActiveSemester();
      if (!activeSemester) {
        if (mounted) {
          setSemesterId(null);
          setSemesterLabel("Belum ada semester aktif");
          setRooms([]);
          setOralSubjectOptions([]);
          setSelectedRoomId(null);
        }
        return;
      }

      const activeSemesterId = Number(activeSemester.id);
      if (!Number.isFinite(activeSemesterId)) {
        throw new Error("ID semester aktif tidak valid.");
      }

      const [roomData, subjectData] = await Promise.all([
        guruPenugasanService.getRuanganSyafahi(activeSemesterId, userId),
        masterDataService.getMataPelajaranLisan(),
      ]);
      if (!mounted) return;

      setSemesterId(activeSemesterId);
      setSemesterLabel(
        `${activeSemester.semester ?? "Semester"} · ${activeSemester.tahun_ajaran}`
      );
      setRooms(roomData);
      setOralSubjectOptions(subjectData);
      setParticipantsReloadKey((key) => key + 1);
      setSelectedRoomId((current) => {
        if (current !== null && roomData.some((room) => room.id === current)) {
          return current;
        }
        return roomData[0]?.id ?? null;
      });
    })()
      .catch((error: unknown) => {
        console.error("Gagal memuat penugasan PJ Syafahi:", error);
        if (mounted) {
          setErrorMessage("Data semester, ruangan, atau mata pelajaran lisan tidak dapat dimuat.");
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [roomsReloadKey, userId]);

  useEffect(() => {
    if (selectedRoomId === null) {
      setParticipants([]);
      setSavedOralScores([]);
      setParticipantsLoading(false);
      return;
    }

    let mounted = true;
    setParticipantsLoading(true);
    setParticipants([]);
    setSavedOralScores([]);
    setErrorMessage(null);
    guruPenugasanService
      .getSantriByRuangan(selectedRoomId)
      .then((data) => {
        if (mounted) {
          setParticipants(
            data.filter((allocation) => allocation.santri?.is_active !== false)
          );
        }
      })
      .catch((error: unknown) => {
        console.error("Gagal memuat peserta ruangan syafahi:", error);
        if (mounted) {
          setParticipants([]);
          setErrorMessage("Daftar santri ruangan tidak dapat dimuat.");
        }
      })
      .finally(() => {
        if (mounted) setParticipantsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [participantsReloadKey, selectedRoomId]);

  useEffect(() => {
    if (!manageParticipants || classes.length > 0) return;

    let mounted = true;
    setClassLoading(true);
    masterDataService
      .getKelas()
      .then((data) => {
        if (mounted) setClasses(data);
      })
      .catch((error: unknown) => {
        console.error("Gagal memuat daftar kelas:", error);
        if (mounted) {
          setErrorMessage("Daftar kelas tidak dapat dimuat.");
        }
      })
      .finally(() => {
        if (mounted) setClassLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [classes.length, manageParticipants]);

  useEffect(() => {
    if (selectedClassId === null) {
      setClassSantri([]);
      setCandidateLoading(false);
      return;
    }

    let mounted = true;
    setCandidateLoading(true);
    masterDataService
      .getSantri({ onlyActive: true, kelasId: selectedClassId, limit: 1000 })
      .then((result) => {
        if (mounted) setClassSantri(result.data);
      })
      .catch((error: unknown) => {
        console.error("Gagal memuat santri per kelas:", error);
        if (mounted) {
          setClassSantri([]);
          setErrorMessage("Daftar santri kelas tidak dapat dimuat.");
        }
      })
      .finally(() => {
        if (mounted) setCandidateLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [selectedClassId]);

  const oralSubjects = useMemo(
    () =>
      filterMataPelajaranByJenjang(
        oralSubjectOptions,
        participants.map((allocation) => allocation.santri?.kelas?.jenjang ?? null)
      ),
    [oralSubjectOptions, participants]
  );

  useEffect(() => {
    if (oralSubjects.some((subject) => subject.id === selectedMapelId)) return;
    setSelectedMapelId(oralSubjects[0]?.id ?? null);
  }, [oralSubjects, selectedMapelId]);

  const eligibleParticipants = useMemo(() => {
    const subject = oralSubjects.find((item) => item.id === selectedMapelId);
    if (!subject) return [];
    return participants.filter((allocation) =>
      matchesMataPelajaranLevel(
        subject.tingkat,
        allocation.santri?.kelas?.jenjang ?? null
      )
    );
  }, [oralSubjects, participants, selectedMapelId]);
  const selectedSubject = oralSubjects.find(
    (subject) => subject.id === selectedMapelId
  ) ?? null;
  const participantsPerPage = 10;
  const participantPageCount = Math.max(
    1,
    Math.ceil(participants.length / participantsPerPage)
  );
  const pageParticipants = participants.slice(
    (participantPage - 1) * participantsPerPage,
    participantPage * participantsPerPage
  );

  useEffect(() => {
    if (participantPage > participantPageCount) {
      setParticipantPage(participantPageCount);
    }
  }, [participantPage, participantPageCount]);
  const eligibleSantriIds = useMemo(
    () => new Set(eligibleParticipants.map((allocation) => allocation.santri_id)),
    [eligibleParticipants]
  );

  const savedScoreByKey = useMemo(
    () =>
      new Map(
        savedOralScores.map((score) => [
          `${score.santri_id}:${score.mapel_id}`,
          score.nilai_lisan,
        ])
      ),
    [savedOralScores]
  );
  const selectedScoreBySantri = useMemo(() => {
    if (selectedMapelId === null) return new Map<string, number | null>();
    return new Map(
      participants.map((allocation) => [
        allocation.santri_id,
        savedScoreByKey.get(`${allocation.santri_id}:${selectedMapelId}`) ?? null,
      ])
    );
  }, [participants, savedScoreByKey, selectedMapelId]);
  useEffect(() => {
    if (semesterId === null || participants.length === 0) {
      setSavedOralScores([]);
      setScoresLoading(false);
      return;
    }

    let mounted = true;
    setScoresLoading(true);
    setErrorMessage(null);
    const santriIds = participants.map((allocation) => allocation.santri_id);

    penilaianRaporService
      .getNilaiLisanBySantriIdsAndSemester(semesterId, santriIds)
      .then((scoreRows) => {
        if (!mounted) return;
        setSavedOralScores(scoreRows);
      })
      .catch((error: unknown) => {
        console.error("Gagal memuat nilai lisan:", error);
        if (mounted) {
          setSavedOralScores([]);
          setErrorMessage("Nilai lisan untuk mata pelajaran ini tidak dapat dimuat.");
        }
      })
      .finally(() => {
        if (mounted) setScoresLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [participants, scoreReloadKey, semesterId]);

  const getScoreInputValue = (santriId: string): string =>
    scoreDrafts[santriId] ??
    (selectedScoreBySantri.get(santriId) == null
      ? ""
      : String(selectedScoreBySantri.get(santriId)));

  const completedCount = eligibleParticipants.filter(
    (allocation) => getScoreInputValue(allocation.santri_id).trim() !== ""
  ).length;

  const handleSaveScores = async (event: FormEvent) => {
    event.preventDefault();
    if (semesterId === null || selectedMapelId === null) return;

    const rows: {
      santri_id: string;
      mapel_id: number;
      semester_id: number;
      nilai_lisan: number;
    }[] = [];

    for (const allocation of eligibleParticipants) {
      const rawValue = getScoreInputValue(allocation.santri_id).trim();
      if (!rawValue) continue;

      const nilaiLisan = Number(rawValue);
      if (!Number.isFinite(nilaiLisan) || nilaiLisan < 0 || nilaiLisan > 100) {
        setErrorMessage("Nilai lisan harus berupa angka antara 0 dan 100.");
        return;
      }

      rows.push({
        santri_id: allocation.santri_id,
        mapel_id: selectedMapelId,
        semester_id: semesterId,
        nilai_lisan: nilaiLisan,
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
      await penilaianRaporService.upsertNilaiLisan(rows);
      if (scoreDraftStorageKey) {
        try {
          window.localStorage.removeItem(scoreDraftStorageKey);
        } catch {
          // Data server sudah tersimpan; kegagalan menghapus salinan lokal tidak membatalkan simpan.
        }
      }
      setScoreDrafts({});
      setNotice(`${rows.length} nilai lisan berhasil disimpan.`);
      setScoreReloadKey((key) => key + 1);
    } catch (error) {
      console.error("Gagal menyimpan nilai lisan:", error);
      setErrorMessage(
        `${getDatabaseErrorMessage(error, "Nilai lisan gagal disimpan:")} Draft tetap tersimpan di perangkat ini.`
      );
    } finally {
      setSaving(false);
    }
  };

  const handleAllocateSantri = async (event: FormEvent) => {
    event.preventDefault();
    if (selectedRoomId === null || selectedSantriIds.length === 0) {
      setErrorMessage("Pilih minimal satu santri untuk ditambahkan ke ruangan.");
      return;
    }

    setAllocationSaving(true);
    setErrorMessage(null);
    setNotice(null);
    try {
      await guruPenugasanService.alokasiSantriKeRuangan(
        selectedRoomId,
        selectedSantriIds
      );
      setNotice(`${selectedSantriIds.length} santri berhasil ditambahkan ke ruangan.`);
      setSelectedSantriIds([]);
      setSantriSearch("");
      setParticipantsReloadKey((key) => key + 1);
    } catch (error) {
      console.error("Gagal menambahkan alokasi santri dari halaman PJ:", error);
      setErrorMessage(
        getDatabaseErrorMessage(error, "Alokasi gagal disimpan:")
      );
    } finally {
      setAllocationSaving(false);
    }
  };

  const handleRemoveSantri = async (allocation: AlokasiSantriDetail) => {
    const santriName = allocation.santri?.nama_latin ?? "santri ini";
    if (!window.confirm(`Keluarkan ${santriName} dari ruangan ${selectedRoom?.nama_ruangan ?? ""}?`)) {
      return;
    }

    setAllocationSaving(true);
    setErrorMessage(null);
    setNotice(null);
    try {
      await guruPenugasanService.removeSantriFromRuangan(allocation.id);
      setNotice(`${santriName} berhasil dikeluarkan dari ruangan.`);
      setParticipantsReloadKey((key) => key + 1);
    } catch (error) {
      console.error("Gagal menghapus alokasi santri dari halaman PJ:", error);
      setErrorMessage(
        getDatabaseErrorMessage(error, "Alokasi gagal dihapus:")
      );
    } finally {
      setAllocationSaving(false);
    }
  };

  return (
    <DashboardLayout role="pj_syafahi" title="Input Syafahi">
      <section className="page">
        <header className="syafahi-header">
          <div>
            <p className="syafahi-eyebrow">UJIAN LISAN · SYAFAHI</p>
            <h2>Input Nilai Syafahi</h2>
            <p>Selamat datang, <strong>{name}</strong>. Nilai hanya tersedia untuk ruangan yang ditugaskan kepada Anda.</p>
          </div>
          <div className="syafahi-header-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setRoomsReloadKey((key) => key + 1);
                setClasses([]);
                setClassSantri([]);
                setSelectedClassId(null);
              }}
              disabled={loading}
            >
              Sinkronkan Data
            </button>
            <span className="syafahi-semester-badge">{semesterLabel}</span>
          </div>
        </header>

        {errorMessage && <p className="syafahi-feedback error" role="alert">{errorMessage}</p>}
        {notice && <p className="syafahi-feedback success" role="status">{notice}</p>}

        {loading ? (
          <div className="card">Memuat penugasan ruangan...</div>
        ) : rooms.length === 0 ? (
          <div className="card syafahi-empty">
            {semesterId === null
              ? "Belum ada semester aktif."
              : "Belum ada ruangan syafahi yang ditugaskan ke akun Anda."}
          </div>
        ) : (
          <>
            <div className="card-grid">
              <label className="card syafahi-select-card">
                <span>Ruangan ujian</span>
                <select
                  value={selectedRoomId ?? ""}
                  onChange={(event) => {
                    setSelectedRoomId(
                      event.target.value ? Number(event.target.value) : null
                    );
                    setParticipantPage(1);
                    setSelectedMapelId(null);
                    setSelectedSantriIds([]);
                    setSantriSearch("");
                    setSelectedClassId(null);
                    setClassSantri([]);
                    setNotice(null);
                  }}
                >
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.nama_ruangan}
                    </option>
                  ))}
                </select>
              </label>
              <label className="card syafahi-select-card">
                <span>Mata pelajaran lisan</span>
                <select
                  value={selectedMapelId ?? ""}
                  onChange={(event) => {
                    setSelectedMapelId(
                      event.target.value ? Number(event.target.value) : null
                    );
                  }}
                  disabled={oralSubjects.length === 0}
                >
                  {oralSubjects.length === 0 && (
                    <option value="">Tidak ada mata pelajaran lisan aktif untuk jenjang peserta</option>
                  )}
                  {oralSubjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.nama_arab
                        ? `${subject.kode} · ${subject.nama_latin} · ${subject.nama_arab}`
                        : `${subject.kode} · ${subject.nama_latin}`}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <section className="card syafahi-score-card">
              <div className="syafahi-score-heading">
                <div>
                  <p className="syafahi-eyebrow">DAFTAR PESERTA</p>
                  <h3>{selectedRoom?.nama_ruangan ?? "Ruangan Syafahi"}</h3>
                  <p className="syafahi-room-pj">
                    PJ: {selectedRoom?.pj_guru?.nama_lengkap ?? name}
                  </p>
                </div>
                <div className="syafahi-progress-pill">
                  {completedCount} / {eligibleParticipants.length} nilai terisi
                </div>
              </div>

              {participantsLoading ? (
                <p className="syafahi-empty">Memuat peserta ruangan...</p>
              ) : participants.length === 0 ? (
                <p className="syafahi-empty">
                  Belum ada santri yang dialokasikan ke ruangan ini.
                </p>
              ) : (
                <form onSubmit={handleSaveScores}>
                  {oralSubjects.length === 0 && (
                    <p className="syafahi-empty">
                      Tidak ada mata pelajaran lisan aktif yang cocok dengan jenjang peserta. Daftar peserta dan nilai tersimpan tetap ditampilkan.
                    </p>
                  )}
                  <div className="syafahi-table-wrap">
                    <table className="syafahi-score-table">
                      <thead>
                        <tr>
                          <th>No.</th>
                          <th>No. Peserta</th>
                          <th>Nama Santri</th>
                          <th>Kelas</th>
                          <th>Nilai Lisan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pageParticipants.map((allocation, index) => (
                          <tr key={allocation.santri_id}>
                            <td>{(participantPage - 1) * participantsPerPage + index + 1}</td>
                            <td>{allocation.santri?.no_peserta ?? "-"}</td>
                            <td>
                              <strong>{allocation.santri?.nama_latin ?? "Santri"}</strong>
                              {allocation.santri?.nama_arab && (
                                <span className="syafahi-arabic-name">
                                  {allocation.santri.nama_arab}
                                </span>
                              )}
                            </td>
                            <td>{allocation.santri?.kelas?.nama_kelas ?? "-"}</td>
                            <td>
                              {!selectedSubject ? (
                                <span>Pilih mapel</span>
                              ) : !eligibleSantriIds.has(allocation.santri_id) ? (
                                <span>Di luar jenjang mapel</span>
                              ) : (
                                <input
                                  aria-label={`Nilai lisan ${allocation.santri?.nama_latin ?? "santri"}`}
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.01"
                                  value={getScoreInputValue(allocation.santri_id)}
                                  onWheel={(event) => {
                                    event.currentTarget.blur();
                                  }}
                                  onChange={(event) => {
                                    const value = event.target.value;
                                    const nextDrafts = {
                                      ...scoreDrafts,
                                      [allocation.santri_id]: value,
                                    };
                                    setScoreDrafts(nextDrafts);
                                    if (scoreDraftStorageKey) {
                                      try {
                                        window.localStorage.setItem(
                                          scoreDraftStorageKey,
                                          JSON.stringify(nextDrafts)
                                        );
                                      } catch {
                                        setErrorMessage(
                                          "Draft tidak dapat disimpan di perangkat. Periksa ruang penyimpanan browser."
                                        );
                                      }
                                    }
                                    setNotice(null);
                                  }}
                                  disabled={scoresLoading || saving}
                                />
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {participantPageCount > 1 && (
                    <nav className="syafahi-pagination" aria-label="Halaman daftar peserta">
                      <span>
                        {((participantPage - 1) * participantsPerPage) + 1}–
                        {Math.min(participantPage * participantsPerPage, participants.length)}
                        {" dari "}{participants.length} santri
                      </span>
                      <div>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => setParticipantPage((page) => Math.max(1, page - 1))}
                          disabled={participantPage === 1}
                          aria-label="Halaman sebelumnya"
                        >
                          Sebelumnya
                        </button>
                        <strong>Halaman {participantPage} / {participantPageCount}</strong>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => setParticipantPage((page) => Math.min(participantPageCount, page + 1))}
                          disabled={participantPage === participantPageCount}
                          aria-label="Halaman berikutnya"
                        >
                          Berikutnya
                        </button>
                      </div>
                    </nav>
                  )}
                  <div className="syafahi-save-row">
                    <span>
                      Rentang nilai 0–100. Isian kosong tidak akan mengubah nilai tersimpan.
                      {Object.keys(scoreDrafts).length > 0 && (
                        <strong className="syafahi-local-draft-status">
                          Draft otomatis tersimpan di perangkat ({Object.keys(scoreDrafts).length} nilai).
                        </strong>
                      )}
                    </span>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={
                        saving ||
                        scoresLoading ||
                        selectedMapelId === null ||
                        completedCount === 0
                      }
                    >
                      {saving ? "Menyimpan..." : "Simpan Nilai Lisan"}
                    </button>
                  </div>
                </form>
              )}
            </section>

            <section className="card syafahi-management-card">
              <div className="syafahi-management-heading">
                <div>
                  <h3>Kelola Peserta Ruangan</h3>
                  <p>
                    {participants.length} santri dialokasikan ke{" "}
                    {selectedRoom?.nama_ruangan ?? "ruangan ini"}.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setManageParticipants((open) => !open);
                    setErrorMessage(null);
                  }}
                >
                  {manageParticipants ? "Tutup Pengelolaan" : "Kelola Santri"}
                </button>
              </div>

              {manageParticipants && (
                <>
                  <p className="panitia-allocation-caption">
                    {selectedRoom?.nama_ruangan ?? "Ruangan Syafahi"}
                    {selectedRoom?.pj_guru?.nama_lengkap
                      ? ` · PJ: ${selectedRoom.pj_guru.nama_lengkap}`
                      : ""}
                  </p>

                  <div className="panitia-allocation-list">
                    {participants.length ? (
                      participants.map((allocation) => (
                        <div key={allocation.id} className="panitia-allocation-row">
                          <div>
                            <strong>{allocation.santri?.nama_latin ?? "Santri"}</strong>
                            <span>
                              {allocation.santri?.no_peserta ?? "-"} ·{" "}
                              {allocation.santri?.kelas?.nama_kelas ?? "-"}
                            </span>
                          </div>
                          <button
                            type="button"
                            className="panitia-remove-button"
                            onClick={() => handleRemoveSantri(allocation)}
                            disabled={allocationSaving}
                          >
                            Keluarkan
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="panitia-candidate-empty">
                        Belum ada santri di ruangan ini. Tambahkan peserta di bawah.
                      </p>
                    )}
                  </div>

                  <form onSubmit={handleAllocateSantri} className="panitia-allocation-form">
                    <label className="panitia-print-field">
                      <span>Pilih kelas</span>
                      <select
                        value={selectedClassId ?? ""}
                        onChange={(event) => {
                          setSelectedClassId(
                            event.target.value ? Number(event.target.value) : null
                          );
                          setSantriSearch("");
                          setSelectedSantriIds([]);
                        }}
                        disabled={classLoading}
                      >
                        <option value="">
                          {classLoading
                            ? "Memuat kelas..."
                            : classes.length === 0
                              ? "Belum ada kelas"
                              : "Pilih kelas"}
                        </option>
                        {classes.map((kelas) => (
                          <option key={kelas.id} value={kelas.id}>
                            {kelas.nama_kelas}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="panitia-print-field">
                      <span>Cari santri aktif</span>
                      <input
                        type="search"
                        value={santriSearch}
                        onChange={(event) => setSantriSearch(event.target.value)}
                        placeholder="Nama, nomor peserta, atau NIS"
                        autoComplete="off"
                      />
                    </label>
                    <div className="panitia-candidate-field">
                      <div className="panitia-candidate-heading">
                        <span>Tambah santri aktif</span>
                        <span className="panitia-candidate-count">
                          {selectedSantriIds.length} dipilih
                        </span>
                      </div>
                      <p className="panitia-candidate-summary">
                        {candidateLoading
                          ? "Memuat daftar santri..."
                          : selectedClassId === null
                            ? "Pilih kelas terlebih dahulu untuk menampilkan santri."
                            : `${filteredAvailableSantri.length} santri tersedia · ${
                                classes.find((kelas) => kelas.id === selectedClassId)
                                  ?.nama_kelas ?? "kelas terpilih"
                              }`}
                      </p>
                      <div
                        className="panitia-candidate-list"
                        role="group"
                        aria-label="Pilih santri aktif"
                      >
                        {filteredAvailableSantri.map((santri) => (
                          <label
                            key={santri.id}
                            className={`panitia-candidate-option${
                              selectedSantriIds.includes(santri.id) ? " selected" : ""
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedSantriIds.includes(santri.id)}
                              onChange={(event) => {
                                const checked = event.currentTarget.checked;
                                setSelectedSantriIds((current) =>
                                  checked
                                    ? [...current, santri.id]
                                    : current.filter((id) => id !== santri.id)
                                );
                              }}
                            />
                            <span className="panitia-candidate-name">
                              <strong>{santri.nama_latin}</strong>
                              <small>
                                {santri.no_peserta}
                                {santri.nis ? ` · NIS ${santri.nis}` : ""}
                              </small>
                            </span>
                            <span className="panitia-candidate-class">
                              {santri.kelas?.nama_kelas ?? "Belum ada kelas"}
                            </span>
                          </label>
                        ))}
                        {!candidateLoading && filteredAvailableSantri.length === 0 && (
                          <p className="panitia-candidate-empty" role="status">
                            {selectedClassId === null
                              ? "Pilih kelas terlebih dahulu."
                              : availableSantri.length === 0
                                ? "Semua santri aktif di kelas ini sudah dialokasikan ke ruangan ini."
                                : "Tidak ada santri aktif yang cocok dengan pencarian."}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={
                        allocationSaving ||
                        candidateLoading ||
                        selectedSantriIds.length === 0
                      }
                    >
                      {allocationSaving ? "Menyimpan..." : "Simpan Alokasi"}
                    </button>
                  </form>
                </>
              )}
            </section>
          </>
        )}
      </section>
    </DashboardLayout>
  );
}
