import { useEffect, useState } from "react";
import { useAuth } from "../../lib/auth";
import { guruPenugasanService } from "../../services/guruPenugasanService";
import type { GuruProfile, Role, UserRole } from "../../types/guru-penugasan";

const PAGE_SIZE = 5;

export default function AdminAkunPanel() {
  const { auth } = useAuth();
  const [profiles, setProfiles] = useState<GuruProfile[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [roleOnlyIds, setRoleOnlyIds] = useState<string[]>([]);
  const [drafts, setDrafts] = useState<Record<string, number[]>>({});
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    Promise.all([
      guruPenugasanService.getGuruProfilesPage({ page, limit: PAGE_SIZE }),
      guruPenugasanService.getAllRoles(),
      guruPenugasanService.getAllUserRoles(),
      guruPenugasanService.getAllGuruIds(),
    ]).then(([profilePage, roleData, userRoleData, guruIds]) => {
      if (!mounted) return;
      const totalPages = Math.max(1, Math.ceil(profilePage.count / PAGE_SIZE));
      if (page > totalPages) {
        setPage(totalPages);
        return;
      }
      setProfiles(profilePage.data);
      setCount(profilePage.count);
      setRoles(roleData);
      setUserRoles(userRoleData);
      const guruIdSet = new Set(guruIds);
      const roleOnly = [...new Set(userRoleData.map((userRole) => userRole.user_id))]
        .filter((userId) => !guruIdSet.has(userId));
      setRoleOnlyIds(roleOnly);
      const byUser: Record<string, number[]> = {};
      const accountIds = [...profilePage.data.map((profile) => profile.id), ...roleOnly];
      for (const userId of accountIds) {
        byUser[userId] = userRoleData
          .filter((userRole) => userRole.user_id === userId)
          .map((userRole) => userRole.role_id);
      }
      setDrafts(byUser);
    }).catch((error: unknown) => {
      console.error("Gagal memuat akun dan role:", error);
      if (mounted) setErrorMessage("Profil atau role pengguna tidak dapat dimuat.");
    }).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [page, reloadKey]);

  const toggleRole = (userId: string, roleId: number) => {
    setDrafts((current) => {
      const assigned = current[userId] ?? [];
      return {
        ...current,
        [userId]: assigned.includes(roleId)
          ? assigned.filter((id) => id !== roleId)
          : [...assigned, roleId],
      };
    });
  };

  const saveRoles = async (userId: string, displayName: string) => {
    const currentIds = new Set(
      userRoles.filter((userRole) => userRole.user_id === userId).map((userRole) => userRole.role_id)
    );
    const nextIds = new Set(drafts[userId] ?? []);
    const toAdd = [...nextIds].filter((id) => !currentIds.has(id));
    const toRemove = [...currentIds].filter((id) => !nextIds.has(id));
    const adminRole = roles.find((role) => role.nama_role.toLowerCase() === "admin");
    const isRemovingOwnAdminRole = userId === auth?.user.id
      && adminRole != null
      && toRemove.includes(adminRole.id);
    const currentAdminIds = new Set(
      userRoles
        .filter((userRole) => userRole.role_id === adminRole?.id)
        .map((userRole) => userRole.user_id)
    );
    const isRemovingLastAdmin = adminRole != null
      && currentAdminIds.size <= 1
      && currentIds.has(adminRole.id)
      && !nextIds.has(adminRole.id);
    if (isRemovingOwnAdminRole || isRemovingLastAdmin) {
      setErrorMessage(isRemovingOwnAdminRole
        ? "Role admin akun yang sedang digunakan tidak dapat dihapus dari sini."
        : "Role admin terakhir tidak dapat dihapus.");
      return;
    }

    setSavingId(userId);
    setErrorMessage(null);
    setNotice(null);
    try {
      await Promise.all([
        ...toAdd.map((roleId) => guruPenugasanService.assignRole(userId, roleId)),
        ...toRemove.map((roleId) => guruPenugasanService.removeRole(userId, roleId)),
      ]);
      setNotice(`Role untuk ${displayName} berhasil diperbarui.`);
      setReloadKey((key) => key + 1);
    } catch (error) {
      console.error("Gagal memperbarui role pengguna:", error);
      setErrorMessage("Role gagal diperbarui. Periksa izin akses dan coba kembali.");
      setReloadKey((key) => key + 1);
    } finally {
      setSavingId(null);
    }
  };

  const renderAccountRow = (userId: string, profile?: GuruProfile) => {
    const displayName = profile?.nama_lengkap ?? "Akun tanpa profil guru";
    return (
      <tr key={userId}>
        <td><strong>{displayName}</strong><small className="admin-subtext">{userId}</small></td>
        <td>{profile?.nip ?? "-"}</td>
        <td>
          <div className="admin-role-options">
            {roles.map((role) => (
              <label key={role.id} className="admin-checkbox">
                <input
                  type="checkbox"
                  checked={(drafts[userId] ?? []).includes(role.id)}
                  onChange={() => toggleRole(userId, role.id)}
                  disabled={loading || savingId === userId}
                />
                <span>{role.nama_role}</span>
              </label>
            ))}
          </div>
        </td>
        <td><button type="button" className="btn-primary btn-sm" onClick={() => saveRoles(userId, displayName)} disabled={savingId === userId || loading}>{savingId === userId ? "Menyimpan..." : "Simpan Role"}</button></td>
      </tr>
    );
  };

  return (
    <section className="admin-panel">
      <div className="admin-panel-heading">
        <div>
          <h3>Akun Pengguna dan Role</h3>
          <p>Kelola profil guru dan akun yang sudah memiliki role. Daftar ditampilkan {PAGE_SIZE} baris per halaman agar ringan diakses.</p>
        </div>
      </div>
      {errorMessage && <p className="admin-feedback error" role="alert">{errorMessage}</p>}
      {notice && <p className="admin-feedback success" role="status">{notice}</p>}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Nama</th><th>NIP</th><th>Role</th><th>Aksi</th></tr></thead>
          <tbody>
            {profiles.map((profile) => renderAccountRow(profile.id, profile))}
            {!loading && profiles.length === 0 && <tr><td colSpan={4}>Belum ada profil guru pada halaman ini.</td></tr>}
            {loading && <tr><td colSpan={4}>Memuat data...</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="admin-pagination">
        <span>Halaman {page} dari {Math.max(1, Math.ceil(count / PAGE_SIZE))} · {count} guru</span>
        <div>
          <button type="button" className="btn-secondary btn-sm" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1 || loading}>Sebelumnya</button>
          <button type="button" className="btn-secondary btn-sm" onClick={() => setPage((current) => current + 1)} disabled={loading || page >= Math.ceil(count / PAGE_SIZE)}>Berikutnya</button>
        </div>
      </div>
      {!loading && roleOnlyIds.length > 0 && (
        <>
          <h4 style={{ margin: "1.5rem 0 0.75rem" }}>Akun dengan role tanpa profil guru</h4>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Nama</th><th>NIP</th><th>Role</th><th>Aksi</th></tr></thead>
              <tbody>{roleOnlyIds.map((userId) => renderAccountRow(userId))}</tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
