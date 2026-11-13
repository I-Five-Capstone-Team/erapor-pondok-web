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

export default function Sidebar({ activeItem, onSelect, onNavigate }: SidebarProps) {
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
                onClick={(e) => {
                  e.preventDefault();
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
