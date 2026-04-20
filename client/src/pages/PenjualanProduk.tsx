import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Package, Download, FileText } from "lucide-react";
import { formatRupiah } from "../../../shared/finance";
import { exportToPDF, exportToExcel, fmtRp } from "@/lib/export";
import { toast } from "sonner";

export default function PenjualanProduk() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  // Query sales by product
  const { data: sales, isLoading } = trpc.report.salesByProduct.useQuery(
    { startDate, endDate },
    { retry: false, enabled: startDate <= endDate }
  );

  // Calculate totals
  const totals = useMemo(() => {
    if (!sales) return { qtyTerjual: 0, totalPenjualan: 0, totalHPP: 0, laba: 0 };
    return {
      qtyTerjual: sales.reduce((sum, p) => sum + p.qtyTerjual, 0),
      totalPenjualan: sales.reduce((sum, p) => sum + p.totalPenjualan, 0),
      totalHPP: sales.reduce((sum, p) => sum + p.totalHPP, 0),
      laba: sales.reduce((sum, p) => sum + p.laba, 0),
    };
  }, [sales]);

  const handleExportPDF = () => {
    if (!sales || sales.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    exportToPDF({
      title: "Laporan Penjualan per Produk/SKU",
      subtitle: `Periode: ${startDate} — ${endDate}`,
      filename: `Laporan_Penjualan_Produk_${startDate}_${endDate}`,
      columns: [
        { header: "No", key: "no", width: 8, align: "center" },
        { header: "Produk", key: "productName", width: 35 },
        { header: "SKU", key: "sku", width: 15 },
        { header: "Barcode", key: "barcode", width: 18 },
        { header: "Kategori", key: "category", width: 20 },
        { header: "Qty Terjual", key: "qtyTerjual", width: 12, align: "right" },
        {
          header: "Total Penjualan",
          key: "totalPenjualan",
          width: 20,
          align: "right",
          format: fmtRp,
        },
        { header: "HPP", key: "totalHPP", width: 20, align: "right", format: fmtRp },
        { header: "Laba", key: "laba", width: 20, align: "right", format: fmtRp },
      ],
      data: sales.map((p, idx) => ({
        no: idx + 1,
        ...p,
      })),
      summaryRow: {
        no: "",
        productName: "TOTAL",
        sku: "",
        barcode: "",
        category: "",
        qtyTerjual: totals.qtyTerjual,
        totalPenjualan: totals.totalPenjualan,
        totalHPP: totals.totalHPP,
        laba: totals.laba,
      },
    });

    toast.success("Laporan PDF berhasil diunduh");
  };

  const handleExportExcel = () => {
    if (!sales || sales.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    exportToExcel({
      title: "Laporan Penjualan per Produk/SKU",
      subtitle: `Periode: ${startDate} — ${endDate}`,
      filename: `Laporan_Penjualan_Produk_${startDate}_${endDate}`,
      columns: [
        { header: "No", key: "no", width: 8 },
        { header: "Produk", key: "productName", width: 35 },
        { header: "SKU", key: "sku", width: 15 },
        { header: "Barcode", key: "barcode", width: 18 },
        { header: "Kategori", key: "category", width: 20 },
        { header: "Qty Terjual", key: "qtyTerjual", width: 12 },
        {
          header: "Total Penjualan",
          key: "totalPenjualan",
          width: 20,
          format: fmtRp,
        },
        { header: "HPP", key: "totalHPP", width: 20, format: fmtRp },
        { header: "Laba", key: "laba", width: 20, format: fmtRp },
      ],
      data: sales.map((p, idx) => ({
        no: idx + 1,
        ...p,
      })),
      summaryRow: {
        no: "",
        productName: "TOTAL",
        sku: "",
        barcode: "",
        category: "",
        qtyTerjual: totals.qtyTerjual,
        totalPenjualan: totals.totalPenjualan,
        totalHPP: totals.totalHPP,
        laba: totals.laba,
      },
    });

    toast.success("Laporan Excel berhasil diunduh");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Laporan Penjualan per Produk/SKU
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Detail penjualan, HPP, dan profit margin per produk
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-end flex-wrap">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">
                Tanggal Mulai
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-2 w-40"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">
                Tanggal Akhir
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-2 w-40"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                disabled={isLoading || !sales || sales.length === 0}
              >
                <FileText className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportExcel}
                disabled={isLoading || !sales || sales.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Qty Terjual</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-2xl font-bold">{totals.qtyTerjual}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Penjualan</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-2xl font-bold">{formatRupiah(totals.totalPenjualan)}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total HPP</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-2xl font-bold">{formatRupiah(totals.totalHPP)}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Laba</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className={`text-2xl font-bold ${totals.laba >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                {formatRupiah(totals.laba)}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detail Penjualan Produk</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !sales || sales.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Tidak ada data penjualan untuk periode ini
            </div>
          ) : (
            <ScrollArea className="w-full">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-2 text-left font-semibold text-xs">No</th>
                    <th className="px-4 py-2 text-left font-semibold text-xs">Produk</th>
                    <th className="px-4 py-2 text-left font-semibold text-xs">SKU</th>
                    <th className="px-4 py-2 text-left font-semibold text-xs">Barcode</th>
                    <th className="px-4 py-2 text-left font-semibold text-xs">Kategori</th>
                    <th className="px-4 py-2 text-right font-semibold text-xs">Qty Terjual</th>
                    <th className="px-4 py-2 text-right font-semibold text-xs">Total Penjualan</th>
                    <th className="px-4 py-2 text-right font-semibold text-xs">HPP</th>
                    <th className="px-4 py-2 text-right font-semibold text-xs">Laba</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((row, idx) => (
                    <tr key={row.productId} className="border-b hover:bg-muted/30">
                      <td className="px-4 py-2">{idx + 1}</td>
                      <td className="px-4 py-2 font-medium">{row.productName}</td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">{row.sku || "-"}</td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">{row.barcode || "-"}</td>
                      <td className="px-4 py-2 text-xs">{row.category || "-"}</td>
                      <td className="px-4 py-2 text-right">{row.qtyTerjual}</td>
                      <td className="px-4 py-2 text-right text-sm font-medium">
                        {formatRupiah(row.totalPenjualan)}
                      </td>
                      <td className="px-4 py-2 text-right text-sm text-muted-foreground">
                        {formatRupiah(row.totalHPP)}
                      </td>
                      <td className={`px-4 py-2 text-right font-semibold ${row.laba >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                        {formatRupiah(row.laba)}
                      </td>
                    </tr>
                  ))}
                  {/* Summary row */}
                  <tr className="bg-muted/50 font-bold border-t-2">
                    <td colSpan={5} className="px-4 py-3">
                      TOTAL
                    </td>
                    <td className="px-4 py-3 text-right">{totals.qtyTerjual}</td>
                    <td className="px-4 py-3 text-right text-sm">
                      {formatRupiah(totals.totalPenjualan)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      {formatRupiah(totals.totalHPP)}
                    </td>
                    <td className={`px-4 py-3 text-right text-sm ${totals.laba >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                      {formatRupiah(totals.laba)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
