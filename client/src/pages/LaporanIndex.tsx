import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  FileText,
  Receipt,
  Package,
  CreditCard,
  TrendingUp,
  Scale,
  Wallet,
  BookOpen,
  BarChart3,
  ArrowRightLeft,
  Calculator,
  ClipboardList,
  Users,
  Clock,
  CalendarDays,
  Banknote,
  Tag,
  RotateCcw,
  Star,
  Coins,
  AlertTriangle,
  Factory,
} from "lucide-react";

interface ReportEntry {
  name: string;
  description: string;
  path: string;
  icon: typeof FileText;
  category: string;
  keywords: string[]; // Extra keywords for search
}

const REPORTS: ReportEntry[] = [
  // ── Laporan Keuangan ──
  {
    name: "Laporan Laba Rugi",
    description: "Pendapatan, pengeluaran, laba kotor & bersih per bulan",
    path: "/laporan",
    icon: FileText,
    category: "Laporan Keuangan",
    keywords: ["income", "expense", "profit", "loss", "rugi", "pendapatan", "pengeluaran"],
  },
  {
    name: "Neraca",
    description: "Posisi aset, kewajiban, dan ekuitas pada akhir periode",
    path: "/laporan",
    icon: Scale,
    category: "Laporan Keuangan",
    keywords: ["balance sheet", "aset", "hutang", "modal", "ekuitas"],
  },
  {
    name: "Arus Kas",
    description: "Aliran kas masuk dan keluar selama periode tertentu",
    path: "/laporan",
    icon: TrendingUp,
    category: "Laporan Keuangan",
    keywords: ["cash flow", "kas masuk", "kas keluar"],
  },
  {
    name: "Perubahan Modal",
    description: "Perubahan modal dari awal hingga akhir periode",
    path: "/laporan",
    icon: Wallet,
    category: "Laporan Keuangan",
    keywords: ["modal awal", "modal akhir", "prive", "capital"],
  },
  {
    name: "Catatan atas Laporan Keuangan (CALK)",
    description: "Informasi tambahan dan penjelasan atas laporan keuangan",
    path: "/laporan",
    icon: BookOpen,
    category: "Laporan Keuangan",
    keywords: ["calk", "catatan", "notes", "penjelasan"],
  },
  {
    name: "Laba Rugi Detail",
    description: "Laporan P&L terperinci dengan pendapatan, HPP, dan pengeluaran operasional",
    path: "/laba-rugi-detail",
    icon: BarChart3,
    category: "Laporan Keuangan",
    keywords: ["laba", "rugi", "profit", "loss", "detail", "pnl"],
  },

  {
    name: "Laporan GL (Jurnal Umum)",
    description: "Trial Balance, Laba Rugi, Neraca, dan Buku Besar berbasis General Ledger — standar SAK EMKM",
    path: "/laporan-gl",
    icon: BarChart3,
    category: "Laporan Keuangan",
    keywords: ["gl", "general ledger", "jurnal umum", "trial balance", "neraca saldo", "buku besar", "double entry"],
  },

  // ── Laporan Penjualan ──
  {
    name: "Laporan Penjualan Harian/Periode",
    description: "Detail transaksi POS per hari atau rentang tanggal, termasuk per jam dan per produk",
    path: "/laporan-penjualan",
    icon: Receipt,
    category: "Laporan Penjualan",
    keywords: ["sales", "struk", "receipt", "harian", "pos", "kasir", "daily"],
  },
  {
    name: "Penjualan per Produk/SKU",
    description: "Breakdown penjualan per produk: qty terjual, total penjualan, HPP, dan laba",
    path: "/penjualan-produk",
    icon: Package,
    category: "Laporan Penjualan",
    keywords: ["product sales", "sku", "barcode", "hpp", "margin", "profit"],
  },
  {
    name: "Top Produk & Kategori",
    description: "Ranking produk dan kategori terlaris berdasarkan total penjualan",
    path: "/top-produk",
    icon: TrendingUp,
    category: "Laporan Penjualan",
    keywords: ["ranking", "top", "terlaris", "best seller", "populer"],
  },
  {
    name: "Ringkasan Metode Pembayaran",
    description: "Total pembayaran per metode: Tunai, Transfer, QRIS, dll",
    path: "/ringkasan-pembayaran",
    icon: CreditCard,
    category: "Laporan Penjualan",
    keywords: ["payment", "tunai", "transfer", "qris", "cash", "debit", "credit"],
  },

  // ── Wave 2: Sales Deep Dive ──
  {
    name: "Penjualan per Pelanggan",
    description: "Siapa yang beli paling banyak — total belanja per pelanggan",
    path: "/penjualan-pelanggan",
    icon: Users,
    category: "Laporan Penjualan",
    keywords: ["customer", "pelanggan", "pembeli", "vip", "wholesale"],
  },
  {
    name: "Penjualan per Jam",
    description: "Peak hours analysis — jam berapa penjualan paling ramai",
    path: "/penjualan-jam",
    icon: Clock,
    category: "Laporan Penjualan",
    keywords: ["hourly", "jam", "peak", "ramai", "sibuk"],
  },
  {
    name: "Penjualan per Tanggal",
    description: "Daily breakdown — total penjualan per hari dalam rentang periode",
    path: "/penjualan-tanggal",
    icon: CalendarDays,
    category: "Laporan Penjualan",
    keywords: ["daily", "harian", "tanggal", "hari"],
  },
  {
    name: "Penjualan Kredit & Pelunasan",
    description: "Beli sekarang bayar nanti — tracking kredit dan cicilan pelanggan",
    path: "/penjualan-kredit",
    icon: Banknote,
    category: "Laporan Penjualan",
    keywords: ["credit", "kredit", "cicilan", "piutang", "pelunasan", "hutang"],
  },
  {
    name: "Ringkasan Diskon",
    description: "Detail penggunaan diskon: kode, nama, jumlah, dan total potongan",
    path: "/ringkasan-diskon",
    icon: Tag,
    category: "Laporan Penjualan",
    keywords: ["discount", "diskon", "promo", "potongan", "kode diskon"],
  },
  {
    name: "Void & Refund Analysis",
    description: "Rincian pembatalan dan pengembalian per tanggal dan pelanggan",
    path: "/void-refund",
    icon: RotateCcw,
    category: "Laporan Penjualan",
    keywords: ["void", "refund", "batal", "retur", "pengembalian"],
  },
  {
    name: "Laporan Shift",
    description: "Analitik per shift: penjualan, refund, durasi, kas awal/akhir, dan selisih kas",
    path: "/laporan-shift",
    icon: Clock,
    category: "Laporan Penjualan",
    keywords: ["shift", "kasir", "kas", "penjualan shift", "durasi", "selisih kas"],
  },
  {
    name: "Transaksi Tunai (Kas Reconciliation)",
    description: "Rekonsiliasi kas: pendapatan tunai, void, pengeluaran, kembalian, saldo bersih",
    path: "/transaksi-tunai",
    icon: Wallet,
    category: "Laporan Penjualan",
    keywords: ["cash", "tunai", "kas", "reconciliation", "saldo", "kembalian"],
  },
  {
    name: "Komisi Staff",
    description: "Tracking komisi penjualan setiap kasir/staff per transaksi POS",
    path: "/komisi",
    icon: Coins,
    category: "Laporan Penjualan",
    keywords: ["komisi", "commission", "staff", "kasir", "penjualan", "earnings"],
  },

  // ── Laporan Operasional ──
  {
    name: "Rekening Koran",
    description: "Laporan mutasi bank (debit/kredit) dengan saldo berjalan per rekening",
    path: "/rekening-koran",
    icon: ArrowRightLeft,
    category: "Laporan Operasional",
    keywords: ["bank statement", "debit", "kredit", "saldo", "mutasi bank", "running balance"],
  },
  {
    name: "Mutasi Persediaan",
    description: "Tracking pergerakan stok: barang masuk, keluar, harga, dan sisa stok",
    path: "/mutasi-persediaan",
    icon: ClipboardList,
    category: "Laporan Operasional",
    keywords: ["inventory", "stock", "stok", "barang masuk", "barang keluar", "persediaan"],
  },
  {
    name: "Riwayat Stok",
    description: "Log detail perubahan stok per produk dan alasannya",
    path: "/riwayat-stok",
    icon: Package,
    category: "Laporan Operasional",
    keywords: ["stock log", "history", "riwayat", "perubahan stok"],
  },

  // ── Analitik & Lainnya ──
  {
    name: "Sales Analytics",
    description: "Dashboard analitik penjualan dengan grafik tren dan perbandingan",
    path: "/analitik",
    icon: BarChart3,
    category: "Analitik",
    keywords: ["analytics", "chart", "grafik", "tren", "trend", "statistik"],
  },
  {
    name: "Pajak",
    description: "Estimasi pajak bulanan dan pengaturan tarif pajak UMKM",
    path: "/pajak",
    icon: Calculator,
    category: "Analitik",
    keywords: ["tax", "pph", "ppn", "umkm", "tarif"],
  },

  // ── Laporan Inventori ──
  {
    name: "Valuasi FIFO",
    description: "Valuasi persediaan dengan metode FIFO per batch pembelian",
    path: "/valuasi-fifo",
    icon: Package,
    category: "Laporan Inventori",
    keywords: ["fifo", "valuasi", "hpp", "persediaan", "batch", "cost"],
  },
  {
    name: "Stok Kedaluwarsa",
    description: "Monitoring produk dengan tanggal kadaluarsa yang mendekat atau sudah expired",
    path: "/stok-kedaluwarsa",
    icon: AlertTriangle,
    category: "Laporan Inventori",
    keywords: ["expiry", "kadaluarsa", "expired", "expire date", "barang rusak"],
  },
  {
    name: "Usia Stok",
    description: "Analisis umur stok untuk identifikasi slow-moving dan dead stock",
    path: "/usia-stok",
    icon: CalendarDays,
    category: "Laporan Inventori",
    keywords: ["stock aging", "slow moving", "dead stock", "age", "umur stok"],
  },
  {
    name: "Peringatan Stok Rendah",
    description: "Dashboard peringatan stok dengan rekomendasi pemesanan otomatis",
    path: "/peringatan-stok",
    icon: AlertTriangle,
    category: "Laporan Inventori",
    keywords: ["low stock", "reorder point", "safety stock", "purchase order", "po"],
  },

  // ── Program Loyalitas ──
  {
    name: "Program Loyalitas",
    description: "Kelola poin loyalitas, tier member, dan konfigurasi reward",
    path: "/loyalty",
    icon: Star,
    category: "Program Loyalitas",
    keywords: ["loyalty", "poin", "reward", "tier", "member", "bronze", "silver", "gold", "platinum"],
  },

  // ── Manajemen Produksi ──
  {
    name: "Manajemen Produksi",
    description: "Logging produksi batch, tracking biaya material, dan pelaporan biaya produksi",
    path: "/produksi",
    icon: Factory,
    category: "Manajemen Produksi",
    keywords: ["produksi", "production", "batch", "biaya", "cost", "bahan baku", "material"],
  },
];

const CATEGORIES = Array.from(new Set(REPORTS.map((r) => r.category)));

export default function LaporanIndex() {
  const [search, setSearch] = useState("");
  const [, setLocation] = useLocation();

  const filtered = useMemo(() => {
    if (!search.trim()) return REPORTS;
    const q = search.toLowerCase();
    return REPORTS.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.keywords.some((k) => k.toLowerCase().includes(q))
    );
  }, [search]);

  const groupedByCategory = useMemo(() => {
    const map = new Map<string, ReportEntry[]>();
    for (const cat of CATEGORIES) {
      const items = filtered.filter((r) => r.category === cat);
      if (items.length > 0) map.set(cat, items);
    }
    return map;
  }, [filtered]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          Daftar Laporan
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Cari dan akses semua laporan yang tersedia — {REPORTS.length} laporan
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari laporan... (contoh: penjualan, stok, pajak, neraca)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Tidak ada laporan yang cocok dengan "{search}"
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Array.from(groupedByCategory.entries()).map(([category, items]) => (
            <div key={category}>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {category}
                </h2>
                <Badge variant="secondary" className="text-[10px]">
                  {items.length}
                </Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map((report: ReportEntry) => (
                  <Card
                    key={report.path + report.name}
                    className="cursor-pointer border hover:border-primary/40 hover:shadow-md transition-all group"
                    onClick={() => setLocation(report.path)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                          <report.icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold group-hover:text-primary transition-colors">
                            {report.name}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {report.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
