import { describe, expect, it } from "vitest";
import { getHomePathForRoles, hasRole, normalizeRole } from "../src/lib/roles";

describe("role access", () => {
  it("normalizes legacy role names before checking access", () => {
    expect(normalizeRole(" Guru Mapel Tahriri ")).toBe("guru_mapel");
    expect(hasRole(["admin_pondok"], "admin")).toBe(true);
    expect(hasRole(["wali"], "wali_kelas")).toBe(true);
  });

  it("routes users to their role workspace and unknown users to access denied", () => {
    expect(getHomePathForRoles(["pimpinan"])).toBe("/mudir");
    expect(getHomePathForRoles(["admin", "guru_mapel"])).toBe("/admin");
    expect(getHomePathForRoles([])).toBe("/unauthorized");
  });
});
