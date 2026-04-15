// Map menu paths to permission keys
// Used by DashboardLayout to filter menu items for team members
export const PATH_PERMISSION_MAP: Record<string, string> = {
  "/": "dashboard",
  "/transaksi": "transaksi",
  "/stok": "stok",
  "/riwayat-stok": "stok", // same as stok
  "/gudang": "gudang",
  "/pos": "pos",
  "/client": "client",
  "/hutang-piutang": "hutang",
  "/anggaran": "anggaran",
  "/analitik": "analitik",
  "/laporan": "laporan",
  "/pajak": "pajak",
  "/pengaturan": "pengaturan",
  "/admin": "team",
  "/jurnal": "dashboard", // personal mode
};

export const ROLE_PERMISSIONS: Record<string, Record<string, boolean>> = {
  owner: { dashboard: true, transaksi: true, stok: true, gudang: true, pos: true, client: true, hutang: true, anggaran: true, analitik: true, laporan: true, pajak: true, pengaturan: true, team: true },
  manager: { dashboard: true, transaksi: true, stok: true, gudang: true, pos: true, client: true, hutang: true, anggaran: true, analitik: true, laporan: true, pajak: false, pengaturan: false, team: false },
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
