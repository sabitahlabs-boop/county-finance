// ─── Indonesian Transaction Categories ───
export const PEMASUKAN_CATEGORIES = [
  "Penjualan Produk",
  "Penjualan Jasa",
  "Pendapatan Lain-lain",
] as const;

export const PENGELUARAN_CATEGORIES = [
  "Pembelian Stok",
  "Operasional",
  "Gaji",
  "Utilitas",
  "Sewa",
  "Transportasi",
  "Pengeluaran Lain-lain",
] as const;

export const PAYMENT_METHODS = [
  "Tunai",
  "Transfer Bank",
  "QRIS",
  "E-Wallet",
] as const;

export const BUSINESS_TYPES = [
  { value: "retail", label: "Retail / Toko" },
  { value: "jasa", label: "Jasa / Service" },
  { value: "fnb", label: "Food & Beverage" },
  { value: "produksi", label: "Produksi / Manufaktur" },
] as const;

export const PRODUCT_UNITS = [
  "pcs", "kg", "liter", "box", "pack", "lusin", "rim", "meter", "set",
] as const;

export const PLAN_LIMITS = {
  free: { maxTransactions: 10, maxProducts: 5, canExport: false, aiScanStruk: true, aiInsights: true },
  pro: { maxTransactions: Infinity, maxProducts: Infinity, canExport: true, aiScanStruk: true, aiInsights: true },
} as const;

export const PRO_PRICE = 299000; // Rp 299.000 one-time payment (lifetime)

export type PlanType = "free" | "pro";

// ─── Tax Calculation Results ───
export interface TaxCalcResult {
  taxCode: string;
  taxName: string;
  applicable: boolean;
  rate: number;
  basis: number;
  amount: number;
  dueDate: string;
  reason: string;
  referenceLaw: string;
}

export interface DashboardKPIs {
  omzetBulanIni: number;
  totalPengeluaran: number;
  labaBersih: number;
  estimasiPajak: number;
  omzetLastMonth: number;
  pengeluaranLastMonth: number;
  labaLastMonth: number;
  txCountThisMonth: number;
  lowStockCount: number;
}

export interface LabaRugiReport {
  period: string;
  pendapatan: {
    penjualan: number;
    jasa: number;
    lainLain: number;
    total: number;
  };
  pengeluaran: {
    hpp: number;
    operasional: number;
    gaji: number;
    utilitas: number;
    sewa: number;
    transportasi: number;
    lainLain: number;
    total: number;
  };
  labaKotor: number;
  labaBersih: number;
  marginPct: number;
  taxEstimate: number;
}

export interface ArusKasReport {
  period: string;
  kasMasuk: Record<string, number> & { total: number };
  kasKeluar: Record<string, number> & { total: number };
  netKas: number;
}

// ─── Helper: Format Rupiah ───
export function formatRupiah(amount: number): string {
  if (amount === 0) return "Rp 0";
  const isNeg = amount < 0;
  const abs = Math.abs(Math.round(amount));
  const formatted = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${isNeg ? "-" : ""}Rp ${formatted}`;
}

// ─── Helper: Parse Indonesian number ───
export function smartParseNumber(str: string): number {
  if (!str) return 0;
  const cleaned = str.replace(/[Rr][Pp]\s*/g, "").replace(/\s/g, "").replace(/\./g, "").replace(/,/g, "");
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? 0 : num;
}

// ─── Indonesian month names ───
export const BULAN_INDONESIA = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
] as const;

export const HARI_INDONESIA = [
  "Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu",
] as const;

export function formatTanggalIndonesia(date: Date): string {
  const hari = HARI_INDONESIA[date.getDay()];
  const tgl = date.getDate();
  const bulan = BULAN_INDONESIA[date.getMonth()];
  const tahun = date.getFullYear();
  return `${hari}, ${tgl} ${bulan} ${tahun}`;
}
