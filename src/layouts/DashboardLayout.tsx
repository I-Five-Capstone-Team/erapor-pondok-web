import { useState, type ReactNode } from "react";
import Navbar from "../components/Navbar";
import {
  NavigationSymbol,
  RoleSidebar,
  type NavigationItem,
} from "../components/Sidebar";
import { useAuth } from "../lib/auth";
import { roleConfig, type AppRole } from "../lib/roles";

type DashboardLayoutProps = {
  role: AppRole;
  title?: string;
  children: ReactNode;
  navigationItems?: NavigationItem[];
  activeNavigationId?: string;
  onNavigationChange?: (id: string) => void;
};

export default function DashboardLayout({
  role,
  title,
  children,
  navigationItems,
  activeNavigationId,
  onNavigationChange,
}: DashboardLayoutProps) {
  const { auth, signOut } = useAuth();
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const roleDetails = roleConfig[role];
  const items = navigationItems ?? [{
    id: role,
    label: roleDetails.title,
    mobileLabel: roleDetails.title,
    icon: "home" as const,
  }];
  const [internalActiveId, setInternalActiveId] = useState(items[0]?.id ?? "");
  const activeId = activeNavigationId ?? internalActiveId;
  const activeTitle = items.find((item) => item.id === activeId)?.label ?? items[0]?.label;
  const pageTitle = title ?? activeTitle ?? roleDetails.title;
  const displayName = auth?.profileName ?? "Pengguna";
  const selectNavigation = (id: string) => {
    setInternalActiveId(id);
    onNavigationChange?.(id);
  };
  const handleSignOut = async () => {
    if (!window.confirm("Yakin ingin logout dari e-Rapor Nurul Huda?")) return;
    setLogoutError(null);
    try {
      await signOut();
    } catch (error: unknown) {
      console.error("Gagal keluar dari akun:", error);
      setLogoutError("Gagal keluar. Silakan coba kembali.");
    }
  };

  return (
    <div className="role-app-shell">
      <aside className="role-sidebar-desktop">
        <RoleSidebar
          role={role}
          displayName={displayName}
          onLogout={handleSignOut}
          items={items}
          activeItem={activeId}
          onSelect={selectNavigation}
        />
      </aside>
      <div className="role-workspace">
        <Navbar title={pageTitle} onLogout={handleSignOut} />
        <main className="app-content">
          {logoutError && <p className="login-error" role="alert">{logoutError}</p>}
          {children}
        </main>
      </div>
      <nav className="role-bottom-nav" aria-label="Navigasi bawah">
        {items.map((item) => {
          const active = item.id === activeId;
          return (
            <button
              className={`role-bottom-item${active ? " active" : ""}`}
              type="button"
              key={item.id}
              aria-current={active ? "page" : undefined}
              onClick={() => selectNavigation(item.id)}
            >
              <NavigationSymbol icon={item.icon} />
              <span>{item.mobileLabel}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
