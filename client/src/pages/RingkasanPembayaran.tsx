import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CreditCard, Download, FileText } from "lucide-react";
import { formatRupiah } from "../../../shared/finance";
import { exportToPDF, exportToExcel, fmtRp } from "@/lib/export";
import { toast } from "sonner";

export default function RingkasanPembayaran() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  // Query payment method summary
  const { data: payments, isLoading } = trpc.report.paymentSummary.useQuery(
    { startDate, endDate },
    { retry: false, enabled: startDate <= endDate }
  );

  // Calculate totals
  const totals = useMemo(() => {
    if (!payments) return { totalAmount: 0, transactionCount: 0 };
    return {
      totalAmount: payments.reduce((sum, p) => sum + p.totalAmount, 0),
      transactionCount: payments.reduce((sum, p) => sum + p.transactionCount, 0),
    };
  }, [payments]);

  const handleExportPDF = () => {
    if (!payments || payments.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    exportToPDF({
      title: "Ringkasan Metode Pembayaran",
      subtitle: `Periode: ${startDate} — ${endDate}`,
      filename: `Ringkasan_Pembayaran_${startDate}_${endDate}`,
      columns: [
        { header: "No", key: "no", width: 8, align: "center" },
        { header: "Metode Pembayaran", key: "method", width: 40 },
        { header: "Jumlah Transaksi", key: "transactionCount", width: 20, align: "right" },
        {
          header: "Total (Rp)",
          key: "totalAmount",
          width: 30,
          align: "right",
          format: fmtRp,
        },
      ],
      data: payments.map((p, idx) => ({
        no: idx + 1,
        ...p,
      })),
      summaryRow: {
        no: "",
        method: "TOTAL",
        transactionCount: totals.transactionCount,
        totalAmount: totals.totalAmount,
      },
    });

    toast.success("Laporan PDF berhasil diunduh");
  };

  const handleExportExcel = () => {
    if (!payments || payments.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    exportToExcel({
      title: "Ringkasan Metode Pembayaran",
      subtitle: `Periode: ${startDate} — ${endDate}`,
      filename: `Ringkasan_Pembayaran_${startDate}_${endDate}`,
      columns: [
        { header: "No", key: "no", width: 8 },
        { header: "Metode Pembayaran", key: "method", width: 40 },
        { header: "Jumlah Transaksi", key: "transactionCount", width: 20 },
        {
          header: "Total (Rp)",
          key: "totalAmount",
          width: 30,
          format: fmtRp,
        },
      ],
      data: payments.map((p, idx) => ({
        no: idx + 1,
        ...p,
      })),
      summaryRow: {
        no: "",
        method: "TOTAL",
        transactionCount: totals.transactionCount,
        totalAmount: totals.totalAmount,
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
            <CreditCard className="h-5 w-5 text-primary" />
            Ringkasan Metode Pembayaran
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Ringkasan total pembayaran per metode (Tunai, Transfer, QRIS, dll)
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
                disabled={isLoading || !payments || payments.length === 0}
              >
                <FileText className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportExcel}
                disabled={isLoading || !payments || payments.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Total Seluruh Pembayaran</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-10 w-32" />
          ) : (
            <p className="text-3xl font-bold">{formatRupiah(totals.totalAmount)}</p>
          )}
          {!isLoading && (
            <p className="text-xs text-muted-foreground mt-2">
              {totals.transactionCount} transaksi
            </p>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detail Metode Pembayaran</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !payments || payments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Tidak ada data pembayaran untuk periode ini
            </div>
          ) : (
            <ScrollArea className="w-full">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-2 text-left font-semibold text-xs">No</th>
                    <th className="px-4 py-2 text-left font-semibold text-xs">Metode Pembayaran</th>
                    <th className="px-4 py-2 text-right font-semibold text-xs">Jumlah Transaksi</th>
                    <th className="px-4 py-2 text-right font-semibold text-xs">Total (Rp)</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((row, idx) => (
                    <tr key={row.method} className="border-b hover:bg-muted/30">
                      <td className="px-4 py-2">{idx + 1}</td>
                      <td className="px-4 py-2 font-medium">{row.method}</td>
                      <td className="px-4 py-2 text-right">{row.transactionCount}</td>
                      <td className="px-4 py-2 text-right font-semibold">
                        {formatRupiah(row.totalAmount)}
                      </td>
                    </tr>
                  ))}
                  {/* Summary row */}
                  <tr className="bg-muted/50 font-bold border-t-2">
                    <td colSpan={2} className="px-4 py-3">
                      TOTAL
                    </td>
                    <td className="px-4 py-3 text-right">{totals.transactionCount}</td>
                    <td className="px-4 py-3 text-right">
                      {formatRupiah(totals.totalAmount)}
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
