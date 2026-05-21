// Map menu paths to permission keys
// Used by DashboardLayout to filter menu items for team members
// AND by backend route guards to enforce access control
export const PATH_PERMISSION_MAP: Record<string, string> = {
  "/": "dashboard",
  "/transaksi": "transaksi",
  "/stok": "stok",
  "/riwayat-stok": "stok",
  "/gudang": "gudang",
  "/pos": "pos",
  "/client": "client",
  "/hutang-piutang": "hutang",
  "/anggaran": "anggaran",
  "/analitik": "analitik",
  "/laporan": "laporan",
  "/laporan-penjualan": "laporan",
  "/laporan-pembelian": "laporan",
  "/laporan-index": "laporan",
  "/laporan-gl": "laporan",
  "/laba-rugi-detail": "laporan",
  "/laporan-shift": "laporan",
  "/penjualan-produk": "laporan",
  "/penjualan-pelanggan": "laporan",
  "/penjualan-jam": "laporan",
  "/penjualan-tanggal": "laporan",
  "/penjualan-kredit": "laporan",
  "/ringkasan-pembayaran": "laporan",
  "/ringkasan-diskon": "laporan",
  "/top-produk": "laporan",
  "/void-refund": "laporan",
  "/komisi": "laporan",
  "/transaksi-tunai": "laporan",
  "/pajak": "pajak",
  "/pengaturan": "pengaturan",
  "/invoice-settings": "pengaturan",
  "/admin": "team",
  "/staff": "team",
  "/jurnal": "dashboard",
  "/purchase-order": "stok",
  "/barcode": "stok",
  "/mutasi-persediaan": "stok",
  "/valuasi-fifo": "stok",
  "/stok-kedaluwarsa": "stok",
  "/usia-stok": "stok",
  "/peringatan-stok": "stok",
  "/rekening-koran": "transaksi",
  "/manajemen-rekening": "pengaturan",
  "/marketing": "analitik",
  "/loyalty": "client",
  "/jurnal-adjustment": "transaksi",
  "/select-warehouse": "gudang",
};

export const ROLE_PERMISSIONS: Record<string, Record<string, boolean>> = {
  owner: { dashboard: true, transaksi: true, stok: true, gudang: true, pos: true, client: true, hutang: true, anggaran: true, analitik: true, laporan: true, pajak: true, pengaturan: true, team: true },
  admin: { dashboard: true, transaksi: true, stok: true, gudang: true, pos: true, client: true, hutang: true, anggaran: true, analitik: true, laporan: true, pajak: true, pengaturan: true, team: true },
  manager: { dashboard: true, transaksi: true, stok: true, gudang: true, pos: true, client: true, hutang: true, anggaran: true, analitik: true, laporan: true, pajak: false, pengaturan: false, team: false },
  finance: { dashboard: true, transaksi: true, stok: false, gudang: false, pos: false, client: false, hutang: true, anggaran: true, analitik: false, laporan: true, pajak: true, pengaturan: false, team: false },
  kasir: { dashboard: false, transaksi: true, stok: false, gudang: false, pos: true, client: false, hutang: false, anggaran: false, analitik: false, laporan: false, pajak: false, pengaturan: false, team: false },
  gudang: { dashboard: false, transaksi: false, stok: true, gudang: true, pos: false, client: false, hutang: false, anggaran: false, analitik: false, laporan: false, pajak: false, pengaturan: false, team: false },
  viewer: { dashboard: true, transaksi: false, stok: false, gudang: false, pos: false, client: false, hutang: false, anggaran: false, analitik: true, laporan: true, pajak: false, pengaturan: false, team: false },
};

export const PERMISSION_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  transaksi: "Transaksi",
  stok: "Stok Produk",
  gudang: "Gudang",
  pos: "Kasir (POS)",
  client: "Manajemen Client",
  hutang: "Hutang & Piutang",
  anggaran: "Anggaran",
  analitik: "Analitik Penjualan",
  laporan: "Laporan Keuangan",
  pajak: "Pajak",
  pengaturan: "Pengaturan",
  team: "Kelola Tim",
};

/**
 * Get the default landing path for a role.
 * Used to redirect team members after login/accept-invite.
 */
export function getDefaultPathForRole(role: string): string {
  switch (role) {
    case "kasir": return "/pos";
    case "gudang": return "/stok";
    case "finance": return "/transaksi";
    case "viewer": return "/analitik";
    default: return "/";
  }
}

/**
 * Check if a path is allowed for given permissions.
 */
export function isPathAllowed(path: string, permissions: Record<string, boolean> | null | undefined): boolean {
  if (!permissions) return true; // owner or no permissions = allow all
  const permKey = PATH_PERMISSION_MAP[path];
  if (!permKey) return true; // unmapped paths are allowed
  return permissions[permKey] === true;
}
