export const roleConfig = {
  admin: {
    path: "/admin",
    label: "ADMIN PONDOK",
    title: "Dashboard Admin",
    eyebrow: "PENGELOLAAN SISTEM",
    description:
      "Ruang kerja untuk pengelolaan data utama dan hak akses sistem.",
    focus: ["Data santri dan kelas", "Mata pelajaran dan semester", "Akun dan hak akses"],
  },
  panitia_rapor: {
    path: "/panitia-rapor",
    label: "PANITIA RAPOR",
    title: "Monitoring Nilai",
    eyebrow: "PENGELOLAAN RAPOR",
    description:
      "Ruang kerja panitia untuk memantau proses nilai dan persiapan rapor.",
    focus: ["Monitoring pengumpulan nilai", "Cetak rapor", "Pengelolaan ruangan Syafahi"],
  },
  guru_mapel: {
    path: "/guru/tahriri",
    label: "GURU MATA PELAJARAN",
    title: "Nilai Tahriri",
    eyebrow: "UJIAN TULIS · TAHRIRI",
    description:
      "Ruang kerja guru untuk mengelola nilai Tahriri sesuai penugasan.",
    focus: ["Kelas dan mata pelajaran yang ditugaskan", "Input nilai Tahriri"],
  },
  pj_syafahi: {
    path: "/pj-syafahi",
    label: "PJ RUANGAN SYAFAHI",
    title: "Nilai Syafahi",
    eyebrow: "UJIAN LISAN · SYAFAHI",
    description:
      "Ruang kerja penanggung jawab untuk mengelola nilai ujian Syafahi.",
    focus: ["Penugasan ruangan Syafahi", "Input nilai Syafahi"],
  },
  wali_kelas: {
    path: "/wali-kelas",
    label: "WALI KELAS",
    title: "Presensi & Karakter",
    eyebrow: "PENDAMPINGAN SANTRI",
    description:
      "Ruang kerja wali kelas untuk melengkapi data pendamping rapor.",
    focus: ["Presensi santri", "Catatan karakter", "Kelengkapan rapor kelas"],
  },
  mudir: {
    path: "/mudir",
    label: "MUDIR IDAROH",
    title: "Executive Dashboard",
    eyebrow: "PENGESAHAN RAPOR",
    description:
      "Ruang kerja pimpinan untuk meninjau ringkasan dan pengesahan rapor.",
    focus: ["Ringkasan capaian rapor", "Peninjauan dan pengesahan"],
  },
} as const;

export type AppRole = keyof typeof roleConfig;

const roleAliases: Record<string, AppRole> = {
  admin_pondok: "admin",
  administrator: "admin",
  panitian_rapor: "panitia_rapor",
  guru: "guru_mapel",
  guru_mapel_tahriri: "guru_mapel",
  pj_ruangan_syafahi: "pj_syafahi",
  syafahi: "pj_syafahi",
  wali: "wali_kelas",
  walikelas: "wali_kelas",
  pimpinan: "mudir",
  mudir_idaroh: "mudir",
};

export function normalizeRole(role: string): string {
  const normalized = role.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return roleAliases[normalized] ?? normalized;
}

export function hasRole(roles: string[], role: string): boolean {
  const expectedRole = normalizeRole(role);
  return roles.some((assignedRole) => normalizeRole(assignedRole) === expectedRole);
}

export function getHomePathForRoles(roles: string[]): string {
  const priority: AppRole[] = [
    "admin",
    "panitia_rapor",
    "guru_mapel",
    "pj_syafahi",
    "wali_kelas",
    "mudir",
  ];
  const homeRole = priority.find((role) => hasRole(roles, role));
  return homeRole ? roleConfig[homeRole].path : "/unauthorized";
}
