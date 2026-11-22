import { useEffect, useState } from "react";
import { useAuth } from "../../lib/auth";
import { guruPenugasanService } from "../../services/guruPenugasanService";
import type { GuruProfile, Role, UserRole } from "../../types/guru-penugasan";

export default function AdminAkunPanel() {
  const { auth } = useAuth();
  const [profiles, setProfiles] = useState<GuruProfile[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [drafts, setDrafts] = useState<Record<string, number[]>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    Promise.all([
      guruPenugasanService.getAllGuruProfiles(),
      guruPenugasanService.getAllRoles(),
      guruPenugasanService.getAllUserRoles(),
    ]).then(([profileData, roleData, userRoleData]) => {
      if (!mounted) return;
      setProfiles(profileData);
      setRoles(roleData);
      setUserRoles(userRoleData);
      const byUser: Record<string, number[]> = {};
      for (const profile of profileData) {
        byUser[profile.id] = userRoleData
          .filter((userRole) => userRole.user_id === profile.id)
          .map((userRole) => userRole.role_id);
      }
      setDrafts(byUser);
    }).catch((error: unknown) => {
      console.error("Gagal memuat akun dan role:", error);
      if (mounted) setErrorMessage("Profil atau role pengguna tidak dapat dimuat.");
    }).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [reloadKey]);

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

  const accountIds = [...new Set([
    ...profiles.map((profile) => profile.id),
    ...userRoles.map((userRole) => userRole.user_id),
  ])];

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

  return (
    <section className="admin-panel">
      <div className="admin-panel-heading">
        <div><h3>Akun Pengguna dan Role</h3><p>Kelola profil guru dan akun yang sudah memiliki role. Akun Auth tanpa profil atau baris role tidak dapat dilisting dari browser; pembuatan akun Auth juga tidak dilakukan dari sini.</p></div>
      </div>
      {errorMessage && <p className="admin-feedback error" role="alert">{errorMessage}</p>}
      {notice && <p className="admin-feedback success" role="status">{notice}</p>}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Nama</th><th>NIP</th><th>Role</th><th>Aksi</th></tr></thead>
          <tbody>
            {accountIds.map((userId) => {
              const profile = profiles.find((item) => item.id === userId);
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
                          disabled={savingId === userId}
                        />
                        <span>{role.nama_role}</span>
                      </label>
                    ))}
                  </div>
                </td>
                <td><button type="button" className="btn-primary btn-sm" onClick={() => saveRoles(userId, displayName)} disabled={savingId === userId || loading}>{savingId === userId ? "Menyimpan..." : "Simpan Role"}</button></td>
              </tr>
            );})}
            {!loading && accountIds.length === 0 && <tr><td colSpan={4}>Belum ada akun atau profil yang dapat dikelola.</td></tr>}
            {loading && <tr><td colSpan={4}>Memuat data...</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
