import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CalendarDays, FileDown, Sheet } from "lucide-react";
import { formatRupiah } from "../../../shared/finance";
import { exportToPDF, exportToExcel, fmtRp, ExportColumn, fmtDate } from "@/lib/export";
import { toast } from "sonner";

const HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

function formatTanggalFull(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return `${HARI[d.getDay()]}, ${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
}

function formatTanggalShort(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getDate()} ${BULAN[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
}

export default function PenjualanTanggal() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  const { data: report, isLoading } = trpc.report.salesByDate.useQuery(
    { startDate, endDate },
    { retry: false, enabled: startDate <= endDate }
  );

  const summary = useMemo(() => {
    if (!report) return { activeDays: 0, totalSales: 0, avgPerDay: 0, totalRefund: 0 };
    const totalSales = report.reduce((sum, r) => sum + r.totalPenjualan, 0);
    const totalRefund = report.reduce((sum, r) => sum + r.refundCount, 0);
    const activeDays = report.length;
    const avgPerDay = activeDays > 0 ? Math.round(totalSales / activeDays) : 0;
    return { activeDays, totalSales, avgPerDay, totalRefund };
  }, [report]);

  const maxValue = useMemo(() => {
    if (!report) return 1;
    return Math.max(1, ...report.map(d => d.totalPenjualan));
  }, [report]);

  const handleExport = (format: "pdf" | "excel") => {
    if (!report || report.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    const columns: ExportColumn[] = [
      { header: "Tanggal", key: "date", width: 20 },
      { header: "Jumlah Transaksi", key: "transactionCount", width: 18, align: "right" },
      { header: "Total Penjualan (Rp)", key: "totalPenjualan", width: 20, align: "right", format: fmtRp },
      { header: "Diskon (Rp)", key: "totalDiskon", width: 18, align: "right", format: fmtRp },
      { header: "Refund", key: "refundCount", width: 12, align: "right" },
      { header: "Net Penjualan (Rp)", key: "netPenjualan", width: 20, align: "right", format: fmtRp },
    ];

    const data = report.map(d => ({
      date: formatTanggalShort(d.date),
      transactionCount: d.transactionCount,
      totalPenjualan: d.totalPenjualan,
      totalDiskon: d.totalDiskon,
      refundCount: d.refundCount,
      netPenjualan: d.netPenjualan,
    }));

    const summaryRow = {
      date: "TOTAL",
      transactionCount: report.reduce((sum, d) => sum + d.transactionCount, 0),
      totalPenjualan: summary.totalSales,
      totalDiskon: report.reduce((sum, d) => sum + d.totalDiskon, 0),
      refundCount: summary.totalRefund,
      netPenjualan: report.reduce((sum, d) => sum + d.netPenjualan, 0),
    };

    const options = {
      title: "Laporan Penjualan Per Tanggal",
      subtitle: `Periode ${formatTanggalShort(startDate)} s/d ${formatTanggalShort(endDate)}`,
      columns,
      data,
      summaryRow,
      filename: `penjualan_tanggal_${startDate}_${endDate}`,
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Penjualan Per Tanggal
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Ringkasan penjualan harian dengan analisis detail</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-40 h-9 text-sm"
          />
          <span className="text-xs text-muted-foreground">s/d</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-40 h-9 text-sm"
          />
        </div>
      </div>

      <p className="text-sm font-medium text-muted-foreground -mt-3">
        {formatTanggalShort(startDate)} — {formatTanggalShort(endDate)}
      </p>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      ) : !report ? (
        <Card className="border">
          <CardContent className="py-12 text-center">
            <CalendarDays className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Tidak dapat memuat data</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KPICard
              icon={CalendarDays}
              label="Total Hari Aktif"
              value={String(summary.activeDays)}
              variant="info"
            />
            <KPICard
              icon={CalendarDays}
              label="Total Penjualan"
              value={formatRupiah(summary.totalSales)}
              variant="success"
            />
            <KPICard
              icon={CalendarDays}
              label="Rata-rata per Hari"
              value={formatRupiah(summary.avgPerDay)}
              variant="default"
            />
            <KPICard
              icon={CalendarDays}
              label="Total Refund"
              value={String(summary.totalRefund)}
              variant="danger"
            />
          </div>

          {/* Daily Chart */}
          {report.length > 0 && (
            <Card className="border shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <CalendarDays className="h-3 w-3" /> Penjualan Per Hari
                </p>
                <div className="flex items-end gap-1 h-32 overflow-x-auto">
                  {report.map((day) => (
                    <div key={day.date} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                      <div
                        className="w-full rounded-t bg-primary/70 hover:bg-primary transition-colors min-h-[2px]"
                        style={{ height: `${Math.max(2, (day.totalPenjualan / maxValue) * 100)}%` }}
                        title={`${formatTanggalShort(day.date)}: ${formatRupiah(day.totalPenjualan)}`}
                      />
                      <span className="text-[9px] text-muted-foreground truncate w-full text-center">
                        {new Date(day.date + "T00:00:00").getDate()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Table */}
          <Card className="border shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Detail Per Tanggal ({report.length} hari)
              </p>
              {report.length === 0 ? (
                <div className="py-12 text-center">
                  <CalendarDays className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Tidak ada data penjualan pada periode ini</p>
                </div>
              ) : (
                <ScrollArea className="max-h-[500px]">
                  <div className="space-y-2">
                    {report.map((day) => (
                      <div
                        key={day.date}
                        className={`p-3 rounded-lg border transition-colors ${
                          day.totalPenjualan > 0
                            ? "bg-muted/30 hover:bg-muted/50"
                            : "bg-muted/10 opacity-60"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{formatTanggalFull(day.date)}</p>
                            <p className="text-xs text-muted-foreground">
                              {day.transactionCount} transaksi
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold">{formatRupiah(day.totalPenjualan)}</p>
                            <div className="text-[10px] text-muted-foreground space-y-0.5 mt-1">
                              {day.totalDiskon > 0 && (
                                <p className="text-warning">Diskon -{formatRupiah(day.totalDiskon)}</p>
                              )}
                              {day.refundCount > 0 && (
                                <p className="text-danger">Refund: {day.refundCount}</p>
                              )}
                              <p className="font-medium text-foreground">Net {formatRupiah(day.netPenjualan)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Export buttons */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => handleExport("pdf")}
              disabled={!report || report.length === 0}
            >
              <FileDown className="h-4 w-4" /> PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => handleExport("excel")}
              disabled={!report || report.length === 0}
            >
              <Sheet className="h-4 w-4" /> Excel
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function KPICard({ icon: Icon, label, value, variant = "default" }: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
  variant?: "success" | "danger" | "info" | "warning" | "default";
}) {
  const bgColors = {
    success: "bg-success/10",
    danger: "bg-danger/10",
    info: "bg-info/10",
    warning: "bg-warning/10",
    default: "bg-primary/10",
  };
  const iconColors = {
    success: "text-success",
    danger: "text-danger",
    info: "text-info",
    warning: "text-warning",
    default: "text-primary",
  };

  return (
    <Card className="border shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className={`h-8 w-8 rounded-lg ${bgColors[variant]} flex items-center justify-center`}>
            <Icon className={`h-4 w-4 ${iconColors[variant]}`} />
          </div>
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
        <p className="text-lg font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
