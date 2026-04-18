import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronUp, Download, FileText } from "lucide-react";
import { formatRupiah } from "../../../shared/finance";
import { exportToPDF, exportToExcel, fmtRp, fmtDate } from "@/lib/export";
import { toast } from "sonner";

export default function ValuasiFIFO() {
  const { data: reportData, isLoading } = trpc.report.fifoValuation.useQuery();
  const [expandedProducts, setExpandedProducts] = useState<Set<number>>(new Set());

  const toggleProduct = (productId: number) => {
    const newExpanded = new Set(expandedProducts);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
    }
    setExpandedProducts(newExpanded);
  };

  const metrics = useMemo(() => {
    if (!reportData) return { totalValue: 0, totalProducts: 0, avgCost: 0 };
    const totalValue = reportData.reduce((sum, p) => sum + p.totalValue, 0);
    const totalProducts = reportData.length;
    const totalQty = reportData.reduce((sum, p) => sum + p.totalQty, 0);
    const avgCost = totalQty > 0 ? totalValue / totalQty : 0;
    return { totalValue, totalProducts, avgCost };
  }, [reportData]);

  const handleExportPDF = () => {
    if (!reportData || reportData.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    const flatData = reportData.flatMap((product) =>
      product.batches.map((batch, idx) => ({
        no: idx + 1,
        productName: product.productName,
        sku: product.sku || "-",
        batchCode: batch.batchCode || "-",
        purchaseDate: batch.purchaseDate,
        costPrice: batch.costPrice,
        remainingQty: batch.remainingQty,
        totalValue: batch.totalValue,
      }))
    );

    exportToPDF({
      title: "Valuasi FIFO Persediaan",
      subtitle: `Total Nilai: ${formatRupiah(metrics.totalValue)}`,
      filename: `Valuasi_FIFO_${new Date().toISOString().slice(0, 10)}`,
      columns: [
        { header: "No", key: "no", width: 6, align: "center" },
        { header: "Produk", key: "productName", width: 25 },
        { header: "SKU", key: "sku", width: 15 },
        { header: "Batch", key: "batchCode", width: 15 },
        { header: "Tanggal Beli", key: "purchaseDate", width: 14, format: fmtDate },
        { header: "HPP/Unit (Rp)", key: "costPrice", width: 16, align: "right", format: fmtRp },
        { header: "Sisa Qty", key: "remainingQty", width: 12, align: "right" },
        { header: "Total Nilai (Rp)", key: "totalValue", width: 18, align: "right", format: fmtRp },
      ],
      data: flatData,
      summaryRow: {
        no: "",
        productName: "TOTAL",
        sku: "",
        batchCode: "",
        purchaseDate: "",
        costPrice: 0,
        remainingQty: reportData.reduce((sum, p) => sum + p.totalQty, 0),
        totalValue: metrics.totalValue,
      },
    });

    toast.success("Laporan PDF berhasil diunduh");
  };

  const handleExportExcel = () => {
    if (!reportData || reportData.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    const flatData = reportData.flatMap((product) =>
      product.batches.map((batch, idx) => ({
        no: idx + 1,
        productName: product.productName,
        sku: product.sku || "-",
        batchCode: batch.batchCode || "-",
        purchaseDate: batch.purchaseDate,
        costPrice: batch.costPrice,
        remainingQty: batch.remainingQty,
        totalValue: batch.totalValue,
      }))
    );

    exportToExcel({
      title: "Valuasi FIFO Persediaan",
      subtitle: `Total Nilai: ${formatRupiah(metrics.totalValue)}`,
      filename: `Valuasi_FIFO_${new Date().toISOString().slice(0, 10)}`,
      columns: [
        { header: "No", key: "no", width: 6 },
        { header: "Produk", key: "productName", width: 25 },
        { header: "SKU", key: "sku", width: 15 },
        { header: "Batch", key: "batchCode", width: 15 },
        { header: "Tanggal Beli", key: "purchaseDate", width: 14, format: fmtDate },
        { header: "HPP/Unit (Rp)", key: "costPrice", width: 16, format: fmtRp },
        { header: "Sisa Qty", key: "remainingQty", width: 12 },
        { header: "Total Nilai (Rp)", key: "totalValue", width: 18, format: fmtRp },
      ],
      data: flatData,
      summaryRow: {
        no: "",
        productName: "TOTAL",
        sku: "",
        batchCode: "",
        purchaseDate: "",
        costPrice: 0,
        remainingQty: reportData.reduce((sum, p) => sum + p.totalQty, 0),
        totalValue: metrics.totalValue,
      },
    });

    toast.success("Laporan Excel berhasil diunduh");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold">Valuasi FIFO Persediaan</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Laporan perhitungan nilai persediaan dengan metode FIFO
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
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Nilai Persediaan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatRupiah(metrics.totalValue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Jumlah Produk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalProducts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rata-rata HPP
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatRupiah(metrics.avgCost)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Products List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detail Produk & Batch</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {reportData && reportData.length > 0 ? (
              reportData.map((product) => (
                <div key={product.productId} className="border rounded-lg overflow-hidden">
                  {/* Product Header */}
                  <button
                    onClick={() => toggleProduct(product.productId)}
                    className="w-full px-4 py-3 bg-muted hover:bg-muted/80 flex items-center justify-between text-sm font-medium transition-colors"
                  >
                    <div className="text-left">
                      <div className="font-semibold">{product.productName}</div>
                      <div className="text-xs text-muted-foreground">
                        SKU: {product.sku || "-"} | Stok: {product.totalQty} | Nilai:{" "}
                        {formatRupiah(product.totalValue)}
                      </div>
                    </div>
                    {expandedProducts.has(product.productId) ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>

                  {/* Batches Detail */}
                  {expandedProducts.has(product.productId) && (
                    <div className="p-4 bg-background border-t">
                      <div className="space-y-2">
                        {product.batches.map((batch, idx) => (
                          <div
                            key={idx}
                            className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs p-2 bg-muted/30 rounded"
                          >
                            <div>
                              <div className="text-muted-foreground">Batch</div>
                              <div className="font-medium">{batch.batchCode}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Tanggal Beli</div>
                              <div className="font-medium">{batch.purchaseDate}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">HPP/Unit</div>
                              <div className="font-medium text-right">
                                {formatRupiah(batch.costPrice)}
                              </div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Sisa Qty</div>
                              <div className="font-medium text-right">{batch.remainingQty}</div>
                            </div>
                          </div>
                        ))}
                        <div className="border-t pt-2 font-medium text-sm">
                          Total Nilai: {formatRupiah(product.totalValue)} | Rata-rata HPP:{" "}
                          {formatRupiah(product.weightedAvgCost)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Tidak ada data batch untuk ditampilkan
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
