import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tag, Download, FileText } from "lucide-react";
import { formatRupiah } from "../../../shared/finance";
import { exportToPDF, exportToExcel, fmtRp } from "@/lib/export";
import { toast } from "sonner";

export default function RingkasanDiskon() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  // Query discount summary
  const { data: discounts, isLoading } = trpc.report.discountSummary.useQuery(
    { startDate, endDate },
    { retry: false, enabled: startDate <= endDate }
  );

  // Calculate summary
  const summary = useMemo(() => {
    if (!discounts) {
      return {
        totalDiskon: 0,
        totalOrderBerdiskon: 0,
        rataRataDiskonPerOrder: 0,
      };
    }
    const totalDiskon = discounts.reduce((sum, d) => sum + d.totalDiscount, 0);
    const totalOrder = discounts.reduce((sum, d) => sum + d.orderCount, 0);
    const rataRata = totalOrder > 0 ? totalDiskon / totalOrder : 0;

    return {
      totalDiskon,
      totalOrderBerdiskon: totalOrder,
      rataRataDiskonPerOrder: rataRata,
    };
  }, [discounts]);

  const handleExportPDF = () => {
    if (!discounts || discounts.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    exportToPDF({
      title: "Ringkasan Diskon",
      subtitle: `Periode: ${startDate} — ${endDate}`,
      filename: `Ringkasan_Diskon_${startDate}_${endDate}`,
      columns: [
        { header: "No", key: "no", width: 6, align: "center" },
        { header: "Kode Diskon", key: "code", width: 15 },
        { header: "Nama Diskon", key: "name", width: 25 },
        { header: "Tipe", key: "type", width: 12 },
        { header: "Nilai", key: "value", width: 10, align: "right" },
        { header: "Jumlah Order", key: "orderCount", width: 12, align: "right" },
        { header: "Total Diskon (Rp)", key: "totalDiscount", width: 18, align: "right", format: fmtRp },
        { header: "Total Sebelum Diskon (Rp)", key: "totalBeforeDiscount", width: 20, align: "right", format: fmtRp },
        { header: "Rata-rata Diskon/Order (Rp)", key: "avgDiscountPerOrder", width: 20, align: "right", format: fmtRp },
      ],
      data: discounts.map((d, idx) => ({
        no: idx + 1,
        ...d,
      })),
      summaryRow: {
        no: "",
        code: "",
        name: "TOTAL",
        type: "",
        value: "",
        orderCount: summary.totalOrderBerdiskon,
        totalDiscount: summary.totalDiskon,
        totalBeforeDiscount: discounts.reduce((sum, d) => sum + d.totalBeforeDiscount, 0),
        avgDiscountPerOrder: summary.rataRataDiskonPerOrder,
      },
    });

    toast.success("Laporan PDF berhasil diunduh");
  };

  const handleExportExcel = () => {
    if (!discounts || discounts.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    exportToExcel({
      title: "Ringkasan Diskon",
      subtitle: `Periode: ${startDate} — ${endDate}`,
      filename: `Ringkasan_Diskon_${startDate}_${endDate}`,
      columns: [
        { header: "No", key: "no", width: 6 },
        { header: "Kode Diskon", key: "code", width: 15 },
        { header: "Nama Diskon", key: "name", width: 25 },
        { header: "Tipe", key: "type", width: 12 },
        { header: "Nilai", key: "value", width: 10 },
        { header: "Jumlah Order", key: "orderCount", width: 12 },
        { header: "Total Diskon (Rp)", key: "totalDiscount", width: 18, format: fmtRp },
        { header: "Total Sebelum Diskon (Rp)", key: "totalBeforeDiscount", width: 20, format: fmtRp },
        { header: "Rata-rata Diskon/Order (Rp)", key: "avgDiscountPerOrder", width: 20, format: fmtRp },
      ],
      data: discounts.map((d, idx) => ({
        no: idx + 1,
        ...d,
      })),
      summaryRow: {
        no: "",
        code: "",
        name: "TOTAL",
        type: "",
        value: "",
        orderCount: summary.totalOrderBerdiskon,
        totalDiscount: summary.totalDiskon,
        totalBeforeDiscount: discounts.reduce((sum, d) => sum + d.totalBeforeDiscount, 0),
        avgDiscountPerOrder: summary.rataRataDiskonPerOrder,
      },
    });

    toast.success("Laporan Excel berhasil diunduh");
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "percentage":
        return "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300";
      case "fixed":
        return "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "percentage":
        return "Persentase";
      case "fixed":
        return "Nominal";
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Tag className="h-5 w-5 text-primary" />
            Ringkasan Diskon
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Analisis penggunaan dan dampak diskon terhadap penjualan
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
                disabled={isLoading || !discounts || discounts.length === 0}
              >
                <FileText className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportExcel}
                disabled={isLoading || !discounts || discounts.length === 0}
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
            <CardTitle className="text-sm font-medium">Total Diskon Diberikan</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-32" />
            ) : (
              <p className="text-3xl font-bold">{formatRupiah(summary.totalDiskon)}</p>
            )}
            {!isLoading && (
              <p className="text-xs text-muted-foreground mt-2">
                Periode: {startDate} — {endDate}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Jumlah Pesanan Berdiskon</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-32" />
            ) : (
              <p className="text-3xl font-bold">{summary.totalOrderBerdiskon}</p>
            )}
            {!isLoading && (
              <p className="text-xs text-muted-foreground mt-2">
                Total order dengan diskon
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Rata-rata Diskon per Pesanan</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-32" />
            ) : (
              <p className="text-3xl font-bold">{formatRupiah(summary.rataRataDiskonPerOrder)}</p>
            )}
            {!isLoading && (
              <p className="text-xs text-muted-foreground mt-2">
                Rata-rata nilai diskon
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detail Diskon</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !discounts || discounts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Tidak ada data diskon untuk periode ini
            </div>
          ) : (
            <ScrollArea className="w-full">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-2 text-left font-semibold text-xs">No</th>
                    <th className="px-4 py-2 text-left font-semibold text-xs">Kode Diskon</th>
                    <th className="px-4 py-2 text-left font-semibold text-xs">Nama Diskon</th>
                    <th className="px-4 py-2 text-left font-semibold text-xs">Tipe</th>
                    <th className="px-4 py-2 text-right font-semibold text-xs">Nilai</th>
                    <th className="px-4 py-2 text-right font-semibold text-xs">Jumlah Order</th>
                    <th className="px-4 py-2 text-right font-semibold text-xs">Total Diskon (Rp)</th>
                    <th className="px-4 py-2 text-right font-semibold text-xs">Total Sebelum Diskon (Rp)</th>
                    <th className="px-4 py-2 text-right font-semibold text-xs">Rata-rata Diskon/Order (Rp)</th>
                  </tr>
                </thead>
                <tbody>
                  {discounts.map((row, idx) => (
                    <tr key={row.discountCodeId} className="border-b hover:bg-muted/30">
                      <td className="px-4 py-2">{idx + 1}</td>
                      <td className="px-4 py-2 font-medium">{row.code}</td>
                      <td className="px-4 py-2">{row.name}</td>
                      <td className="px-4 py-2">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded text-xs font-medium ${getTypeBadgeColor(
                            row.type
                          )}`}
                        >
                          {getTypeLabel(row.type)}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        {row.type === "percentage" ? `${row.value}%` : formatRupiah(row.value)}
                      </td>
                      <td className="px-4 py-2 text-right">{row.orderCount}</td>
                      <td className="px-4 py-2 text-right font-semibold">
                        {formatRupiah(row.totalDiscount)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {formatRupiah(row.totalBeforeDiscount)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {formatRupiah(row.avgDiscountPerOrder)}
                      </td>
                    </tr>
                  ))}
                  {/* Summary row */}
                  <tr className="bg-muted/50 font-bold border-t-2">
                    <td colSpan={2} className="px-4 py-3">
                      TOTAL
                    </td>
                    <td className="px-4 py-3"></td>
                    <td className="px-4 py-3"></td>
                    <td className="px-4 py-3"></td>
                    <td className="px-4 py-3 text-right">{summary.totalOrderBerdiskon}</td>
                    <td className="px-4 py-3 text-right">
                      {formatRupiah(summary.totalDiskon)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatRupiah(
                        discounts.reduce((sum, d) => sum + d.totalBeforeDiscount, 0)
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatRupiah(summary.rataRataDiskonPerOrder)}
                    </td>
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
