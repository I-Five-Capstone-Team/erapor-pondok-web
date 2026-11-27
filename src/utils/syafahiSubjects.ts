import type { MataPelajaran } from "../types/master-data";

export function matchesMataPelajaranLevel(
  tingkat: string | null,
  jenjang: string | null
): boolean {
  const subjectLevel = tingkat?.trim();
  if (!subjectLevel) return false;
  if (subjectLevel.toLocaleLowerCase("id") === "semua jenjang") return true;
  return Boolean(
    jenjang &&
      subjectLevel.toLocaleUpperCase("id") === jenjang.trim().toLocaleUpperCase("id")
  );
}

export function filterMataPelajaranByJenjang(
  subjects: MataPelajaran[],
  jenjangs: (string | null)[]
): MataPelajaran[] {
  const availableLevels = new Set(
    jenjangs
      .filter((jenjang): jenjang is string => Boolean(jenjang?.trim()))
      .map((jenjang) => jenjang.trim().toLocaleUpperCase("id"))
  );

  return subjects.filter((subject) => {
    const level = subject.tingkat?.trim();
    return (
      Boolean(level) &&
      (level?.toLocaleLowerCase("id") === "semua jenjang" ||
        availableLevels.has(level?.toLocaleUpperCase("id") ?? ""))
    );
  });
}
