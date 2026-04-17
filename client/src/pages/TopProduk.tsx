import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TrendingUp, Download, FileText } from "lucide-react";
import { formatRupiah } from "../../../shared/finance";
import { exportToPDF, exportToExcel, fmtRp } from "@/lib/export";
import { toast } from "sonner";

export default function TopProduk() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [limit, setLimit] = useState(10);

  // Query top products and categories
  const { data: data, isLoading } = trpc.report.topProducts.useQuery(
    { startDate, endDate, limit },
    { retry: false, enabled: startDate <= endDate }
  );

  const topProducts = data?.topProducts ?? [];
  const topCategories = data?.topCategories ?? [];

  const handleExportPDF = async () => {
    if ((topProducts.length === 0 && topCategories.length === 0)) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    // Export PDF dengan 2 tabel (top products + top categories)
    const { jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();

    // Title
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text("Top Produk & Kategori", pageWidth / 2, 15, { align: "center" });

    // Subtitle
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Periode: ${startDate} — ${endDate}`, pageWidth / 2, 22, { align: "center" });

    let startY = 28;

    // Top Products Table
    if (topProducts.length > 0) {
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      pdf.text("Top Produk", 14, startY);
      startY += 5;

      autoTable(pdf, {
        startY,
        head: [["Rank", "Nama Produk", "Qty", "Total Penjualan (Rp)"]],
        body: topProducts.map((p) => [
          p.rank.toString(),
          p.productName,
          p.qty.toString(),
          fmtRp(p.totalPenjualan),
        ]),
        theme: "grid",
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [30, 77, 155],
          textColor: 255,
          fontStyle: "bold",
          fontSize: 8,
        },
        alternateRowStyles: {
          fillColor: [245, 247, 250],
        },
      });

      startY = (pdf as any).lastAutoTable.finalY + 15;
    }

    // Top Categories Table
    if (topCategories.length > 0) {
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      pdf.text("Top Kategori", 14, startY);
      startY += 5;

      autoTable(pdf, {
        startY,
        head: [["Rank", "Kategori", "Qty", "Total Penjualan (Rp)"]],
        body: topCategories.map((c) => [
          c.rank.toString(),
          c.kategori,
          c.qty.toString(),
          fmtRp(c.totalPenjualan),
        ]),
        theme: "grid",
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [30, 77, 155],
          textColor: 255,
          fontStyle: "bold",
          fontSize: 8,
        },
        alternateRowStyles: {
          fillColor: [245, 247, 250],
        },
      });
    }

    // Footer
    const pageCount = pdf.getNumberOfPages();
    pdf.setFontSize(7);
    pdf.setFont("helvetica", "normal");
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.text(
        `County — Top Produk & Kategori — Halaman ${i} / ${pageCount}`,
        pageWidth / 2,
        pdf.internal.pageSize.getHeight() - 8,
        { align: "center" }
      );
      pdf.text(
        `Dicetak: ${new Date().toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}`,
        pageWidth / 2,
        pdf.internal.pageSize.getHeight() - 4,
        { align: "center" }
      );
    }

    pdf.save(`Top_Produk_Kategori_${startDate}_${endDate}.pdf`);
    toast.success("Laporan PDF berhasil diunduh");
  };

  const handleExportExcel = async () => {
    if ((topProducts.length === 0 && topCategories.length === 0)) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    const XLSX = await import("xlsx");
    const workbook = XLSX.utils.book_new();

    // Top Products sheet
    if (topProducts.length > 0) {
      const productsData = [
        ["Top Produk"],
        [`Periode: ${startDate} — ${endDate}`],
        [],
        ["Rank", "Nama Produk", "Qty", "Total Penjualan (Rp)"],
        ...topProducts.map((p) => [
          p.rank,
          p.productName,
          p.qty,
          p.totalPenjualan,
        ]),
      ];

      const productsSheet = XLSX.utils.aoa_to_sheet(productsData);
      productsSheet["!cols"] = [
        { wch: 6 },
        { wch: 35 },
        { wch: 12 },
        { wch: 25 },
      ];
      XLSX.utils.book_append_sheet(workbook, productsSheet, "Top Produk");
    }

    // Top Categories sheet
    if (topCategories.length > 0) {
      const categoriesData = [
        ["Top Kategori"],
        [`Periode: ${startDate} — ${endDate}`],
        [],
        ["Rank", "Kategori", "Qty", "Total Penjualan (Rp)"],
        ...topCategories.map((c) => [
          c.rank,
          c.kategori,
          c.qty,
          c.totalPenjualan,
        ]),
      ];

      const categoriesSheet = XLSX.utils.aoa_to_sheet(categoriesData);
      categoriesSheet["!cols"] = [
        { wch: 6 },
        { wch: 25 },
        { wch: 12 },
        { wch: 25 },
      ];
      XLSX.utils.book_append_sheet(workbook, categoriesSheet, "Top Kategori");
    }

    const { saveAs } = await import("file-saver");
    const buf = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf], { type: "application/octet-stream" }), `Top_Produk_Kategori_${startDate}_${endDate}.xlsx`);
    toast.success("Laporan Excel berhasil diunduh");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Top Produk & Kategori
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Ranking produk dan kategori berdasarkan total penjualan
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
            <div>
              <label className="text-xs font-semibold text-muted-foreground">
                Tampilkan Top N
              </label>
              <Input
                type="number"
                value={limit}
                onChange={(e) => setLimit(Math.max(1, parseInt(e.target.value) || 10))}
                className="mt-2 w-24"
                min="1"
                max="100"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                disabled={isLoading || (topProducts.length === 0 && topCategories.length === 0)}
              >
                <FileText className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportExcel}
                disabled={isLoading || (topProducts.length === 0 && topCategories.length === 0)}
              >
                <Download className="h-4 w-4 mr-2" />
                Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two columns: Top Products and Top Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Produk</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : topProducts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Tidak ada data penjualan produk
              </div>
            ) : (
              <ScrollArea className="w-full">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-2 text-center font-semibold text-xs">Rank</th>
                      <th className="px-4 py-2 text-left font-semibold text-xs">Nama Produk</th>
                      <th className="px-4 py-2 text-right font-semibold text-xs">Qty</th>
                      <th className="px-4 py-2 text-right font-semibold text-xs">Total Penjualan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.map((row) => (
                      <tr key={row.productName} className="border-b hover:bg-muted/30">
                        <td className="px-4 py-2 text-center font-bold text-primary">
                          #{row.rank}
                        </td>
                        <td className="px-4 py-2 font-medium">{row.productName}</td>
                        <td className="px-4 py-2 text-right">{row.qty}</td>
                        <td className="px-4 py-2 text-right font-semibold">
                          {formatRupiah(row.totalPenjualan)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Top Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Kategori</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : topCategories.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Tidak ada data kategori
              </div>
            ) : (
              <ScrollArea className="w-full">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-2 text-center font-semibold text-xs">Rank</th>
                      <th className="px-4 py-2 text-left font-semibold text-xs">Kategori</th>
                      <th className="px-4 py-2 text-right font-semibold text-xs">Qty</th>
                      <th className="px-4 py-2 text-right font-semibold text-xs">Total Penjualan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topCategories.map((row) => (
                      <tr key={row.kategori} className="border-b hover:bg-muted/30">
                        <td className="px-4 py-2 text-center font-bold text-primary">
                          #{row.rank}
                        </td>
                        <td className="px-4 py-2 font-medium">{row.kategori}</td>
                        <td className="px-4 py-2 text-right">{row.qty}</td>
                        <td className="px-4 py-2 text-right font-semibold">
                          {formatRupiah(row.totalPenjualan)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
