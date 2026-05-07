import { useState, useMemo, useEffect } from "react";
import { useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Receipt, TrendingUp, Banknote, CreditCard, QrCode,
  ShoppingBag, ChevronLeft, ChevronRight, Printer, ArrowUpDown,
  Package, Tag, RotateCcw, Clock, DollarSign, CalendarRange, CalendarDays, FileDown, Sheet,
  ChevronDown, ChevronUp, User, UserCircle, Smartphone, BarChart3, Percent,
} from "lucide-react";
import { formatRupiah } from "../../../shared/finance";
import { exportToPDF, exportToExcel, fmtRp, ExportColumn } from "@/lib/export";
import { toast } from "sonner";

const HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

function formatTanggal(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return `${HARI[d.getDay()]}, ${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
}

function formatTanggalShort(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getDate()} ${BULAN[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
}

function formatTime(dateStr: string | Date) {
  const d = new Date(dateStr);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const PAYMENT_ICONS: Record<string, typeof Banknote> = {
  "Tunai": Banknote,
  "Transfer/QRIS": CreditCard,
  "Transfer Bank": CreditCard,
  "QRIS": QrCode,
};

export default function LaporanPenjualan() {
  const searchQuery = useSearch();
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const dateFromParam = useMemo(() => {
    const params = new URLSearchParams(searchQuery);
    return params.get("date");
  }, [searchQuery]);
  const [mode, setMode] = useState<"daily" | "period">("daily");
  const [selectedDate, setSelectedDate] = useState(dateFromParam || today);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  // Sync with URL query param when navigating from PenjualanTanggal
  useEffect(() => {
    if (dateFromParam) {
      setSelectedDate(dateFromParam);
      setMode("daily");
    }
  }, [dateFromParam]);
  const [sortBy, setSortBy] = useState<"time" | "amount">("time");
  const [expandedReceipt, setExpandedReceipt] = useState<number | null>(null);

  // Daily mode query
  const { data: dailyReport, isLoading: dailyLoading } = trpc.report.dailySales.useQuery(
    { date: selectedDate },
    { retry: false, enabled: mode === "daily" }
  );

  // Period mode query
  const { data: periodReport, isLoading: periodLoading } = trpc.report.periodSales.useQuery(
    { startDate, endDate },
    { retry: false, enabled: mode === "period" && startDate <= endDate }
  );

  const isLoading = mode === "daily" ? dailyLoading : periodLoading;
  const report = mode === "daily" ? dailyReport : periodReport;

  const navigateDate = (delta: number) => {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() + delta);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const sortedReceipts = useMemo(() => {
    if (!report?.receipts) return [];
    const list = [...report.receipts];
    if (sortBy === "amount") {
      list.sort((a: any, b: any) => b.grandTotal - a.grandTotal);
    }
    return list;
  }, [report?.receipts, sortBy]);

  // Hourly chart data (daily mode only)
  const hourlyData = useMemo(() => {
    if (mode !== "daily" || !dailyReport?.byHour) return [];
    const hours = [];
    for (let h = 0; h < 24; h++) {
      const key = `${String(h).padStart(2, "0")}:00`;
      const value = dailyReport.byHour[key] || 0;
      if (value > 0 || (h >= 7 && h <= 22)) {
        hours.push({ hour: key, value });
      }
    }
    return hours;
  }, [dailyReport?.byHour, mode]);

  // Daily chart data (period mode only)
  const dailyChartData = useMemo(() => {
    if (mode !== "period" || !periodReport?.byDate) return [];
    const entries = Object.entries(periodReport.byDate).sort(([a], [b]) => a.localeCompare(b));
    return entries.map(([date, value]) => ({ date, label: formatTanggalShort(date), value }));
  }, [periodReport?.byDate, mode]);

  const maxHourlyValue = useMemo(() => Math.max(1, ...hourlyData.map(h => h.value)), [hourlyData]);
  const maxDailyValue = useMemo(() => Math.max(1, ...dailyChartData.map(d => d.value)), [dailyChartData]);

  const periodLabel = mode === "daily"
    ? formatTanggal(selectedDate)
    : `${formatTanggalShort(startDate)} — ${formatTanggalShort(endDate)}`;

  const handleExportSales = (format: "pdf" | "excel") => {
    if (!report) return;

    const columns: ExportColumn[] = [
      { header: "Kode Struk", key: "receiptCode", width: 15 },
      { header: mode === "period" ? "Tanggal" : "Waktu", key: "time", width: 15 },
      { header: "Pelanggan", key: "customer", width: 15 },
      { header: "Kasir", key: "cashier", width: 12 },
      { header: "Items", key: "itemCount", width: 8, align: "right" },
      { header: "Subtotal (Rp)", key: "subtotal", width: 16, align: "right", format: (v: any) => fmtRp(v) },
      { header: "Diskon (Rp)", key: "discount", width: 14, align: "right", format: (v: any) => fmtRp(v) },
      { header: "Total (Rp)", key: "grandTotal", width: 16, align: "right", format: (v: any) => fmtRp(v) },
      { header: "HPP (Rp)", key: "hpp", width: 14, align: "right", format: (v: any) => fmtRp(v) },
      { header: "Laba (Rp)", key: "profit", width: 14, align: "right", format: (v: any) => fmtRp(v) },
      { header: "Metode", key: "method", width: 15 },
      { header: "Status", key: "status", width: 10 },
    ];

    const data = sortedReceipts.map((r: any) => {
      const ps = (typeof r.payments === "string" ? JSON.parse(r.payments) : r.payments) as Array<{ method: string }>;
      const hpp = (r.items || []).reduce((s: number, i: any) => s + (i.hppSnapshot || 0) * i.qty, 0);
      return {
        receiptCode: r.receiptCode,
        time: mode === "period" ? formatTanggalShort(r.date) : (r.createdAt ? formatTime(r.createdAt) : "-"),
        customer: r.customerName || "-",
        cashier: r.cashierName || "-",
        itemCount: r.itemCount || 0,
        subtotal: r.subtotal,
        discount: r.discountAmount,
        grandTotal: r.grandTotal,
        hpp,
        profit: r.isRefunded ? 0 : (r.grandTotal - hpp),
        method: ps.map((p: any) => p.method).join(" + "),
        status: r.isRefunded ? "REFUND" : "OK",
      };
    });

    const totalHPP = data.reduce((s, d) => s + d.hpp, 0);
    const summaryRow = {
      receiptCode: "TOTAL",
      time: "",
      customer: "",
      cashier: "",
      itemCount: data.reduce((s, d) => s + d.itemCount, 0),
      subtotal: report.totalSales + report.totalDiscount,
      discount: report.totalDiscount,
      grandTotal: report.totalSales,
      hpp: totalHPP,
      profit: report.totalSales - totalHPP,
      method: "",
      status: "",
    };

    const subtitle = mode === "daily"
      ? `${formatTanggal(selectedDate)} — Laporan Penjualan Harian`
      : `Periode ${formatTanggalShort(startDate)} s/d ${formatTanggalShort(endDate)}`;

    const options = {
      title: "Laporan Penjualan",
      subtitle,
      columns,
      data,
      summaryRow,
      filename: mode === "daily" ? `penjualan_${selectedDate}` : `penjualan_${startDate}_${endDate}`,
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

  // Gross profit margin %
  const grossProfitPct = report && report.totalSales > 0
    ? Math.round(((report as any).grossProfit / report.totalSales) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Laporan Penjualan
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Detail transaksi POS per hari atau periode — ERP Detail</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Mode toggle */}
          <div className="flex border rounded-lg overflow-hidden">
            <button
              className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1 transition-colors ${mode === "daily" ? "bg-primary text-primary-foreground" : "bg-muted/30 hover:bg-muted"}`}
              onClick={() => setMode("daily")}
            >
              <CalendarDays className="h-3.5 w-3.5" /> Harian
            </button>
            <button
              className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1 transition-colors ${mode === "period" ? "bg-primary text-primary-foreground" : "bg-muted/30 hover:bg-muted"}`}
              onClick={() => setMode("period")}
            >
              <CalendarRange className="h-3.5 w-3.5" /> Periode
            </button>
          </div>

          {mode === "daily" ? (
            <>
              <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => navigateDate(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-40 h-9 text-sm"
              />
              <Button
                variant="outline" size="icon" className="h-9 w-9"
                onClick={() => navigateDate(1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              {selectedDate !== today && (
                <Button variant="ghost" size="sm" className="text-xs h-9" onClick={() => setSelectedDate(today)}>
                  Hari Ini
                </Button>
              )}
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>

      <p className="text-sm font-medium text-muted-foreground -mt-3">{periodLabel}</p>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      ) : !report ? (
        <Card className="border">
          <CardContent className="py-12 text-center">
            <Receipt className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Tidak dapat memuat data</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ─── KPI Cards (2 rows) ─── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KPICard
              icon={TrendingUp}
              label="Total Penjualan"
              value={formatRupiah(report.totalSales)}
              variant="success"
            />
            <KPICard
              icon={ShoppingBag}
              label="Transaksi"
              value={String(report.totalTransactions)}
              sub={report.totalTransactions > 0 ? `Rata-rata ${formatRupiah(Math.round(report.totalSales / report.totalTransactions))}` : undefined}
              variant="info"
            />
            <KPICard
              icon={Tag}
              label="Total Diskon"
              value={formatRupiah(report.totalDiscount)}
              variant="warning"
            />
            <KPICard
              icon={DollarSign}
              label="Penjualan Bersih"
              value={formatRupiah(report.netSales)}
              variant="default"
            />
          </div>

          {/* Row 2: Profitability KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 -mt-3">
            <KPICard
              icon={Package}
              label="Item Terjual"
              value={String((report as any).totalItemsSold || 0)}
              variant="info"
            />
            <KPICard
              icon={BarChart3}
              label="Total HPP"
              value={formatRupiah((report as any).totalHPP || 0)}
              variant="warning"
            />
            <KPICard
              icon={TrendingUp}
              label="Laba Kotor"
              value={formatRupiah((report as any).grossProfit || 0)}
              sub={`Margin ${grossProfitPct}%`}
              variant="success"
            />
            {report.totalRefunds > 0 ? (
              <KPICard
                icon={RotateCcw}
                label="Total Refund"
                value={formatRupiah(report.totalRefunds)}
                variant="danger"
              />
            ) : (
              <KPICard
                icon={Percent}
                label="Rata-rata Margin"
                value={`${grossProfitPct}%`}
                sub={report.totalTransactions > 0 ? `per ${report.totalTransactions} transaksi` : undefined}
                variant="default"
              />
            )}
          </div>

          {/* ─── Payment Method Breakdown ─── */}
          {Object.keys(report.byPaymentMethod).length > 0 && (
            <Card className="border shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Metode Pembayaran</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {Object.entries(report.byPaymentMethod).map(([method, amount]) => {
                    const Icon = PAYMENT_ICONS[method] || Banknote;
                    const pct = report.totalSales > 0 ? Math.round(((amount as number) / report.totalSales) * 100) : 0;
                    return (
                      <div key={method} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">{method}</p>
                          <p className="text-sm font-bold">{formatRupiah(amount as number)}</p>
                        </div>
                        <Badge variant="secondary" className="text-xs shrink-0">{pct}%</Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ─── Hourly Sales Chart (daily mode) ─── */}
          {mode === "daily" && hourlyData.length > 0 && (
            <Card className="border shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <Clock className="h-3 w-3" /> Penjualan Per Jam
                </p>
                <div className="flex items-end gap-1 h-32">
                  {hourlyData.map(({ hour, value }) => (
                    <div key={hour} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                      <div
                        className="w-full rounded-t bg-primary/70 hover:bg-primary transition-colors min-h-[2px]"
                        style={{ height: `${Math.max(2, (value / maxHourlyValue) * 100)}%` }}
                        title={`${hour}: ${formatRupiah(value)}`}
                      />
                      <span className="text-[9px] text-muted-foreground truncate w-full text-center">
                        {hour.slice(0, 2)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ─── Daily Sales Chart (period mode) ─── */}
          {mode === "period" && dailyChartData.length > 0 && (
            <Card className="border shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <CalendarDays className="h-3 w-3" /> Penjualan Per Hari
                </p>
                <div className="flex items-end gap-1 h-32">
                  {dailyChartData.map(({ date, label, value }) => (
                    <div key={date} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                      <div
                        className="w-full rounded-t bg-primary/70 hover:bg-primary transition-colors min-h-[2px]"
                        style={{ height: `${Math.max(2, (value / maxDailyValue) * 100)}%` }}
                        title={`${label}: ${formatRupiah(value)}`}
                      />
                      <span className="text-[9px] text-muted-foreground truncate w-full text-center">
                        {label.split(" ")[0]}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ─── Product Breakdown (with SKU) ─── */}
          {report.byProduct && report.byProduct.length > 0 && (
            <Card className="border shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <Package className="h-3 w-3" /> Penjualan Per Produk
                </p>
                <div className="space-y-2">
                  {report.byProduct.map((prod: any, idx: number) => {
                    const margin = prod.revenue - prod.hpp;
                    const marginPct = prod.revenue > 0 ? Math.round((margin / prod.revenue) * 100) : 0;
                    return (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary">
                            {idx + 1}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{prod.name}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {prod.sku && <span className="font-mono">{prod.sku}</span>}
                              {prod.category && <Badge variant="outline" className="text-[10px] px-1.5 py-0">{prod.category}</Badge>}
                              <span>{prod.qty} item</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <p className="text-sm font-bold">{formatRupiah(prod.revenue)}</p>
                          <div className="flex items-center gap-2 justify-end">
                            {prod.hpp > 0 && (
                              <span className="text-[10px] text-muted-foreground">HPP {formatRupiah(prod.hpp)}</span>
                            )}
                            {prod.hpp > 0 && (
                              <span className={`text-[10px] font-medium ${marginPct >= 30 ? "text-green-600 dark:text-green-400" : marginPct >= 10 ? "text-yellow-600 dark:text-yellow-400" : "text-red-600 dark:text-red-400"}`}>
                                {marginPct}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ─── Receipts / Transactions List (with drill-down) ─── */}
          <Card className="border shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Daftar Struk ({sortedReceipts.length})
                </p>
                <Button
                  variant="ghost" size="sm" className="text-xs h-7 gap-1"
                  onClick={() => setSortBy(s => s === "time" ? "amount" : "time")}
                >
                  <ArrowUpDown className="h-3 w-3" />
                  {sortBy === "time" ? "Urutkan Nominal" : "Urutkan Waktu"}
                </Button>
              </div>

              {sortedReceipts.length === 0 ? (
                <div className="py-12 text-center">
                  <Receipt className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Belum ada transaksi POS pada {mode === "daily" ? "tanggal" : "periode"} ini</p>
                </div>
              ) : (
                <ScrollArea className="max-h-[600px]">
                  <div className="space-y-2">
                    {sortedReceipts.map((receipt: any) => {
                      const payments = (typeof receipt.payments === "string"
                        ? JSON.parse(receipt.payments)
                        : receipt.payments) as Array<{ method: string; amount: number }>;
                      const isSplit = payments.length > 1;
                      const isExpanded = expandedReceipt === receipt.id;
                      const receiptItems = receipt.items || [];
                      const receiptHPP = receiptItems.reduce((s: number, i: any) => s + (i.hppSnapshot || 0) * i.qty, 0);

                      return (
                        <div
                          key={receipt.id}
                          className={`rounded-lg border transition-colors ${receipt.isRefunded ? "opacity-60 bg-red-500/5 border-red-500/20" : ""} ${isExpanded ? "ring-1 ring-primary/30" : ""}`}
                        >
                          {/* Receipt header row */}
                          <div
                            className="p-3 cursor-pointer hover:bg-muted/30 transition-colors"
                            onClick={() => setExpandedReceipt(isExpanded ? null : receipt.id)}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-xs font-mono text-muted-foreground">{receipt.receiptCode}</p>
                                  {receipt.isRefunded && (
                                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0 gap-0.5">
                                      <RotateCcw className="h-2.5 w-2.5" /> Refund
                                    </Badge>
                                  )}
                                  {isSplit && (
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">Split</Badge>
                                  )}
                                  {receipt.itemCount > 0 && (
                                    <span className="text-[10px] text-muted-foreground">{receipt.itemCount} item</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground flex-wrap">
                                  {mode === "period" && (
                                    <span>{formatTanggalShort(receipt.date)}</span>
                                  )}
                                  {receipt.createdAt && (
                                    <span className="flex items-center gap-0.5">
                                      <Clock className="h-2.5 w-2.5" />
                                      {formatTime(receipt.createdAt)}
                                    </span>
                                  )}
                                  {receipt.customerName && (
                                    <span className="flex items-center gap-0.5">
                                      <User className="h-2.5 w-2.5" />
                                      {receipt.customerName}
                                    </span>
                                  )}
                                  {receipt.cashierName && (
                                    <span className="flex items-center gap-0.5">
                                      <UserCircle className="h-2.5 w-2.5" />
                                      {receipt.cashierName}
                                    </span>
                                  )}
                                  {receipt.deviceInfo && (
                                    <span className="flex items-center gap-0.5">
                                      <Smartphone className="h-2.5 w-2.5" />
                                      {receipt.deviceInfo.length > 20 ? receipt.deviceInfo.slice(0, 20) + "…" : receipt.deviceInfo}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="text-right shrink-0 flex items-start gap-2">
                                <div>
                                  <p className={`text-sm font-bold ${receipt.isRefunded ? "line-through text-muted-foreground" : ""}`}>
                                    {formatRupiah(receipt.grandTotal)}
                                  </p>
                                  {receipt.discountAmount > 0 && (
                                    <p className="text-[10px] text-green-600 dark:text-green-400">Diskon -{formatRupiah(receipt.discountAmount)}</p>
                                  )}
                                  <div className="flex items-center gap-1 justify-end mt-0.5">
                                    {payments.map((p, i) => {
                                      const Icon = PAYMENT_ICONS[p.method] || Banknote;
                                      return (
                                        <span key={i} className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                                          <Icon className="h-3 w-3" />
                                          {isSplit && formatRupiah(p.amount)}
                                        </span>
                                      );
                                    })}
                                  </div>
                                </div>
                                <div className="pt-0.5">
                                  {isExpanded ? (
                                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Drill-down: Line items */}
                          {isExpanded && receiptItems.length > 0 && (
                            <div className="border-t px-3 pb-3 pt-2 bg-muted/10">
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Detail Item</p>
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="text-[10px] text-muted-foreground uppercase border-b">
                                      <th className="text-left py-1.5 pr-2">Produk</th>
                                      <th className="text-left py-1.5 pr-2">SKU</th>
                                      <th className="text-right py-1.5 pr-2">Qty</th>
                                      <th className="text-right py-1.5 pr-2">Harga</th>
                                      <th className="text-right py-1.5 pr-2">Subtotal</th>
                                      <th className="text-right py-1.5 pr-2">HPP</th>
                                      <th className="text-right py-1.5">Margin</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {receiptItems.map((item: any, idx: number) => {
                                      const itemHpp = (item.hppSnapshot || 0) * item.qty;
                                      const itemMargin = item.totalPrice - itemHpp;
                                      const itemMarginPct = item.totalPrice > 0 ? Math.round((itemMargin / item.totalPrice) * 100) : 0;
                                      return (
                                        <tr key={idx} className="border-b border-dashed last:border-0">
                                          <td className="py-1.5 pr-2 font-medium">{item.productName}</td>
                                          <td className="py-1.5 pr-2 font-mono text-muted-foreground">{item.sku || "-"}</td>
                                          <td className="py-1.5 pr-2 text-right">{item.qty}</td>
                                          <td className="py-1.5 pr-2 text-right">{formatRupiah(item.unitPrice)}</td>
                                          <td className="py-1.5 pr-2 text-right font-medium">{formatRupiah(item.totalPrice)}</td>
                                          <td className="py-1.5 pr-2 text-right text-muted-foreground">{formatRupiah(itemHpp)}</td>
                                          <td className={`py-1.5 text-right font-medium ${itemMarginPct >= 30 ? "text-green-600 dark:text-green-400" : itemMarginPct >= 10 ? "text-yellow-600 dark:text-yellow-400" : "text-red-600 dark:text-red-400"}`}>
                                            {formatRupiah(itemMargin)} ({itemMarginPct}%)
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                  <tfoot>
                                    <tr className="border-t font-semibold">
                                      <td className="py-1.5 pr-2" colSpan={2}>Total</td>
                                      <td className="py-1.5 pr-2 text-right">{receiptItems.reduce((s: number, i: any) => s + i.qty, 0)}</td>
                                      <td className="py-1.5 pr-2"></td>
                                      <td className="py-1.5 pr-2 text-right">{formatRupiah(receipt.grandTotal + receipt.discountAmount)}</td>
                                      <td className="py-1.5 pr-2 text-right text-muted-foreground">{formatRupiah(receiptHPP)}</td>
                                      <td className="py-1.5 text-right text-green-600 dark:text-green-400">
                                        {formatRupiah(receipt.grandTotal - receiptHPP)}
                                      </td>
                                    </tr>
                                  </tfoot>
                                </table>
                              </div>
                              {/* Additional receipt meta */}
                              <div className="mt-2 flex items-center gap-4 text-[10px] text-muted-foreground flex-wrap">
                                {receipt.notes && <span>Catatan: {receipt.notes}</span>}
                                {receipt.deviceInfo && <span>Device: {receipt.deviceInfo}</span>}
                                {receipt.shiftId && <span>Shift #{receipt.shiftId}</span>}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Refund summary if any */}
          {report.totalRefunds > 0 && (
            <Card className="border border-red-500/20 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                    <RotateCcw className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Total Refund</p>
                    <p className="text-lg font-bold text-red-500">{formatRupiah(report.totalRefunds)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Export buttons */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => handleExportSales("pdf")}
              disabled={!report || sortedReceipts.length === 0}
            >
              <FileDown className="h-4 w-4" /> PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => handleExportSales("excel")}
              disabled={!report || sortedReceipts.length === 0}
            >
              <Sheet className="h-4 w-4" /> Excel
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => {
              const w = window.open("", "_blank");
              if (!w) return;
              w.document.write(`<html><head><title>Laporan Penjualan ${periodLabel}</title>
                <style>
                  body{font-family:system-ui,-apple-system,sans-serif;padding:24px;max-width:1000px;margin:auto;font-size:13px}
                  h1{font-size:16px;margin:0}
                  .date{color:#666;margin-bottom:16px}
                  table{width:100%;border-collapse:collapse;margin-top:12px}
                  th,td{padding:6px 8px;text-align:left;border-bottom:1px solid #eee}
                  th{background:#f8f8f8;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#666}
                  .right{text-align:right}
                  .bold{font-weight:bold}
                  .summary{margin-top:16px;padding:12px;background:#f8f8f8;border-radius:8px}
                  .summary-row{display:flex;justify-content:space-between;padding:4px 0}
                  .refund{color:#dc2626;text-decoration:line-through}
                  .mono{font-family:monospace;font-size:11px}
                  .small{font-size:11px;color:#888}
                  @media print{body{padding:0}}
                </style></head><body>
                <h1>Laporan Penjualan ${mode === "daily" ? "Harian" : "Periode"}</h1>
                <p class="date">${periodLabel}</p>
                <div class="summary">
                  <div class="summary-row"><span>Total Penjualan</span><span class="bold">${formatRupiah(report.totalSales)}</span></div>
                  <div class="summary-row"><span>Total Transaksi</span><span class="bold">${report.totalTransactions}</span></div>
                  <div class="summary-row"><span>Total Diskon</span><span>${formatRupiah(report.totalDiscount)}</span></div>
                  <div class="summary-row"><span>Total HPP</span><span>${formatRupiah((report as any).totalHPP || 0)}</span></div>
                  <div class="summary-row"><span>Laba Kotor</span><span class="bold" style="color:#16a34a">${formatRupiah((report as any).grossProfit || 0)} (${grossProfitPct}%)</span></div>
                  ${report.totalRefunds > 0 ? `<div class="summary-row"><span>Total Refund</span><span style="color:#dc2626">${formatRupiah(report.totalRefunds)}</span></div>` : ""}
                  <div class="summary-row" style="border-top:1px solid #ddd;padding-top:8px;margin-top:4px"><span class="bold">Penjualan Bersih</span><span class="bold">${formatRupiah(report.netSales)}</span></div>
                </div>
                ${report.byProduct && report.byProduct.length > 0 ? `
                <h2 style="font-size:14px;margin-top:20px">Produk Terjual</h2>
                <table>
                  <tr><th>Produk</th><th>SKU</th><th>Kategori</th><th class="right">Qty</th><th class="right">Revenue</th><th class="right">HPP</th><th class="right">Margin</th></tr>
                  ${report.byProduct.map((p: any) => {
                    const m = p.revenue - p.hpp;
                    const mp = p.revenue > 0 ? Math.round((m / p.revenue) * 100) : 0;
                    return `<tr><td>${p.name}</td><td class="mono">${p.sku || "-"}</td><td>${p.category || "-"}</td><td class="right">${p.qty}</td><td class="right">${formatRupiah(p.revenue)}</td><td class="right">${formatRupiah(p.hpp)}</td><td class="right">${formatRupiah(m)} (${mp}%)</td></tr>`;
                  }).join("")}
                </table>` : ""}
                <h2 style="font-size:14px;margin-top:20px">Daftar Struk</h2>
                <table>
                  <tr><th>Kode</th><th>${mode === "period" ? "Tanggal" : "Waktu"}</th><th>Pelanggan</th><th>Kasir</th><th class="right">Items</th><th class="right">Total</th><th>Metode</th><th>Status</th></tr>
                  ${sortedReceipts.map((r: any) => {
                    const ps = (typeof r.payments === "string" ? JSON.parse(r.payments) : r.payments) as Array<{ method: string; amount: number }>;
                    return `<tr${r.isRefunded ? ' class="refund"' : ""}>
                      <td class="mono">${r.receiptCode}</td>
                      <td>${mode === "period" ? formatTanggalShort(r.date) + " " : ""}${r.createdAt ? formatTime(r.createdAt) : "-"}</td>
                      <td>${r.customerName || "-"}</td>
                      <td>${r.cashierName || "-"}</td>
                      <td class="right">${r.itemCount || 0}</td>
                      <td class="right">${formatRupiah(r.grandTotal)}</td>
                      <td>${ps.map(p => p.method).join(" + ")}</td>
                      <td>${r.isRefunded ? '<span style="color:#dc2626">REFUND</span>' : "OK"}</td>
                    </tr>`;
                  }).join("")}
                </table>
                <script>window.onload=()=>{window.print()}<\/script>
              </body></html>`);
              w.document.close();
            }}>
              <Printer className="h-4 w-4" /> Cetak
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function KPICard({ icon: Icon, label, value, sub, variant = "default" }: {
  icon: typeof TrendingUp;
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
