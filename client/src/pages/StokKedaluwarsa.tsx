import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, FileText, AlertCircle, AlertTriangle } from "lucide-react";
import { formatRupiah } from "../../../shared/finance";
import { exportToPDF, exportToExcel, fmtRp, fmtDate } from "@/lib/export";
import { toast } from "sonner";

export default function StokKedaluwarsa() {
  const [daysFilter, setDaysFilter] = useState(30);
  const { data: expiringData, isLoading: expiringLoading } = trpc.report.expiringStock.useQuery(
    { daysAhead: daysFilter }
  );
  const { data: expiredData, isLoading: expiredLoading } = trpc.report.expiredStock.useQuery();

  const isLoading = expiringLoading || expiredLoading;

  const metrics = useMemo(() => {
    const expiring = expiringData || [];
    const expired = expiredData || [];

    const segera = expiring.filter((s) => s.daysRemaining <= 7);
    const mendekati = expiring.filter((s) => s.daysRemaining > 7 && s.daysRemaining <= 30);

    const segaraValue = segera.reduce((sum, s) => sum + s.totalValue, 0);
    const mendekatiValue = mendekati.reduce((sum, s) => sum + s.totalValue, 0);
    const expiredValue = expired.reduce((sum, e) => sum + e.totalValue, 0);
    const risikoValue = segaraValue + mendekatiValue + expiredValue;

    return {
      segaraCount: segera.length,
      segaraValue,
      mendekatiCount: mendekati.length,
      mendekatiValue,
      expiredCount: expired.length,
      expiredValue,
      risikoValue,
    };
  }, [expiringData, expiredData]);

  const allData = useMemo(() => {
    const expiring = expiringData || [];
    const expired = (expiredData || []).map((e) => ({ ...e, daysRemaining: -999 }));
    return [...expiring, ...expired];
  }, [expiringData, expiredData]);

  const handleExportPDF = () => {
    if (allData.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    const data = allData.map((item, idx) => ({
      no: idx + 1,
      productName: item.productName,
      batchCode: item.batchCode || "-",
      expiryDate: item.expiryDate,
      daysRemaining: item.daysRemaining,
      remainingQty: item.remainingQty,
      costPrice: item.costPrice,
      totalValue: item.totalValue,
    }));

    exportToPDF({
      title: "Laporan Stok Kedaluwarsa",
      subtitle: `Filter: ${daysFilter} hari ke depan | Total Risiko: ${formatRupiah(metrics.risikoValue)}`,
      filename: `Stok_Kedaluwarsa_${new Date().toISOString().slice(0, 10)}`,
      columns: [
        { header: "No", key: "no", width: 6, align: "center" },
        { header: "Produk", key: "productName", width: 25 },
        { header: "Batch", key: "batchCode", width: 15 },
        { header: "Tanggal Kadaluarsa", key: "expiryDate", width: 16, format: fmtDate },
        { header: "Sisa Hari", key: "daysRemaining", width: 12, align: "right" },
        { header: "Qty", key: "remainingQty", width: 10, align: "right" },
        { header: "Nilai (Rp)", key: "totalValue", width: 18, align: "right", format: fmtRp },
      ],
      data,
      summaryRow: {
        no: "",
        productName: "TOTAL",
        batchCode: "",
        expiryDate: "",
        daysRemaining: "",
        remainingQty: data.reduce((sum, d) => sum + d.remainingQty, 0),
        totalValue: metrics.risikoValue,
      },
    });

    toast.success("Laporan PDF berhasil diunduh");
  };

  const handleExportExcel = () => {
    if (allData.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    const data = allData.map((item, idx) => ({
      no: idx + 1,
      productName: item.productName,
      batchCode: item.batchCode || "-",
      expiryDate: item.expiryDate,
      daysRemaining: item.daysRemaining,
      remainingQty: item.remainingQty,
      costPrice: item.costPrice,
      totalValue: item.totalValue,
    }));

    exportToExcel({
      title: "Laporan Stok Kedaluwarsa",
      subtitle: `Filter: ${daysFilter} hari ke depan | Total Risiko: ${formatRupiah(metrics.risikoValue)}`,
      filename: `Stok_Kedaluwarsa_${new Date().toISOString().slice(0, 10)}`,
      columns: [
        { header: "No", key: "no", width: 6 },
        { header: "Produk", key: "productName", width: 25 },
        { header: "Batch", key: "batchCode", width: 15 },
        { header: "Tanggal Kadaluarsa", key: "expiryDate", width: 16, format: fmtDate },
        { header: "Sisa Hari", key: "daysRemaining", width: 12 },
        { header: "Qty", key: "remainingQty", width: 10 },
        { header: "Nilai (Rp)", key: "totalValue", width: 18, format: fmtRp },
      ],
      data,
      summaryRow: {
        no: "",
        productName: "TOTAL",
        batchCode: "",
        expiryDate: "",
        daysRemaining: "",
        remainingQty: data.reduce((sum, d) => sum + d.remainingQty, 0),
        totalValue: metrics.risikoValue,
      },
    });

    toast.success("Laporan Excel berhasil diunduh");
  };

  const getStatusColor = (days: number) => {
    if (days < 0) return "bg-red-100 border-red-200";
    if (days < 7) return "bg-red-100 border-red-200";
    if (days < 30) return "bg-yellow-100 border-yellow-200";
    return "bg-green-100 border-green-200";
  };

  const getStatusLabel = (days: number) => {
    if (days < 0) return "Sudah Kedaluwarsa";
    if (days < 7) return "Segera Kedaluwarsa";
    if (days < 30) return "Mendekati Kedaluwarsa";
    return "Aman";
  };

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
            <AlertCircle className="h-5 w-5 text-orange-600" />
            Stok Kedaluwarsa
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Pantau produk dengan tanggal kadaluarsa mendekat
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            disabled={isLoading || allData.length === 0}
          >
            <FileText className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            disabled={isLoading || allData.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 flex-wrap">
        {[7, 14, 30, 60, 90].map((days) => (
          <Button
            key={days}
            variant={daysFilter === days ? "default" : "outline"}
            size="sm"
            onClick={() => setDaysFilter(days)}
          >
            {days} hari
          </Button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-700">Segera Expired</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">{metrics.segaraCount}</div>
            <div className="text-xs text-red-700 mt-1">{formatRupiah(metrics.segaraValue)}</div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700">Mendekati Expired</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-900">{metrics.mendekatiCount}</div>
            <div className="text-xs text-yellow-700 mt-1">{formatRupiah(metrics.mendekatiValue)}</div>
          </CardContent>
        </Card>
        <Card className="border-gray-200 bg-gray-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Sudah Expired</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{metrics.expiredCount}</div>
            <div className="text-xs text-gray-700 mt-1">{formatRupiah(metrics.expiredValue)}</div>
          </CardContent>
        </Card>
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">Total Risiko</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">
              {formatRupiah(metrics.risikoValue)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detail Stok Kedaluwarsa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Produk</th>
                  <th className="text-left py-2 px-2">Batch</th>
                  <th className="text-left py-2 px-2">Tanggal Expired</th>
                  <th className="text-right py-2 px-2">Sisa Hari</th>
                  <th className="text-right py-2 px-2">Qty</th>
                  <th className="text-right py-2 px-2">Nilai (Rp)</th>
                  <th className="text-center py-2 px-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {allData.length > 0 ? (
                  allData.map((item, idx) => (
                    <tr key={idx} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="py-2 px-2">{item.productName}</td>
                      <td className="py-2 px-2 text-xs">{item.batchCode || "-"}</td>
                      <td className="py-2 px-2 text-xs">{item.expiryDate}</td>
                      <td className="text-right py-2 px-2 font-medium">{item.daysRemaining}</td>
                      <td className="text-right py-2 px-2">{item.remainingQty}</td>
                      <td className="text-right py-2 px-2 font-medium">
                        {formatRupiah(item.totalValue)}
                      </td>
                      <td className="text-center py-2 px-2">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-semibold border ${getStatusColor(item.daysRemaining)}`}
                        >
                          {getStatusLabel(item.daysRemaining)}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-muted-foreground">
                      Tidak ada stok yang akan kedaluwarsa dalam {daysFilter} hari ke depan
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
