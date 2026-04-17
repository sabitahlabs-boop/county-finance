import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Package, FileDown, Sheet } from "lucide-react";
import { formatRupiah } from "../../../shared/finance";
import { exportToPDF, exportToExcel, fmtRp, ExportColumn } from "@/lib/export";
import { toast } from "sonner";

export default function MutasiPersediaanPage() {
  const [selectedProductId, setSelectedProductId] = useState<number | undefined>();
  const [productSearch, setProductSearch] = useState("");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));

  const { data: products = [] } = trpc.product.list.useQuery();
  const { data: reportData = [], isLoading } = trpc.report.mutasiPersediaan.useQuery(
    {
      productId: selectedProductId,
      startDate,
      endDate,
    },
    { enabled: !!selectedProductId }
  );

  // Filter products by search
  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return products;
    const q = productSearch.toLowerCase();
    return products.filter((p: any) =>
      p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q)
    );
  }, [products, productSearch]);

  const selectedProduct = useMemo(
    () => products.find((p: any) => p.id === selectedProductId),
    [products, selectedProductId]
  );

  const currentReportData = reportData.find((item: any) => item.productId === selectedProductId);

  const calculateSummary = () => {
    if (!currentReportData) {
      return { totalIn: 0, totalOut: 0, endStock: selectedProduct?.stockCurrent ?? 0, inventoryValue: 0 };
    }

    let totalIn = 0;
    let totalOut = 0;
    let endStock = selectedProduct?.stockCurrent ?? 0;
    let inventoryValue = 0;

    for (const movement of currentReportData.movements) {
      if (movement.type === "in" || movement.type === "opening") {
        totalIn += movement.qty;
      } else if (movement.type === "out") {
        totalOut += movement.qty;
      }
    }

    endStock = currentReportData.movements.length > 0
      ? currentReportData.movements[currentReportData.movements.length - 1].stockAfter
      : selectedProduct?.stockCurrent ?? 0;

    inventoryValue = endStock * (selectedProduct?.hpp ?? 0);

    return { totalIn, totalOut, endStock, inventoryValue };
  };

  const summary = calculateSummary();

  const getMovementTypeLabel = (type: string) => {
    switch (type) {
      case "in":
        return "Masuk";
      case "out":
        return "Keluar";
      case "adjustment":
        return "Penyesuaian";
      case "opening":
        return "Awal";
      default:
        return type;
    }
  };

  const getMovementTypeColor = (type: string) => {
    switch (type) {
      case "in":
      case "opening":
        return "text-success";
      case "out":
        return "text-danger";
      case "adjustment":
        return "text-warning";
      default:
        return "";
    }
  };

  const handleExportInventoryMovement = (format: "pdf" | "excel") => {
    if (!currentReportData || !selectedProduct) return;

    const columns: ExportColumn[] = [
      { header: "No", key: "no", width: 8, align: "center" },
      { header: "Tanggal", key: "date", width: 12 },
      { header: "Jenis", key: "type", width: 12 },
      { header: "Qty", key: "qty", width: 10, align: "right" },
      { header: "Harga Masuk (Rp)", key: "priceIn", width: 15, align: "right", format: (v: any) => fmtRp(v) },
      { header: "Harga Keluar (Rp)", key: "priceOut", width: 15, align: "right", format: (v: any) => fmtRp(v) },
      { header: "Stok Sebelum", key: "stockBefore", width: 12, align: "right" },
      { header: "Stok Sesudah", key: "stockAfter", width: 12, align: "right" },
      { header: "Referensi", key: "reference", width: 15 },
    ];

    const data = currentReportData.movements.map((movement: any, idx: number) => ({
      no: idx + 1,
      date: movement.date,
      type: getMovementTypeLabel(movement.type),
      qty: movement.qty,
      priceIn: movement.priceIn,
      priceOut: movement.priceOut,
      stockBefore: movement.stockBefore,
      stockAfter: movement.stockAfter,
      reference: movement.reference,
    }));

    const options = {
      title: "Mutasi Persediaan",
      subtitle: `${selectedProduct.name} (SKU: ${selectedProduct.sku || "-"}) — ${startDate} s/d ${endDate}`,
      columns,
      data,
      filename: `mutasi-persediaan_${selectedProduct.id}_${startDate}_${endDate}`,
      orientation: "landscape" as const,
    };

    if (format === "pdf") {
      exportToPDF(options);
      toast.success("PDF berhasil diunduh");
    } else {
      exportToExcel(options);
      toast.success("Excel berhasil diunduh");
    }
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mutasi Persediaan</h1>
          <p className="text-muted-foreground mt-1">Laporan Pergerakan Stok Produk</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Produk</label>
              <div className="relative">
                <Input
                  placeholder="Cari nama atau SKU..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="mb-2"
                />
                {productSearch && filteredProducts.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-background border rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                    {filteredProducts.slice(0, 10).map((p: any) => (
                      <button
                        key={p.id}
                        className="w-full text-left px-4 py-2 hover:bg-muted transition-colors border-b last:border-b-0 text-sm"
                        onClick={() => {
                          setSelectedProductId(p.id);
                          setProductSearch("");
                        }}
                      >
                        <div className="font-medium">{p.name}</div>
                        {p.sku && <div className="text-xs text-muted-foreground">SKU: {p.sku}</div>}
                      </button>
                    ))}
                  </div>
                )}
                {selectedProductId && selectedProduct && (
                  <div className="flex items-center justify-between rounded-lg bg-primary/10 border border-primary/20 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-primary" />
                      <div>
                        <p className="font-medium text-sm">{selectedProduct.name}</p>
                        {selectedProduct.sku && (
                          <p className="text-xs text-muted-foreground">SKU: {selectedProduct.sku}</p>
                        )}
                      </div>
                    </div>
                    <button
                      className="text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        setSelectedProductId(undefined);
                        setProductSearch("");
                      }}
                    >
                      Ubah
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tanggal Mulai</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tanggal Akhir</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      {selectedProductId && selectedProduct && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground mb-1">Harga Pokok</p>
              <p className="text-lg font-bold text-primary">{formatRupiah(selectedProduct.hpp)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground mb-1">Total Masuk</p>
              <p className="text-lg font-bold text-success">{summary.totalIn}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground mb-1">Total Keluar</p>
              <p className="text-lg font-bold text-danger">{summary.totalOut}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground mb-1">Stok Akhir</p>
              <p className="text-lg font-bold text-primary">{summary.endStock}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground mb-1">Nilai Persediaan</p>
              <p className="text-lg font-bold text-primary">{formatRupiah(summary.inventoryValue)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Table */}
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base">
            {selectedProductId && selectedProduct ? `Mutasi ${selectedProduct.name}` : "Pilih Produk untuk Melihat Detail"}
          </CardTitle>
          {selectedProductId && selectedProduct && currentReportData && currentReportData.movements.length > 0 && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExportInventoryMovement("pdf")}
              >
                <FileDown className="h-4 w-4 mr-1.5" /> PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExportInventoryMovement("excel")}
              >
                <Sheet className="h-4 w-4 mr-1.5" /> Excel
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden flex flex-col">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
            </div>
          ) : !selectedProductId ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground">
              Silakan pilih produk untuk melihat detail mutasi
            </div>
          ) : !currentReportData || currentReportData.movements.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground">
              Tidak ada pergerakan stok dalam periode ini
            </div>
          ) : (
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b sticky top-0">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-xs">No</th>
                    <th className="text-left px-4 py-3 font-medium text-xs">Tanggal</th>
                    <th className="text-left px-4 py-3 font-medium text-xs">Jenis</th>
                    <th className="text-right px-4 py-3 font-medium text-xs">Qty</th>
                    <th className="text-right px-4 py-3 font-medium text-xs">Harga Masuk</th>
                    <th className="text-right px-4 py-3 font-medium text-xs">Harga Keluar</th>
                    <th className="text-right px-4 py-3 font-medium text-xs">Stok Sebelum</th>
                    <th className="text-right px-4 py-3 font-medium text-xs">Stok Sesudah</th>
                    <th className="text-left px-4 py-3 font-medium text-xs">Referensi</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {currentReportData.movements.map((movement: any, idx: number) => (
                    <tr key={idx} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium">{movement.date}</td>
                      <td className={`px-4 py-3 font-medium ${getMovementTypeColor(movement.type)}`}>
                        {getMovementTypeLabel(movement.type)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">{movement.qty}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {formatRupiah(movement.priceIn)}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {formatRupiah(movement.priceOut)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">{movement.stockBefore}</td>
                      <td className="px-4 py-3 text-right font-bold text-primary">{movement.stockAfter}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{movement.reference}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
