import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Factory, Plus, Download, TrendingUp, AlertCircle } from "lucide-react";
import { formatRupiah, BULAN_INDONESIA } from "../../../shared/finance";
import { exportToPDF, exportToExcel, fmtRp, ExportColumn } from "@/lib/export";
import { toast } from "sonner";

export default function ProduksiPage() {
  const now = useMemo(() => new Date(), []);
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedProductId, setSelectedProductId] = useState<number | undefined>();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ productId: "", qty: "", date: now.toISOString().split("T")[0], notes: "" });

  const { data: products, isLoading: productsLoading } = trpc.product.list.useQuery();
  const { data: logs, isLoading: logsLoading, refetch: refetchLogs } = trpc.production.logs.useQuery({
    productId: selectedProductId,
    startDate: `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-01`,
    endDate: `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-31`,
  });
  const { data: costReport, isLoading: reportLoading } = trpc.production.costReport.useQuery({
    startDate: `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-01`,
    endDate: `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-31`,
  });

  const runProductionMutation = trpc.production.run.useMutation();

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: BULAN_INDONESIA[i],
  }));

  const years = Array.from({ length: 5 }, (_, i) => ({
    value: now.getFullYear() - i,
    label: String(now.getFullYear() - i),
  }));

  const handleRunProduction = async () => {
    if (!formData.productId || !formData.qty) {
      toast.error("Lengkapi data produksi");
      return;
    }

    try {
      await runProductionMutation.mutateAsync({
        productId: parseInt(formData.productId),
        qty: parseInt(formData.qty),
        date: formData.date,
        notes: formData.notes || undefined,
      });
      toast.success("Produksi berhasil dicatat");
      setFormData({ productId: "", qty: "", date: now.toISOString().split("T")[0], notes: "" });
      setDialogOpen(false);
      refetchLogs();
    } catch (err: any) {
      toast.error(err.message || "Gagal mencatat produksi");
    }
  };

  const selectedProduct = products?.find(p => p.id === parseInt(formData.productId));
  const materialCost = selectedProduct ? selectedProduct.hpp : 0;
  const projectedTotalCost = parseInt(formData.qty || "0") * materialCost;

  const handleExport = (format: "pdf" | "excel") => {
    if (!costReport || !logs) return;
    const bizName = "Bisnis Saya";
    const columns: ExportColumn[] = [
      { header: "Tanggal", key: "date", width: 12 },
      { header: "Produk", key: "productName", width: 20 },
      { header: "Qty", key: "qtyProduced", width: 10, align: "right" },
      { header: "Total Biaya (Rp)", key: "totalCost", width: 15, align: "right", format: (v: any) => fmtRp(v) },
      { header: "Biaya/Unit (Rp)", key: "costPerUnit", width: 15, align: "right", format: (v: any) => fmtRp(v) },
    ];

    const data = logs?.map(log => ({
      date: log.date,
      productName: log.productName,
      qtyProduced: log.qtyProduced,
      totalCost: log.totalCost,
      costPerUnit: log.costPerUnit,
    })) || [];

    const filename = `laporan-produksi_${BULAN_INDONESIA[selectedMonth - 1]}_${selectedYear}`;
    const options = {
      title: "Laporan Produksi",
      subtitle: `${bizName} — ${BULAN_INDONESIA[selectedMonth - 1]} ${selectedYear}`,
      columns,
      data,
      filename,
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
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Factory className="h-8 w-8 text-green-600" />
          <div>
            <h1 className="text-3xl font-bold">Manajemen Produksi</h1>
            <p className="text-gray-600">Catat dan pantau batch produksi dengan biaya material</p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4" />
              Jalankan Produksi
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Catat Produksi Baru</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Produk</label>
                <Select value={formData.productId} onValueChange={(v) => setFormData({...formData, productId: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih produk..." />
                  </SelectTrigger>
                  <SelectContent>
                    {products?.map(p => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedProduct && (
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                  <p className="text-sm text-gray-600">Biaya Material/Unit</p>
                  <p className="text-lg font-bold text-blue-600">{formatRupiah(materialCost)}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Jumlah Diproduksi</label>
                <Input
                  type="number"
                  min="1"
                  value={formData.qty}
                  onChange={(e) => setFormData({...formData, qty: e.target.value})}
                  placeholder="Jumlah unit"
                />
              </div>

              {selectedProduct && formData.qty && (
                <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                  <p className="text-sm text-gray-600">Total Biaya Material</p>
                  <p className="text-lg font-bold text-green-600">{formatRupiah(projectedTotalCost)}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Tanggal Produksi</label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Catatan (Opsional)</label>
                <Input
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Catatan batch, QC, dll..."
                />
              </div>

              <Button
                onClick={handleRunProduction}
                disabled={runProductionMutation.isPending || !formData.productId || !formData.qty}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {runProductionMutation.isPending ? "Menyimpan..." : "Catat Produksi"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {months.map(m => (
              <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(parseInt(v))}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map(y => (
              <SelectItem key={y.value} value={String(y.value)}>{y.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedProductId ? String(selectedProductId) : ""} onValueChange={(v) => setSelectedProductId(v ? parseInt(v) : undefined)}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Filter produk..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Semua Produk</SelectItem>
            {products?.map(p => (
              <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      {costReport && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Diproduksi</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{costReport.totalProduced.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">unit</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Biaya</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{formatRupiah(costReport.totalCost)}</p>
              <p className="text-xs text-gray-500 mt-1">material</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Rata-rata Cost/Unit</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">{formatRupiah(costReport.avgCostPerUnit)}</p>
              <p className="text-xs text-gray-500 mt-1">per unit</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* By Product Summary */}
      {costReport && costReport.byProduct.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ringkasan per Produk</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produk</TableHead>
                  <TableHead className="text-right">Qty Produksi</TableHead>
                  <TableHead className="text-right">Total Biaya</TableHead>
                  <TableHead className="text-right">Biaya/Unit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {costReport.byProduct.map((item) => (
                  <TableRow key={item.productId}>
                    <TableCell className="font-medium">{item.productName}</TableCell>
                    <TableCell className="text-right">{item.qtyProduced.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{formatRupiah(item.totalCost)}</TableCell>
                    <TableCell className="text-right">{formatRupiah(item.avgCostPerUnit)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Production Logs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle>Log Produksi</CardTitle>
            <CardDescription>Riwayat batch produksi {BULAN_INDONESIA[selectedMonth - 1]} {selectedYear}</CardDescription>
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
        </CardHeader>
        <CardContent>
          {logsLoading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : logs && logs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Produk</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Total Biaya</TableHead>
                  <TableHead className="text-right">Biaya/Unit</TableHead>
                  <TableHead>Catatan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-sm">{log.date}</TableCell>
                    <TableCell className="font-medium">{log.productName}</TableCell>
                    <TableCell className="text-right">{log.qtyProduced.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{formatRupiah(log.totalCost)}</TableCell>
                    <TableCell className="text-right text-sm">{formatRupiah(log.costPerUnit)}</TableCell>
                    <TableCell className="text-xs text-gray-600">{log.notes || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Belum ada log produksi untuk periode ini</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
