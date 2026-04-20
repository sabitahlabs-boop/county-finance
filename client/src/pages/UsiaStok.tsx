import { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, FileText, TrendingUp } from "lucide-react";
import { exportToPDF, exportToExcel, fmtDate } from "@/lib/export";
import { toast } from "sonner";

export default function UsiaStok() {
  const { data: reportData, isLoading } = trpc.report.stockAging.useQuery();

  const metrics = useMemo(() => {
    if (!reportData) {
      return { fresh: 0, aging: 0, old: 0, dead: 0 };
    }

    const fresh = reportData.filter((s) => s.ageBucket === "0-30").length;
    const aging = reportData.filter((s) => s.ageBucket === "31-60").length;
    const old = reportData.filter((s) => s.ageBucket === "61-90").length;
    const dead = reportData.filter((s) => s.ageBucket === ">90").length;

    return { fresh, aging, old, dead };
  }, [reportData]);

  const handleExportPDF = () => {
    if (!reportData || reportData.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    const data = reportData.map((item, idx) => ({
      no: idx + 1,
      productName: item.productName,
      sku: item.sku || "-",
      currentStock: item.currentStock,
      ageDays: item.ageDays,
      ageBucket: item.ageBucket,
      lastSaleDate: item.lastSaleDate || "Belum terjual",
    }));

    exportToPDF({
      title: "Laporan Usia Stok",
      subtitle: `Total Produk: ${reportData.length}`,
      filename: `Usia_Stok_${new Date().toISOString().slice(0, 10)}`,
      columns: [
        { header: "No", key: "no", width: 6, align: "center" },
        { header: "Produk", key: "productName", width: 25 },
        { header: "SKU", key: "sku", width: 15 },
        { header: "Stok", key: "currentStock", width: 10, align: "right" },
        { header: "Umur (Hari)", key: "ageDays", width: 12, align: "right" },
        { header: "Kategori", key: "ageBucket", width: 15 },
        { header: "Terakhir Terjual", key: "lastSaleDate", width: 16, format: fmtDate },
      ],
      data,
    });

    toast.success("Laporan PDF berhasil diunduh");
  };

  const handleExportExcel = () => {
    if (!reportData || reportData.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    const data = reportData.map((item, idx) => ({
      no: idx + 1,
      productName: item.productName,
      sku: item.sku || "-",
      currentStock: item.currentStock,
      ageDays: item.ageDays,
      ageBucket: item.ageBucket,
      lastSaleDate: item.lastSaleDate || "Belum terjual",
    }));

    exportToExcel({
      title: "Laporan Usia Stok",
      subtitle: `Total Produk: ${reportData.length}`,
      filename: `Usia_Stok_${new Date().toISOString().slice(0, 10)}`,
      columns: [
        { header: "No", key: "no", width: 6 },
        { header: "Produk", key: "productName", width: 25 },
        { header: "SKU", key: "sku", width: 15 },
        { header: "Stok", key: "currentStock", width: 10 },
        { header: "Umur (Hari)", key: "ageDays", width: 12 },
        { header: "Kategori", key: "ageBucket", width: 15 },
        { header: "Terakhir Terjual", key: "lastSaleDate", width: 16, format: fmtDate },
      ],
      data,
    });

    toast.success("Laporan Excel berhasil diunduh");
  };

  const getBucketColor = (bucket: string) => {
    switch (bucket) {
      case "0-30":
        return "bg-green-100 dark:bg-green-900 text-green-900 border-green-200 dark:border-green-800";
      case "31-60":
        return "bg-yellow-100 dark:bg-yellow-900 text-yellow-900 border-yellow-200 dark:border-yellow-800";
      case "61-90":
        return "bg-orange-100 dark:bg-orange-900 text-orange-900 border-orange-200 dark:border-orange-800";
      case ">90":
        return "bg-red-100 dark:bg-red-900 text-red-900 border-red-200 dark:border-red-800";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700";
    }
  };

  const chartData = [
    { label: "Fresh (0-30d)", value: metrics.fresh, color: "bg-green-500" },
    { label: "Aging (31-60d)", value: metrics.aging, color: "bg-yellow-500" },
    { label: "Old (61-90d)", value: metrics.old, color: "bg-orange-500" },
    { label: "Dead (>90d)", value: metrics.dead, color: "bg-red-500" },
  ];

  const maxValue = Math.max(...chartData.map((d) => d.value), 1);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Analisis Usia Stok
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Identifikasi produk lama dan slow-moving items
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            disabled={isLoading || !reportData || reportData.length === 0}
          >
            <FileText className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            disabled={isLoading || !reportData || reportData.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Fresh</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{metrics.fresh}</div>
            <div className="text-xs text-green-700 dark:text-green-300 mt-1">0-30 hari</div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Aging</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-900">{metrics.aging}</div>
            <div className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">31-60 hari</div>
          </CardContent>
        </Card>
        <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">Old</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{metrics.old}</div>
            <div className="text-xs text-orange-700 dark:text-orange-300 mt-1">61-90 hari</div>
          </CardContent>
        </Card>
        <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300">Dead Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">{metrics.dead}</div>
            <div className="text-xs text-red-700 dark:text-red-300 mt-1">&gt;90 hari</div>
          </CardContent>
        </Card>
      </div>

      {/* Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Distribusi Usia Stok</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {chartData.map((item) => (
              <div key={item.label} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{item.label}</span>
                  <span className="text-muted-foreground">{item.value} produk</span>
                </div>
                <div className="w-full bg-muted rounded-full h-4 overflow-hidden">
                  <div
                    className={`${item.color} h-full rounded-full transition-all`}
                    style={{ width: `${(item.value / maxValue) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detail Produk</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Produk</th>
                  <th className="text-left py-2 px-2">SKU</th>
                  <th className="text-right py-2 px-2">Stok</th>
                  <th className="text-right py-2 px-2">Umur (hari)</th>
                  <th className="text-center py-2 px-2">Kategori</th>
                  <th className="text-left py-2 px-2">Terakhir Terjual</th>
                </tr>
              </thead>
              <tbody>
                {reportData && reportData.length > 0 ? (
                  reportData.map((item, idx) => (
                    <tr key={idx} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="py-2 px-2 font-medium">{item.productName}</td>
                      <td className="py-2 px-2 text-xs">{item.sku || "-"}</td>
                      <td className="text-right py-2 px-2">{item.currentStock}</td>
                      <td className="text-right py-2 px-2 font-medium">{item.ageDays}</td>
                      <td className="text-center py-2 px-2">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-semibold border ${getBucketColor(item.ageBucket)}`}
                        >
                          {item.ageBucket}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-xs text-muted-foreground">
                        {item.lastSaleDate ? item.lastSaleDate : "Belum terjual"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground">
                      Tidak ada data stok untuk ditampilkan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
