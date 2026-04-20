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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Coins, Download, FileText } from "lucide-react";
import { formatRupiah } from "../../../shared/finance";
import { exportToPDF, exportToExcel, fmtRp, fmtDate } from "@/lib/export";
import { toast } from "sonner";

interface SelectedCommissions {
  [key: number]: boolean;
}

export default function KomisiStaff() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [selectedUserId, setSelectedUserId] = useState<number | undefined>();
  const [selectedCommissions, setSelectedCommissions] = useState<SelectedCommissions>({});

  // Config state
  const [configEnabled, setConfigEnabled] = useState(false);
  const [commissionType, setCommissionType] = useState<"percentage" | "flat">("percentage");
  const [commissionRate, setCommissionRate] = useState("");

  // Query config
  const { data: config, isLoading: configLoading } = trpc.commission.config.useQuery();

  // Query commission data
  const { data: commissions, isLoading: commissionsLoading, refetch } = trpc.commission.report.useQuery(
    { startDate, endDate, userId: selectedUserId },
    { retry: false, enabled: startDate <= endDate }
  );

  // Query summary by staff
  const { data: summary } = trpc.commission.summary.useQuery(
    { startDate, endDate },
    { retry: false, enabled: startDate <= endDate }
  );

  // Mutations
  const updateConfigMutation = trpc.commission.updateConfig.useMutation();
  const markPaidMutation = trpc.commission.markPaid.useMutation();
  const markBulkPaidMutation = trpc.commission.markBulkPaid.useMutation();

  // Initialize config state when loaded
  useMemo(() => {
    if (config) {
      setConfigEnabled(config.isEnabled);
      setCommissionType(config.commissionType);
      setCommissionRate(config.commissionRate.toString());
    }
  }, [config]);

  // Calculate summary metrics
  const metrics = useMemo(() => {
    if (!commissions) {
      return {
        totalKomisi: 0,
        totalBelumDibayar: 0,
        totalSudahDibayar: 0,
      };
    }
    const totalKomisi = commissions.reduce((sum, c) => sum + c.commissionAmount, 0);
    const totalBelumDibayar = commissions.reduce((sum, c) => c.status === "pending" ? sum + c.commissionAmount : sum, 0);
    const totalSudahDibayar = commissions.reduce((sum, c) => c.status === "paid" ? sum + c.commissionAmount : sum, 0);
    return {
      totalKomisi,
      totalBelumDibayar,
      totalSudahDibayar,
    };
  }, [commissions]);

  const handleSaveConfig = async () => {
    if (!commissionRate || isNaN(parseFloat(commissionRate))) {
      toast.error("Silakan masukkan nilai komisi yang benar");
      return;
    }

    try {
      await updateConfigMutation.mutateAsync({
        isEnabled: configEnabled,
        commissionType,
        commissionRate: parseInt(commissionRate),
      });
      toast.success("Konfigurasi komisi berhasil disimpan");
    } catch (error) {
      toast.error("Gagal menyimpan konfigurasi komisi");
      console.error(error);
    }
  };

  const handleMarkPaid = async (commissionId: number) => {
    try {
      await markPaidMutation.mutateAsync({ id: commissionId });
      toast.success("Komisi berhasil ditandai sebagai dibayar");
      refetch();
    } catch (error) {
      toast.error("Gagal menandai komisi sebagai dibayar");
      console.error(error);
    }
  };

  const handleMarkBulkPaid = async () => {
    const ids = Object.entries(selectedCommissions)
      .filter(([, isSelected]) => isSelected)
      .map(([id]) => parseInt(id));

    if (ids.length === 0) {
      toast.error("Silakan pilih minimal satu komisi");
      return;
    }

    try {
      await markBulkPaidMutation.mutateAsync({ ids });
      toast.success(`${ids.length} komisi berhasil ditandai sebagai dibayar`);
      setSelectedCommissions({});
      refetch();
    } catch (error) {
      toast.error("Gagal menandai komisi sebagai dibayar");
      console.error(error);
    }
  };

  const handleExportPDF = () => {
    if (!commissions || commissions.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    exportToPDF({
      title: "Laporan Komisi Staff",
      subtitle: `Periode: ${startDate} — ${endDate}`,
      filename: `Komisi_Staff_${startDate}_${endDate}`,
      columns: [
        { header: "No", key: "no", width: 6, align: "center" },
        { header: "Tanggal", key: "date", width: 14, format: fmtDate },
        { header: "Kode Struk", key: "receiptCode", width: 18 },
        { header: "Nama Staff", key: "userName", width: 20 },
        { header: "Total Penjualan (Rp)", key: "saleAmount", width: 18, align: "right", format: fmtRp },
        { header: "Komisi (Rp)", key: "commissionAmount", width: 16, align: "right", format: fmtRp },
        { header: "Status", key: "status", width: 14 },
      ],
      data: commissions.map((c, idx) => ({
        no: idx + 1,
        ...c,
      })),
      summaryRow: {
        no: "",
        date: "",
        receiptCode: "",
        userName: "TOTAL",
        saleAmount: commissions.reduce((sum, c) => sum + c.saleAmount, 0),
        commissionAmount: metrics.totalKomisi,
        status: "",
      },
    });

    toast.success("Laporan PDF berhasil diunduh");
  };

  const handleExportExcel = () => {
    if (!commissions || commissions.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    exportToExcel({
      title: "Laporan Komisi Staff",
      filename: `Komisi_Staff_${startDate}_${endDate}`,
      columns: [
        { header: "No", key: "no" },
        { header: "Tanggal", key: "date", format: fmtDate },
        { header: "Kode Struk", key: "receiptCode" },
        { header: "Nama Staff", key: "userName" },
        { header: "Total Penjualan (Rp)", key: "saleAmount", format: fmtRp },
        { header: "Komisi (Rp)", key: "commissionAmount", format: fmtRp },
        { header: "Status", key: "status" },
      ],
      data: commissions.map((c, idx) => ({
        no: idx + 1,
        ...c,
      })),
    });

    toast.success("Laporan Excel berhasil diunduh");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            Komisi Staff
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Kelola komisi penjualan untuk setiap transaksi POS
          </p>
        </div>
      </div>

      {/* Config Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pengaturan Komisi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {configLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-6 w-48" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <Label htmlFor="enable-commission">Aktifkan Komisi</Label>
                <Switch
                  id="enable-commission"
                  checked={configEnabled}
                  onCheckedChange={setConfigEnabled}
                />
              </div>

              {configEnabled && (
                <>
                  <div>
                    <Label htmlFor="commission-type" className="mb-2 block text-sm">
                      Tipe Komisi
                    </Label>
                    <Select value={commissionType} onValueChange={(value: any) => setCommissionType(value)}>
                      <SelectTrigger id="commission-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Persentase (%)</SelectItem>
                        <SelectItem value="flat">Flat (Rp)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="commission-rate" className="mb-2 block text-sm">
                      Nilai Komisi {commissionType === "percentage" ? "(%)" : "(Rp)"}
                    </Label>
                    <Input
                      id="commission-rate"
                      type="number"
                      value={commissionRate}
                      onChange={(e) => setCommissionRate(e.target.value)}
                      placeholder={commissionType === "percentage" ? "Contoh: 5" : "Contoh: 50000"}
                    />
                  </div>
                </>
              )}

              <Button onClick={handleSaveConfig} disabled={updateConfigMutation.isPending}>
                Simpan Pengaturan
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-1">Total Komisi Periode</div>
            <div className="text-2xl font-bold">{formatRupiah(metrics.totalKomisi)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-1">Belum Dibayar</div>
            <div className="text-2xl font-bold text-amber-600">{formatRupiah(metrics.totalBelumDibayar)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-1">Sudah Dibayar</div>
            <div className="text-2xl font-bold text-green-600">{formatRupiah(metrics.totalSudahDibayar)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="start-date" className="text-sm mb-2 block">Dari Tanggal</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="end-date" className="text-sm mb-2 block">Sampai Tanggal</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="staff-filter" className="text-sm mb-2 block">Filter Staff</Label>
              <Select value={selectedUserId?.toString() ?? "all"} onValueChange={(val) => setSelectedUserId(val === "all" ? undefined : parseInt(val))}>
                <SelectTrigger id="staff-filter">
                  <SelectValue placeholder="Semua Staff" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Staff</SelectItem>
                  {summary?.map((s) => (
                    <SelectItem key={s.userId} value={s.userId.toString()}>
                      {s.userName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Per-Staff Summary Table */}
      {summary && summary.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ringkasan per Staff</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="text-left py-2 px-3 font-medium">Nama Staff</th>
                    <th className="text-right py-2 px-3 font-medium">Total Penjualan</th>
                    <th className="text-right py-2 px-3 font-medium">Total Komisi</th>
                    <th className="text-right py-2 px-3 font-medium">Belum Dibayar</th>
                    <th className="text-right py-2 px-3 font-medium">Sudah Dibayar</th>
                    <th className="text-right py-2 px-3 font-medium">Transaksi</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.map((row) => (
                    <tr key={row.userId} className="border-b hover:bg-muted/30">
                      <td className="py-2 px-3">{row.userName || "Unknown"}</td>
                      <td className="text-right py-2 px-3">{formatRupiah(row.totalSalesAmount)}</td>
                      <td className="text-right py-2 px-3 font-semibold">{formatRupiah(row.totalCommissionAmount)}</td>
                      <td className="text-right py-2 px-3 text-amber-600">{formatRupiah(row.commissionPending)}</td>
                      <td className="text-right py-2 px-3 text-green-600">{formatRupiah(row.commissionPaid)}</td>
                      <td className="text-right py-2 px-3">{row.transactionCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detail Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Detail Komisi</CardTitle>
          <div className="flex gap-2">
            {Object.values(selectedCommissions).some(Boolean) && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleMarkBulkPaid}
                disabled={markBulkPaidMutation.isPending}
              >
                Bayar {Object.values(selectedCommissions).filter(Boolean).length} Komisi
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={handleExportPDF}>
              <FileText className="h-4 w-4 mr-1" />
              PDF
            </Button>
            <Button size="sm" variant="outline" onClick={handleExportExcel}>
              <Download className="h-4 w-4 mr-1" />
              Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {commissionsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : !commissions || commissions.length === 0 ? (
            <div className="text-center py-12">
              <Coins className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">Tidak ada data komisi untuk periode ini</p>
            </div>
          ) : (
            <ScrollArea className="w-full">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="py-2 px-3 w-10">
                      <input
                        type="checkbox"
                        checked={Object.values(selectedCommissions).every(Boolean) && Object.keys(selectedCommissions).length > 0}
                        onChange={(e) => {
                          const newSelected: SelectedCommissions = {};
                          if (e.target.checked && commissions) {
                            commissions.forEach((c) => {
                              newSelected[c.id] = true;
                            });
                          }
                          setSelectedCommissions(newSelected);
                        }}
                      />
                    </th>
                    <th className="text-left py-2 px-3 font-medium">No</th>
                    <th className="text-left py-2 px-3 font-medium">Tanggal</th>
                    <th className="text-left py-2 px-3 font-medium">Kode Struk</th>
                    <th className="text-left py-2 px-3 font-medium">Nama Staff</th>
                    <th className="text-right py-2 px-3 font-medium">Total Penjualan</th>
                    <th className="text-right py-2 px-3 font-medium">Komisi</th>
                    <th className="text-center py-2 px-3 font-medium">Status</th>
                    <th className="text-center py-2 px-3 font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.map((c, idx) => (
                    <tr key={c.id} className="border-b hover:bg-muted/30">
                      <td className="py-2 px-3">
                        <input
                          type="checkbox"
                          checked={selectedCommissions[c.id] ?? false}
                          onChange={(e) => {
                            setSelectedCommissions((prev) => ({
                              ...prev,
                              [c.id]: e.target.checked,
                            }));
                          }}
                          disabled={c.status === "paid"}
                        />
                      </td>
                      <td className="py-2 px-3">{idx + 1}</td>
                      <td className="py-2 px-3">{c.date}</td>
                      <td className="py-2 px-3">{c.receiptCode}</td>
                      <td className="py-2 px-3">{c.userName}</td>
                      <td className="text-right py-2 px-3">{formatRupiah(c.saleAmount)}</td>
                      <td className="text-right py-2 px-3 font-semibold">{formatRupiah(c.commissionAmount)}</td>
                      <td className="text-center py-2 px-3">
                        {c.status === "pending" ? (
                          <span className="text-xs font-semibold text-amber-600 bg-amber-100 px-2 py-1 rounded">
                            Pending
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded">
                            Dibayar
                          </span>
                        )}
                      </td>
                      <td className="text-center py-2 px-3">
                        {c.status === "pending" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMarkPaid(c.id)}
                            disabled={markPaidMutation.isPending}
                          >
                            Bayar
                          </Button>
                        )}
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
  );
}
