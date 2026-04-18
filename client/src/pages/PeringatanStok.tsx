import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, FileText, AlertTriangle, Info } from "lucide-react";
import { formatRupiah } from "../../../shared/finance";
import { exportToPDF, exportToExcel, fmtRp } from "@/lib/export";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function PeringatanStok() {
  const [, navigate] = useLocation();
  const { data: reportData, isLoading } = trpc.report.lowStockAlerts.useQuery();

  const metrics = useMemo(() => {
    if (!reportData) return { critical: 0, warning: 0, total: 0 };

    const critical = reportData.filter((a) => a.currentStock <= (a.safetyStock || 0)).length;
    const warning = reportData.filter((a) => a.currentStock > (a.safetyStock || 0) && a.currentStock <= (a.reorderPoint || 0)).length;

    return {
      critical,
      warning,
      total: reportData.length,
    };
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
      reorderPoint: item.reorderPoint,
      safetyStock: item.safetyStock,
      leadTimeDays: item.leadTimeDays,
      daysUntilStockout: item.daysUntilStockout,
      suggestedOrderQty: item.suggestedOrderQty,
    }));

    exportToPDF({
      title: "Peringatan Stok Rendah",
      subtitle: `Total Alert: ${reportData.length} | Kritis: ${metrics.critical} | Warning: ${metrics.warning}`,
      filename: `Peringatan_Stok_${new Date().toISOString().slice(0, 10)}`,
      columns: [
        { header: "No", key: "no", width: 6, align: "center" },
        { header: "Produk", key: "productName", width: 20 },
        { header: "SKU", key: "sku", width: 12 },
        { header: "Stok Sekarang", key: "currentStock", width: 12, align: "right" },
        { header: "Reorder Point", key: "reorderPoint", width: 12, align: "right" },
        { header: "Safety Stock", key: "safetyStock", width: 12, align: "right" },
        { header: "Lead Time (hari)", key: "leadTimeDays", width: 12, align: "right" },
        { header: "Hari Hingga Habis", key: "daysUntilStockout", width: 14, align: "right" },
        { header: "Suggested Order Qty", key: "suggestedOrderQty", width: 14, align: "right" },
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
      reorderPoint: item.reorderPoint,
      safetyStock: item.safetyStock,
      leadTimeDays: item.leadTimeDays,
      daysUntilStockout: item.daysUntilStockout,
      suggestedOrderQty: item.suggestedOrderQty,
    }));

    exportToExcel({
      title: "Peringatan Stok Rendah",
      subtitle: `Total Alert: ${reportData.length} | Kritis: ${metrics.critical} | Warning: ${metrics.warning}`,
      filename: `Peringatan_Stok_${new Date().toISOString().slice(0, 10)}`,
      columns: [
        { header: "No", key: "no", width: 6 },
        { header: "Produk", key: "productName", width: 20 },
        { header: "SKU", key: "sku", width: 12 },
        { header: "Stok Sekarang", key: "currentStock", width: 12 },
        { header: "Reorder Point", key: "reorderPoint", width: 12 },
        { header: "Safety Stock", key: "safetyStock", width: 12 },
        { header: "Lead Time (hari)", key: "leadTimeDays", width: 12 },
        { header: "Hari Hingga Habis", key: "daysUntilStockout", width: 14 },
        { header: "Suggested Order Qty", key: "suggestedOrderQty", width: 14 },
      ],
      data,
    });

    toast.success("Laporan Excel berhasil diunduh");
  };

  const getAlertLevel = (alert: any) => {
    if (alert.currentStock <= (alert.safetyStock || 0)) {
      return "critical";
    }
    if (alert.currentStock <= (alert.reorderPoint || 0)) {
      return "warning";
    }
    return "info";
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
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Peringatan Stok Rendah
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Dashboard peringatan stok dengan rekomendasi pemesanan
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-700">Kritis (Safety)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">{metrics.critical}</div>
            <div className="text-xs text-red-700 mt-1">Segera pesan</div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700">
              Warning (Reorder)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-900">{metrics.warning}</div>
            <div className="text-xs text-yellow-700 mt-1">Pertimbangkan pemesanan</div>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Total Alert</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{metrics.total}</div>
            <div className="text-xs text-blue-700 mt-1">Produk memerlukan perhatian</div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daftar Alert Stok</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {reportData && reportData.length > 0 ? (
              reportData.map((alert, idx) => {
                const level = getAlertLevel(alert);
                const bgColor =
                  level === "critical"
                    ? "bg-red-50 border-red-200"
                    : level === "warning"
                      ? "bg-yellow-50 border-yellow-200"
                      : "bg-blue-50 border-blue-200";

                const levelLabel =
                  level === "critical" ? "KRITIS" : level === "warning" ? "WARNING" : "INFO";
                const levelColor =
                  level === "critical"
                    ? "text-red-900 bg-red-100"
                    : level === "warning"
                      ? "text-yellow-900 bg-yellow-100"
                      : "text-blue-900 bg-blue-100";

                return (
                  <div key={idx} className={`border rounded-lg p-4 ${bgColor}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-sm">{alert.productName}</h3>
                        <p className="text-xs text-muted-foreground">SKU: {alert.sku || "-"}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-bold ${levelColor}`}>
                        {levelLabel}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                      <div>
                        <div className="text-xs text-muted-foreground">Stok Sekarang</div>
                        <div className="font-semibold text-sm">{alert.currentStock} pcs</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Reorder Point</div>
                        <div className="font-semibold text-sm">{alert.reorderPoint} pcs</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Safety Stock</div>
                        <div className="font-semibold text-sm">{alert.safetyStock} pcs</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Lead Time</div>
                        <div className="font-semibold text-sm">{alert.leadTimeDays} hari</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3 pb-3 border-t">
                      <div>
                        <div className="text-xs text-muted-foreground mt-2">
                          Estimasi Habis
                        </div>
                        <div className="font-semibold text-sm">
                          {alert.daysUntilStockout < 0
                            ? "Sudah Habis"
                            : `${alert.daysUntilStockout} hari`}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mt-2">
                          Qty Pemesanan
                        </div>
                        <div className="font-semibold text-sm">{alert.suggestedOrderQty} pcs</div>
                      </div>
                      <div className="flex items-end">
                        <Button
                          size="sm"
                          variant="default"
                          className="w-full"
                          onClick={() =>
                            navigate(
                              `/purchase-order?productId=${alert.productId}&qty=${alert.suggestedOrderQty}`
                            )
                          }
                        >
                          Buat PO
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12">
                <Info className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">Tidak ada produk yang perlu peringatan stok</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Semua stok produk dalam kondisi sehat
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
