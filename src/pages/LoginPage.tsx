import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { getHomePathForRoles } from "../lib/roles";

export default function LoginPage() {
  const navigate = useNavigate();
  const { auth, error: authError, loading, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <main className="auth-loading" aria-live="polite">
        Memeriksa sesi akun...
      </main>
    );
  }

  if (auth) {
    return <Navigate to={getHomePathForRoles(auth.roles)} replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await signIn(email, password);
      if (result.error) {
        setError(result.error);
        return;
      }
      navigate("/", { replace: true });
    } catch (signInError) {
      console.error("Gagal masuk:", signInError);
      setError("Terjadi kesalahan saat masuk. Silakan coba kembali.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="login-page">
      <div className="login-shell">
        <section className="login-intro" aria-label="Informasi aplikasi">
          <div className="login-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
            </svg>
          </div>
          <p className="login-school">PONDOK PESANTREN NURUL HUDA</p>
          <h1>Sistem E-Rapor Pondok Terpadu</h1>
          <p className="login-intro-copy">
            Satu ruang kerja untuk pengelolaan rapor dengan akses yang
            disesuaikan untuk setiap pengguna.
          </p>
        </section>

        <section className="login-card" aria-labelledby="login-title">
          <div className="login-card-heading">
            <p className="login-eyebrow">AKSES PENGGUNA TERDAFTAR</p>
            <h2 id="login-title">Masuk ke e-Rapor</h2>
            <p>Gunakan email dan password akun yang diberikan Admin Pondok.</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <label className="login-field">
              <span>Email</span>
              <input
                type="email"
                name="email"
                autoComplete="username"
                placeholder="nama@contoh.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>

            <label className="login-field">
              <span>Password</span>
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                placeholder="Masukkan password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>

            {(error || authError) && (
              <p className="login-error" role="alert">
                {error ?? authError}
              </p>
            )}

            <button className="login-submit" type="submit" disabled={submitting}>
              {submitting ? "Memproses..." : "Masuk"}
              {!submitting && <span aria-hidden="true">→</span>}
            </button>

            <div className="login-divider" aria-hidden="true">
              <span />
              <small>TANPA LOGIN</small>
              <span />
            </div>
            <button
              className="login-verify"
              type="button"
              onClick={() => navigate("/verify")}
            >
              <span aria-hidden="true">✓</span>
              Verifikasi Rapor Publik
              <span className="login-verify-arrow" aria-hidden="true">→</span>
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
