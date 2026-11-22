import type { ReactNode } from "react";
import { roleConfig, type AppRole } from "../lib/roles";

export type NavigationIcon =
  | "home"
  | "users"
  | "book"
  | "chart"
  | "edit"
  | "calendar"
  | "shield"
  | "database";

export type NavigationItem = {
  id: string;
  label: string;
  mobileLabel: string;
  icon: NavigationIcon;
};

type RoleSidebarProps = {
  role: AppRole;
  displayName: string;
  onLogout: () => void;
  items?: NavigationItem[];
  activeItem?: string;
  onSelect?: (id: string) => void;
};

type SidebarProps = {
  activeItem?: string;
  onSelect?: (label: string) => void;
  onNavigate?: () => void;
};

export const defaultNavItems = [
  { label: "Beranda", href: "#" },
  { label: "Guru", href: "#" },
  { label: "Wali Kelas", href: "#" },
  { label: "Panitia", href: "#" },
  { label: "Mudir", href: "#" },
];

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function NavigationSymbol({ icon }: { icon: NavigationIcon }) {
  const paths: Record<NavigationIcon, ReactNode> = {
    home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9M9 20v-6h6v6" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" /></>,
    chart: <><path d="M4 19V5M4 19h16" /><rect x="7" y="11" width="3" height="6" rx="1" /><rect x="12" y="8" width="3" height="9" rx="1" /><rect x="17" y="6" width="3" height="11" rx="1" /></>,
    edit: <><path d="m16 4 4 4L9 19l-5 1 1-5L16 4Z" /><path d="m14 6 4 4" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
    shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>,
    database: <><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3" /></>,
  };
  return (
    <svg className="role-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[icon]}
    </svg>
  );
}

export function RoleSidebar({
  role,
  displayName,
  onLogout,
  items,
  activeItem,
  onSelect,
}: RoleSidebarProps) {
  const roleDetails = roleConfig[role];
  const navigationItems = items ?? [{
    id: role,
    label: roleDetails.title,
    mobileLabel: roleDetails.title,
    icon: "home" as const,
  }];
  const currentItem = activeItem ?? navigationItems[0]?.id;

  return (
    <div className="role-sidebar">
      <header className="role-sidebar-brand">
        <div className="role-brand-mark">
          <NavigationSymbol icon="book" />
        </div>
        <div className="role-brand-copy">
          <span className="role-brand-school">PESANTREN NURUL HUDA</span>
          <strong className="role-brand-title">e-Rapor Digital</strong>
          <span className="role-badge">{roleDetails.label}</span>
        </div>
      </header>

      <div className="role-sidebar-content">
        <p className="role-menu-caption">MENU UTAMA</p>
        <nav className="role-nav" aria-label="Menu utama">
          {navigationItems.map((item) => {
            const active = item.id === currentItem;
            return (
              <button
                type="button"
                key={item.id}
                className={`role-nav-item${active ? " active" : ""}`}
                aria-current={active ? "page" : undefined}
                onClick={() => onSelect?.(item.id)}
              >
                <NavigationSymbol icon={item.icon} />
                <span>{item.label}</span>
                {active && <span className="role-nav-chevron" aria-hidden="true">›</span>}
              </button>
            );
          })}
        </nav>
      </div>

      <button type="button" className="role-user-card" onClick={onLogout}>
        <span className="role-user-avatar">{getInitials(displayName)}</span>
        <span className="role-user-copy">
          <strong>{displayName}</strong>
          <small>Keluar dari akun</small>
        </span>
        <span className="role-user-chevron" aria-hidden="true">↪</span>
      </button>
    </div>
  );
}

export default function Sidebar({
  activeItem,
  onSelect,
  onNavigate,
}: SidebarProps) {
  return (
    <nav className="sidebar" aria-label="Navigasi utama">
      <div className="sidebar-brand">E-Rapor Pondok</div>
      <ul className="sidebar-nav">
        {defaultNavItems.map((item) => {
          const isActive = item.label === activeItem;
          return (
            <li key={item.label}>
              <a
                className={`sidebar-link ${isActive ? "active" : ""}`}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                onClick={(event) => {
                  event.preventDefault();
                  onSelect?.(item.label);
                  onNavigate?.();
                }}
              >
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
