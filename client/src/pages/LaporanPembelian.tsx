import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ShoppingCart, Package, Truck, Banknote, FileDown, Sheet,
  ArrowUpDown, ChevronDown, ChevronUp, Search, TrendingUp,
  CheckCircle2, Clock, AlertCircle, Hash, Layers, User,
} from "lucide-react";
import { formatRupiah } from "../../../shared/finance";
import { exportToPDF, exportToExcel, fmtRp, ExportColumn } from "@/lib/export";
import { toast } from "sonner";

const BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

function formatTanggal(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
}

type SortKey = "date" | "amount" | "supplier" | "product";

export default function LaporanPembelian() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const firstOfMonth = useMemo(() => today.slice(0, 8) + "01", [today]);
  const [startDate, setStartDate] = useState(firstOfMonth);
  const [endDate, setEndDate] = useState(today);
  const [sortBy, setSortBy] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSection, setExpandedSection] = useState<"supplier" | "product" | null>(null);

  const { data: report, isLoading } = trpc.report.purchaseReport.useQuery(
    { startDate, endDate },
    { retry: false, enabled: startDate <= endDate }
  );

  const filteredItems = useMemo(() => {
    if (!report?.items) return [];
    let items = [...report.items];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(i =>
        i.poNumber.toLowerCase().includes(q) ||
        i.supplierName.toLowerCase().includes(q) ||
        i.productName.toLowerCase().includes(q) ||
        (i.category || "").toLowerCase().includes(q) ||
        (i.notes || "").toLowerCase().includes(q) ||
        (i.description || "").toLowerCase().includes(q)
      );
    }

    // Sort
    items.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case "date": cmp = a.date.localeCompare(b.date); break;
        case "amount": cmp = a.totalPrice - b.totalPrice; break;
        case "supplier": cmp = a.supplierName.localeCompare(b.supplierName); break;
        case "product": cmp = a.productName.localeCompare(b.productName); break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return items;
  }, [report, searchQuery, sortBy, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortBy(key);
      setSortDir("desc");
    }
  };

  const SortIcon = ({ field }: { field: SortKey }) => {
    if (sortBy !== field) return <ArrowUpDown className="h-3 w-3 opacity-30" />;
    return sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />;
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "paid": return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[10px]">Lunas</Badge>;
      case "partial": return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 text-[10px]">Sebagian</Badge>;
      case "unpaid": return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px]">Belum</Badge>;
      default: return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
    }
  };

  const receiptBadge = (status: string) => {
    switch (status) {
      case "received": return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[10px]">Diterima</Badge>;
      case "partial": return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 text-[10px]">Sebagian</Badge>;
      case "pending": return <Badge className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 text-[10px]">Pending</Badge>;
      default: return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
    }
  };

  // Export handlers
  const handleExportPDF = () => {
    if (!filteredItems.length) return;
    const columns: ExportColumn[] = [
      { header: "No. PO", key: "poNumber", width: 18 },
      { header: "Tanggal", key: "date", width: 14, format: (v: string) => formatTanggal(v) },
      { header: "Supplier", key: "supplierName", width: 20 },
      { header: "Nama Barang", key: "productName", width: 22 },
      { header: "Kategori", key: "category", width: 14, format: (v: any) => v || "-" },
      { header: "Qty", key: "qty", width: 6, align: "right" as const },
      { header: "Harga Satuan", key: "unitPrice", width: 16, align: "right" as const, format: (v: number) => fmtRp(v) },
      { header: "Total", key: "totalPrice", width: 16, align: "right" as const, format: (v: number) => fmtRp(v) },
      { header: "Bayar", key: "paymentStatus", width: 10 },
      { header: "Catatan", key: "notes", width: 20, format: (v: any) => v || "-" },
    ];
    exportToPDF({
      title: "Rincian Pembelian per Barang",
      subtitle: `Dari ${formatTanggal(startDate)} s/d ${formatTanggal(endDate)}`,
      columns,
      data: filteredItems,
      filename: `laporan-pembelian-${startDate}-${endDate}`,
    });
    toast.success("PDF berhasil diexport");
  };

  const handleExportExcel = () => {
    if (!filteredItems.length) return;
    const columns: ExportColumn[] = [
      { header: "Nomor PO", key: "poNumber", width: 20 },
      { header: "Tanggal", key: "date", width: 14, format: (v: string) => formatTanggal(v) },
      { header: "Supplier", key: "supplierName", width: 25 },
      { header: "Telepon Supplier", key: "supplierPhone", width: 18, format: (v: any) => v || "-" },
      { header: "Keterangan", key: "description", width: 25, format: (v: any) => v || "-" },
      { header: "Nama Barang", key: "productName", width: 25 },
      { header: "SKU", key: "sku", width: 15, format: (v: any) => v || "-" },
      { header: "Kategori", key: "category", width: 15, format: (v: any) => v || "-" },
      { header: "Kuantitas", key: "qty", width: 10 },
      { header: "Harga Satuan", key: "unitPrice", width: 16, format: (v: number) => fmtRp(v) },
      { header: "Total Pembelian", key: "totalPrice", width: 16, format: (v: number) => fmtRp(v) },
      { header: "Qty Diterima", key: "receivedQty", width: 12 },
      { header: "Status Bayar", key: "paymentStatus", width: 12 },
      { header: "Status Terima", key: "receiptStatus", width: 12 },
      { header: "Catatan", key: "notes", width: 25, format: (v: any) => v || "-" },
    ];
    exportToExcel({
      title: "Rincian Pembelian per Barang",
      subtitle: `Dari ${formatTanggal(startDate)} s/d ${formatTanggal(endDate)}`,
      columns,
      data: filteredItems,
      filename: `laporan-pembelian-${startDate}-${endDate}`,
    });
    toast.success("Excel berhasil diexport");
  };

  const summary = report?.summary;

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Rincian Pembelian per Barang</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Laporan pembelian detail per item — format Accurate</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleExportPDF} disabled={!filteredItems.length} className="gap-1 h-8 text-xs">
            <FileDown className="h-3.5 w-3.5" /> PDF
          </Button>
          <Button size="sm" variant="outline" onClick={handleExportExcel} disabled={!filteredItems.length} className="gap-1 h-8 text-xs">
            <Sheet className="h-3.5 w-3.5" /> Excel
          </Button>
        </div>
      </div>

      {/* Date Range + Search */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex items-center gap-2">
          <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-8 text-xs w-36" />
          <span className="text-xs text-muted-foreground">s/d</span>
          <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-8 text-xs w-36" />
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Cari PO, supplier, barang, kategori..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="h-8 text-xs pl-8"
          />
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
        </div>
      )}

      {!isLoading && summary && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Total PO", value: summary.totalPOs.toString(), icon: Hash, color: "text-blue-600" },
              { label: "Total Item", value: summary.totalItems.toString(), icon: Package, color: "text-purple-600" },
              { label: "Total Qty", value: summary.totalQty.toLocaleString("id-ID"), icon: Layers, color: "text-orange-600" },
              { label: "Total Pembelian", value: formatRupiah(summary.totalAmount), icon: ShoppingCart, color: "text-red-600" },
              { label: "Sudah Dibayar", value: formatRupiah(summary.totalPaid), icon: CheckCircle2, color: "text-green-600" },
              { label: "Belum Dibayar", value: formatRupiah(summary.totalUnpaid), icon: AlertCircle, color: "text-red-500" },
              { label: "Supplier", value: (report?.bySupplier?.length || 0).toString(), icon: Truck, color: "text-teal-600" },
              { label: "Produk Dibeli", value: (report?.byProduct?.length || 0).toString(), icon: TrendingUp, color: "text-indigo-600" },
            ].map((kpi, i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{kpi.label}</span>
                  </div>
                  <p className="text-lg font-bold">{kpi.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Breakdown Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* By Supplier */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-3">
                <button
                  className="flex items-center justify-between w-full text-left"
                  onClick={() => setExpandedSection(s => s === "supplier" ? null : "supplier")}
                >
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-teal-600" />
                    <span className="text-sm font-semibold">Per Supplier ({report.bySupplier.length})</span>
                  </div>
                  {expandedSection === "supplier" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {expandedSection === "supplier" && (
                  <div className="mt-3 space-y-2">
                    {report.bySupplier.map((s, i) => (
                      <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-dashed last:border-0">
                        <div>
                          <span className="font-medium">{s.supplierName}</span>
                          <span className="text-muted-foreground ml-2">({s.poCount} PO)</span>
                        </div>
                        <span className="font-semibold">{formatRupiah(s.totalAmount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* By Product */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-3">
                <button
                  className="flex items-center justify-between w-full text-left"
                  onClick={() => setExpandedSection(s => s === "product" ? null : "product")}
                >
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-semibold">Per Produk ({report.byProduct.length})</span>
                  </div>
                  {expandedSection === "product" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {expandedSection === "product" && (
                  <div className="mt-3 space-y-2">
                    {report.byProduct.map((p, i) => (
                      <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-dashed last:border-0">
                        <div>
                          <span className="font-medium">{p.productName}</span>
                          {p.category && <Badge variant="outline" className="ml-1.5 text-[9px] h-4">{p.category}</Badge>}
                          <span className="text-muted-foreground ml-2">({p.totalQty} unit)</span>
                        </div>
                        <span className="font-semibold">{formatRupiah(p.totalAmount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Detail Table — Accurate-style */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <div className="px-4 py-3 border-b flex items-center justify-between">
                <h3 className="text-sm font-semibold">Rincian Pembelian ({filteredItems.length} item)</h3>
                <span className="text-xs text-muted-foreground">
                  Dari {formatTanggal(startDate)} s/d {formatTanggal(endDate)}
                </span>
              </div>

              <ScrollArea className="max-h-[65vh]">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50 sticky top-0">
                      <tr>
                        <th className="text-left px-3 py-2 font-semibold cursor-pointer select-none whitespace-nowrap" onClick={() => handleSort("date")}>
                          <div className="flex items-center gap-1">Nomor # <SortIcon field="date" /></div>
                        </th>
                        <th className="text-left px-3 py-2 font-semibold cursor-pointer select-none whitespace-nowrap" onClick={() => handleSort("date")}>
                          <div className="flex items-center gap-1">Tanggal <SortIcon field="date" /></div>
                        </th>
                        <th className="text-left px-3 py-2 font-semibold cursor-pointer select-none whitespace-nowrap" onClick={() => handleSort("supplier")}>
                          <div className="flex items-center gap-1">Keterangan <SortIcon field="supplier" /></div>
                        </th>
                        <th className="text-left px-3 py-2 font-semibold cursor-pointer select-none whitespace-nowrap" onClick={() => handleSort("product")}>
                          <div className="flex items-center gap-1">Nama Barang <SortIcon field="product" /></div>
                        </th>
                        <th className="text-right px-3 py-2 font-semibold whitespace-nowrap">Kuantitas</th>
                        <th className="text-right px-3 py-2 font-semibold cursor-pointer select-none whitespace-nowrap" onClick={() => handleSort("amount")}>
                          <div className="flex items-center justify-end gap-1">Pembelian <SortIcon field="amount" /></div>
                        </th>
                        <th className="text-left px-3 py-2 font-semibold whitespace-nowrap">Status</th>
                        <th className="text-left px-3 py-2 font-semibold whitespace-nowrap">Catatan</th>
                        <th className="text-left px-3 py-2 font-semibold whitespace-nowrap">Kategori</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredItems.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="text-center py-12 text-muted-foreground">
                            {searchQuery ? "Tidak ada data yang cocok dengan pencarian" : "Belum ada data pembelian pada periode ini"}
                          </td>
                        </tr>
                      ) : (
                        filteredItems.map((item, i) => (
                          <tr key={i} className="border-b hover:bg-muted/30 transition-colors">
                            {/* Nomor PO */}
                            <td className="px-3 py-2.5 font-mono text-[11px] text-blue-600 dark:text-blue-400 whitespace-nowrap">
                              {item.poNumber}
                            </td>
                            {/* Tanggal */}
                            <td className="px-3 py-2.5 whitespace-nowrap">
                              {formatTanggal(item.date)}
                            </td>
                            {/* Keterangan (Supplier + description) */}
                            <td className="px-3 py-2.5 max-w-[200px]">
                              <div className="font-medium">{item.supplierName}</div>
                              {item.supplierPhone && (
                                <div className="text-[10px] text-muted-foreground">{item.supplierPhone}</div>
                              )}
                              {item.description && (
                                <div className="text-[10px] text-muted-foreground truncate">{item.description}</div>
                              )}
                            </td>
                            {/* Nama Barang */}
                            <td className="px-3 py-2.5">
                              <div className="font-medium">{item.productName}</div>
                              {item.sku && <div className="text-[10px] text-muted-foreground">SKU: {item.sku}</div>}
                            </td>
                            {/* Kuantitas */}
                            <td className="px-3 py-2.5 text-right font-medium">
                              {item.qty}
                              {item.receivedQty > 0 && item.receivedQty < item.qty && (
                                <div className="text-[10px] text-yellow-600">({item.receivedQty} diterima)</div>
                              )}
                            </td>
                            {/* Pembelian */}
                            <td className="px-3 py-2.5 text-right font-semibold whitespace-nowrap">
                              {formatRupiah(item.totalPrice)}
                              <div className="text-[10px] text-muted-foreground font-normal">
                                @ {formatRupiah(item.unitPrice)}
                              </div>
                            </td>
                            {/* Status */}
                            <td className="px-3 py-2.5">
                              <div className="flex flex-col gap-0.5">
                                {statusBadge(item.paymentStatus)}
                                {receiptBadge(item.receiptStatus)}
                              </div>
                            </td>
                            {/* Catatan */}
                            <td className="px-3 py-2.5 max-w-[180px] text-muted-foreground">
                              <div className="truncate">{item.notes || "-"}</div>
                            </td>
                            {/* Kategori */}
                            <td className="px-3 py-2.5">
                              {item.category ? (
                                <Badge variant="outline" className="text-[10px]">{item.category}</Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    {filteredItems.length > 0 && (
                      <tfoot className="bg-muted/30 border-t-2">
                        <tr className="font-semibold">
                          <td colSpan={4} className="px-3 py-2.5 text-right">TOTAL</td>
                          <td className="px-3 py-2.5 text-right">
                            {filteredItems.reduce((s, i) => s + i.qty, 0).toLocaleString("id-ID")}
                          </td>
                          <td className="px-3 py-2.5 text-right whitespace-nowrap">
                            {formatRupiah(filteredItems.reduce((s, i) => s + i.totalPrice, 0))}
                          </td>
                          <td colSpan={3}></td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </>
      )}

      {/* Empty state when no report */}
      {!isLoading && !summary && (
        <Card className="border-0 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <ShoppingCart className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-sm font-medium">Belum ada data pembelian</p>
            <p className="text-xs mt-1">Buat Purchase Order terlebih dahulu di menu Gudang</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
