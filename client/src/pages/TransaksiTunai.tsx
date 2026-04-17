import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Banknote, Download, FileText } from "lucide-react";
import { formatRupiah } from "../../../shared/finance";
import { exportToPDF, exportToExcel, fmtRp } from "@/lib/export";
import { toast } from "sonner";

export default function TransaksiTunai() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  // Query kas reconciliation
  const { data: kasData, isLoading } = trpc.report.kasReconciliation.useQuery(
    { startDate, endDate },
    { retry: false, enabled: startDate <= endDate }
  );

  // Calculate derived values
  const metrics = useMemo(() => {
    if (!kasData) {
      return {
        kasIn: 0,
        kasOut: 0,
        netKas: 0,
      };
    }
    return {
      kasIn: kasData.totalKasMasuk,
      kasOut: kasData.totalKasKeluar,
      netKas: kasData.netKas,
    };
  }, [kasData]);

  const handleExportPDF = () => {
    if (!kasData) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    const lineItems = [
      {
        no: 1,
        item: "Pendapatan Tunai POS",
        count: kasData.posTransactionCount,
        amount: kasData.pendapatanTunaiPOS,
        category: "KAS MASUK",
      },
      {
        no: 2,
        item: "Pemasukan Tunai Manual",
        count: kasData.manualInCount,
        amount: kasData.pendapatanTunaiManual,
        category: "KAS MASUK",
      },
      {
        no: 3,
        item: "TOTAL KAS MASUK",
        count: kasData.posTransactionCount + kasData.manualInCount,
        amount: kasData.totalKasMasuk,
        category: "KAS MASUK",
        isBold: true,
      },
      {
        no: 4,
        item: "Void/Refund Tunai",
        count: kasData.refundCount,
        amount: kasData.voidTunai,
        category: "KAS KELUAR",
      },
      {
        no: 5,
        item: "Pengeluaran Tunai Manual",
        count: kasData.manualOutCount,
        amount: kasData.pengeluaranTunai,
        category: "KAS KELUAR",
      },
      {
        no: 6,
        item: "Kembalian Pelanggan",
        count: 0,
        amount: kasData.kembalianPelanggan,
        category: "KAS KELUAR",
      },
      {
        no: 7,
        item: "TOTAL KAS KELUAR",
        count: kasData.refundCount + kasData.manualOutCount,
        amount: kasData.totalKasKeluar,
        category: "KAS KELUAR",
        isBold: true,
      },
      {
        no: 8,
        item: "SALDO KAS BERSIH",
        count: 0,
        amount: kasData.netKas,
        category: "SALDO",
        isBold: true,
      },
    ];

    exportToPDF({
      title: "Rekonsiliasi Kas Tunai",
      subtitle: `Periode: ${startDate} — ${endDate}`,
      filename: `Rekonsiliasi_Kas_${startDate}_${endDate}`,
      columns: [
        { header: "No", key: "no", width: 6, align: "center" },
        { header: "Deskripsi", key: "item", width: 40 },
        { header: "Jumlah", key: "count", width: 15, align: "right" },
        {
          header: "Nominal (Rp)",
          key: "amount",
          width: 30,
          align: "right",
          format: fmtRp,
        },
      ],
      data: lineItems.map((item) => ({
        no: item.no,
        item: item.item,
        count: item.count || "-",
        amount: item.amount,
      })),
    });

    toast.success("Laporan PDF berhasil diunduh");
  };

  const handleExportExcel = () => {
    if (!kasData) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    const lineItems = [
      {
        no: 1,
        item: "Pendapatan Tunai POS",
        count: kasData.posTransactionCount,
        amount: kasData.pendapatanTunaiPOS,
        category: "KAS MASUK",
      },
      {
        no: 2,
        item: "Pemasukan Tunai Manual",
        count: kasData.manualInCount,
        amount: kasData.pendapatanTunaiManual,
        category: "KAS MASUK",
      },
      {
        no: 3,
        item: "TOTAL KAS MASUK",
        count: kasData.posTransactionCount + kasData.manualInCount,
        amount: kasData.totalKasMasuk,
        category: "KAS MASUK",
        isBold: true,
      },
      {
        no: 4,
        item: "Void/Refund Tunai",
        count: kasData.refundCount,
        amount: kasData.voidTunai,
        category: "KAS KELUAR",
      },
      {
        no: 5,
        item: "Pengeluaran Tunai Manual",
        count: kasData.manualOutCount,
        amount: kasData.pengeluaranTunai,
        category: "KAS KELUAR",
      },
      {
        no: 6,
        item: "Kembalian Pelanggan",
        count: 0,
        amount: kasData.kembalianPelanggan,
        category: "KAS KELUAR",
      },
      {
        no: 7,
        item: "TOTAL KAS KELUAR",
        count: kasData.refundCount + kasData.manualOutCount,
        amount: kasData.totalKasKeluar,
        category: "KAS KELUAR",
        isBold: true,
      },
      {
        no: 8,
        item: "SALDO KAS BERSIH",
        count: 0,
        amount: kasData.netKas,
        category: "SALDO",
        isBold: true,
      },
    ];

    exportToExcel({
      title: "Rekonsiliasi Kas Tunai",
      subtitle: `Periode: ${startDate} — ${endDate}`,
      filename: `Rekonsiliasi_Kas_${startDate}_${endDate}`,
      columns: [
        { header: "No", key: "no", width: 6 },
        { header: "Deskripsi", key: "item", width: 40 },
        { header: "Jumlah", key: "count", width: 15 },
        {
          header: "Nominal (Rp)",
          key: "amount",
          width: 30,
          format: fmtRp,
        },
      ],
      data: lineItems.map((item) => ({
        no: item.no,
        item: item.item,
        count: item.count || "-",
        amount: item.amount,
      })),
    });

    toast.success("Laporan Excel berhasil diunduh");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Banknote className="h-5 w-5 text-amber-600" />
            Rekonsiliasi Kas Tunai
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Laporan pemasukan dan pengeluaran kas tunai harian
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
                disabled={isLoading || !kasData}
              >
                <FileText className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportExcel}
                disabled={isLoading || !kasData}
              >
                <Download className="h-4 w-4 mr-2" />
                Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : !kasData ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              Tidak ada data kas untuk periode ini
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* KAS MASUK Section */}
          <Card className="border-green-200">
            <CardHeader className="bg-green-50 border-b border-green-200">
              <CardTitle className="text-base text-green-900">KAS MASUK</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {/* Pendapatan Tunai POS */}
              <div className="flex justify-between items-start pb-4 border-b">
                <div>
                  <p className="font-semibold text-sm">Pendapatan Tunai POS</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {kasData.posTransactionCount} transaksi
                  </p>
                </div>
                <p className="text-xl font-bold text-green-700">
                  {formatRupiah(kasData.pendapatanTunaiPOS)}
                </p>
              </div>

              {/* Pemasukan Tunai Manual */}
              <div className="flex justify-between items-start pb-4 border-b">
                <div>
                  <p className="font-semibold text-sm">Pemasukan Tunai Manual</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {kasData.manualInCount} entri
                  </p>
                </div>
                <p className="text-xl font-bold text-green-700">
                  {formatRupiah(kasData.pendapatanTunaiManual)}
                </p>
              </div>

              {/* Total Kas Masuk */}
              <div className="flex justify-between items-start pt-2 bg-green-50 p-4 rounded-lg">
                <p className="font-bold text-base">Total Kas Masuk</p>
                <p className="text-2xl font-bold text-green-700">
                  {formatRupiah(kasData.totalKasMasuk)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* KAS KELUAR Section */}
          <Card className="border-red-200">
            <CardHeader className="bg-red-50 border-b border-red-200">
              <CardTitle className="text-base text-red-900">KAS KELUAR</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {/* Void/Refund Tunai */}
              <div className="flex justify-between items-start pb-4 border-b">
                <div>
                  <p className="font-semibold text-sm">Void/Refund Tunai</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {kasData.refundCount} transaksi
                  </p>
                </div>
                <p className="text-xl font-bold text-red-700">
                  {formatRupiah(kasData.voidTunai)}
                </p>
              </div>

              {/* Pengeluaran Tunai Manual */}
              <div className="flex justify-between items-start pb-4 border-b">
                <div>
                  <p className="font-semibold text-sm">Pengeluaran Tunai Manual</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {kasData.manualOutCount} entri
                  </p>
                </div>
                <p className="text-xl font-bold text-red-700">
                  {formatRupiah(kasData.pengeluaranTunai)}
                </p>
              </div>

              {/* Kembalian Pelanggan */}
              <div className="flex justify-between items-start pb-4 border-b">
                <div>
                  <p className="font-semibold text-sm">Kembalian Pelanggan</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    perubahan pembulatan & kembalian uang
                  </p>
                </div>
                <p className="text-xl font-bold text-red-700">
                  {formatRupiah(kasData.kembalianPelanggan)}
                </p>
              </div>

              {/* Total Kas Keluar */}
              <div className="flex justify-between items-start pt-2 bg-red-50 p-4 rounded-lg">
                <p className="font-bold text-base">Total Kas Keluar</p>
                <p className="text-2xl font-bold text-red-700">
                  {formatRupiah(kasData.totalKasKeluar)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* SALDO KAS BERSIH Section */}
          <Card
            className={`border-2 ${
              metrics.netKas >= 0 ? "border-blue-300" : "border-orange-300"
            }`}
          >
            <CardHeader
              className={`${
                metrics.netKas >= 0 ? "bg-blue-50" : "bg-orange-50"
              } border-b ${metrics.netKas >= 0 ? "border-blue-200" : "border-orange-200"}`}
            >
              <CardTitle className={`text-base ${
                metrics.netKas >= 0 ? "text-blue-900" : "text-orange-900"
              }`}>
                SALDO KAS BERSIH
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-8 pb-8">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Total Kas Masuk - Total Kas Keluar
                </p>
                <p className={`text-5xl font-bold ${
                  metrics.netKas >= 0 ? "text-blue-700" : "text-orange-700"
                }`}>
                  {formatRupiah(metrics.netKas)}
                </p>
                <p className="text-xs text-muted-foreground mt-4">
                  {metrics.netKas >= 0
                    ? "Saldo kas positif"
                    : "Saldo kas defisit"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Summary Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ringkasan Rekonsiliasi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left font-semibold text-xs">Deskripsi</th>
                      <th className="px-4 py-3 text-right font-semibold text-xs">Jumlah</th>
                      <th className="px-4 py-3 text-right font-semibold text-xs">Nominal (Rp)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* KAS MASUK Group */}
                    <tr className="bg-green-50 border-b">
                      <td colSpan={3} className="px-4 py-2 font-bold text-green-900 text-xs">
                        KAS MASUK
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-4 py-2">Pendapatan Tunai POS</td>
                      <td className="px-4 py-2 text-right text-xs">{kasData.posTransactionCount}</td>
                      <td className="px-4 py-2 text-right font-semibold">
                        {formatRupiah(kasData.pendapatanTunaiPOS)}
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-4 py-2">Pemasukan Tunai Manual</td>
                      <td className="px-4 py-2 text-right text-xs">{kasData.manualInCount}</td>
                      <td className="px-4 py-2 text-right font-semibold">
                        {formatRupiah(kasData.pendapatanTunaiManual)}
                      </td>
                    </tr>
                    <tr className="bg-green-100 font-bold border-b-2">
                      <td className="px-4 py-2">TOTAL KAS MASUK</td>
                      <td className="px-4 py-2 text-right">-</td>
                      <td className="px-4 py-2 text-right text-green-700">
                        {formatRupiah(kasData.totalKasMasuk)}
                      </td>
                    </tr>

                    {/* KAS KELUAR Group */}
                    <tr className="bg-red-50 border-b">
                      <td colSpan={3} className="px-4 py-2 font-bold text-red-900 text-xs">
                        KAS KELUAR
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-4 py-2">Void/Refund Tunai</td>
                      <td className="px-4 py-2 text-right text-xs">{kasData.refundCount}</td>
                      <td className="px-4 py-2 text-right font-semibold">
                        {formatRupiah(kasData.voidTunai)}
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-4 py-2">Pengeluaran Tunai Manual</td>
                      <td className="px-4 py-2 text-right text-xs">{kasData.manualOutCount}</td>
                      <td className="px-4 py-2 text-right font-semibold">
                        {formatRupiah(kasData.pengeluaranTunai)}
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-4 py-2">Kembalian Pelanggan</td>
                      <td className="px-4 py-2 text-right text-xs">-</td>
                      <td className="px-4 py-2 text-right font-semibold">
                        {formatRupiah(kasData.kembalianPelanggan)}
                      </td>
                    </tr>
                    <tr className="bg-red-100 font-bold border-b-2">
                      <td className="px-4 py-2">TOTAL KAS KELUAR</td>
                      <td className="px-4 py-2 text-right">-</td>
                      <td className="px-4 py-2 text-right text-red-700">
                        {formatRupiah(kasData.totalKasKeluar)}
                      </td>
                    </tr>

                    {/* SALDO Group */}
                    <tr
                      className={`${
                        metrics.netKas >= 0 ? "bg-blue-100" : "bg-orange-100"
                      } font-bold border-t-2`}
                    >
                      <td className="px-4 py-3">SALDO KAS BERSIH</td>
                      <td className="px-4 py-3 text-right">-</td>
                      <td
                        className={`px-4 py-3 text-right text-lg ${
                          metrics.netKas >= 0 ? "text-blue-700" : "text-orange-700"
                        }`}
                      >
                        {formatRupiah(metrics.netKas)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
