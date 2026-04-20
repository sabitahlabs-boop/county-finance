import { useState, useMemo } from "react";
import { ComponentType } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, FileDown, ChevronDown, ChevronUp } from "lucide-react";
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
    info: "bg-blue-50 dark:bg-blue-950",
    success: "bg-green-50 dark:bg-green-950",
    warning: "bg-amber-50 dark:bg-amber-950",
  }[variant];

  const borderColor = {
    default: "border-slate-200",
    info: "border-blue-200 dark:border-blue-800",
    success: "border-green-200 dark:border-green-800",
    warning: "border-amber-200 dark:border-amber-800",
  }[variant];

  const textColor = {
    default: "text-slate-600",
    info: "text-blue-600 dark:text-blue-400",
    success: "text-green-600 dark:text-green-400",
    warning: "text-amber-600 dark:text-amber-400",
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

export default function PenjualanStaff() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [expandedStaff, setExpandedStaff] = useState<string | null>(null);

  const { data: report, isLoading } = trpc.report.salesByStaff.useQuery(
    { startDate, endDate },
    { retry: false, enabled: startDate <= endDate }
  );

  const { data: staffDetail, isLoading: isLoadingDetail } = trpc.report.staffSalesDetail.useQuery(
    { staffName: expandedStaff || "", startDate, endDate },
    { retry: false, enabled: expandedStaff !== null }
  );

  const summary = useMemo(() => {
    if (!report) return { totalStaff: 0, totalSales: 0, avgPerStaff: 0 };
    const totalStaff = report.length;
    const totalSales = report.reduce((sum, r) => sum + r.totalSales, 0);
    const avgPerStaff = totalStaff > 0 ? Math.round(totalSales / totalStaff) : 0;
    return { totalStaff, totalSales, avgPerStaff };
  }, [report]);

  const handleExport = (format: "pdf" | "excel") => {
    if (!report || report.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    const columns: ExportColumn[] = [
      { header: "Staff Name", key: "staffName", width: 25 },
      { header: "Total Transaksi", key: "transactionCount", width: 16, align: "right" },
      { header: "Total Penjualan (Rp)", key: "totalSales", width: 20, align: "right", format: fmtRp },
      { header: "Komisi (Rp)", key: "commissionEarned", width: 18, align: "right", format: fmtRp },
    ];

    const data = report.map((r, idx) => ({
      rank: idx + 1,
      staffName: r.staffName || "-",
      transactionCount: r.transactionCount,
      totalSales: r.totalSales,
      commissionEarned: r.commissionEarned,
    }));

    const summaryRow = {
      staffName: "TOTAL",
      transactionCount: report.reduce((sum, r) => sum + r.transactionCount, 0),
      totalSales: summary.totalSales,
      commissionEarned: report.reduce((sum, r) => sum + r.commissionEarned, 0),
    };

    const options = {
      title: "Laporan Penjualan Per Staff",
      subtitle: `Periode ${formatTanggalShort(startDate)} s/d ${formatTanggalShort(endDate)}`,
      columns,
      data,
      summaryRow,
      filename: `penjualan_staff_${startDate}_${endDate}`,
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
            <Users className="h-5 w-5 text-primary" />
            Penjualan Per Penjual/Staff
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Tracking performa penjualan setiap kasir/staf</p>
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
            <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Tidak dapat memuat data</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <KPICard
              icon={Users}
              label="Total Staff Aktif"
              value={String(summary.totalStaff)}
              variant="info"
            />
            <KPICard
              icon={Users}
              label="Total Penjualan"
              value={formatRupiah(summary.totalSales)}
              variant="success"
            />
            <KPICard
              icon={Users}
              label="Rata-rata per Staff"
              value={formatRupiah(summary.avgPerStaff)}
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

          {/* Staff Ranking Table */}
          <Card className="border">
            <CardContent className="p-0">
              <ScrollArea className="rounded-lg border-0">
                <div className="min-w-max">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-slate-50">
                        <th className="px-4 py-3 text-left font-semibold">Rank</th>
                        <th className="px-4 py-3 text-left font-semibold">Nama Staff</th>
                        <th className="px-4 py-3 text-right font-semibold">Total Transaksi</th>
                        <th className="px-4 py-3 text-right font-semibold">Total Penjualan</th>
                        <th className="px-4 py-3 text-right font-semibold">Komisi</th>
                        <th className="px-4 py-3 text-center font-semibold">Detail</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.map((staff, idx) => (
                        <tr key={staff.staffName} className="border-b hover:bg-slate-50">
                          <td className="px-4 py-3 font-semibold text-center">
                            <Badge variant="outline">{idx + 1}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium">{staff.staffName || "-"}</p>
                          </td>
                          <td className="px-4 py-3 text-right">{staff.transactionCount}</td>
                          <td className="px-4 py-3 text-right font-medium">{formatRupiah(staff.totalSales)}</td>
                          <td className="px-4 py-3 text-right font-medium text-green-600 dark:text-green-400">{formatRupiah(staff.commissionEarned)}</td>
                          <td className="px-4 py-3 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpandedStaff(expandedStaff === staff.staffName ? null : staff.staffName || null)}
                            >
                              {expandedStaff === staff.staffName ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Staff Detail (Expandable) */}
          {expandedStaff !== null && (
            <Card className="border">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4">
                  Detail Transaksi: {expandedStaff}
                </h3>
                {isLoadingDetail ? (
                  <Skeleton className="h-48 rounded" />
                ) : staffDetail && staffDetail.length > 0 ? (
                  <ScrollArea className="rounded-lg border">
                    <div className="min-w-max">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b bg-slate-50">
                            <th className="px-3 py-2 text-left">Tanggal</th>
                            <th className="px-3 py-2 text-left">Kode Struk</th>
                            <th className="px-3 py-2 text-right">Total Penjualan</th>
                            <th className="px-3 py-2 text-right">Komisi</th>
                            <th className="px-3 py-2 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {staffDetail.map((detail, idx) => (
                            <tr key={idx} className="border-b hover:bg-slate-50">
                              <td className="px-3 py-2">{formatTanggalShort(detail.date)}</td>
                              <td className="px-3 py-2 font-mono text-xs">{detail.receiptCode}</td>
                              <td className="px-3 py-2 text-right font-medium">{formatRupiah(detail.saleAmount)}</td>
                              <td className="px-3 py-2 text-right font-medium text-green-600 dark:text-green-400">{formatRupiah(detail.commissionAmount)}</td>
                              <td className="px-3 py-2 text-center">
                                {detail.status === 'paid' ? (
                                  <Badge variant="default" className="text-xs">Dibayar</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs">Menunggu</Badge>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </ScrollArea>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">Tidak ada transaksi</p>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
