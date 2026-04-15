import { useState, useMemo, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Download, TrendingUp, TrendingDown, Printer, FileSpreadsheet } from "lucide-react";
import { formatRupiah, BULAN_INDONESIA } from "../../../shared/finance";
import { toast } from "sonner";

export default function Laporan() {
  const now = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const { data: business } = trpc.business.mine.useQuery(undefined, { retry: false });
  const { data: labaRugi, isLoading: lrLoading } = trpc.report.labaRugi.useQuery({ month, year }, { retry: false });
  const { data: arusKas, isLoading: akLoading } = trpc.report.arusKas.useQuery({ month, year }, { retry: false });

  const canExport = true; // All users have full access — no free tier

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: BULAN_INDONESIA[i],
  }));

  const exportPDF = (type: "laba-rugi" | "arus-kas") => {
    const period = `${BULAN_INDONESIA[month - 1]} ${year}`;
    const bizName = business?.businessName ?? "Bisnis Saya";
    let content = "";
    if (type === "laba-rugi" && labaRugi) {
      content = `
        <h1 style="font-size:18px;font-weight:bold;margin-bottom:4px">Laporan Laba Rugi</h1>
        <p style="color:#666;margin-bottom:16px">${bizName} &mdash; ${labaRugi.period}</p>
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <tr style="background:#f0fdf4"><td colspan="2" style="padding:8px;font-weight:bold;color:#166534">PENDAPATAN</td></tr>
          <tr><td style="padding:6px 8px;color:#555">Penjualan Produk</td><td style="text-align:right;padding:6px 8px">${formatRupiah(labaRugi.pendapatan.penjualan)}</td></tr>
          <tr><td style="padding:6px 8px;color:#555">Penjualan Jasa</td><td style="text-align:right;padding:6px 8px">${formatRupiah(labaRugi.pendapatan.jasa)}</td></tr>
          <tr><td style="padding:6px 8px;color:#555">Lain-lain</td><td style="text-align:right;padding:6px 8px">${formatRupiah(labaRugi.pendapatan.lainLain)}</td></tr>
          <tr style="border-top:1px solid #ddd"><td style="padding:8px;font-weight:bold">Total Pendapatan</td><td style="text-align:right;padding:8px;font-weight:bold;color:#16a34a">${formatRupiah(labaRugi.pendapatan.total)}</td></tr>
          <tr style="background:#fef2f2"><td colspan="2" style="padding:8px;font-weight:bold;color:#991b1b">PENGELUARAN</td></tr>
          <tr><td style="padding:6px 8px;color:#555">HPP</td><td style="text-align:right;padding:6px 8px">${formatRupiah(labaRugi.pengeluaran.hpp)}</td></tr>
          <tr><td style="padding:6px 8px;color:#555">Operasional</td><td style="text-align:right;padding:6px 8px">${formatRupiah(labaRugi.pengeluaran.operasional)}</td></tr>
          <tr><td style="padding:6px 8px;color:#555">Gaji</td><td style="text-align:right;padding:6px 8px">${formatRupiah(labaRugi.pengeluaran.gaji)}</td></tr>
          <tr><td style="padding:6px 8px;color:#555">Utilitas</td><td style="text-align:right;padding:6px 8px">${formatRupiah(labaRugi.pengeluaran.utilitas)}</td></tr>
          <tr><td style="padding:6px 8px;color:#555">Sewa</td><td style="text-align:right;padding:6px 8px">${formatRupiah(labaRugi.pengeluaran.sewa)}</td></tr>
          <tr><td style="padding:6px 8px;color:#555">Transportasi</td><td style="text-align:right;padding:6px 8px">${formatRupiah(labaRugi.pengeluaran.transportasi)}</td></tr>
          <tr><td style="padding:6px 8px;color:#555">Lain-lain</td><td style="text-align:right;padding:6px 8px">${formatRupiah(labaRugi.pengeluaran.lainLain)}</td></tr>
          <tr style="border-top:1px solid #ddd"><td style="padding:8px;font-weight:bold">Total Pengeluaran</td><td style="text-align:right;padding:8px;font-weight:bold;color:#dc2626">${formatRupiah(labaRugi.pengeluaran.total)}</td></tr>
          <tr style="border-top:2px solid #333"><td style="padding:10px 8px;font-weight:bold;font-size:14px">Laba Bersih</td><td style="text-align:right;padding:10px 8px;font-weight:bold;font-size:14px;color:${labaRugi.labaBersih >= 0 ? '#16a34a' : '#dc2626'}">${formatRupiah(labaRugi.labaBersih)}</td></tr>
          <tr><td style="padding:6px 8px;color:#555">Margin</td><td style="text-align:right;padding:6px 8px">${labaRugi.marginPct}%</td></tr>
          <tr><td style="padding:6px 8px;color:#555">Estimasi Pajak</td><td style="text-align:right;padding:6px 8px">${formatRupiah(labaRugi.taxEstimate)}</td></tr>
        </table>`;
    } else if (type === "arus-kas" && arusKas) {
      const masukRows = Object.entries(arusKas.kasMasuk).filter(([k]) => k !== "total").map(([k, v]) => `<tr><td style="padding:6px 8px;color:#555">${k}</td><td style="text-align:right;padding:6px 8px">${formatRupiah(v as number)}</td></tr>`).join("");
      const keluarRows = Object.entries(arusKas.kasKeluar).filter(([k]) => k !== "total").map(([k, v]) => `<tr><td style="padding:6px 8px;color:#555">${k}</td><td style="text-align:right;padding:6px 8px">${formatRupiah(v as number)}</td></tr>`).join("");
      content = `
        <h1 style="font-size:18px;font-weight:bold;margin-bottom:4px">Laporan Arus Kas</h1>
        <p style="color:#666;margin-bottom:16px">${bizName} &mdash; ${arusKas.period}</p>
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <tr style="background:#f0fdf4"><td colspan="2" style="padding:8px;font-weight:bold;color:#166534">KAS MASUK</td></tr>
          ${masukRows}
          <tr style="border-top:1px solid #ddd"><td style="padding:8px;font-weight:bold">Total Kas Masuk</td><td style="text-align:right;padding:8px;font-weight:bold;color:#16a34a">${formatRupiah(arusKas.kasMasuk.total)}</td></tr>
          <tr style="background:#fef2f2"><td colspan="2" style="padding:8px;font-weight:bold;color:#991b1b">KAS KELUAR</td></tr>
          ${keluarRows}
          <tr style="border-top:1px solid #ddd"><td style="padding:8px;font-weight:bold">Total Kas Keluar</td><td style="text-align:right;padding:8px;font-weight:bold;color:#dc2626">${formatRupiah(arusKas.kasKeluar.total)}</td></tr>
          <tr style="border-top:2px solid #333"><td style="padding:10px 8px;font-weight:bold;font-size:14px">Arus Kas Bersih</td><td style="text-align:right;padding:10px 8px;font-weight:bold;font-size:14px;color:${arusKas.netKas >= 0 ? '#16a34a' : '#dc2626'}">${formatRupiah(arusKas.netKas)}</td></tr>
        </table>`;
    }
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Laporan County</title><style>body{font-family:Arial,sans-serif;padding:32px;color:#111}table{width:100%}@media print{body{padding:16px}}</style></head><body>${content}<p style="margin-top:32px;font-size:11px;color:#999">Dicetak dari County &mdash; ${new Date().toLocaleDateString("id-ID")}</p></body></html>`;
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 500);
    }
    toast.success("Dialog cetak PDF dibuka");
  };

  const exportExcel = (type: "laba-rugi" | "arus-kas") => {
    const period = `${BULAN_INDONESIA[month - 1]}_${year}`;
    const bizName = business?.businessName ?? "Bisnis Saya";
    let rows: string[][] = [];
    if (type === "laba-rugi" && labaRugi) {
      rows = [
        ["Laporan Laba Rugi", ""],
        ["Bisnis", bizName],
        ["Periode", labaRugi.period],
        ["", ""],
        ["PENDAPATAN", "Jumlah (Rp)"],
        ["Penjualan Produk", String(labaRugi.pendapatan.penjualan)],
        ["Penjualan Jasa", String(labaRugi.pendapatan.jasa)],
        ["Pendapatan Lain-lain", String(labaRugi.pendapatan.lainLain)],
        ["Total Pendapatan", String(labaRugi.pendapatan.total)],
        ["", ""],
        ["PENGELUARAN", "Jumlah (Rp)"],
        ["HPP (Harga Pokok)", String(labaRugi.pengeluaran.hpp)],
        ["Operasional", String(labaRugi.pengeluaran.operasional)],
        ["Gaji", String(labaRugi.pengeluaran.gaji)],
        ["Utilitas", String(labaRugi.pengeluaran.utilitas)],
        ["Sewa", String(labaRugi.pengeluaran.sewa)],
        ["Transportasi", String(labaRugi.pengeluaran.transportasi)],
        ["Lain-lain", String(labaRugi.pengeluaran.lainLain)],
        ["Total Pengeluaran", String(labaRugi.pengeluaran.total)],
        ["", ""],
        ["RINGKASAN", "Jumlah (Rp)"],
        ["Laba Kotor", String(labaRugi.labaKotor)],
        ["Laba Bersih", String(labaRugi.labaBersih)],
        ["Margin Laba", `${labaRugi.marginPct}%`],
        ["Estimasi Pajak", String(labaRugi.taxEstimate)],
      ];
    } else if (type === "arus-kas" && arusKas) {
      rows = [
        ["Laporan Arus Kas", ""],
        ["Bisnis", bizName],
        ["Periode", arusKas.period],
        ["", ""],
        ["KAS MASUK", "Jumlah (Rp)"],
        ...Object.entries(arusKas.kasMasuk).filter(([k]) => k !== "total").map(([k, v]) => [k, String(v)]),
        ["Total Kas Masuk", String(arusKas.kasMasuk.total)],
        ["", ""],
        ["KAS KELUAR", "Jumlah (Rp)"],
        ...Object.entries(arusKas.kasKeluar).filter(([k]) => k !== "total").map(([k, v]) => [k, String(v)]),
        ["Total Kas Keluar", String(arusKas.kasKeluar.total)],
        ["", ""],
        ["Arus Kas Bersih", String(arusKas.netKas)],
      ];
    }
    // Build simple XML-based Excel file (opens in Excel, Google Sheets, etc.)
    const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>\n<?mso-application progid="Excel.Sheet"?>\n<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n<Worksheet ss:Name="Laporan">\n<Table>\n`;
    const xmlRows = rows.map(row => {
      const cells = row.map(cell => {
        const isNum = /^-?\d+(\.\d+)?$/.test(cell);
        return isNum 
          ? `<Cell><Data ss:Type="Number">${cell}</Data></Cell>`
          : `<Cell><Data ss:Type="String">${cell.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</Data></Cell>`;
      }).join("");
      return `<Row>${cells}</Row>`;
    }).join("\n");
    const xmlFooter = `\n</Table>\n</Worksheet>\n</Workbook>`;
    const blob = new Blob([xmlHeader + xmlRows + xmlFooter], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${type}_${period}.xls`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("File Excel berhasil diunduh");
  };

  const exportCSV = (type: "laba-rugi" | "arus-kas") => {
    // canExport is always true, no restriction
    const period = `${BULAN_INDONESIA[month - 1]}_${year}`;
    let csv = "";
    if (type === "laba-rugi" && labaRugi) {
      csv = "Laporan Laba Rugi\n";
      csv += `Periode,${labaRugi.period}\n\n`;
      csv += "PENDAPATAN\n";
      csv += `Penjualan Produk,${labaRugi.pendapatan.penjualan}\n`;
      csv += `Penjualan Jasa,${labaRugi.pendapatan.jasa}\n`;
      csv += `Pendapatan Lain-lain,${labaRugi.pendapatan.lainLain}\n`;
      csv += `Total Pendapatan,${labaRugi.pendapatan.total}\n\n`;
      csv += "PENGELUARAN\n";
      csv += `HPP (Harga Pokok),${labaRugi.pengeluaran.hpp}\n`;
      csv += `Operasional,${labaRugi.pengeluaran.operasional}\n`;
      csv += `Gaji,${labaRugi.pengeluaran.gaji}\n`;
      csv += `Utilitas,${labaRugi.pengeluaran.utilitas}\n`;
      csv += `Sewa,${labaRugi.pengeluaran.sewa}\n`;
      csv += `Transportasi,${labaRugi.pengeluaran.transportasi}\n`;
      csv += `Lain-lain,${labaRugi.pengeluaran.lainLain}\n`;
      csv += `Total Pengeluaran,${labaRugi.pengeluaran.total}\n\n`;
      csv += `Laba Kotor,${labaRugi.labaKotor}\n`;
      csv += `Laba Bersih,${labaRugi.labaBersih}\n`;
      csv += `Margin,${labaRugi.marginPct}%\n`;
      csv += `Estimasi Pajak,${labaRugi.taxEstimate}\n`;
    } else if (type === "arus-kas" && arusKas) {
      csv = "Laporan Arus Kas\n";
      csv += `Periode,${arusKas.period}\n\n`;
      csv += "KAS MASUK\n";
      Object.entries(arusKas.kasMasuk).filter(([k]) => k !== "total").forEach(([k, v]) => {
        csv += `${k},${v}\n`;
      });
      csv += `Total Kas Masuk,${arusKas.kasMasuk.total}\n\n`;
      csv += "KAS KELUAR\n";
      Object.entries(arusKas.kasKeluar).filter(([k]) => k !== "total").forEach(([k, v]) => {
        csv += `${k},${v}\n`;
      });
      csv += `Total Kas Keluar,${arusKas.kasKeluar.total}\n\n`;
      csv += `Arus Kas Bersih,${arusKas.netKas}\n`;
    }
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${type}_${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("File berhasil diunduh");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Laporan Keuangan</h1>
          <p className="text-sm text-muted-foreground">Laporan otomatis berdasarkan transaksi Anda</p>
        </div>

      </div>

      {/* Period Selector */}
      <div className="flex items-center gap-3">
        <Select value={String(month)} onValueChange={(v) => setMonth(parseInt(v))}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            {months.map((m) => (<SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>))}
          </SelectContent>
        </Select>
        <Select value={String(year)} onValueChange={(v) => setYear(parseInt(v))}>
          <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
          <SelectContent>
            {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="laba-rugi">
        <TabsList>
          <TabsTrigger value="laba-rugi"><FileText className="h-4 w-4 mr-1.5" /> Laba Rugi</TabsTrigger>
          <TabsTrigger value="arus-kas"><TrendingUp className="h-4 w-4 mr-1.5" /> Arus Kas</TabsTrigger>
        </TabsList>

        {/* Laba Rugi */}
        <TabsContent value="laba-rugi" className="mt-4">
          {lrLoading ? (
            <Skeleton className="h-96 rounded-xl" />
          ) : !labaRugi ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Belum ada data untuk periode ini</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 shadow-md shadow-black/5">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Laporan Laba Rugi</CardTitle>
                  <CardDescription>{labaRugi.period} — {business?.businessName}</CardDescription>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={() => exportPDF("laba-rugi")}>
                    <Printer className="h-4 w-4 mr-1.5" /> PDF
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => exportExcel("laba-rugi")} className="text-emerald-700 border-emerald-200 hover:bg-emerald-50">
                    <FileSpreadsheet className="h-4 w-4 mr-1.5" /> Excel
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => exportCSV("laba-rugi")}>
                    <Download className="h-4 w-4 mr-1.5" /> CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Pendapatan */}
                  <div>
                    <h3 className="font-semibold text-sm text-emerald-700 mb-2 uppercase tracking-wide">Pendapatan</h3>
                    <div className="space-y-1">
                      <ReportRow label="Penjualan Produk" value={labaRugi.pendapatan.penjualan} />
                      <ReportRow label="Penjualan Jasa" value={labaRugi.pendapatan.jasa} />
                      <ReportRow label="Pendapatan Lain-lain" value={labaRugi.pendapatan.lainLain} />
                      <ReportRow label="Total Pendapatan" value={labaRugi.pendapatan.total} bold className="border-t pt-1" />
                    </div>
                  </div>

                  {/* Pengeluaran */}
                  <div>
                    <h3 className="font-semibold text-sm text-red-700 mb-2 uppercase tracking-wide">Pengeluaran</h3>
                    <div className="space-y-1">
                      <ReportRow label="HPP (Harga Pokok)" value={labaRugi.pengeluaran.hpp} />
                      <ReportRow label="Operasional" value={labaRugi.pengeluaran.operasional} />
                      <ReportRow label="Gaji" value={labaRugi.pengeluaran.gaji} />
                      <ReportRow label="Utilitas" value={labaRugi.pengeluaran.utilitas} />
                      <ReportRow label="Sewa" value={labaRugi.pengeluaran.sewa} />
                      <ReportRow label="Transportasi" value={labaRugi.pengeluaran.transportasi} />
                      <ReportRow label="Lain-lain" value={labaRugi.pengeluaran.lainLain} />
                      <ReportRow label="Total Pengeluaran" value={labaRugi.pengeluaran.total} bold className="border-t pt-1" />
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="border-t-2 pt-4 space-y-2">
                    <ReportRow label="Laba Kotor" value={labaRugi.labaKotor} bold />
                    <ReportRow label="Laba Bersih" value={labaRugi.labaBersih} bold highlight />
                    <ReportRow label="Margin Laba" value={`${labaRugi.marginPct}%`} isText />
                    <ReportRow label="Estimasi Pajak" value={labaRugi.taxEstimate} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Arus Kas */}
        <TabsContent value="arus-kas" className="mt-4">
          {akLoading ? (
            <Skeleton className="h-96 rounded-xl" />
          ) : !arusKas ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Belum ada data untuk periode ini</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 shadow-md shadow-black/5">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Laporan Arus Kas</CardTitle>
                  <CardDescription>{arusKas.period} — {business?.businessName}</CardDescription>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={() => exportPDF("arus-kas")}>
                    <Printer className="h-4 w-4 mr-1.5" /> PDF
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => exportExcel("arus-kas")} className="text-emerald-700 border-emerald-200 hover:bg-emerald-50">
                    <FileSpreadsheet className="h-4 w-4 mr-1.5" /> Excel
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => exportCSV("arus-kas")}>
                    <Download className="h-4 w-4 mr-1.5" /> CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Kas Masuk */}
                  <div>
                    <h3 className="font-semibold text-sm text-emerald-700 mb-2 uppercase tracking-wide">Kas Masuk</h3>
                    <div className="space-y-1">
                      {Object.entries(arusKas.kasMasuk).filter(([k]) => k !== "total").map(([key, val]) => (
                        <ReportRow key={key} label={key} value={val as number} />
                      ))}
                      <ReportRow label="Total Kas Masuk" value={arusKas.kasMasuk.total} bold className="border-t pt-1" />
                    </div>
                  </div>

                  {/* Kas Keluar */}
                  <div>
                    <h3 className="font-semibold text-sm text-red-700 mb-2 uppercase tracking-wide">Kas Keluar</h3>
                    <div className="space-y-1">
                      {Object.entries(arusKas.kasKeluar).filter(([k]) => k !== "total").map(([key, val]) => (
                        <ReportRow key={key} label={key} value={val as number} />
                      ))}
                      <ReportRow label="Total Kas Keluar" value={arusKas.kasKeluar.total} bold className="border-t pt-1" />
                    </div>
                  </div>

                  {/* Net */}
                  <div className="border-t-2 pt-4">
                    <ReportRow label="Arus Kas Bersih" value={arusKas.netKas} bold highlight />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ReportRow({ label, value, bold, highlight, className, isText }: {
  label: string; value: number | string; bold?: boolean; highlight?: boolean; className?: string; isText?: boolean;
}) {
  const numVal = typeof value === "number" ? value : 0;
  const isNeg = numVal < 0;
  return (
    <div className={`flex items-center justify-between py-1 text-sm ${className ?? ""}`}>
      <span className={bold ? "font-semibold" : "text-muted-foreground"}>{label}</span>
      <span className={`${bold ? "font-semibold" : ""} ${highlight ? (isNeg ? "text-red-600 text-base" : "text-emerald-600 text-base") : ""}`}>
        {isText ? value : formatRupiah(numVal)}
      </span>
    </div>
  );
}
