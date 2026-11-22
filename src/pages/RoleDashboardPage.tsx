import DashboardLayout from "../layouts/DashboardLayout";
import { roleConfig, type AppRole } from "../lib/roles";
import { useAuth } from "../lib/auth";

export default function RoleDashboardPage({ role }: { role: AppRole }) {
  const { auth } = useAuth();
  const page = roleConfig[role];

  return (
    <DashboardLayout role={role} title={page.title}>
      <section className="workspace-page">
        <header className="workspace-heading">
          <div>
            <p className="workspace-eyebrow">{page.eyebrow}</p>
            <h2>Selamat datang, {auth?.profileName}</h2>
            <p>{page.description}</p>
          </div>
          <span className="workspace-role-badge">{page.label}</span>
        </header>

        <section className="workspace-card" aria-labelledby="workspace-focus-title">
          <div className="workspace-card-heading">
            <div className="workspace-card-icon" aria-hidden="true">✦</div>
            <div>
              <p className="workspace-eyebrow">RUANG KERJA ANDA</p>
              <h3 id="workspace-focus-title">Akses sesuai peran</h3>
            </div>
          </div>
          <ul className="workspace-focus-list">
            {page.focus.map((item) => (
              <li key={item}>
                <span aria-hidden="true">✓</span>
                {item}
              </li>
            ))}
          </ul>
          <p className="workspace-note">
            Halaman awal peran sudah tersedia. Fitur pengelolaan data akan
            dilanjutkan pada tahap berikutnya.
          </p>
        </section>
      </section>
    </DashboardLayout>
  );
}
