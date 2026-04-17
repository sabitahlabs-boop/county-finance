import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, FileDown, Sheet } from "lucide-react";
import { formatRupiah } from "../../../shared/finance";
import { exportToPDF, exportToExcel, fmtRp, ExportColumn } from "@/lib/export";
import { toast } from "sonner";

const HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

function formatTanggalShort(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getDate()} ${BULAN[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
}

export default function PenjualanPelanggan() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  const { data: report, isLoading } = trpc.report.salesByCustomer.useQuery(
    { startDate, endDate },
    { retry: false, enabled: startDate <= endDate }
  );

  const summary = useMemo(() => {
    if (!report) return { totalCustomers: 0, totalSales: 0, avgPerCustomer: 0 };
    const totalCustomers = report.length;
    const totalSales = report.reduce((sum, r) => sum + r.totalPenjualan, 0);
    const avgPerCustomer = totalCustomers > 0 ? Math.round(totalSales / totalCustomers) : 0;
    return { totalCustomers, totalSales, avgPerCustomer };
  }, [report]);

  const handleExport = (format: "pdf" | "excel") => {
    if (!report || report.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    const columns: ExportColumn[] = [
      { header: "No", key: "no", width: 8, align: "center" },
      { header: "Nama Pelanggan", key: "clientName", width: 30 },
      { header: "Tipe", key: "clientType", width: 15 },
      { header: "Jumlah Transaksi", key: "transactionCount", width: 18, align: "right" },
      { header: "Total Penjualan (Rp)", key: "totalPenjualan", width: 20, align: "right", format: fmtRp },
      { header: "Total Diskon (Rp)", key: "totalDiskon", width: 20, align: "right", format: fmtRp },
    ];

    const data = report.map((r, idx) => ({
      no: idx + 1,
      clientName: r.clientName,
      clientType: r.clientType,
      transactionCount: r.transactionCount,
      totalPenjualan: r.totalPenjualan,
      totalDiskon: r.totalDiskon,
    }));

    const summaryRow = {
      no: "",
      clientName: "TOTAL",
      clientType: "",
      transactionCount: report.reduce((sum, r) => sum + r.transactionCount, 0),
      totalPenjualan: summary.totalSales,
      totalDiskon: report.reduce((sum, r) => sum + r.totalDiskon, 0),
    };

    const options = {
      title: "Laporan Penjualan Per Pelanggan",
      subtitle: `Periode ${formatTanggalShort(startDate)} s/d ${formatTanggalShort(endDate)}`,
      columns,
      data,
      summaryRow,
      filename: `penjualan_pelanggan_${startDate}_${endDate}`,
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
            Penjualan Per Pelanggan
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Detail penjualan berdasarkan data pelanggan</p>
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
              label="Total Pelanggan"
              value={String(summary.totalCustomers)}
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
              label="Rata-rata per Pelanggan"
              value={formatRupiah(summary.avgPerCustomer)}
              variant="default"
            />
          </div>

          {/* Table */}
          <Card className="border shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Daftar Pelanggan ({report.length})
              </p>
              {report.length === 0 ? (
                <div className="py-12 text-center">
                  <Users className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Tidak ada data pelanggan pada periode ini</p>
                </div>
              ) : (
                <ScrollArea className="max-h-[500px]">
                  <div className="space-y-2">
                    {report.map((customer, idx) => {
                      const typeColor = customer.clientType === "regular" ? "default" : customer.clientType === "vip" ? "yellow" : "blue";
                      return (
                        <div
                          key={customer.clientId}
                          className="p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-xs font-mono text-muted-foreground">#{idx + 1}</span>
                                <p className="text-sm font-medium truncate">{customer.clientName}</p>
                                <Badge
                                  variant={typeColor as any}
                                  className="text-[10px] px-1.5 py-0 shrink-0 capitalize"
                                >
                                  {customer.clientType}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {customer.transactionCount} transaksi
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-bold">{formatRupiah(customer.totalPenjualan)}</p>
                              {customer.totalDiskon > 0 && (
                                <p className="text-[10px] text-warning">Diskon -{formatRupiah(customer.totalDiskon)}</p>
                              )}
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

function KPICard({ icon: Icon, label, value, variant = "default" }: {
  icon: typeof Users;
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
