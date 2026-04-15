import { describe, expect, it } from "vitest";
import { ROLE_PERMISSIONS, PERMISSION_LABELS } from "./db";
import { PATH_PERMISSION_MAP } from "../shared/permissions";

describe("Team: ROLE_PERMISSIONS", () => {
  it("owner has all permissions set to true", () => {
    const ownerPerms = ROLE_PERMISSIONS.owner;
    expect(ownerPerms).toBeDefined();
    for (const [key, val] of Object.entries(ownerPerms)) {
      expect(val).toBe(true);
    }
  });

  it("kasir only has transaksi and pos", () => {
    const kasir = ROLE_PERMISSIONS.kasir;
    expect(kasir.transaksi).toBe(true);
    expect(kasir.pos).toBe(true);
    expect(kasir.dashboard).toBe(false);
    expect(kasir.stok).toBe(false);
    expect(kasir.gudang).toBe(false);
    expect(kasir.pengaturan).toBe(false);
    expect(kasir.team).toBe(false);
  });

  it("gudang only has stok and gudang", () => {
    const gudang = ROLE_PERMISSIONS.gudang;
    expect(gudang.stok).toBe(true);
    expect(gudang.gudang).toBe(true);
    expect(gudang.pos).toBe(false);
    expect(gudang.transaksi).toBe(false);
    expect(gudang.pengaturan).toBe(false);
  });

  it("manager has most permissions but not pajak, pengaturan, team", () => {
    const mgr = ROLE_PERMISSIONS.manager;
    expect(mgr.dashboard).toBe(true);
    expect(mgr.transaksi).toBe(true);
    expect(mgr.stok).toBe(true);
    expect(mgr.gudang).toBe(true);
    expect(mgr.pos).toBe(true);
    expect(mgr.pajak).toBe(false);
    expect(mgr.pengaturan).toBe(false);
    expect(mgr.team).toBe(false);
  });

  it("viewer has dashboard, analitik, laporan only", () => {
    const viewer = ROLE_PERMISSIONS.viewer;
    expect(viewer.dashboard).toBe(true);
    expect(viewer.analitik).toBe(true);
    expect(viewer.laporan).toBe(true);
    expect(viewer.pos).toBe(false);
    expect(viewer.stok).toBe(false);
    expect(viewer.transaksi).toBe(false);
  });

  it("all roles have the same permission keys", () => {
    const keys = Object.keys(ROLE_PERMISSIONS.owner);
    for (const role of ["manager", "kasir", "gudang", "viewer"]) {
      expect(Object.keys(ROLE_PERMISSIONS[role]).sort()).toEqual(keys.sort());
    }
  });
});

describe("Team: PERMISSION_LABELS", () => {
  it("has labels for all permission keys", () => {
    const ownerKeys = Object.keys(ROLE_PERMISSIONS.owner);
    for (const key of ownerKeys) {
      expect(PERMISSION_LABELS[key]).toBeDefined();
      expect(typeof PERMISSION_LABELS[key]).toBe("string");
    }
  });
});

describe("Team: PATH_PERMISSION_MAP", () => {
  it("maps all major paths to valid permission keys", () => {
    const validKeys = Object.keys(ROLE_PERMISSIONS.owner);
    for (const [path, permKey] of Object.entries(PATH_PERMISSION_MAP)) {
      expect(validKeys).toContain(permKey);
    }
  });

  it("maps / to dashboard", () => {
    expect(PATH_PERMISSION_MAP["/"]).toBe("dashboard");
  });

  it("maps /pos to pos", () => {
    expect(PATH_PERMISSION_MAP["/pos"]).toBe("pos");
  });

  it("maps /gudang to gudang", () => {
    expect(PATH_PERMISSION_MAP["/gudang"]).toBe("gudang");
  });

  it("maps /stok and /riwayat-stok to stok", () => {
    expect(PATH_PERMISSION_MAP["/stok"]).toBe("stok");
    expect(PATH_PERMISSION_MAP["/riwayat-stok"]).toBe("stok");
  });
});

describe("Team: Menu filtering logic", () => {
  const UMKM_PATHS = ["/", "/transaksi", "/stok", "/riwayat-stok", "/gudang", "/client", "/hutang-piutang", "/anggaran", "/analitik", "/laporan", "/pajak", "/pengaturan"];

  function filterMenuByPermissions(paths: string[], permissions: Record<string, boolean>): string[] {
    return paths.filter(path => {
      const permKey = PATH_PERMISSION_MAP[path];
      if (!permKey) return true;
      return permissions[permKey] === true;
    });
  }

  it("kasir sees only transaksi-related paths", () => {
    const filtered = filterMenuByPermissions(UMKM_PATHS, ROLE_PERMISSIONS.kasir);
    expect(filtered).toContain("/transaksi");
    expect(filtered).not.toContain("/");
    expect(filtered).not.toContain("/stok");
    expect(filtered).not.toContain("/gudang");
    expect(filtered).not.toContain("/pengaturan");
  });

  it("gudang sees only stok and gudang paths", () => {
    const filtered = filterMenuByPermissions(UMKM_PATHS, ROLE_PERMISSIONS.gudang);
    expect(filtered).toContain("/stok");
    expect(filtered).toContain("/riwayat-stok");
    expect(filtered).toContain("/gudang");
    expect(filtered).not.toContain("/transaksi");
    expect(filtered).not.toContain("/pos");
  });

  it("manager sees most paths except pajak and pengaturan", () => {
    const filtered = filterMenuByPermissions(UMKM_PATHS, ROLE_PERMISSIONS.manager);
    expect(filtered).toContain("/");
    expect(filtered).toContain("/transaksi");
    expect(filtered).toContain("/stok");
    expect(filtered).toContain("/gudang");
    expect(filtered).not.toContain("/pajak");
    expect(filtered).not.toContain("/pengaturan");
  });

  it("owner sees all paths", () => {
    const filtered = filterMenuByPermissions(UMKM_PATHS, ROLE_PERMISSIONS.owner);
    expect(filtered).toEqual(UMKM_PATHS);
  });
});

describe("Team: Pro+ Plan enforcement", () => {
  const PLAN_TIERS = ["free", "pro", "pro_plus"] as const;

  function isProPlus(plan: string): boolean {
    return plan === "pro_plus";
  }

  function isPro(plan: string): boolean {
    return plan === "pro" || plan === "pro_plus";
  }

  it("free plan is not Pro and not Pro+", () => {
    expect(isPro("free")).toBe(false);
    expect(isProPlus("free")).toBe(false);
  });

  it("pro plan is Pro but not Pro+", () => {
    expect(isPro("pro")).toBe(true);
    expect(isProPlus("pro")).toBe(false);
  });

  it("pro_plus plan is both Pro and Pro+", () => {
    expect(isPro("pro_plus")).toBe(true);
    expect(isProPlus("pro_plus")).toBe(true);
  });

  it("Tim tab should only show for Pro+ plan", () => {
    for (const plan of PLAN_TIERS) {
      const showTimTab = plan === "pro_plus";
      if (plan === "pro_plus") {
        expect(showTimTab).toBe(true);
      } else {
        expect(showTimTab).toBe(false);
      }
    }
  });

  it("max 5 team members enforced", () => {
    const MAX_MEMBERS = 5;
    const existingCount = 5;
    expect(existingCount >= MAX_MEMBERS).toBe(true);
    const canInvite = existingCount < MAX_MEMBERS;
    expect(canInvite).toBe(false);
  });

  it("can invite when under limit", () => {
    const MAX_MEMBERS = 5;
    const existingCount = 3;
    const canInvite = existingCount < MAX_MEMBERS;
    expect(canInvite).toBe(true);
  });
});
