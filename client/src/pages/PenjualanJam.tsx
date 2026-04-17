import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, FileDown, Sheet } from "lucide-react";
import { formatRupiah } from "../../../shared/finance";
import { exportToPDF, exportToExcel, fmtRp, ExportColumn } from "@/lib/export";
import { toast } from "sonner";

const BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

function formatTanggalShort(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getDate()} ${BULAN[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
}

export default function PenjualanJam() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  const { data: report, isLoading } = trpc.report.salesByHour.useQuery(
    { startDate, endDate },
    { retry: false, enabled: startDate <= endDate }
  );

  const summary = useMemo(() => {
    if (!report) return { peakHourLabel: "-", peakHourAmount: 0, totalTransactions: 0, totalSales: 0 };
    const totalTransactions = report.hours.reduce((sum, h) => sum + h.transactionCount, 0);
    const totalSales = report.hours.reduce((sum, h) => sum + h.totalPenjualan, 0);
    return {
      peakHourLabel: report.peakHour?.label || "-",
      peakHourAmount: report.peakHour?.totalPenjualan || 0,
      totalTransactions,
      totalSales,
    };
  }, [report]);

  const maxValue = useMemo(() => {
    if (!report) return 1;
    return Math.max(1, ...report.hours.map(h => h.totalPenjualan));
  }, [report]);

  const handleExport = (format: "pdf" | "excel") => {
    if (!report) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    const columns: ExportColumn[] = [
      { header: "Jam", key: "label", width: 12 },
      { header: "Jumlah Transaksi", key: "transactionCount", width: 18, align: "right" },
      { header: "Total Penjualan (Rp)", key: "totalPenjualan", width: 22, align: "right", format: fmtRp },
      { header: "Rata-rata per Transaksi (Rp)", key: "avgPerTransaction", width: 24, align: "right", format: fmtRp },
    ];

    const data = report.hours.map(h => ({
      label: h.label,
      transactionCount: h.transactionCount,
      totalPenjualan: h.totalPenjualan,
      avgPerTransaction: h.avgPerTransaction,
    }));

    const summaryRow = {
      label: "TOTAL",
      transactionCount: summary.totalTransactions,
      totalPenjualan: summary.totalSales,
      avgPerTransaction: summary.totalTransactions > 0 ? Math.round(summary.totalSales / summary.totalTransactions) : 0,
    };

    const options = {
      title: "Laporan Penjualan Per Jam",
      subtitle: `Periode ${formatTanggalShort(startDate)} s/d ${formatTanggalShort(endDate)}`,
      columns,
      data,
      summaryRow,
      filename: `penjualan_jam_${startDate}_${endDate}`,
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
            <Clock className="h-5 w-5 text-primary" />
            Penjualan Per Jam
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Analisis penjualan berdasarkan jam operasional</p>
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
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      ) : !report ? (
        <Card className="border">
          <CardContent className="py-12 text-center">
            <Clock className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Tidak dapat memuat data</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <KPICard
              icon={Clock}
              label="Jam Puncak"
              value={summary.peakHourLabel}
              sub={formatRupiah(summary.peakHourAmount)}
              variant="warning"
            />
            <KPICard
              icon={Clock}
              label="Total Transaksi"
              value={String(summary.totalTransactions)}
              variant="info"
            />
            <KPICard
              icon={Clock}
              label="Total Penjualan"
              value={formatRupiah(summary.totalSales)}
              variant="success"
            />
          </div>

          {/* Hourly Chart */}
          {report.hours.length > 0 && (
            <Card className="border shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <Clock className="h-3 w-3" /> Penjualan Per Jam
                </p>
                <div className="flex items-end gap-1 h-32">
                  {report.hours.map((hour) => (
                    <div key={hour.hour} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                      <div
                        className="w-full rounded-t bg-primary/70 hover:bg-primary transition-colors min-h-[2px]"
                        style={{ height: `${Math.max(2, (hour.totalPenjualan / maxValue) * 100)}%` }}
                        title={`${hour.label}: ${formatRupiah(hour.totalPenjualan)}`}
                      />
                      <span className="text-[9px] text-muted-foreground truncate w-full text-center">
                        {hour.label.slice(0, 2)}
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
                Detail Per Jam (24 jam)
              </p>
              <ScrollArea className="max-h-[500px]">
                <div className="space-y-2">
                  {report.hours.map((hour) => (
                    <div
                      key={hour.hour}
                      className={`p-3 rounded-lg border transition-colors ${
                        hour.totalPenjualan > 0
                          ? "bg-muted/30 hover:bg-muted/50"
                          : "bg-muted/10 opacity-60"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{hour.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {hour.transactionCount} transaksi
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold">{formatRupiah(hour.totalPenjualan)}</p>
                          <p className="text-[10px] text-muted-foreground">
                            Rata-rata {formatRupiah(hour.avgPerTransaction)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Export buttons */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => handleExport("pdf")}
            >
              <FileDown className="h-4 w-4" /> PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => handleExport("excel")}
            >
              <Sheet className="h-4 w-4" /> Excel
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function KPICard({ icon: Icon, label, value, sub, variant = "default" }: {
  icon: typeof Clock;
  label: string;
  value: string;
  sub?: string;
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
        {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}
