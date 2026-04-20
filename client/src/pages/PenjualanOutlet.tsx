import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { formatRupiah } from "../../../shared/finance";
import { Download, Store, TrendingUp } from "lucide-react";
import { format, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface Outlet {
  id: number;
  name: string;
}

interface OutletReport {
  outletName: string | null;
  outletId: number | null;
  totalSales: number;
  transactionCount: number;
  avgTransaction: number;
}

export default function PenjualanOutlet() {
  const today = new Date().toISOString().slice(0, 10);
  const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .slice(0, 10);

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(today);
  const [selectedOutletId, setSelectedOutletId] = useState<string>("");

  const { data: outlets } = trpc.outlet.list.useQuery(undefined, { retry: false });

  const { data: reportData, isLoading: isLoadingReport } = trpc.outlet.salesReport.useQuery({
    outletId: selectedOutletId ? parseInt(selectedOutletId) : undefined,
    startDate,
    endDate,
  }, { retry: false });

  const summary = useMemo(() => {
    if (!reportData) return null;

    let totalPenjualan = 0;
    let totalTransaksi = 0;

    for (const outlet of reportData) {
      totalPenjualan += outlet.totalSales;
      totalTransaksi += outlet.transactionCount;
    }

    return {
      totalPenjualan,
      totalTransaksi,
      avgPerTx: totalTransaksi > 0 ? totalPenjualan / totalTransaksi : 0,
    };
  }, [reportData]);

  const handleExportPDF = async () => {
    try {
      const { exportToPDF } = await import("@/lib/export");
      const columns = [
        { header: "Outlet", key: "outlet" },
        { header: "Total Penjualan", key: "totalSales", format: (v: any) => formatRupiah(v) },
        { header: "Jumlah Transaksi", key: "transactionCount" },
        { header: "Rata-rata per Tx", key: "avgTransaction", format: (v: any) => formatRupiah(v) },
      ];
      const data = reportData?.map((o) => ({
        outlet: o.outletName || 'Tanpa Outlet',
        totalSales: o.totalSales,
        transactionCount: o.transactionCount,
        avgTransaction: o.avgTransaction,
      })) || [];
      exportToPDF({
        title: "Laporan Penjualan Per Outlet",
        subtitle: `Periode: ${format(parseISO(startDate), "d MMM yyyy", { locale: idLocale })} - ${format(parseISO(endDate), "d MMM yyyy", { locale: idLocale })}`,
        columns, data,
        filename: `Laporan-Penjualan-Outlet-${startDate}`,
      });
    } catch (error) {
      console.error("Export PDF error:", error);
    }
  };

  const handleExportExcel = async () => {
    try {
      const { exportToExcel } = await import("@/lib/export");
      const columns = [
        { header: "Outlet", key: "outlet" },
        { header: "Total Penjualan", key: "totalSales", format: (v: any) => formatRupiah(v) },
        { header: "Jumlah Transaksi", key: "transactionCount" },
        { header: "Rata-rata per Tx", key: "avgTransaction", format: (v: any) => formatRupiah(v) },
      ];
      const data = reportData?.map((o) => ({
        outlet: o.outletName || 'Tanpa Outlet',
        totalSales: o.totalSales,
        transactionCount: o.transactionCount,
        avgTransaction: o.avgTransaction,
      })) || [];
      exportToExcel({
        title: "Laporan Penjualan Per Outlet",
        columns, data,
        filename: `Laporan-Penjualan-Outlet-${startDate}`,
      });
    } catch (error) {
      console.error("Export Excel error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />
            <h1 className="text-3xl font-bold text-slate-900">
              Laporan Penjualan Per Outlet
            </h1>
          </div>
          <p className="text-slate-600">
            Analisis performa penjualan untuk setiap lokasi outlet
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filter Laporan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="startDate">Tanggal Mulai</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="endDate">Tanggal Akhir</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="outlet">Outlet</Label>
                <Select value={selectedOutletId} onValueChange={setSelectedOutletId}>
                  <SelectTrigger id="outlet">
                    <SelectValue placeholder="Semua Outlet" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Semua Outlet</SelectItem>
                    {outlets?.map((outlet: Outlet) => (
                      <SelectItem key={outlet.id} value={outlet.id.toString()}>
                        {outlet.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2">
                <Button
                  onClick={handleExportPDF}
                  disabled={isLoadingReport}
                  className="flex-1 gap-2 bg-red-600 hover:bg-red-700"
                >
                  <Download className="w-4 h-4" />
                  PDF
                </Button>
                <Button
                  onClick={handleExportExcel}
                  disabled={isLoadingReport}
                  className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                >
                  <Download className="w-4 h-4" />
                  Excel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600">
                  Total Penjualan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatRupiah(summary.totalPenjualan)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600">
                  Jumlah Outlet
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {reportData?.length || 0}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600">
                  Jumlah Transaksi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {summary.totalTransaksi}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600">
                  Rata-rata per Transaksi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {formatRupiah(summary.avgPerTx)}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Comparison Table */}
        <Card>
          <CardHeader>
            <CardTitle>Perbandingan Outlet</CardTitle>
            <CardDescription>
              Rincian penjualan untuk setiap outlet pada periode terpilih
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingReport ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-slate-500">Memuat data...</p>
              </div>
            ) : reportData && reportData.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Outlet</TableHead>
                      <TableHead className="text-right">
                        Total Penjualan
                      </TableHead>
                      <TableHead className="text-right">Transaksi</TableHead>
                      <TableHead className="text-right">
                        Rata-rata per Tx
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.map((outlet, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Store className="w-4 h-4 text-slate-400" />
                            {outlet.outletName || 'Tanpa Outlet'}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatRupiah(outlet.totalSales)}
                        </TableCell>
                        <TableCell className="text-right">
                          {outlet.transactionCount}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatRupiah(outlet.avgTransaction)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <p className="text-slate-500">Tidak ada data untuk periode ini</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
