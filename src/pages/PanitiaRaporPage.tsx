import { useState } from "react";
import type { NavigationItem } from "../components/Sidebar";
import PanitiaCetakRaporPanel from "../components/PanitiaCetakRaporPanel";
import PanitiaMonitoringPanel from "../components/PanitiaMonitoringPanel";
import PanitiaRuanganSyafahiPanel from "../components/PanitiaRuanganSyafahiPanel";
import DashboardLayout from "../layouts/DashboardLayout";

type PanitiaView = "pantau" | "rapor" | "ruangan";

const navigationItems: NavigationItem[] = [
  {
    id: "pantau",
    label: "Monitoring Nilai",
    mobileLabel: "Pantau",
    icon: "chart",
  },
  { id: "rapor", label: "Cetak Rapor", mobileLabel: "Rapor", icon: "book" },
  {
    id: "ruangan",
    label: "Ruangan Syafahi",
    mobileLabel: "Ruangan",
    icon: "users",
  },
];

export default function PanitiaRaporPage() {
  const [activeView, setActiveView] = useState<PanitiaView>("pantau");
  const title =
    navigationItems.find((item) => item.id === activeView)?.label ??
    "Panitia Rapor";

  return (
    <DashboardLayout
      role="panitia_rapor"
      title={title}
      navigationItems={navigationItems}
      activeNavigationId={activeView}
      onNavigationChange={(id) => {
        if (id === "pantau" || id === "rapor" || id === "ruangan") {
          setActiveView(id);
        }
      }}
    >
      <div className="panitia-content">
        {activeView === "pantau" ? (
          <PanitiaMonitoringPanel />
        ) : activeView === "rapor" ? (
          <PanitiaCetakRaporPanel />
        ) : (
          <PanitiaRuanganSyafahiPanel />
        )}
      </div>
    </DashboardLayout>
  );
}
