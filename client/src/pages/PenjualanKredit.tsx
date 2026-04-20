import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Banknote, Download, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { formatRupiah } from "../../../shared/finance";
import { exportToPDF, exportToExcel, fmtRp, fmtDate } from "@/lib/export";
import { toast } from "sonner";

type CreditStatus = "semua" | "belum_lunas" | "cicilan" | "lunas";

interface ExpandedRow {
  [key: number]: boolean;
}

export default function PenjualanKredit() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [status, setStatus] = useState<CreditStatus>("semua");
  const [expandedRows, setExpandedRows] = useState<ExpandedRow>({});
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedCreditId, setSelectedCreditId] = useState<number | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Tunai");
  const [paymentDate, setPaymentDate] = useState(today);
  const [paymentNotes, setPaymentNotes] = useState("");

  // Query credit sales
  const statusFilter = status === "semua" ? undefined : status;
  const { data: credits, isLoading, refetch } = trpc.credit.list.useQuery(
    { startDate, endDate, status: statusFilter },
    { retry: false, enabled: startDate <= endDate }
  );

  // Query payment history for selected credit
  const { data: paymentHistory } = trpc.credit.payments.useQuery(
    { creditSaleId: selectedCreditId ?? 0 },
    { retry: false, enabled: !!selectedCreditId }
  );

  // Add payment mutation
  const addPaymentMutation = trpc.credit.addPayment.useMutation();

  // Calculate summary
  const summary = useMemo(() => {
    if (!credits) return { totalPiutang: 0, totalBayar: 0, totalSisa: 0, jumlahAktif: 0 };
    return {
      totalPiutang: credits.reduce((sum, c) => sum + c.totalAmount, 0),
      totalBayar: credits.reduce((sum, c) => sum + c.paidAmount, 0),
      totalSisa: credits.reduce((sum, c) => sum + c.remainingAmount, 0),
      jumlahAktif: credits.filter((c) => c.status !== "lunas").length,
    };
  }, [credits]);

  const toggleRow = (id: number) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const openPaymentDialog = (creditId: number) => {
    setSelectedCreditId(creditId);
    setPaymentAmount("");
    setPaymentMethod("Tunai");
    setPaymentDate(today);
    setPaymentNotes("");
    setPaymentDialogOpen(true);
  };

  const handleAddPayment = async () => {
    if (!selectedCreditId || !paymentAmount || isNaN(parseFloat(paymentAmount))) {
      toast.error("Silakan isi jumlah pembayaran dengan benar");
      return;
    }

    try {
      await addPaymentMutation.mutateAsync({
        creditSaleId: selectedCreditId,
        amount: parseFloat(paymentAmount),
        paymentMethod,
        date: paymentDate,
        notes: paymentNotes,
      });

      toast.success("Pembayaran berhasil dicatat");
      setPaymentDialogOpen(false);
      refetch();
    } catch (error) {
      toast.error("Gagal mencatat pembayaran");
      console.error(error);
    }
  };

  const handleExportPDF = () => {
    if (!credits || credits.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    exportToPDF({
      title: "Penjualan Kredit",
      subtitle: `Periode: ${startDate} — ${endDate}`,
      filename: `Penjualan_Kredit_${startDate}_${endDate}`,
      columns: [
        { header: "No", key: "no", width: 6, align: "center" },
        { header: "Kode Struk", key: "receiptCode", width: 15 },
        { header: "Tanggal", key: "receiptDate", width: 15, format: fmtDate },
        { header: "Pelanggan", key: "clientName", width: 25 },
        { header: "Total Tagihan (Rp)", key: "totalAmount", width: 18, align: "right", format: fmtRp },
        { header: "Dibayar (Rp)", key: "paidAmount", width: 15, align: "right", format: fmtRp },
        { header: "Sisa (Rp)", key: "remainingAmount", width: 15, align: "right", format: fmtRp },
        { header: "Status", key: "status", width: 12 },
      ],
      data: credits.map((c, idx) => ({
        no: idx + 1,
        ...c,
      })),
      summaryRow: {
        no: "",
        receiptCode: "TOTAL",
        receiptDate: "",
        clientName: "",
        totalAmount: summary.totalPiutang,
        paidAmount: summary.totalBayar,
        remainingAmount: summary.totalSisa,
        status: "",
      },
    });

    toast.success("Laporan PDF berhasil diunduh");
  };

  const handleExportExcel = () => {
    if (!credits || credits.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    exportToExcel({
      title: "Penjualan Kredit",
      subtitle: `Periode: ${startDate} — ${endDate}`,
      filename: `Penjualan_Kredit_${startDate}_${endDate}`,
      columns: [
        { header: "No", key: "no", width: 6 },
        { header: "Kode Struk", key: "receiptCode", width: 15 },
        { header: "Tanggal", key: "receiptDate", width: 15, format: fmtDate },
        { header: "Pelanggan", key: "clientName", width: 25 },
        { header: "Total Tagihan (Rp)", key: "totalAmount", width: 18, format: fmtRp },
        { header: "Dibayar (Rp)", key: "paidAmount", width: 15, format: fmtRp },
        { header: "Sisa (Rp)", key: "remainingAmount", width: 15, format: fmtRp },
        { header: "Status", key: "status", width: 12 },
      ],
      data: credits.map((c, idx) => ({
        no: idx + 1,
        ...c,
      })),
      summaryRow: {
        no: "",
        receiptCode: "TOTAL",
        receiptDate: "",
        clientName: "",
        totalAmount: summary.totalPiutang,
        paidAmount: summary.totalBayar,
        remainingAmount: summary.totalSisa,
        status: "",
      },
    });

    toast.success("Laporan Excel berhasil diunduh");
  };

  const getStatusBadgeColor = (stat: string) => {
    switch (stat) {
      case "belum_lunas":
        return "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300";
      case "cicilan":
        return "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300";
      case "lunas":
        return "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300";
    }
  };

  const getStatusLabel = (stat: string) => {
    switch (stat) {
      case "belum_lunas":
        return "Belum Lunas";
      case "cicilan":
        return "Cicilan";
      case "lunas":
        return "Lunas";
      default:
        return stat;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Banknote className="h-5 w-5 text-primary" />
            Penjualan Kredit
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Kelola penjualan cicilan dan pembayaran kredit pelanggan
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
                Status
              </label>
              <Select value={status} onValueChange={(val) => setStatus(val as CreditStatus)}>
                <SelectTrigger className="mt-2 w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semua">Semua</SelectItem>
                  <SelectItem value="belum_lunas">Belum Lunas</SelectItem>
                  <SelectItem value="cicilan">Cicilan</SelectItem>
                  <SelectItem value="lunas">Lunas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                disabled={isLoading || !credits || credits.length === 0}
              >
                <FileText className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportExcel}
                disabled={isLoading || !credits || credits.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Piutang</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-32" />
            ) : (
              <p className="text-2xl font-bold">{formatRupiah(summary.totalPiutang)}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sudah Dibayar</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-32" />
            ) : (
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatRupiah(summary.totalBayar)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sisa Tagihan</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-32" />
            ) : (
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {formatRupiah(summary.totalSisa)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Jumlah Kredit Aktif</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-32" />
            ) : (
              <p className="text-2xl font-bold">{summary.jumlahAktif}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daftar Penjualan Kredit</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !credits || credits.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Tidak ada data penjualan kredit untuk periode ini
            </div>
          ) : (
            <ScrollArea className="w-full">
              <div className="space-y-0">
                {credits.map((credit, idx) => (
                  <div key={credit.id}>
                    {/* Main Row */}
                    <div
                      className="flex items-center gap-4 px-4 py-3 border-b hover:bg-muted/30 cursor-pointer text-sm"
                      onClick={() => toggleRow(credit.id)}
                    >
                      <button className="p-1 hover:bg-muted rounded">
                        {expandedRows[credit.id] ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                      <div className="flex-shrink-0 w-8 text-center font-medium">
                        {idx + 1}
                      </div>
                      <div className="flex-shrink-0 w-24 font-semibold">
                        {credit.receiptCode}
                      </div>
                      <div className="flex-shrink-0 w-24 text-muted-foreground">
                        {new Date(credit.receiptDate).toLocaleDateString("id-ID")}
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="font-medium truncate">{credit.clientName}</p>
                      </div>
                      <div className="flex-shrink-0 w-24 text-right">
                        {formatRupiah(credit.totalAmount)}
                      </div>
                      <div className="flex-shrink-0 w-20 text-right text-green-600 dark:text-green-400">
                        {formatRupiah(credit.paidAmount)}
                      </div>
                      <div className="flex-shrink-0 w-20 text-right text-orange-600 dark:text-orange-400">
                        {formatRupiah(credit.remainingAmount)}
                      </div>
                      <div className="flex-shrink-0">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded text-xs font-medium ${getStatusBadgeColor(
                            credit.status
                          )}`}
                        >
                          {getStatusLabel(credit.status)}
                        </span>
                      </div>
                      <div className="flex-shrink-0 w-24 text-right text-xs text-muted-foreground">
                        {credit.dueDate ? new Date(credit.dueDate).toLocaleDateString("id-ID") : "-"}
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {expandedRows[credit.id] && (
                      <div className="px-4 py-4 bg-muted/20 border-b space-y-4">
                        {/* Payment History */}
                        <div>
                          <h4 className="font-semibold text-sm mb-3">Riwayat Pembayaran</h4>
                          {!paymentHistory || paymentHistory.length === 0 ? (
                            <p className="text-xs text-muted-foreground">
                              Belum ada pembayaran untuk kredit ini
                            </p>
                          ) : (
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b">
                                  <th className="text-left py-2 px-2">Tanggal</th>
                                  <th className="text-right py-2 px-2">Jumlah</th>
                                  <th className="text-left py-2 px-2">Metode</th>
                                  <th className="text-left py-2 px-2">Catatan</th>
                                </tr>
                              </thead>
                              <tbody>
                                {paymentHistory.map((payment, pidx) => (
                                  <tr key={pidx} className="border-b">
                                    <td className="py-2 px-2">
                                      {new Date(payment.date).toLocaleDateString("id-ID")}
                                    </td>
                                    <td className="text-right py-2 px-2 font-semibold">
                                      {formatRupiah(payment.amount)}
                                    </td>
                                    <td className="py-2 px-2">
                                      {payment.paymentMethod || "-"}
                                    </td>
                                    <td className="py-2 px-2 text-muted-foreground">
                                      {payment.notes || "-"}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>

                        {/* Notes */}
                        {credit.notes && (
                          <div>
                            <h4 className="font-semibold text-sm mb-1">Catatan</h4>
                            <p className="text-xs text-muted-foreground">{credit.notes}</p>
                          </div>
                        )}

                        {/* Action Button */}
                        <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              onClick={() => openPaymentDialog(credit.id)}
                              disabled={credit.status === "lunas"}
                            >
                              Bayar
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Tambah Pembayaran</DialogTitle>
                              <DialogDescription>
                                Catat pembayaran untuk {credit.clientName}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <label className="text-xs font-semibold text-muted-foreground">
                                  Jumlah Pembayaran (Rp)
                                </label>
                                <Input
                                  type="number"
                                  placeholder="0"
                                  value={paymentAmount}
                                  onChange={(e) => setPaymentAmount(e.target.value)}
                                  className="mt-2"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-muted-foreground">
                                  Metode Pembayaran
                                </label>
                                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                  <SelectTrigger className="mt-2">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Tunai">Tunai</SelectItem>
                                    <SelectItem value="Transfer">Transfer</SelectItem>
                                    <SelectItem value="QRIS">QRIS</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-muted-foreground">
                                  Tanggal Pembayaran
                                </label>
                                <Input
                                  type="date"
                                  value={paymentDate}
                                  onChange={(e) => setPaymentDate(e.target.value)}
                                  className="mt-2"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-muted-foreground">
                                  Catatan (Opsional)
                                </label>
                                <Input
                                  placeholder="Catatan pembayaran..."
                                  value={paymentNotes}
                                  onChange={(e) => setPaymentNotes(e.target.value)}
                                  className="mt-2"
                                />
                              </div>
                              <div className="flex gap-2 justify-end pt-4">
                                <Button
                                  variant="outline"
                                  onClick={() => setPaymentDialogOpen(false)}
                                >
                                  Batal
                                </Button>
                                <Button
                                  onClick={handleAddPayment}
                                  disabled={addPaymentMutation.isPending}
                                >
                                  {addPaymentMutation.isPending ? "Menyimpan..." : "Simpan"}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
