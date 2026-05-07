import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CalendarDays, FileDown, Sheet, TrendingUp, ShoppingBag,
  Package, DollarSign, RotateCcw, BarChart3, ExternalLink,
  ArrowUpDown, Percent,
} from "lucide-react";
import { formatRupiah } from "../../../shared/finance";
import { exportToPDF, exportToExcel, fmtRp, ExportColumn } from "@/lib/export";
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

type SortKey = "date" | "sales" | "profit" | "transactions";

export default function PenjualanTanggal() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [sortBy, setSortBy] = useState<SortKey>("date");
  const [, setLocation] = useLocation();

  const { data: report, isLoading } = trpc.report.salesByDate.useQuery(
    { startDate, endDate },
    { retry: false, enabled: startDate <= endDate }
  );

  const summary = useMemo(() => {
    if (!report) return { activeDays: 0, totalSales: 0, avgPerDay: 0, totalRefund: 0, totalRefundAmount: 0, totalHPP: 0, grossProfit: 0, totalItems: 0, totalTransactions: 0, totalDiskon: 0 };
    const totalSales = report.reduce((sum, r) => sum + r.totalPenjualan, 0);
    const totalRefund = report.reduce((sum, r) => sum + r.refundCount, 0);
    const totalRefundAmount = report.reduce((sum, r) => sum + (r.refundAmount || 0), 0);
    const totalHPP = report.reduce((sum, r) => sum + (r.totalHPP || 0), 0);
    const grossProfit = report.reduce((sum, r) => sum + (r.grossProfit || 0), 0);
    const totalItems = report.reduce((sum, r) => sum + (r.itemsSold || 0), 0);
    const totalTransactions = report.reduce((sum, r) => sum + r.transactionCount, 0);
    const totalDiskon = report.reduce((sum, r) => sum + r.totalDiskon, 0);
    const activeDays = report.length;
    const avgPerDay = activeDays > 0 ? Math.round(totalSales / activeDays) : 0;
    return { activeDays, totalSales, avgPerDay, totalRefund, totalRefundAmount, totalHPP, grossProfit, totalItems, totalTransactions, totalDiskon };
  }, [report]);

  const sortedReport = useMemo(() => {
    if (!report) return [];
    const list = [...report];
    switch (sortBy) {
      case "sales": list.sort((a, b) => b.totalPenjualan - a.totalPenjualan); break;
      case "profit": list.sort((a, b) => (b.grossProfit || 0) - (a.grossProfit || 0)); break;
      case "transactions": list.sort((a, b) => b.transactionCount - a.transactionCount); break;
      default: list.sort((a, b) => a.date.localeCompare(b.date)); break;
    }
    return list;
  }, [report, sortBy]);

  const maxValue = useMemo(() => {
    if (!report) return 1;
    return Math.max(1, ...report.map(d => d.totalPenjualan));
  }, [report]);

  const grossMarginPct = summary.totalSales > 0 ? Math.round((summary.grossProfit / summary.totalSales) * 100) : 0;

  const handleExport = (format: "pdf" | "excel") => {
    if (!report || report.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    const columns: ExportColumn[] = [
      { header: "Tanggal", key: "date", width: 20 },
      { header: "Transaksi", key: "transactionCount", width: 12, align: "right" },
      { header: "Items", key: "itemsSold", width: 10, align: "right" },
      { header: "Penjualan (Rp)", key: "totalPenjualan", width: 18, align: "right", format: fmtRp },
      { header: "Diskon (Rp)", key: "totalDiskon", width: 15, align: "right", format: fmtRp },
      { header: "Refund", key: "refundCount", width: 10, align: "right" },
      { header: "HPP (Rp)", key: "totalHPP", width: 15, align: "right", format: fmtRp },
      { header: "Laba Kotor (Rp)", key: "grossProfit", width: 18, align: "right", format: fmtRp },
      { header: "Margin %", key: "marginPct", width: 10, align: "right" },
      { header: "Net (Rp)", key: "netPenjualan", width: 18, align: "right", format: fmtRp },
    ];

    const data = sortedReport.map(d => {
      const marginPct = d.totalPenjualan > 0 ? Math.round(((d.grossProfit || 0) / d.totalPenjualan) * 100) : 0;
      return {
        date: formatTanggalShort(d.date),
        transactionCount: d.transactionCount,
        itemsSold: d.itemsSold || 0,
        totalPenjualan: d.totalPenjualan,
        totalDiskon: d.totalDiskon,
        refundCount: d.refundCount,
        totalHPP: d.totalHPP || 0,
        grossProfit: d.grossProfit || 0,
        marginPct: `${marginPct}%`,
        netPenjualan: d.netPenjualan,
      };
    });

    const summaryRow = {
      date: "TOTAL",
      transactionCount: summary.totalTransactions,
      itemsSold: summary.totalItems,
      totalPenjualan: summary.totalSales,
      totalDiskon: summary.totalDiskon,
      refundCount: summary.totalRefund,
      totalHPP: summary.totalHPP,
      grossProfit: summary.grossProfit,
      marginPct: `${grossMarginPct}%`,
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

  const nextSortLabel: Record<SortKey, string> = {
    date: "Sort: Penjualan",
    sales: "Sort: Laba",
    profit: "Sort: Transaksi",
    transactions: "Sort: Tanggal",
  };
  const nextSort: Record<SortKey, SortKey> = {
    date: "sales",
    sales: "profit",
    profit: "transactions",
    transactions: "date",
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
          <p className="text-sm text-muted-foreground mt-0.5">Ringkasan penjualan harian dengan HPP, laba, dan margin — klik untuk drill-down</p>
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
          {/* KPI Cards Row 1 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KPICard icon={CalendarDays} label="Hari Aktif" value={String(summary.activeDays)} variant="info" />
            <KPICard icon={TrendingUp} label="Total Penjualan" value={formatRupiah(summary.totalSales)} variant="success" />
            <KPICard icon={ShoppingBag} label="Total Transaksi" value={String(summary.totalTransactions)} sub={`Rata-rata ${formatRupiah(summary.avgPerDay)}/hari`} variant="info" />
            <KPICard icon={Package} label="Item Terjual" value={String(summary.totalItems)} variant="default" />
          </div>

          {/* KPI Cards Row 2 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 -mt-3">
            <KPICard icon={BarChart3} label="Total HPP" value={formatRupiah(summary.totalHPP)} variant="warning" />
            <KPICard icon={DollarSign} label="Laba Kotor" value={formatRupiah(summary.grossProfit)} sub={`Margin ${grossMarginPct}%`} variant="success" />
            <KPICard icon={Percent} label="Diskon Diberikan" value={formatRupiah(summary.totalDiskon)} variant="warning" />
            <KPICard icon={RotateCcw} label="Refund" value={`${summary.totalRefund} (${formatRupiah(summary.totalRefundAmount)})`} variant="danger" />
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
                        className="w-full rounded-t bg-primary/70 hover:bg-primary transition-colors min-h-[2px] cursor-pointer"
                        style={{ height: `${Math.max(2, (day.totalPenjualan / maxValue) * 100)}%` }}
                        title={`${formatTanggalShort(day.date)}: ${formatRupiah(day.totalPenjualan)} | Laba: ${formatRupiah(day.grossProfit || 0)}`}
                        onClick={() => setLocation(`/laporan-penjualan?date=${day.date}`)}
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
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Detail Per Tanggal ({report.length} hari)
                </p>
                <Button
                  variant="ghost" size="sm" className="text-xs h-7 gap-1"
                  onClick={() => setSortBy(nextSort[sortBy])}
                >
                  <ArrowUpDown className="h-3 w-3" />
                  {nextSortLabel[sortBy]}
                </Button>
              </div>
              {report.length === 0 ? (
                <div className="py-12 text-center">
                  <CalendarDays className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Tidak ada data penjualan pada periode ini</p>
                </div>
              ) : (
                <ScrollArea className="max-h-[500px]">
                  <div className="space-y-2">
                    {sortedReport.map((day) => {
                      const marginPct = day.totalPenjualan > 0 ? Math.round(((day.grossProfit || 0) / day.totalPenjualan) * 100) : 0;
                      return (
                        <div
                          key={day.date}
                          className={`p-3 rounded-lg border transition-colors cursor-pointer group ${
                            day.totalPenjualan > 0
                              ? "hover:bg-muted/50 hover:border-primary/30"
                              : "bg-muted/10 opacity-60"
                          }`}
                          onClick={() => setLocation(`/laporan-penjualan?date=${day.date}`)}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium">{formatTanggalFull(day.date)}</p>
                                <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                                <span>{day.transactionCount} transaksi</span>
                                <span>{day.itemsSold || 0} item</span>
                                {day.refundCount > 0 && (
                                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                                    <RotateCcw className="h-2.5 w-2.5 mr-0.5" />
                                    {day.refundCount} refund
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-bold">{formatRupiah(day.totalPenjualan)}</p>
                              <div className="text-[10px] space-y-0.5 mt-1">
                                {day.totalDiskon > 0 && (
                                  <p className="text-yellow-600 dark:text-yellow-400">Diskon -{formatRupiah(day.totalDiskon)}</p>
                                )}
                                {(day.totalHPP || 0) > 0 && (
                                  <p className="text-muted-foreground">HPP {formatRupiah(day.totalHPP || 0)}</p>
                                )}
                                <p className={`font-medium ${marginPct >= 30 ? "text-green-600 dark:text-green-400" : marginPct >= 10 ? "text-yellow-600 dark:text-yellow-400" : "text-red-600 dark:text-red-400"}`}>
                                  Laba {formatRupiah(day.grossProfit || 0)} ({marginPct}%)
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
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

function KPICard({ icon: Icon, label, value, sub, variant = "default" }: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
  sub?: string;
  variant?: "success" | "danger" | "info" | "warning" | "default";
}) {
  const bgColors = {
    success: "bg-green-500/10",
    danger: "bg-red-500/10",
    info: "bg-blue-500/10",
    warning: "bg-yellow-500/10",
    default: "bg-primary/10",
  };
  const iconColors = {
    success: "text-green-600 dark:text-green-400",
    danger: "text-red-600 dark:text-red-400",
    info: "text-blue-600 dark:text-blue-400",
    warning: "text-yellow-600 dark:text-yellow-400",
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
