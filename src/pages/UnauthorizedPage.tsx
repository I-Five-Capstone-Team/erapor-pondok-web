import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { getHomePathForRoles } from "../lib/roles";

export default function UnauthorizedPage() {
  const { auth, signOut } = useAuth();
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const home = auth ? getHomePathForRoles(auth.roles) : "/login";
  const handleSignOut = async () => {
    setSignOutError(null);
    try {
      await signOut();
    } catch (error: unknown) {
      console.error("Gagal keluar dari akun:", error);
      setSignOutError("Gagal keluar. Silakan coba kembali.");
    }
  };

  return (
    <main className="access-page">
      <section className="access-card">
        <p className="workspace-eyebrow">AKSES TERBATAS</p>
        <h1>Akses belum tersedia</h1>
        <p>
          Akun ini belum memiliki role yang terdaftar untuk membuka halaman
          aplikasi. Hubungi Admin Pondok untuk memeriksa hak akses.
        </p>
        {signOutError && <p className="login-error" role="alert">{signOutError}</p>}
        <div className="access-actions">
          {auth && home !== "/unauthorized" && (
            <Link className="login-submit access-link" to={home}>
              Kembali ke halaman saya
            </Link>
          )}
          <button
            className="access-logout"
            type="button"
            onClick={handleSignOut}
          >
            Keluar
          </button>
        </div>
      </section>
    </main>
  );
}
