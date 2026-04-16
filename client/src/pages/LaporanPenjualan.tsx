import { useState, useMemo } from "react";
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
  Package, Tag, RotateCcw, Clock, DollarSign,
} from "lucide-react";
import { formatRupiah } from "../../../shared/finance";

const HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

function formatTanggal(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return `${HARI[d.getDay()]}, ${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
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
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [selectedDate, setSelectedDate] = useState(today);
  const [sortBy, setSortBy] = useState<"time" | "amount">("time");

  const { data: report, isLoading } = trpc.report.dailySales.useQuery(
    { date: selectedDate },
    { retry: false }
  );

  const navigateDate = (delta: number) => {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() + delta);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const sortedReceipts = useMemo(() => {
    if (!report?.receipts) return [];
    const list = [...report.receipts];
    if (sortBy === "amount") {
      list.sort((a, b) => b.grandTotal - a.grandTotal);
    }
    // default is time (already sorted desc from server)
    return list;
  }, [report?.receipts, sortBy]);

  // Hourly chart data
  const hourlyData = useMemo(() => {
    if (!report?.byHour) return [];
    const hours = [];
    for (let h = 0; h < 24; h++) {
      const key = `${String(h).padStart(2, "0")}:00`;
      const value = report.byHour[key] || 0;
      if (value > 0 || (h >= 7 && h <= 22)) {
        hours.push({ hour: key, value });
      }
    }
    return hours;
  }, [report?.byHour]);

  const maxHourlyValue = useMemo(() => Math.max(1, ...hourlyData.map(h => h.value)), [hourlyData]);

  return (
    <div className="space-y-6">
      {/* Header with date navigation */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Laporan Penjualan Harian
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Detail transaksi POS per hari</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => navigateDate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-40 h-9 text-sm"
            max={today}
          />
          <Button
            variant="outline" size="icon" className="h-9 w-9"
            onClick={() => navigateDate(1)}
            disabled={selectedDate >= today}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          {selectedDate !== today && (
            <Button variant="ghost" size="sm" className="text-xs h-9" onClick={() => setSelectedDate(today)}>
              Hari Ini
            </Button>
          )}
        </div>
      </div>

      <p className="text-sm font-medium text-muted-foreground -mt-3">{formatTanggal(selectedDate)}</p>

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
          {/* ─── KPI Cards ─── */}
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

          {/* ─── Payment Method Breakdown ─── */}
          {Object.keys(report.byPaymentMethod).length > 0 && (
            <Card className="border shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Metode Pembayaran</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {Object.entries(report.byPaymentMethod).map(([method, amount]) => {
                    const Icon = PAYMENT_ICONS[method] || Banknote;
                    const pct = report.totalSales > 0 ? Math.round((amount / report.totalSales) * 100) : 0;
                    return (
                      <div key={method} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">{method}</p>
                          <p className="text-sm font-bold">{formatRupiah(amount)}</p>
                        </div>
                        <Badge variant="secondary" className="text-xs shrink-0">{pct}%</Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ─── Hourly Sales Chart (simple bar chart) ─── */}
          {hourlyData.length > 0 && (
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

          {/* ─── Product Breakdown ─── */}
          {report.byProduct && report.byProduct.length > 0 && (
            <Card className="border shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <Package className="h-3 w-3" /> Penjualan Per Produk
                </p>
                <div className="space-y-2">
                  {report.byProduct.map((prod, idx) => {
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
                            <p className="text-xs text-muted-foreground">{prod.qty} item terjual</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <p className="text-sm font-bold">{formatRupiah(prod.revenue)}</p>
                          {prod.hpp > 0 && (
                            <p className={`text-[10px] ${marginPct >= 30 ? "text-success" : marginPct >= 10 ? "text-warning" : "text-danger"}`}>
                              Margin {marginPct}%
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ─── Receipts / Transactions List ─── */}
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
                  <p className="text-sm text-muted-foreground">Belum ada transaksi POS pada tanggal ini</p>
                </div>
              ) : (
                <ScrollArea className="max-h-[500px]">
                  <div className="space-y-2">
                    {sortedReceipts.map((receipt) => {
                      const payments = (typeof receipt.payments === "string"
                        ? JSON.parse(receipt.payments)
                        : receipt.payments) as Array<{ method: string; amount: number }>;
                      const isSplit = payments.length > 1;

                      return (
                        <div
                          key={receipt.id}
                          className={`p-3 rounded-lg border transition-colors hover:bg-muted/30 ${receipt.isRefunded ? "opacity-60 bg-danger/5 border-danger/20" : ""}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-xs font-mono text-muted-foreground">{receipt.receiptCode}</p>
                                {receipt.isRefunded && (
                                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0 gap-0.5">
                                    <RotateCcw className="h-2.5 w-2.5" /> Refund
                                  </Badge>
                                )}
                                {isSplit && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">Split</Badge>
                                )}
                              </div>
                              {receipt.createdAt && (
                                <p className="text-[11px] text-muted-foreground mt-0.5">{formatTime(receipt.createdAt)}</p>
                              )}
                              {receipt.notes && (
                                <p className="text-xs text-muted-foreground mt-1 truncate max-w-[200px]">{receipt.notes}</p>
                              )}
                            </div>
                            <div className="text-right shrink-0">
                              <p className={`text-sm font-bold ${receipt.isRefunded ? "line-through text-muted-foreground" : ""}`}>
                                {formatRupiah(receipt.grandTotal)}
                              </p>
                              {receipt.discountAmount > 0 && (
                                <p className="text-[10px] text-success">Diskon -{formatRupiah(receipt.discountAmount)}</p>
                              )}
                              <div className="flex items-center gap-1 justify-end mt-1">
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
                          </div>
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
            <Card className="border border-danger/20 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-danger/10 flex items-center justify-center shrink-0">
                    <RotateCcw className="h-5 w-5 text-danger" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Total Refund</p>
                    <p className="text-lg font-bold text-danger">{formatRupiah(report.totalRefunds)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Print button */}
          <div className="flex justify-end">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => {
              const w = window.open("", "_blank");
              if (!w) return;
              const dateLabel = formatTanggal(selectedDate);
              w.document.write(`<html><head><title>Laporan Penjualan ${dateLabel}</title>
                <style>
                  body{font-family:system-ui,-apple-system,sans-serif;padding:24px;max-width:800px;margin:auto;font-size:13px}
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
                  @media print{body{padding:0}}
                </style></head><body>
                <h1>Laporan Penjualan Harian</h1>
                <p class="date">${dateLabel}</p>
                <div class="summary">
                  <div class="summary-row"><span>Total Penjualan</span><span class="bold">${formatRupiah(report.totalSales)}</span></div>
                  <div class="summary-row"><span>Total Transaksi</span><span class="bold">${report.totalTransactions}</span></div>
                  <div class="summary-row"><span>Total Diskon</span><span>${formatRupiah(report.totalDiscount)}</span></div>
                  ${report.totalRefunds > 0 ? `<div class="summary-row"><span>Total Refund</span><span style="color:#dc2626">${formatRupiah(report.totalRefunds)}</span></div>` : ""}
                  <div class="summary-row" style="border-top:1px solid #ddd;padding-top:8px;margin-top:4px"><span class="bold">Penjualan Bersih</span><span class="bold">${formatRupiah(report.netSales)}</span></div>
                </div>
                ${report.byProduct && report.byProduct.length > 0 ? `
                <h2 style="font-size:14px;margin-top:20px">Produk Terjual</h2>
                <table>
                  <tr><th>Produk</th><th class="right">Qty</th><th class="right">Revenue</th></tr>
                  ${report.byProduct.map(p => `<tr><td>${p.name}</td><td class="right">${p.qty}</td><td class="right">${formatRupiah(p.revenue)}</td></tr>`).join("")}
                </table>` : ""}
                <h2 style="font-size:14px;margin-top:20px">Daftar Struk</h2>
                <table>
                  <tr><th>Kode</th><th>Waktu</th><th class="right">Total</th><th>Metode</th></tr>
                  ${sortedReceipts.map(r => {
                    const ps = (typeof r.payments === "string" ? JSON.parse(r.payments) : r.payments) as Array<{ method: string; amount: number }>;
                    return `<tr${r.isRefunded ? ' class="refund"' : ""}>
                      <td>${r.receiptCode}</td>
                      <td>${r.createdAt ? formatTime(r.createdAt) : "-"}</td>
                      <td class="right">${formatRupiah(r.grandTotal)}</td>
                      <td>${ps.map(p => p.method).join(" + ")}</td>
                    </tr>`;
                  }).join("")}
                </table>
                <script>window.onload=()=>{window.print()}<\/script>
              </body></html>`);
              w.document.close();
            }}>
              <Printer className="h-4 w-4" /> Cetak Laporan
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
