import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Download, TrendingUp, TrendingDown } from "lucide-react";
import { formatRupiah, BULAN_INDONESIA } from "../../../shared/finance";
import { exportToPDF, exportToExcel, fmtRp, ExportColumn } from "@/lib/export";
import { toast } from "sonner";

export default function LabaRugiDetail() {
  const now = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const { data: business } = trpc.business.mine.useQuery(undefined, { retry: false });
  const { data: report, isLoading: reportLoading } = trpc.report.labaRugiDetail.useQuery({ month, year }, { retry: false });
  const { data: prevReport } = trpc.report.labaRugiDetail.useQuery(
    { month: month === 1 ? 12 : month - 1, year: month === 1 ? year - 1 : year },
    { retry: false }
  );

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: BULAN_INDONESIA[i],
  }));

  const years = Array.from({ length: 5 }, (_, i) => ({
    value: now.getFullYear() - i,
    label: String(now.getFullYear() - i),
  }));

  const getDelta = (current: number, prev: number) => {
    if (prev === 0) return { pct: 0, isUp: current >= 0 };
    const pct = Math.round(((current - prev) / Math.abs(prev)) * 10000) / 100;
    return { pct: Math.abs(pct), isUp: pct >= 0 };
  };

  const handleExport = (format: "pdf" | "excel") => {
    if (!report) return;
    const bizName = business?.businessName ?? "Bisnis Saya";
    const columns: ExportColumn[] = [
      { header: "Deskripsi", key: "label", width: 25 },
      { header: "Jumlah (Rp)", key: "value", width: 18, align: "right", format: (v: any) => fmtRp(v) },
      { header: "% Pendapatan", key: "pct", width: 15, align: "right", format: (v: any) => v ? `${v}%` : "-" },
    ];

    const calculatePct = (val: number, total: number) => total > 0 ? Math.round((val / total) * 10000) / 100 : 0;

    const data = [
      { label: "PENDAPATAN", value: 0, pct: null },
      { label: "  Penjualan POS", value: report.pendapatan.penjualanPOS, pct: calculatePct(report.pendapatan.penjualanPOS, report.pendapatan.totalPendapatan) },
      { label: "  Penjualan Manual", value: report.pendapatan.penjualanManual, pct: calculatePct(report.pendapatan.penjualanManual, report.pendapatan.totalPendapatan) },
      { label: "  Pendapatan Jasa", value: report.pendapatan.pendapatanJasa, pct: calculatePct(report.pendapatan.pendapatanJasa, report.pendapatan.totalPendapatan) },
      { label: "  Pendapatan Lain", value: report.pendapatan.pendapatanLain, pct: calculatePct(report.pendapatan.pendapatanLain, report.pendapatan.totalPendapatan) },
      { label: "Total Pendapatan", value: report.pendapatan.totalPendapatan, pct: 100 },
      { label: "", value: 0, pct: null },
      { label: "HARGA POKOK PENJUALAN", value: 0, pct: null },
      { label: "  HPP Penjualan", value: report.hpp.hppPenjualan, pct: calculatePct(report.hpp.hppPenjualan, report.pendapatan.totalPendapatan) },
      { label: "  Pembelian Barang", value: report.hpp.pembelianBarang, pct: calculatePct(report.hpp.pembelianBarang, report.pendapatan.totalPendapatan) },
      { label: "  Biaya Produksi", value: report.hpp.biayaProduksi, pct: calculatePct(report.hpp.biayaProduksi, report.pendapatan.totalPendapatan) },
      { label: "  Stok Opname", value: report.hpp.stokOpname, pct: calculatePct(report.hpp.stokOpname, report.pendapatan.totalPendapatan) },
      { label: "Total HPP", value: report.hpp.totalHPP, pct: calculatePct(report.hpp.totalHPP, report.pendapatan.totalPendapatan) },
      { label: "", value: 0, pct: null },
      { label: "Laba Kotor", value: report.labaKotor, pct: calculatePct(report.labaKotor, report.pendapatan.totalPendapatan) },
      { label: "Margin Kotor", value: report.marginKotor, pct: null },
      { label: "", value: 0, pct: null },
      { label: "PENGELUARAN OPERASIONAL", value: 0, pct: null },
      { label: "  Gaji", value: report.pengeluaran.gaji, pct: calculatePct(report.pengeluaran.gaji, report.pendapatan.totalPendapatan) },
      { label: "  Sewa", value: report.pengeluaran.sewa, pct: calculatePct(report.pengeluaran.sewa, report.pendapatan.totalPendapatan) },
      { label: "  Utilitas", value: report.pengeluaran.utilitas, pct: calculatePct(report.pengeluaran.utilitas, report.pendapatan.totalPendapatan) },
      { label: "  Transportasi", value: report.pengeluaran.transportasi, pct: calculatePct(report.pengeluaran.transportasi, report.pendapatan.totalPendapatan) },
      { label: "  Operasional Lain", value: report.pengeluaran.operasionalLain, pct: calculatePct(report.pengeluaran.operasionalLain, report.pendapatan.totalPendapatan) },
      { label: "  Refund", value: report.pengeluaran.refund, pct: calculatePct(report.pengeluaran.refund, report.pendapatan.totalPendapatan) },
      { label: "  Komisi Staff", value: report.pengeluaran.komisiStaff, pct: calculatePct(report.pengeluaran.komisiStaff, report.pendapatan.totalPendapatan) },
      { label: "Total Pengeluaran", value: report.pengeluaran.totalPengeluaran, pct: calculatePct(report.pengeluaran.totalPengeluaran, report.pendapatan.totalPendapatan) },
      { label: "", value: 0, pct: null },
      { label: "Laba Bersih", value: report.labaBersih, pct: calculatePct(report.labaBersih, report.pendapatan.totalPendapatan) },
      { label: "Margin Bersih", value: report.marginBersih, pct: null },
    ];

    const filename = `laba-rugi-detail_${BULAN_INDONESIA[month - 1]}_${year}`;
    const options = {
      title: "Laporan Laba Rugi Detail",
      subtitle: `${bizName} — ${report.period}`,
      columns,
      data: data.filter(d => d.label !== ""),
      filename,
      orientation: "portrait" as const,
    };

    if (format === "pdf") {
      exportToPDF(options);
      toast.success("PDF berhasil diunduh");
    } else {
      exportToExcel(options);
      toast.success("Excel berhasil diunduh");
    }
  };

  if (reportLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-64" />
        {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-32 w-full" />)}
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">Data tidak tersedia</p>
      </div>
    );
  }

  const calculatePct = (val: number, total: number) => total > 0 ? Math.round((val / total) * 10000) / 100 : 0;
  const totalPendapatanPct = calculatePct(report.pendapatan.totalPendapatan, report.pendapatan.totalPendapatan);

  const pendapatanPct = calculatePct(report.pendapatan.totalPendapatan, report.pendapatan.totalPendapatan);
  const hppPct = calculatePct(report.hpp.totalHPP, report.pendapatan.totalPendapatan);
  const labaKotorPct = calculatePct(report.labaKotor, report.pendapatan.totalPendapatan);
  const pengeluaranPct = calculatePct(report.pengeluaran.totalPengeluaran - report.hpp.totalHPP, report.pendapatan.totalPendapatan);
  const labaBersihPct = calculatePct(report.labaBersih, report.pendapatan.totalPendapatan);

  const deltaPendapatan = prevReport ? getDelta(report.pendapatan.totalPendapatan, prevReport.pendapatan.totalPendapatan) : null;
  const deltaLabaBersih = prevReport ? getDelta(report.labaBersih, prevReport.labaBersih) : null;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">Laporan Laba Rugi Detail</h1>
            <p className="text-gray-600">Format detail Olsera dengan breakdown komprehensif</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => handleExport("pdf")} className="gap-1">
            <Download className="h-3 w-3" />
            PDF
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleExport("excel")} className="gap-1">
            <Download className="h-3 w-3" />
            Excel
          </Button>
        </div>
      </div>

      {/* Period & Month Selector */}
      <div className="flex gap-4">
        <Select value={String(month)} onValueChange={(v) => setMonth(parseInt(v))}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {months.map(m => (
              <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={String(year)} onValueChange={(v) => setYear(parseInt(v))}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map(y => (
              <SelectItem key={y.value} value={String(y.value)}>{y.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center justify-between">
              Total Pendapatan
              {deltaPendapatan && (
                <Badge variant={deltaPendapatan.isUp ? "default" : "destructive"} className="text-xs">
                  {deltaPendapatan.isUp ? "↑" : "↓"} {deltaPendapatan.pct}%
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{formatRupiah(report.pendapatan.totalPendapatan)}</p>
            <p className="text-xs text-gray-500 mt-1">100%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Laba Kotor</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${report.labaKotor >= 0 ? "text-blue-600" : "text-red-600"}`}>
              {formatRupiah(report.labaKotor)}
            </p>
            <p className="text-xs text-gray-500 mt-1">{report.marginKotor}% margin</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center justify-between">
              Laba Bersih
              {deltaLabaBersih && (
                <Badge variant={deltaLabaBersih.isUp ? "default" : "destructive"} className="text-xs">
                  {deltaLabaBersih.isUp ? "↑" : "↓"} {deltaLabaBersih.pct}%
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${report.labaBersih >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatRupiah(report.labaBersih)}
            </p>
            <p className="text-xs text-gray-500 mt-1">{report.marginBersih}% margin</p>
          </CardContent>
        </Card>
      </div>

      {/* Section 1: Pendapatan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>1. Pendapatan (Revenue)</span>
            <span className="text-sm font-normal text-gray-600">{formatRupiah(report.pendapatan.totalPendapatan)}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <LineItem
              label="Penjualan POS"
              value={report.pendapatan.penjualanPOS}
              total={report.pendapatan.totalPendapatan}
            />
            <LineItem
              label="Penjualan Manual Produk"
              value={report.pendapatan.penjualanManual}
              total={report.pendapatan.totalPendapatan}
            />
            <LineItem
              label="Pendapatan Jasa"
              value={report.pendapatan.pendapatanJasa}
              total={report.pendapatan.totalPendapatan}
            />
            <LineItem
              label="Pendapatan Lain-lain"
              value={report.pendapatan.pendapatanLain}
              total={report.pendapatan.totalPendapatan}
            />
            <div className="border-t pt-3 mt-3">
              <LineItem
                label="Total Pendapatan"
                value={report.pendapatan.totalPendapatan}
                total={report.pendapatan.totalPendapatan}
                bold
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: HPP */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>2. Harga Pokok Penjualan (COGS)</span>
            <span className="text-sm font-normal text-gray-600">{formatRupiah(report.hpp.totalHPP)}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <LineItem
              label="HPP Penjualan (dari POS)"
              value={report.hpp.hppPenjualan}
              total={report.pendapatan.totalPendapatan}
            />
            <LineItem
              label="Pembelian Barang/Stok"
              value={report.hpp.pembelianBarang}
              total={report.pendapatan.totalPendapatan}
            />
            <LineItem
              label="Biaya Produksi"
              value={report.hpp.biayaProduksi}
              total={report.pendapatan.totalPendapatan}
            />
            <LineItem
              label="Stok Opname (Loss)"
              value={report.hpp.stokOpname}
              total={report.pendapatan.totalPendapatan}
            />
            <div className="border-t pt-3 mt-3">
              <LineItem
                label="Total HPP"
                value={report.hpp.totalHPP}
                total={report.pendapatan.totalPendapatan}
                bold
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Laba Kotor */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Laba Kotor</span>
            <span className="text-sm font-normal text-gray-600">{formatRupiah(report.labaKotor)}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-bold text-blue-600">{report.marginKotor}% Margin Kotor</p>
          <p className="text-sm text-gray-600 mt-1">Total Pendapatan − Total HPP</p>
        </CardContent>
      </Card>

      {/* Section 3: Pengeluaran Operasional */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>3. Pengeluaran Operasional</span>
            <span className="text-sm font-normal text-gray-600">
              {formatRupiah(report.pengeluaran.totalPengeluaran - report.hpp.totalHPP)}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <LineItem
              label="Gaji & Upah"
              value={report.pengeluaran.gaji}
              total={report.pendapatan.totalPendapatan}
            />
            <LineItem
              label="Sewa Lokasi"
              value={report.pengeluaran.sewa}
              total={report.pendapatan.totalPendapatan}
            />
            <LineItem
              label="Utilitas (Listrik, Air)"
              value={report.pengeluaran.utilitas}
              total={report.pendapatan.totalPendapatan}
            />
            <LineItem
              label="Transportasi"
              value={report.pengeluaran.transportasi}
              total={report.pendapatan.totalPendapatan}
            />
            <LineItem
              label="Operasional Lain"
              value={report.pengeluaran.operasionalLain}
              total={report.pendapatan.totalPendapatan}
            />
            <LineItem
              label="Refund/Retur"
              value={report.pengeluaran.refund}
              total={report.pendapatan.totalPendapatan}
            />
            <LineItem
              label="Komisi Staff"
              value={report.pengeluaran.komisiStaff}
              total={report.pendapatan.totalPendapatan}
            />
            <div className="border-t pt-3 mt-3">
              <LineItem
                label="Total Pengeluaran Operasional"
                value={report.pengeluaran.totalPengeluaran - report.hpp.totalHPP}
                total={report.pendapatan.totalPendapatan}
                bold
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Laba Bersih */}
      <Card className={`${report.labaBersih >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Laba Bersih (Net Income)</span>
            <span className="text-sm font-normal text-gray-600">{formatRupiah(report.labaBersih)}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className={`text-lg font-bold ${report.labaBersih >= 0 ? "text-green-600" : "text-red-600"}`}>
            {report.marginBersih}% Margin Bersih
          </p>
          <p className="text-sm text-gray-600 mt-1">Total Pendapatan − (Total HPP + Pengeluaran Operasional)</p>
        </CardContent>
      </Card>
    </div>
  );
}

function LineItem({ label, value, total, bold }: { label: string; value: number; total: number; bold?: boolean }) {
  const pct = total > 0 ? Math.round((value / total) * 10000) / 100 : 0;
  return (
    <div className={`flex items-center justify-between ${bold ? "font-bold border-t pt-3" : ""}`}>
      <span>{label}</span>
      <div className="flex items-center gap-4">
        <span className={bold ? "text-lg" : ""}>{formatRupiah(value)}</span>
        <span className={`w-12 text-right text-sm ${value < 0 ? "text-red-600" : "text-gray-600"}`}>{pct}%</span>
      </div>
    </div>
  );
}
