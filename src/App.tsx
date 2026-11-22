import type { ReactElement } from "react";
import { useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./lib/auth";
import { getHomePathForRoles, hasRole, type AppRole } from "./lib/roles";
import AdminPage from "./pages/AdminPage";
import LoginPage from "./pages/LoginPage";
import PublicVerifyPage from "./pages/PublicVerifyPage";
import RoleDashboardPage from "./pages/RoleDashboardPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";

function LoadingPage() {
  return (
    <main className="auth-loading" aria-live="polite">
      Memuat sesi pengguna...
    </main>
  );
}

function AuthErrorPage({ message }: { message: string }) {
  const { signOut } = useAuth();
  const [signOutError, setSignOutError] = useState<string | null>(null);

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
        <p className="workspace-eyebrow">SESI PENGGUNA</p>
        <h1>Peran akun tidak dapat dimuat</h1>
        <p role="alert">{message}</p>
        {signOutError && <p className="login-error" role="alert">{signOutError}</p>}
        <button className="access-logout" type="button" onClick={handleSignOut}>
          Keluar
        </button>
      </section>
    </main>
  );
}

function RootRedirect() {
  const { auth, hasSession, error, loading } = useAuth();
  if (loading) return <LoadingPage />;
  if (error) {
    return hasSession ? (
      <AuthErrorPage message={error} />
    ) : (
      <Navigate to="/login" replace />
    );
  }
  if (!auth) return <Navigate to="/login" replace />;
  return <Navigate to={getHomePathForRoles(auth.roles)} replace />;
}

function RequireAuth({ children }: { children: ReactElement }) {
  const { auth, hasSession, error, loading } = useAuth();
  if (loading) return <LoadingPage />;
  if (error) {
    return hasSession ? (
      <AuthErrorPage message={error} />
    ) : (
      <Navigate to="/login" replace />
    );
  }
  if (!auth) return <Navigate to="/login" replace />;
  return children;
}

function RequireRole({
  role,
  children,
}: {
  role: AppRole;
  children: ReactElement;
}) {
  const { auth } = useAuth();
  if (!auth) return <Navigate to="/login" replace />;
  if (!hasRole(auth.roles, role)) return <Navigate to="/unauthorized" replace />;
  return children;
}

const roleRoutes: { role: AppRole; path: string }[] = [
  { role: "admin", path: "/admin" },
  { role: "panitia_rapor", path: "/panitia-rapor" },
  { role: "guru_mapel", path: "/guru/tahriri" },
  { role: "pj_syafahi", path: "/pj-syafahi" },
  { role: "wali_kelas", path: "/wali-kelas" },
  { role: "mudir", path: "/mudir" },
];

function RolePage({ role }: { role: AppRole }) {
  return role === "admin" ? <AdminPage /> : <RoleDashboardPage role={role} />;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/verify" element={<PublicVerifyPage />} />
      <Route path="/verify/:hash" element={<PublicVerifyPage />} />
      <Route
        path="/unauthorized"
        element={
          <RequireAuth>
            <UnauthorizedPage />
          </RequireAuth>
        }
      />
      <Route path="/" element={<RootRedirect />} />
      {roleRoutes.map(({ role, path }) => (
        <Route
          key={role}
          path={path}
          element={
            <RequireAuth>
              <RequireRole role={role}>
                <RolePage role={role} />
              </RequireRole>
            </RequireAuth>
          }
        />
      ))}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
