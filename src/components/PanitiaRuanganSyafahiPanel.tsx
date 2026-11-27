import { useEffect, useMemo, useState, type FormEvent } from "react";
import { hasRole } from "../lib/auth";
import { getDatabaseErrorMessage } from "../lib/databaseError";
import { guruPenugasanService } from "../services/guruPenugasanService";
import { masterDataService } from "../services/masterDataService";
import type {
  AlokasiSantriDetail,
  GuruProfile,
  RuanganSyafahiDetail,
} from "../types/guru-penugasan";
import type { KelasWithWali, SantriWithKelas } from "../types/master-data";

const classCollator = new Intl.Collator("id", {
  numeric: true,
  sensitivity: "base",
});

export default function PanitiaRuanganSyafahiPanel() {
  const [semesterId, setSemesterId] = useState<number | null>(null);
  const [rooms, setRooms] = useState<RuanganSyafahiDetail[]>([]);
  const [teachers, setTeachers] = useState<GuruProfile[]>([]);
  const [classes, setClasses] = useState<KelasWithWali[]>([]);
  const [classStudents, setClassStudents] = useState<SantriWithKelas[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [allocations, setAllocations] = useState<AlokasiSantriDetail[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [editingRoomId, setEditingRoomId] = useState<number | null>(null);
  const [roomName, setRoomName] = useState("");
  const [pjGuruId, setPjGuruId] = useState("");
  const [selectedSantriIds, setSelectedSantriIds] = useState<string[]>([]);
  const [santriSearch, setSantriSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [roomLoading, setRoomLoading] = useState(false);
  const [classLoading, setClassLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.id === selectedRoomId) ?? null,
    [rooms, selectedRoomId]
  );
  const allocatedSantriIds = useMemo(
    () => new Set(allocations.map((allocation) => allocation.santri_id)),
    [allocations]
  );
  const availableStudents = useMemo(
    () => classStudents.filter((student) => !allocatedSantriIds.has(student.id)),
    [allocatedSantriIds, classStudents]
  );
  const filteredAvailableStudents = useMemo(() => {
    const query = santriSearch.trim().toLocaleLowerCase("id");
    return availableStudents
      .filter((student) => {
        const searchableText =
          `${student.no_peserta} ${student.nis ?? ""} ${student.nama_latin}`
            .toLocaleLowerCase("id");
        return !query || searchableText.includes(query);
      })
      .sort(
        (a, b) =>
          classCollator.compare(a.nama_latin, b.nama_latin) ||
          classCollator.compare(a.no_peserta, b.no_peserta)
      );
  }, [availableStudents, santriSearch]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setErrorMessage(null);
    (async () => {
      const activeSemester = await masterDataService.getActiveSemester();
      const activeSemesterId = activeSemester ? Number(activeSemester.id) : null;
      if (activeSemesterId !== null && !Number.isFinite(activeSemesterId)) {
        throw new Error("ID semester aktif tidak valid.");
      }

      if (activeSemesterId === null) {
        if (!mounted) return;
        setSemesterId(null);
        setRooms([]);
        setTeachers([]);
        setClasses([]);
        setClassStudents([]);
        return;
      }

      const [roomData, teacherData, userRoleData, classData] = await Promise.all([
        guruPenugasanService.getRuanganSyafahi(activeSemesterId),
        guruPenugasanService.getAllGuruProfiles(),
        guruPenugasanService.getAllUserRoles(),
        masterDataService.getKelas(),
      ]);
      if (!mounted) return;
      setSemesterId(activeSemesterId);
      setRooms(roomData);
      const pjUserIds = new Set(
        userRoleData
          .filter((userRole) =>
            hasRole(
              userRole.roles?.nama_role ? [userRole.roles.nama_role] : [],
              "pj_syafahi"
            )
          )
          .map((userRole) => userRole.user_id)
      );
      setTeachers(
        teacherData.filter((teacher) => pjUserIds.has(teacher.id))
      );
      setClasses(classData);
      setSelectedRoomId((current) =>
        current !== null && roomData.some((room) => room.id === current)
          ? current
          : roomData[0]?.id ?? null
      );
    })()
      .catch((error: unknown) => {
        console.error("Gagal memuat data ruangan syafahi:", error);
        if (mounted) {
          setErrorMessage("Data ruangan, guru, atau santri tidak dapat dimuat.");
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
    const room = rooms.find((item) => item.id === selectedRoomId);
    setEditingRoomId(room?.id ?? null);
    setRoomName(room?.nama_ruangan ?? "");
    setPjGuruId(room?.pj_guru_id ?? "");
  }, [rooms, selectedRoomId]);

  useEffect(() => {
    if (selectedRoomId === null) {
      setAllocations([]);
      return;
    }

    let mounted = true;
    setRoomLoading(true);
    guruPenugasanService
      .getSantriByRuangan(selectedRoomId)
      .then((data) => {
        if (mounted) setAllocations(data);
      })
      .catch((error: unknown) => {
        console.error("Gagal memuat alokasi santri:", error);
        if (mounted) setErrorMessage("Daftar alokasi santri tidak dapat dimuat.");
      })
      .finally(() => {
        if (mounted) setRoomLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [selectedRoomId, reloadKey]);

  useEffect(() => {
    if (selectedClassId === null) {
      setClassStudents([]);
      setClassLoading(false);
      return;
    }

    let mounted = true;
    setClassLoading(true);
    masterDataService
      .getSantri({ onlyActive: true, kelasId: selectedClassId, limit: 1000 })
      .then((result) => {
        if (mounted) setClassStudents(result.data);
      })
      .catch((error: unknown) => {
        console.error("Gagal memuat santri per kelas:", error);
        if (mounted) {
          setClassStudents([]);
          setErrorMessage("Daftar santri kelas tidak dapat dimuat.");
        }
      })
      .finally(() => {
        if (mounted) setClassLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [selectedClassId, reloadKey]);

  const startNewRoom = () => {
    setEditingRoomId(null);
    setRoomName("");
    setPjGuruId("");
    setErrorMessage(null);
    setNotice(null);
  };

  const handleSaveRoom = async (event: FormEvent) => {
    event.preventDefault();
    if (semesterId === null || !roomName.trim()) {
      setErrorMessage("Isi nama ruangan terlebih dahulu.");
      return;
    }
    if (pjGuruId && !teachers.some((teacher) => teacher.id === pjGuruId)) {
      setErrorMessage("Penanggung jawab ruangan harus memiliki role PJ Syafahi.");
      return;
    }

    setBusy(true);
    setErrorMessage(null);
    setNotice(null);
    try {
      if (editingRoomId === null) {
        const created = await guruPenugasanService.createRuanganSyafahi({
          nama_ruangan: roomName.trim(),
          pj_guru_id: pjGuruId || null,
          semester_id: semesterId,
        });
        setSelectedRoomId(created.id);
        setNotice("Ruangan syafahi berhasil ditambahkan.");
      } else {
        await guruPenugasanService.updateRuanganSyafahi(editingRoomId, {
          nama_ruangan: roomName.trim(),
          pj_guru_id: pjGuruId || null,
          semester_id: semesterId,
        });
        setNotice("Data ruangan syafahi berhasil diperbarui.");
      }
      setReloadKey((key) => key + 1);
    } catch (error) {
      console.error("Gagal menyimpan ruangan syafahi:", error);
      setErrorMessage(
        getDatabaseErrorMessage(error, "Ruangan gagal disimpan:")
      );
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteRoom = async () => {
    if (!selectedRoom) return;
    if (!window.confirm(`Hapus ruangan ${selectedRoom.nama_ruangan}?`)) return;

    setBusy(true);
    setErrorMessage(null);
    setNotice(null);
    try {
      await guruPenugasanService.deleteRuanganSyafahi(selectedRoom.id);
      setSelectedRoomId(null);
      setNotice("Ruangan berhasil dihapus.");
      setReloadKey((key) => key + 1);
    } catch (error) {
      console.error("Gagal menghapus ruangan syafahi:", error);
      setErrorMessage(
        getDatabaseErrorMessage(
          error,
          "Ruangan gagal dihapus. Hapus semua alokasi santri di ruangan tersebut terlebih dahulu."
        )
      );
    } finally {
      setBusy(false);
    }
  };

  const handleAllocate = async (event: FormEvent) => {
    event.preventDefault();
    if (selectedRoomId === null || selectedSantriIds.length === 0) {
      setErrorMessage("Pilih minimal satu santri untuk dialokasikan.");
      return;
    }

    setBusy(true);
    setErrorMessage(null);
    setNotice(null);
    try {
      await guruPenugasanService.alokasiSantriKeRuangan(
        selectedRoomId,
        selectedSantriIds
      );
      setSelectedSantriIds([]);
      setSantriSearch("");
      setNotice("Alokasi santri berhasil disimpan.");
      setReloadKey((key) => key + 1);
    } catch (error) {
      console.error("Gagal menyimpan alokasi santri:", error);
      setErrorMessage(
        getDatabaseErrorMessage(error, "Alokasi gagal disimpan:")
      );
    } finally {
      setBusy(false);
    }
  };

  const handleRemoveAllocation = async (allocationId: number) => {
    setBusy(true);
    setErrorMessage(null);
    setNotice(null);
    try {
      await guruPenugasanService.removeSantriFromRuangan(allocationId);
      setNotice("Santri berhasil dikeluarkan dari ruangan.");
      setReloadKey((key) => key + 1);
    } catch (error) {
      console.error("Gagal menghapus alokasi santri:", error);
      setErrorMessage(
        getDatabaseErrorMessage(error, "Alokasi santri gagal dihapus:")
      );
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <section className="page">
        <h2>Pengelolaan Ruangan Syafahi</h2>
        <div className="card">Memuat semester aktif...</div>
      </section>
    );
  }

  if (semesterId === null) {
    return (
      <section className="page">
        <h2>Pengelolaan Ruangan Syafahi</h2>
        <div className="card">
          {errorMessage ?? "Aktifkan semester terlebih dahulu."}
          {errorMessage && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setReloadKey((key) => key + 1)}
            >
              Coba lagi
            </button>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="page panitia-ruangan-panel">
      <header className="panitia-panel-heading">
        <div>
          <h2>Pengelolaan Ruangan Syafahi</h2>
          <p>Kelola ruangan, penanggung jawab, dan alokasi santri untuk semester aktif.</p>
        </div>
        <button type="button" className="btn-secondary" onClick={startNewRoom}>
          Ruangan Baru
        </button>
      </header>

      {errorMessage && <p className="panitia-feedback error" role="alert">{errorMessage}</p>}
      {notice && <p className="panitia-feedback success" role="status">{notice}</p>}

      {loading ? (
        <div className="card">Memuat ruangan dan daftar santri...</div>
      ) : (
        <div className="panitia-ruangan-grid">
          <div className="card panitia-ruangan-form-card">
            <label className="panitia-print-field">
              <span>Pilih ruangan</span>
              <select
                value={selectedRoomId ?? ""}
                onChange={(event) =>
                  {
                    setSelectedRoomId(
                      event.target.value ? Number(event.target.value) : null
                    );
                    setSelectedSantriIds([]);
                    setSantriSearch("");
                    setSelectedClassId(null);
                    setClassStudents([]);
                  }
                }
              >
                {rooms.length === 0 && <option value="">Belum ada ruangan</option>}
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.nama_ruangan}
                  </option>
                ))}
              </select>
            </label>

            <form onSubmit={handleSaveRoom} className="panitia-room-form">
              <h3>{editingRoomId === null ? "Tambah Ruangan" : "Ubah Ruangan"}</h3>
              <label className="panitia-print-field">
                <span>Nama ruangan</span>
                <input
                  value={roomName}
                  onChange={(event) => setRoomName(event.target.value)}
                  required
                />
              </label>
              <label className="panitia-print-field">
                <span>Penanggung jawab</span>
                <select
                  value={pjGuruId}
                  onChange={(event) => setPjGuruId(event.target.value)}
                >
                  <option value="">Belum ditentukan</option>
                  {pjGuruId && !teachers.some((teacher) => teacher.id === pjGuruId) && (
                    <option value={pjGuruId} disabled>
                      Penanggung jawab saat ini bukan PJ Syafahi
                    </option>
                  )}
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.nama_lengkap}
                    </option>
                  ))}
                </select>
              </label>
              <div className="panitia-print-actions">
                <button type="submit" className="btn-primary" disabled={busy}>
                  {busy ? "Menyimpan..." : "Simpan Ruangan"}
                </button>
                {selectedRoom && editingRoomId !== null && (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleDeleteRoom}
                    disabled={busy}
                  >
                    Hapus Ruangan
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="card panitia-allocation-card">
            <div className="panitia-allocation-heading">
              <h3>Alokasi Santri</h3>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setReloadKey((key) => key + 1)}
                disabled={busy || roomLoading}
              >
                Muat Ulang Alokasi
              </button>
            </div>
            <label className="panitia-print-field">
              <span>Pilih ruangan untuk alokasi</span>
              <select
                value={selectedRoomId ?? ""}
                onChange={(event) => {
                  setSelectedRoomId(
                    event.target.value ? Number(event.target.value) : null
                  );
                  setSelectedSantriIds([]);
                  setSantriSearch("");
                  setSelectedClassId(null);
                  setClassStudents([]);
                }}
                disabled={rooms.length === 0}
              >
                {rooms.length === 0 ? (
                  <option value="">Belum ada ruangan</option>
                ) : (
                  rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.nama_ruangan}
                    </option>
                  ))
                )}
              </select>
            </label>
            {!selectedRoom ? (
              <p>Tambahkan atau pilih ruangan terlebih dahulu.</p>
            ) : (
              <>
                <p className="panitia-allocation-caption">
                  {selectedRoom.nama_ruangan}
                  {selectedRoom.pj_guru?.nama_lengkap
                    ? ` · PJ: ${selectedRoom.pj_guru.nama_lengkap}`
                    : ""}
                </p>
                {roomLoading ? (
                  <p>Memuat alokasi...</p>
                ) : (
                  <div className="panitia-allocation-list">
                    {allocations.length ? (
                      allocations.map((allocation) => (
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
                            onClick={() => handleRemoveAllocation(allocation.id)}
                            disabled={busy}
                          >
                            Hapus
                          </button>
                        </div>
                      ))
                    ) : (
                      <p>Belum ada santri yang dialokasikan.</p>
                    )}
                  </div>
                )}

                <form onSubmit={handleAllocate} className="panitia-allocation-form">
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
                      disabled={classLoading || classes.length === 0}
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
                      <span className="panitia-candidate-count">{selectedSantriIds.length} dipilih</span>
                    </div>
                    <p className="panitia-candidate-summary">
                      {classLoading
                        ? "Memuat daftar santri..."
                        : selectedClassId === null
                          ? "Pilih kelas terlebih dahulu untuk menampilkan santri."
                          : `${filteredAvailableStudents.length} santri tersedia · ${
                              classes.find((kelas) => kelas.id === selectedClassId)
                                ?.nama_kelas ?? "kelas terpilih"
                            }`}
                    </p>
                    <div className="panitia-candidate-list" role="group" aria-label="Pilih santri aktif">
                      {filteredAvailableStudents.map((student) => (
                        <label
                          key={student.id}
                          className={`panitia-candidate-option${selectedSantriIds.includes(student.id) ? " selected" : ""}`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedSantriIds.includes(student.id)}
                            onChange={(event) => {
                              const checked = event.currentTarget.checked;
                              setSelectedSantriIds((current) =>
                                checked
                                  ? [...current, student.id]
                                  : current.filter((id) => id !== student.id)
                              );
                            }}
                          />
                          <span className="panitia-candidate-name">
                            <strong>{student.nama_latin}</strong>
                            <small>
                              {student.no_peserta}
                              {student.nis ? ` · NIS ${student.nis}` : ""}
                            </small>
                          </span>
                          <span className="panitia-candidate-class">
                            {student.kelas?.nama_kelas ?? "Belum ada kelas"}
                          </span>
                        </label>
                      ))}
                      {!classLoading && filteredAvailableStudents.length === 0 && (
                        <p className="panitia-candidate-empty" role="status">
                          {selectedClassId === null
                            ? "Pilih kelas terlebih dahulu."
                            : availableStudents.length === 0
                              ? "Semua santri aktif di kelas ini sudah dialokasikan ke ruangan ini."
                              : "Tidak ada santri aktif yang cocok dengan pencarian."}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={busy || selectedSantriIds.length === 0}
                  >
                    Simpan Alokasi
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
