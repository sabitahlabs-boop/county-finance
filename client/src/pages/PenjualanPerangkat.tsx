import { useState, useMemo } from "react";
import { ComponentType } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Monitor, FileDown } from "lucide-react";
import { formatRupiah } from "../../../shared/finance";
import { exportToPDF, exportToExcel, fmtRp, ExportColumn } from "@/lib/export";
import { toast } from "sonner";

const HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

function formatTanggalShort(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getDate()} ${BULAN[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
}

function KPICard({ icon: Icon, label, value, variant = "default" }: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  variant?: "default" | "info" | "success" | "warning";
}) {
  const bgColor = {
    default: "bg-slate-50",
    info: "bg-blue-50",
    success: "bg-green-50",
    warning: "bg-amber-50",
  }[variant];

  const borderColor = {
    default: "border-slate-200",
    info: "border-blue-200",
    success: "border-green-200",
    warning: "border-amber-200",
  }[variant];

  const textColor = {
    default: "text-slate-600",
    info: "text-blue-600",
    success: "text-green-600",
    warning: "text-amber-600",
  }[variant];

  return (
    <Card className={`border ${borderColor} ${bgColor}`}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-bold mt-2">{value}</p>
          </div>
          <Icon className={`h-5 w-5 ${textColor}`} />
        </div>
      </CardContent>
    </Card>
  );
}

interface DeviceData {
  deviceInfo: string | null;
  transactionCount: number;
  totalSales: number;
  avgTransaction: number;
}

export default function PenjualanPerangkat() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  const { data: report, isLoading } = trpc.report.salesByDevice.useQuery(
    { startDate, endDate },
    { retry: false, enabled: startDate <= endDate }
  );

  const summary = useMemo(() => {
    if (!report) return { totalDevices: 0, activeDevice: null, totalSales: 0 };
    const totalDevices = report.length;
    const totalSales = report.reduce((sum, r) => sum + r.totalSales, 0);
    const activeDevice = report.length > 0 ? report[0] : null;
    return { totalDevices, activeDevice, totalSales };
  }, [report]);

  const chartData = useMemo(() => {
    if (!report || report.length === 0) return [];
    const total = report.reduce((sum, r) => sum + r.totalSales, 0);
    return report.map(d => ({
      name: d.deviceInfo || 'Unknown',
      value: total > 0 ? Math.round((d.totalSales / total) * 100) : 0,
      count: d.transactionCount,
      sales: d.totalSales,
    }));
  }, [report]);

  const handleExport = (format: "pdf" | "excel") => {
    if (!report || report.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    const total = report.reduce((sum, r) => sum + r.totalSales, 0);
    const columns: ExportColumn[] = [
      { header: "Info Perangkat", key: "deviceInfo", width: 40 },
      { header: "Total Transaksi", key: "transactionCount", width: 16, align: "right" },
      { header: "Total Penjualan (Rp)", key: "totalSales", width: 20, align: "right", format: fmtRp },
      { header: "Rata-rata/Transaksi (Rp)", key: "avgTransaction", width: 22, align: "right", format: fmtRp },
      { header: "% dari Total", key: "percentOfTotal", width: 14, align: "right", format: (v) => `${v}%` },
    ];

    const data = report.map((r) => ({
      deviceInfo: r.deviceInfo || "-",
      transactionCount: r.transactionCount,
      totalSales: r.totalSales,
      avgTransaction: r.avgTransaction,
      percentOfTotal: total > 0 ? Math.round((r.totalSales / total) * 100) : 0,
    }));

    const summaryRow = {
      deviceInfo: "TOTAL",
      transactionCount: report.reduce((sum, r) => sum + r.transactionCount, 0),
      totalSales: summary.totalSales,
      avgTransaction: report.reduce((sum, r) => sum + r.avgTransaction * r.transactionCount, 0) / (report.reduce((sum, r) => sum + r.transactionCount, 0) || 1),
      percentOfTotal: 100,
    };

    const options = {
      title: "Laporan Penjualan Per Perangkat",
      subtitle: `Periode ${formatTanggalShort(startDate)} s/d ${formatTanggalShort(endDate)}`,
      columns,
      data,
      summaryRow,
      filename: `penjualan_perangkat_${startDate}_${endDate}`,
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
            <Monitor className="h-5 w-5 text-primary" />
            Penjualan Per Perangkat
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Analisis penjualan dari browser/perangkat berbeda</p>
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
          <Skeleton className="h-64 rounded-xl" />
        </div>
      ) : !report ? (
        <Card className="border">
          <CardContent className="py-12 text-center">
            <Monitor className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Tidak dapat memuat data</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <KPICard
              icon={Monitor}
              label="Total Perangkat"
              value={String(summary.totalDevices)}
              variant="info"
            />
            <KPICard
              icon={Monitor}
              label="Perangkat Paling Aktif"
              value={summary.activeDevice?.deviceInfo || "-"}
              variant="success"
            />
            <KPICard
              icon={Monitor}
              label="Total Penjualan"
              value={formatRupiah(summary.totalSales)}
              variant="warning"
            />
          </div>

          {/* Export Buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => handleExport("pdf")}
            >
              <FileDown className="h-4 w-4" />
              Export PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => handleExport("excel")}
            >
              <FileDown className="h-4 w-4" />
              Export Excel
            </Button>
          </div>

          {/* Pie Chart (Simple representation) */}
          <Card className="border">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-6">Distribusi Penjualan per Perangkat</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Chart Legend */}
                <div className="space-y-3">
                  {chartData.map((item, idx) => {
                    const colors = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-orange-500", "bg-pink-500"];
                    const color = colors[idx % colors.length];
                    return (
                      <div key={idx} className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${color}`}></div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.count} transaksi</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm">{item.value}%</p>
                          <p className="text-xs text-muted-foreground">{formatRupiah(item.sales)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Percentage Bars */}
                <div className="space-y-4">
                  {chartData.map((item, idx) => {
                    const colors = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-orange-500", "bg-pink-500"];
                    const color = colors[idx % colors.length];
                    return (
                      <div key={idx} className="space-y-1">
                        <p className="text-xs font-medium">{item.name}</p>
                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full ${color}`}
                            style={{ width: `${item.value}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-muted-foreground text-right">{item.value}%</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Device Table */}
          <Card className="border">
            <CardContent className="p-0">
              <ScrollArea className="rounded-lg border-0">
                <div className="min-w-max">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-slate-50">
                        <th className="px-4 py-3 text-left font-semibold">Info Perangkat (User Agent)</th>
                        <th className="px-4 py-3 text-right font-semibold">Total Transaksi</th>
                        <th className="px-4 py-3 text-right font-semibold">Total Penjualan</th>
                        <th className="px-4 py-3 text-right font-semibold">Rata-rata/Transaksi</th>
                        <th className="px-4 py-3 text-right font-semibold">% dari Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.map((device, idx) => {
                        const total = report.reduce((sum, r) => sum + r.totalSales, 0);
                        const percentOfTotal = total > 0 ? Math.round((device.totalSales / total) * 100) : 0;
                        return (
                          <tr key={idx} className="border-b hover:bg-slate-50">
                            <td className="px-4 py-3">
                              <p className="text-xs text-muted-foreground font-mono max-w-xs truncate">
                                {device.deviceInfo || "-"}
                              </p>
                            </td>
                            <td className="px-4 py-3 text-right">{device.transactionCount}</td>
                            <td className="px-4 py-3 text-right font-medium">{formatRupiah(device.totalSales)}</td>
                            <td className="px-4 py-3 text-right">{formatRupiah(device.avgTransaction)}</td>
                            <td className="px-4 py-3 text-right">
                              <span className="font-semibold text-primary">{percentOfTotal}%</span>
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="bg-slate-50 font-semibold border-t-2">
                        <td className="px-4 py-3">TOTAL</td>
                        <td className="px-4 py-3 text-right">{report.reduce((sum, r) => sum + r.transactionCount, 0)}</td>
                        <td className="px-4 py-3 text-right">{formatRupiah(summary.totalSales)}</td>
                        <td className="px-4 py-3 text-right">
                          {formatRupiah(
                            report.reduce((sum, r) => sum + r.avgTransaction * r.transactionCount, 0) /
                            (report.reduce((sum, r) => sum + r.transactionCount, 0) || 1)
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">100%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
