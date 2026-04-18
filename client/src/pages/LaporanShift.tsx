import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, Download, FileText, BarChart3 } from "lucide-react";
import { formatRupiah } from "../../../shared/finance";
import { exportToPDF, exportToExcel, fmtRp, fmtDate } from "@/lib/export";
import { toast } from "sonner";

export default function LaporanShift() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  // Query shift report
  const { data: reportData, isLoading } = trpc.report.shiftReport.useQuery(
    { startDate, endDate },
    { retry: false, enabled: startDate <= endDate }
  );

  // Calculate derived metrics
  const metrics = useMemo(() => {
    if (!reportData) {
      return {
        totalShifts: 0,
        totalPenjualan: 0,
        totalRefund: 0,
        avgCashDifference: 0,
        surplusCount: 0,
        deficitCount: 0,
      };
    }
    const summary = reportData.summary;
    const surplusCount = reportData.shifts.filter((s) => s.status === "surplus").length;
    const deficitCount = reportData.shifts.filter((s) => s.status === "deficit").length;
    return {
      totalShifts: summary.totalShifts,
      totalPenjualan: summary.totalPenjualan,
      totalRefund: summary.totalRefund,
      avgCashDifference: summary.avgCashDifference,
      surplusCount,
      deficitCount,
    };
  }, [reportData]);

  const handleExportPDF = () => {
    if (!reportData || reportData.shifts.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    exportToPDF({
      title: "Laporan Shift",
      subtitle: `Periode: ${startDate} — ${endDate}`,
      filename: `Laporan_Shift_${startDate}_${endDate}`,
      columns: [
        { header: "No", key: "no", width: 6, align: "center" },
        { header: "Tanggal", key: "date", width: 12, format: (v) => v },
        { header: "Kasir", key: "cashierName", width: 18 },
        { header: "Jam Buka", key: "timeOpen", width: 12, format: (v) => v },
        { header: "Jam Tutup", key: "timeClose", width: 12, format: (v) => v },
        { header: "Durasi (jam)", key: "durationHours", width: 10, align: "right", format: (v) => v },
        { header: "Kas Awal (Rp)", key: "openingCash", width: 16, align: "right", format: fmtRp },
        { header: "Penjualan (Rp)", key: "totalPenjualan", width: 16, align: "right", format: fmtRp },
        { header: "Refund (Rp)", key: "totalRefund", width: 14, align: "right", format: fmtRp },
        { header: "Kas Akhir (Rp)", key: "closingCash", width: 16, align: "right", format: fmtRp },
        { header: "Selisih (Rp)", key: "cashDifference", width: 14, align: "right", format: fmtRp },
      ],
      data: reportData.shifts.map((shift, idx) => ({
        no: idx + 1,
        date: shift.date,
        cashierName: shift.cashierName,
        timeOpen: shift.openedAt ? new Date(shift.openedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "-",
        timeClose: shift.closedAt ? new Date(shift.closedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "-",
        durationHours: (shift.durationMinutes / 60).toFixed(1),
        openingCash: shift.openingCash,
        totalPenjualan: shift.totalPenjualan,
        totalRefund: shift.totalRefund,
        closingCash: shift.closingCash,
        cashDifference: shift.cashDifference,
      })),
      summaryRow: {
        no: "",
        date: "",
        cashierName: "TOTAL",
        timeOpen: "",
        timeClose: "",
        durationHours: "",
        openingCash: reportData.shifts.reduce((sum, s) => sum + s.openingCash, 0),
        totalPenjualan: metrics.totalPenjualan,
        totalRefund: metrics.totalRefund,
        closingCash: reportData.shifts.reduce((sum, s) => sum + s.closingCash, 0),
        cashDifference: reportData.shifts.reduce((sum, s) => sum + s.cashDifference, 0),
      },
    });

    toast.success("Laporan PDF berhasil diunduh");
  };

  const handleExportExcel = () => {
    if (!reportData || reportData.shifts.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    exportToExcel({
      title: "Laporan Shift",
      subtitle: `Periode: ${startDate} — ${endDate}`,
      filename: `Laporan_Shift_${startDate}_${endDate}`,
      columns: [
        { header: "No", key: "no", width: 6 },
        { header: "Tanggal", key: "date", width: 12, format: (v) => v },
        { header: "Kasir", key: "cashierName", width: 18 },
        { header: "Jam Buka", key: "timeOpen", width: 12, format: (v) => v },
        { header: "Jam Tutup", key: "timeClose", width: 12, format: (v) => v },
        { header: "Durasi (jam)", key: "durationHours", width: 10, format: (v) => v },
        { header: "Kas Awal (Rp)", key: "openingCash", width: 16, format: fmtRp },
        { header: "Penjualan (Rp)", key: "totalPenjualan", width: 16, format: fmtRp },
        { header: "Refund (Rp)", key: "totalRefund", width: 14, format: fmtRp },
        { header: "Kas Akhir (Rp)", key: "closingCash", width: 16, format: fmtRp },
        { header: "Selisih (Rp)", key: "cashDifference", width: 14, format: fmtRp },
      ],
      data: reportData.shifts.map((shift, idx) => ({
        no: idx + 1,
        date: shift.date,
        cashierName: shift.cashierName,
        timeOpen: shift.openedAt ? new Date(shift.openedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "-",
        timeClose: shift.closedAt ? new Date(shift.closedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "-",
        durationHours: (shift.durationMinutes / 60).toFixed(1),
        openingCash: shift.openingCash,
        totalPenjualan: shift.totalPenjualan,
        totalRefund: shift.totalRefund,
        closingCash: shift.closingCash,
        cashDifference: shift.cashDifference,
      })),
      summaryRow: {
        no: "",
        date: "",
        cashierName: "TOTAL",
        timeOpen: "",
        timeClose: "",
        durationHours: "",
        openingCash: reportData.shifts.reduce((sum, s) => sum + s.openingCash, 0),
        totalPenjualan: metrics.totalPenjualan,
        totalRefund: metrics.totalRefund,
        closingCash: reportData.shifts.reduce((sum, s) => sum + s.closingCash, 0),
        cashDifference: reportData.shifts.reduce((sum, s) => sum + s.cashDifference, 0),
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
            <Clock className="h-5 w-5 text-blue-600" />
            Laporan Shift
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Laporan detail analitik per shift POS
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
                disabled={isLoading || !reportData || reportData.shifts.length === 0}
              >
                <FileText className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportExcel}
                disabled={isLoading || !reportData || reportData.shifts.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Shift</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-24" />
            ) : (
              <p className="text-3xl font-bold text-blue-600">{metrics.totalShifts}</p>
            )}
            {!isLoading && (
              <p className="text-xs text-muted-foreground mt-2">
                shift selesai
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Penjualan</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-32" />
            ) : (
              <p className="text-3xl font-bold text-emerald-600">
                {formatRupiah(metrics.totalPenjualan)}
              </p>
            )}
            {!isLoading && (
              <p className="text-xs text-muted-foreground mt-2">
                keseluruhan
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Refund</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-32" />
            ) : (
              <p className="text-3xl font-bold text-red-600">
                {formatRupiah(metrics.totalRefund)}
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
            <CardTitle className="text-sm font-medium">Rata-rata Selisih Kas</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-32" />
            ) : (
              <p className={`text-3xl font-bold ${metrics.avgCashDifference >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                {formatRupiah(metrics.avgCashDifference)}
              </p>
            )}
            {!isLoading && (
              <p className="text-xs text-muted-foreground mt-2">
                per shift
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown Cards */}
      {!isLoading && metrics.totalShifts > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Surplus</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-emerald-600">{metrics.surplusCount}</p>
              <p className="text-xs text-emerald-600/70 mt-1">{((metrics.surplusCount / metrics.totalShifts) * 100).toFixed(0)}% dari total shift</p>
            </CardContent>
          </Card>

          <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-yellow-700 dark:text-yellow-400">Seimbang</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-yellow-600">{metrics.totalShifts - metrics.surplusCount - metrics.deficitCount}</p>
              <p className="text-xs text-yellow-600/70 mt-1">{(((metrics.totalShifts - metrics.surplusCount - metrics.deficitCount) / metrics.totalShifts) * 100).toFixed(0)}% dari total shift</p>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-700 dark:text-red-400">Deficit</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">{metrics.deficitCount}</p>
              <p className="text-xs text-red-600/70 mt-1">{((metrics.deficitCount / metrics.totalShifts) * 100).toFixed(0)}% dari total shift</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Shift Details Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detail Shift</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !reportData || reportData.shifts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Tidak ada shift untuk periode ini
            </div>
          ) : (
            <ScrollArea className="w-full">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-2 text-left font-semibold text-xs">No</th>
                    <th className="px-4 py-2 text-left font-semibold text-xs">Tanggal</th>
                    <th className="px-4 py-2 text-left font-semibold text-xs">Kasir</th>
                    <th className="px-4 py-2 text-left font-semibold text-xs">Waktu Buka</th>
                    <th className="px-4 py-2 text-left font-semibold text-xs">Waktu Tutup</th>
                    <th className="px-4 py-2 text-right font-semibold text-xs">Durasi (jam)</th>
                    <th className="px-4 py-2 text-right font-semibold text-xs">Kas Awal (Rp)</th>
                    <th className="px-4 py-2 text-right font-semibold text-xs">Penjualan (Rp)</th>
                    <th className="px-4 py-2 text-right font-semibold text-xs">Refund (Rp)</th>
                    <th className="px-4 py-2 text-right font-semibold text-xs">Kas Akhir (Rp)</th>
                    <th className="px-4 py-2 text-right font-semibold text-xs">Selisih (Rp)</th>
                    <th className="px-4 py-2 text-center font-semibold text-xs">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.shifts.map((row, idx) => {
                    const timeOpen = row.openedAt ? new Date(row.openedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "-";
                    const timeClose = row.closedAt ? new Date(row.closedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "-";
                    const durationHours = (row.durationMinutes / 60).toFixed(1);

                    const statusColor =
                      row.status === "surplus"
                        ? "bg-emerald-50 text-emerald-700"
                        : row.status === "deficit"
                        ? "bg-red-50 text-red-700"
                        : "bg-yellow-50 text-yellow-700";

                    const selisihColor =
                      row.cashDifference > 0
                        ? "text-emerald-600"
                        : row.cashDifference < 0
                        ? "text-red-600"
                        : "text-gray-600";

                    return (
                      <tr key={row.id} className="border-b hover:bg-muted/30">
                        <td className="px-4 py-2">{idx + 1}</td>
                        <td className="px-4 py-2 font-medium">{row.date}</td>
                        <td className="px-4 py-2">{row.cashierName}</td>
                        <td className="px-4 py-2 text-xs">{timeOpen}</td>
                        <td className="px-4 py-2 text-xs">{timeClose}</td>
                        <td className="px-4 py-2 text-right text-xs">{durationHours}</td>
                        <td className="px-4 py-2 text-right font-semibold">
                          {formatRupiah(row.openingCash)}
                        </td>
                        <td className="px-4 py-2 text-right font-semibold text-emerald-600">
                          {formatRupiah(row.totalPenjualan)}
                        </td>
                        <td className="px-4 py-2 text-right font-semibold text-red-600">
                          {formatRupiah(row.totalRefund)}
                        </td>
                        <td className="px-4 py-2 text-right font-semibold">
                          {formatRupiah(row.closingCash)}
                        </td>
                        <td className={`px-4 py-2 text-right font-bold ${selisihColor}`}>
                          {formatRupiah(row.cashDifference)}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${statusColor}`}>
                            {row.status === "surplus" ? "Surplus" : row.status === "deficit" ? "Deficit" : "Seimbang"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {/* Summary row */}
                  <tr className="bg-blue-50 dark:bg-blue-900/20 font-bold border-t-2 border-blue-200">
                    <td colSpan={2} className="px-4 py-3">
                      TOTAL
                    </td>
                    <td colSpan={4} />
                    <td className="px-4 py-3 text-right">
                      {formatRupiah(reportData.shifts.reduce((sum, s) => sum + s.openingCash, 0))}
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-600">
                      {formatRupiah(metrics.totalPenjualan)}
                    </td>
                    <td className="px-4 py-3 text-right text-red-600">
                      {formatRupiah(metrics.totalRefund)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatRupiah(reportData.shifts.reduce((sum, s) => sum + s.closingCash, 0))}
                    </td>
                    <td className={`px-4 py-3 text-right ${reportData.shifts.reduce((sum, s) => sum + s.cashDifference, 0) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {formatRupiah(reportData.shifts.reduce((sum, s) => sum + s.cashDifference, 0))}
                    </td>
                    <td />
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
