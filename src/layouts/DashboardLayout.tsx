import { ReactNode, useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar, { defaultNavItems } from "../components/Sidebar";
import MobileDrawer from "../components/MobileDrawer";

type DashboardLayoutProps = {
  title?: string;
  children: ReactNode;
};

export default function DashboardLayout({ title, children }: DashboardLayoutProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeItem, setActiveItem] = useState(defaultNavItems[0]?.label ?? "Beranda");
  const pageTitle = title ?? activeItem;

  return (
    <div className="app-shell">
      <Navbar title={pageTitle} onMenuClick={() => setDrawerOpen(true)} />
      <div className="app-body">
        <aside className="sidebar-desktop">
          <Sidebar activeItem={activeItem} onSelect={setActiveItem} />
        </aside>
        <main className="app-content">{children}</main>
      </div>
      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        activeItem={activeItem}
        onSelect={setActiveItem}
      />
    </div>
  );
}
