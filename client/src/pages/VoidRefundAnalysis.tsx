import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RotateCcw, Download, FileText, Ban } from "lucide-react";
import { formatRupiah } from "../../../shared/finance";
import { exportToPDF, exportToExcel, fmtRp, fmtDate } from "@/lib/export";
import { toast } from "sonner";

export default function VoidRefundAnalysis() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  // Query void/refund analysis (POS receipts)
  const { data: reportData, isLoading } = trpc.report.voidRefundAnalysis.useQuery(
    { startDate, endDate },
    { retry: false, enabled: startDate <= endDate }
  );

  // Query voided transactions (non-POS)
  const { data: voidedTxs, isLoading: voidedLoading } = trpc.transaction.voided.useQuery(
    { startDate, endDate },
    { retry: false, enabled: startDate <= endDate }
  );

  const voidedTxMetrics = useMemo(() => {
    if (!voidedTxs || voidedTxs.length === 0) return { count: 0, total: 0 };
    return {
      count: voidedTxs.length,
      total: voidedTxs.reduce((sum: number, tx: any) => sum + tx.amount, 0),
    };
  }, [voidedTxs]);

  // Calculate derived metrics
  const metrics = useMemo(() => {
    if (!reportData) {
      return {
        totalRefunds: 0,
        totalRefundAmount: 0,
        avgRefundAmount: 0,
      };
    }
    const count = reportData.summary.totalRefunds;
    const amount = reportData.summary.totalRefundAmount;
    return {
      totalRefunds: count,
      totalRefundAmount: amount,
      avgRefundAmount: count > 0 ? amount / count : 0,
    };
  }, [reportData]);

  // Sort reasons by count descending
  const reasonBreakdown = useMemo(() => {
    if (!reportData) return [];
    return Object.entries(reportData.summary.byReason)
      .map(([reason, data]) => ({ reason, ...data }))
      .sort((a, b) => b.count - a.count);
  }, [reportData]);

  // Get max refund amount for chart scaling
  const maxRefundByDate = useMemo(() => {
    if (!reportData) return 0;
    return Math.max(
      ...Object.values(reportData.summary.byDate).map((d) => d.amount),
      1
    );
  }, [reportData]);

  // Sort refunds by date for chart
  const refundsByDateSorted = useMemo(() => {
    if (!reportData) return [];
    return Object.entries(reportData.summary.byDate)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [reportData]);

  const handleExportPDF = () => {
    if (!reportData || reportData.receipts.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    exportToPDF({
      title: "Analisis Void/Refund",
      subtitle: `Periode: ${startDate} — ${endDate}`,
      filename: `Analisis_Void_Refund_${startDate}_${endDate}`,
      columns: [
        { header: "No", key: "no", width: 6, align: "center" },
        { header: "Kode Struk", key: "receiptCode", width: 20 },
        { header: "Tanggal", key: "date", width: 14, format: fmtDate },
        { header: "Pelanggan", key: "clientName", width: 25 },
        { header: "Total Asli (Rp)", key: "grandTotal", width: 18, align: "right", format: fmtRp },
        { header: "Nominal Refund (Rp)", key: "refundAmount", width: 18, align: "right", format: fmtRp },
        { header: "Alasan", key: "refundReason", width: 20 },
        { header: "Waktu Refund", key: "refundedAt", width: 14, format: fmtDate },
      ],
      data: reportData.receipts.map((r, idx) => ({
        no: idx + 1,
        ...r,
      })),
      summaryRow: {
        no: "",
        receiptCode: "",
        date: "",
        clientName: "TOTAL",
        grandTotal: reportData.receipts.reduce((sum, r) => sum + r.grandTotal, 0),
        refundAmount: metrics.totalRefundAmount,
        refundReason: "",
        refundedAt: "",
      },
    });

    toast.success("Laporan PDF berhasil diunduh");
  };

  const handleExportExcel = () => {
    if (!reportData || reportData.receipts.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    exportToExcel({
      title: "Analisis Void/Refund",
      subtitle: `Periode: ${startDate} — ${endDate}`,
      filename: `Analisis_Void_Refund_${startDate}_${endDate}`,
      columns: [
        { header: "No", key: "no", width: 6 },
        { header: "Kode Struk", key: "receiptCode", width: 20 },
        { header: "Tanggal", key: "date", width: 14, format: fmtDate },
        { header: "Pelanggan", key: "clientName", width: 25 },
        { header: "Total Asli (Rp)", key: "grandTotal", width: 18, format: fmtRp },
        { header: "Nominal Refund (Rp)", key: "refundAmount", width: 18, format: fmtRp },
        { header: "Alasan", key: "refundReason", width: 20 },
        { header: "Waktu Refund", key: "refundedAt", width: 14, format: fmtDate },
      ],
      data: reportData.receipts.map((r, idx) => ({
        no: idx + 1,
        ...r,
      })),
      summaryRow: {
        no: "",
        receiptCode: "",
        date: "",
        clientName: "TOTAL",
        grandTotal: reportData.receipts.reduce((sum, r) => sum + r.grandTotal, 0),
        refundAmount: metrics.totalRefundAmount,
        refundReason: "",
        refundedAt: "",
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
            <RotateCcw className="h-5 w-5 text-red-600 dark:text-red-400" />
            Analisis Void/Refund
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Laporan detail transaksi yang di-void atau di-refund
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
                disabled={isLoading || !reportData || reportData.receipts.length === 0}
              >
                <FileText className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportExcel}
                disabled={isLoading || !reportData || reportData.receipts.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Refund</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-24" />
            ) : (
              <p className="text-3xl font-bold text-red-600 dark:text-red-400">{metrics.totalRefunds}</p>
            )}
            {!isLoading && (
              <p className="text-xs text-muted-foreground mt-2">
                transaksi
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Nominal Refund</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-32" />
            ) : (
              <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                {formatRupiah(metrics.totalRefundAmount)}
              </p>
            )}
            {!isLoading && (
              <p className="text-xs text-muted-foreground mt-2">
                jumlah keseluruhan
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Rata-rata per Refund</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-32" />
            ) : (
              <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                {formatRupiah(metrics.avgRefundAmount)}
              </p>
            )}
            {!isLoading && (
              <p className="text-xs text-muted-foreground mt-2">
                per transaksi
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alasan Refund Breakdown */}
      {!isLoading && reasonBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Breakdown Alasan Refund</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {reasonBreakdown.map((item) => (
                <div
                  key={item.reason}
                  className="border rounded-lg p-3 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800"
                >
                  <p className="font-semibold text-sm text-red-900">{item.reason}</p>
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-muted-foreground">
                      {item.count} transaksi
                    </p>
                    <p className="text-sm font-bold text-red-600 dark:text-red-400">
                      {formatRupiah(item.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Refunds by Date - Bar Chart */}
      {!isLoading && refundsByDateSorted.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Refund Berdasarkan Tanggal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {refundsByDateSorted.map((item) => {
                const barWidth = (item.amount / maxRefundByDate) * 100;
                return (
                  <div key={item.date}>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-semibold">{item.date}</span>
                      <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                        {item.count} transaksi • {formatRupiah(item.amount)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-red-600 h-2 rounded-full transition-all"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Voided Transactions (non-POS) */}
      {!voidedLoading && voidedTxs && voidedTxs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Ban className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              Transaksi Void (Manual)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 p-3 dark:border-amber-800 dark:bg-amber-950/30">
                <p className="text-xs font-semibold text-muted-foreground">Jumlah Void</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{voidedTxMetrics.count}</p>
              </div>
              <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 p-3 dark:border-amber-800 dark:bg-amber-950/30">
                <p className="text-xs font-semibold text-muted-foreground">Total Nominal</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{formatRupiah(voidedTxMetrics.total)}</p>
              </div>
            </div>
            <ScrollArea className="w-full">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-2 text-left font-semibold text-xs">No</th>
                    <th className="px-4 py-2 text-left font-semibold text-xs">Kode TX</th>
                    <th className="px-4 py-2 text-left font-semibold text-xs">Tanggal</th>
                    <th className="px-4 py-2 text-left font-semibold text-xs">Kategori</th>
                    <th className="px-4 py-2 text-right font-semibold text-xs">Nominal (Rp)</th>
                    <th className="px-4 py-2 text-left font-semibold text-xs">Alasan Void</th>
                    <th className="px-4 py-2 text-left font-semibold text-xs">Waktu Void</th>
                  </tr>
                </thead>
                <tbody>
                  {voidedTxs.map((tx: any, idx: number) => (
                    <tr key={tx.id} className="border-b hover:bg-muted/30">
                      <td className="px-4 py-2">{idx + 1}</td>
                      <td className="px-4 py-2 font-mono text-xs">{tx.txCode}</td>
                      <td className="px-4 py-2">{tx.date}</td>
                      <td className="px-4 py-2">{tx.category}</td>
                      <td className="px-4 py-2 text-right font-semibold text-amber-600 dark:text-amber-400">
                        {formatRupiah(tx.amount)}
                      </td>
                      <td className="px-4 py-2 text-xs">{tx.voidReason ?? "-"}</td>
                      <td className="px-4 py-2 text-xs">{tx.voidedAt ? new Date(tx.voidedAt).toLocaleString("id-ID") : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Refunded Receipts Table (POS) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detail Transaksi Refund (POS)</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !reportData || reportData.receipts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Tidak ada transaksi refund untuk periode ini
            </div>
          ) : (
            <ScrollArea className="w-full">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-2 text-left font-semibold text-xs">No</th>
                    <th className="px-4 py-2 text-left font-semibold text-xs">Kode Struk</th>
                    <th className="px-4 py-2 text-left font-semibold text-xs">Tanggal</th>
                    <th className="px-4 py-2 text-left font-semibold text-xs">Pelanggan</th>
                    <th className="px-4 py-2 text-right font-semibold text-xs">Total Asli (Rp)</th>
                    <th className="px-4 py-2 text-right font-semibold text-xs">Nominal Refund (Rp)</th>
                    <th className="px-4 py-2 text-left font-semibold text-xs">Alasan</th>
                    <th className="px-4 py-2 text-left font-semibold text-xs">Waktu Refund</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.receipts.map((row, idx) => (
                    <tr key={row.id} className="border-b hover:bg-muted/30">
                      <td className="px-4 py-2">{idx + 1}</td>
                      <td className="px-4 py-2 font-mono text-xs">{row.receiptCode}</td>
                      <td className="px-4 py-2">{row.date}</td>
                      <td className="px-4 py-2">{row.clientName}</td>
                      <td className="px-4 py-2 text-right font-semibold">
                        {formatRupiah(row.grandTotal)}
                      </td>
                      <td className="px-4 py-2 text-right font-bold text-red-600 dark:text-red-400">
                        {formatRupiah(row.refundAmount)}
                      </td>
                      <td className="px-4 py-2 text-xs">{row.refundReason}</td>
                      <td className="px-4 py-2 text-xs">{row.refundedAt ? new Date(row.refundedAt).toLocaleString("id-ID") : "-"}</td>
                    </tr>
                  ))}
                  {/* Summary row */}
                  <tr className="bg-red-50 dark:bg-red-950 font-bold border-t-2 border-red-200 dark:border-red-800">
                    <td colSpan={4} className="px-4 py-3">
                      TOTAL
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatRupiah(
                        reportData.receipts.reduce((sum, r) => sum + r.grandTotal, 0)
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-red-600 dark:text-red-400">
                      {formatRupiah(metrics.totalRefundAmount)}
                    </td>
                    <td colSpan={2} />
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
