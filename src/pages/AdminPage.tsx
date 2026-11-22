import { useState } from "react";
import AdminAkunPanel from "../components/admin/AdminAkunPanel";
import AdminBackupPanel from "../components/admin/AdminBackupPanel";
import AdminKelasPanel from "../components/admin/AdminKelasPanel";
import AdminMapelPanel from "../components/admin/AdminMapelPanel";
import AdminPenugasanPanel from "../components/admin/AdminPenugasanPanel";
import AdminSantriPanel from "../components/admin/AdminSantriPanel";
import AdminSemesterPanel from "../components/admin/AdminSemesterPanel";
import type { NavigationItem } from "../components/Sidebar";
import DashboardLayout from "../layouts/DashboardLayout";
import { useAuth } from "../lib/auth";

type AdminTab =
  | "santri"
  | "kelas"
  | "mapel"
  | "penugasan"
  | "akun"
  | "semester"
  | "backup";

const navigationItems: NavigationItem[] = [
  { id: "santri", label: "Data Santri", mobileLabel: "Santri", icon: "users" },
  { id: "kelas", label: "Kelas", mobileLabel: "Kelas", icon: "home" },
  { id: "mapel", label: "Mata Pelajaran", mobileLabel: "Mapel", icon: "book" },
  { id: "penugasan", label: "Penugasan Guru", mobileLabel: "Tugas", icon: "edit" },
  { id: "akun", label: "Akun & Role", mobileLabel: "Akun", icon: "shield" },
  { id: "semester", label: "Tahun Ajaran", mobileLabel: "Tahun", icon: "calendar" },
  { id: "backup", label: "Backup", mobileLabel: "Backup", icon: "database" },
];

function isAdminTab(id: string): id is AdminTab {
  return navigationItems.some((item) => item.id === id);
}

export default function AdminPage() {
  const { auth } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>("santri");
  const name = auth?.profileName || auth?.user.email || "Admin";
  const activeTitle =
    navigationItems.find((item) => item.id === activeTab)?.label ?? "Admin";

  return (
    <DashboardLayout
      role="admin"
      title={activeTitle}
      navigationItems={navigationItems}
      activeNavigationId={activeTab}
      onNavigationChange={(id) => {
        if (isAdminTab(id)) setActiveTab(id);
      }}
    >
      <section className="page admin-page">
        <header className="admin-page-heading">
          <div>
            <p className="admin-eyebrow">PENGELOLAAN SISTEM</p>
            <h2>Dashboard Admin</h2>
            <p>Selamat datang, <strong>{name}</strong>.</p>
          </div>
        </header>

        <div>
          {activeTab === "santri" && <AdminSantriPanel />}
          {activeTab === "kelas" && <AdminKelasPanel />}
          {activeTab === "mapel" && <AdminMapelPanel />}
          {activeTab === "penugasan" && <AdminPenugasanPanel />}
          {activeTab === "akun" && <AdminAkunPanel />}
          {activeTab === "semester" && <AdminSemesterPanel />}
          {activeTab === "backup" && <AdminBackupPanel />}
        </div>
      </section>
    </DashboardLayout>
  );
}
