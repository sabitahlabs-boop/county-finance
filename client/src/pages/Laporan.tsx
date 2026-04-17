import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, TrendingUp, Printer, FileSpreadsheet, Scale, Wallet, BookOpen, CheckCircle2, AlertCircle, FileDown, Sheet } from "lucide-react";
import { formatRupiah, BULAN_INDONESIA } from "../../../shared/finance";
import { exportToPDF, exportToExcel, fmtRp, ExportColumn } from "@/lib/export";
import { toast } from "sonner";

export default function Laporan() {
  const now = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const { data: business } = trpc.business.mine.useQuery(undefined, { retry: false });
  const { data: labaRugi, isLoading: lrLoading } = trpc.report.labaRugi.useQuery({ month, year }, { retry: false });
  const { data: arusKas, isLoading: akLoading } = trpc.report.arusKas.useQuery({ month, year }, { retry: false });
  const { data: neraca, isLoading: neracaLoading } = trpc.report.neraca.useQuery({ month, year }, { retry: false });
  const { data: perubahanModal, isLoading: pmLoading } = trpc.report.perubahanModal.useQuery({ month, year }, { retry: false });
  const { data: calk, isLoading: calkLoading } = trpc.report.calk.useQuery({ month, year }, { retry: false });

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: BULAN_INDONESIA[i],
  }));

  const handleExportLabaRugi = (format: "pdf" | "excel") => {
    if (!labaRugi) return;
    const bizName = business?.businessName ?? "Bisnis Saya";
    const columns: ExportColumn[] = [
      { header: "Deskripsi", key: "label", width: 25 },
      { header: "Jumlah (Rp)", key: "value", width: 18, align: "right", format: (v: any) => fmtRp(v) },
    ];

    const data = [
      { label: "Penjualan Produk", value: labaRugi.pendapatan.penjualan },
      { label: "Penjualan Jasa", value: labaRugi.pendapatan.jasa },
      { label: "Pendapatan Lain-lain", value: labaRugi.pendapatan.lainLain },
      { label: "Total Pendapatan", value: labaRugi.pendapatan.total },
      { label: "HPP (Harga Pokok)", value: labaRugi.pengeluaran.hpp },
      { label: "Operasional", value: labaRugi.pengeluaran.operasional },
      { label: "Gaji", value: labaRugi.pengeluaran.gaji },
      { label: "Utilitas", value: labaRugi.pengeluaran.utilitas },
      { label: "Sewa", value: labaRugi.pengeluaran.sewa },
      { label: "Transportasi", value: labaRugi.pengeluaran.transportasi },
      { label: "Lain-lain", value: labaRugi.pengeluaran.lainLain },
      { label: "Total Pengeluaran", value: labaRugi.pengeluaran.total },
      { label: "Laba Kotor", value: labaRugi.labaKotor },
      { label: "Laba Bersih", value: labaRugi.labaBersih },
    ];

    const options = {
      title: "Laporan Laba Rugi",
      subtitle: `${bizName} — ${labaRugi.period}`,
      columns,
      data,
      filename: `laba-rugi_${BULAN_INDONESIA[month - 1]}_${year}`,
      orientation: "portrait" as const,
    };

    if (format === "pdf") {
      exportToPDF(options);
      toast.success("PDF berhasil diunduh");
    } else {
      exportToExcel(options);
      toast.success("Excel berhasil diunduh");
    }
  };

  const handleExportArusKas = (format: "pdf" | "excel") => {
    if (!arusKas) return;
    const bizName = business?.businessName ?? "Bisnis Saya";
    const columns: ExportColumn[] = [
      { header: "Deskripsi", key: "label", width: 25 },
      { header: "Jumlah (Rp)", key: "value", width: 18, align: "right", format: (v: any) => fmtRp(v) },
    ];

    const masukItems = Object.entries(arusKas.kasMasuk)
      .filter(([k]) => k !== "total")
      .map(([label, value]) => ({ label, value }));

    const keluarItems = Object.entries(arusKas.kasKeluar)
      .filter(([k]) => k !== "total")
      .map(([label, value]) => ({ label, value }));

    const data = [
      ...masukItems,
      { label: "Total Kas Masuk", value: arusKas.kasMasuk.total },
      ...keluarItems,
      { label: "Total Kas Keluar", value: arusKas.kasKeluar.total },
      { label: "Arus Kas Bersih", value: arusKas.netKas },
    ];

    const options = {
      title: "Laporan Arus Kas",
      subtitle: `${bizName} — ${arusKas.period}`,
      columns,
      data,
      filename: `arus-kas_${BULAN_INDONESIA[month - 1]}_${year}`,
      orientation: "portrait" as const,
    };

    if (format === "pdf") {
      exportToPDF(options);
      toast.success("PDF berhasil diunduh");
    } else {
      exportToExcel(options);
      toast.success("Excel berhasil diunduh");
    }
  };

  const handleExportNeraca = (format: "pdf" | "excel") => {
    if (!neraca) return;
    const bizName = business?.businessName ?? "Bisnis Saya";
    const columns: ExportColumn[] = [
      { header: "Deskripsi", key: "label", width: 25 },
      { header: "Jumlah (Rp)", key: "value", width: 18, align: "right", format: (v: any) => fmtRp(v) },
    ];

    const data = [
      { label: "Kas & Setara Kas", value: neraca.aset.kas },
      { label: "Piutang Usaha", value: neraca.aset.piutang },
      { label: "Persediaan Barang", value: neraca.aset.persediaan },
      { label: "Total Aset Lancar", value: neraca.aset.totalAsetLancar },
      { label: "Aset Tetap", value: neraca.aset.asetTetap },
      { label: "Total Aset", value: neraca.aset.totalAset },
      { label: "Hutang Usaha", value: neraca.kewajiban.hutangUsaha },
      { label: "Hutang Lain-lain", value: neraca.kewajiban.hutangLain },
      { label: "Total Kewajiban", value: neraca.kewajiban.totalKewajiban },
      { label: "Modal", value: neraca.ekuitas.modalAwal },
      { label: "Laba Periode Berjalan", value: neraca.ekuitas.labaPeriode },
      { label: "Prive", value: neraca.ekuitas.prive },
      { label: "Total Ekuitas", value: neraca.ekuitas.totalEkuitas },
    ];

    const options = {
      title: "Laporan Neraca",
      subtitle: `${bizName} — ${neraca.period}`,
      columns,
      data,
      filename: `neraca_${BULAN_INDONESIA[month - 1]}_${year}`,
      orientation: "portrait" as const,
    };

    if (format === "pdf") {
      exportToPDF(options);
      toast.success("PDF berhasil diunduh");
    } else {
      exportToExcel(options);
      toast.success("Excel berhasil diunduh");
    }
  };

  const handleExportPerubahanModal = (format: "pdf" | "excel") => {
    if (!perubahanModal) return;
    const bizName = business?.businessName ?? "Bisnis Saya";
    const columns: ExportColumn[] = [
      { header: "Deskripsi", key: "label", width: 25 },
      { header: "Jumlah (Rp)", key: "value", width: 18, align: "right", format: (v: any) => fmtRp(v) },
    ];

    const data = [
      { label: "Modal Awal Periode", value: perubahanModal.modalAwal },
      { label: "Penambahan Modal", value: perubahanModal.penambahanModal },
      { label: "Laba/Rugi Bersih", value: perubahanModal.labaBersih },
      { label: "Prive / Pengambilan Pribadi", value: perubahanModal.prive },
      { label: "Modal Akhir Periode", value: perubahanModal.modalAkhir },
    ];

    const options = {
      title: "Laporan Perubahan Modal",
      subtitle: `${bizName} — ${perubahanModal.period}`,
      columns,
      data,
      filename: `perubahan-modal_${BULAN_INDONESIA[month - 1]}_${year}`,
      orientation: "portrait" as const,
    };

    if (format === "pdf") {
      exportToPDF(options);
      toast.success("PDF berhasil diunduh");
    } else {
      exportToExcel(options);
      toast.success("Excel berhasil diunduh");
    }
  };

  const ExportButtons = ({ type }: { type: string }) => {
    const handlers: Record<string, (format: "pdf" | "excel") => void> = {
      "laba-rugi": handleExportLabaRugi,
      "arus-kas": handleExportArusKas,
      "neraca": handleExportNeraca,
      "perubahan-modal": handleExportPerubahanModal,
    };

    const handler = handlers[type];
    const hasData =
      (type === "laba-rugi" && labaRugi) ||
      (type === "arus-kas" && arusKas) ||
      (type === "neraca" && neraca) ||
      (type === "perubahan-modal" && perubahanModal);

    return (
      <div className="flex gap-1.5 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          onClick={() => handler?.("pdf")}
          disabled={!hasData}
        >
          <FileDown className="h-3.5 w-3.5 mr-1" /> PDF
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          onClick={() => handler?.("excel")}
          disabled={!hasData}
        >
          <Sheet className="h-3.5 w-3.5 mr-1" /> Excel
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Laporan Keuangan</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Laporan otomatis berdasarkan transaksi Anda</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(month)} onValueChange={(v) => setMonth(parseInt(v))}>
            <SelectTrigger className="w-32 sm:w-40 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {months.map((m) => (<SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>))}
            </SelectContent>
          </Select>
          <Select value={String(year)} onValueChange={(v) => setYear(parseInt(v))}>
            <SelectTrigger className="w-20 sm:w-24 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="laba-rugi">
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <TabsList className="w-max sm:w-auto">
            <TabsTrigger value="laba-rugi" className="text-xs sm:text-sm gap-1"><FileText className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Laba</span> Rugi</TabsTrigger>
            <TabsTrigger value="neraca" className="text-xs sm:text-sm gap-1"><Scale className="h-3.5 w-3.5" /> Neraca</TabsTrigger>
            <TabsTrigger value="arus-kas" className="text-xs sm:text-sm gap-1"><TrendingUp className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Arus</span> Kas</TabsTrigger>
            <TabsTrigger value="perubahan-modal" className="text-xs sm:text-sm gap-1"><Wallet className="h-3.5 w-3.5" /> Modal</TabsTrigger>
            <TabsTrigger value="calk" className="text-xs sm:text-sm gap-1"><BookOpen className="h-3.5 w-3.5" /> CALK</TabsTrigger>
          </TabsList>
        </div>

        {/* ═══ 1. Laba Rugi ═══ */}
        <TabsContent value="laba-rugi" className="mt-4">
          {lrLoading ? <Skeleton className="h-96 rounded-xl" /> : !labaRugi ? <EmptyReport /> : (
            <Card className="border-0 shadow-md shadow-black/5">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4">
                <div>
                  <CardTitle className="text-base">Laporan Laba Rugi</CardTitle>
                  <CardDescription>{labaRugi.period} — {business?.businessName}</CardDescription>
                </div>
                <ExportButtons type="laba-rugi" />
              </CardHeader>
              <CardContent>
                <div className="space-y-5">
                  <ReportSection title="Pendapatan" color="emerald">
                    <ReportRow label="Penjualan Produk" value={labaRugi.pendapatan.penjualan} />
                    <ReportRow label="Penjualan Jasa" value={labaRugi.pendapatan.jasa} />
                    <ReportRow label="Pendapatan Lain-lain" value={labaRugi.pendapatan.lainLain} />
                    <ReportRow label="Total Pendapatan" value={labaRugi.pendapatan.total} bold className="border-t pt-1" />
                  </ReportSection>
                  <ReportSection title="Pengeluaran" color="red">
                    <ReportRow label="HPP (Harga Pokok)" value={labaRugi.pengeluaran.hpp} />
                    <ReportRow label="Operasional" value={labaRugi.pengeluaran.operasional} />
                    <ReportRow label="Gaji" value={labaRugi.pengeluaran.gaji} />
                    <ReportRow label="Utilitas" value={labaRugi.pengeluaran.utilitas} />
                    <ReportRow label="Sewa" value={labaRugi.pengeluaran.sewa} />
                    <ReportRow label="Transportasi" value={labaRugi.pengeluaran.transportasi} />
                    <ReportRow label="Lain-lain" value={labaRugi.pengeluaran.lainLain} />
                    <ReportRow label="Total Pengeluaran" value={labaRugi.pengeluaran.total} bold className="border-t pt-1" />
                  </ReportSection>
                  <div className="border-t-2 pt-4 space-y-2">
                    <ReportRow label="Laba Kotor" value={labaRugi.labaKotor} bold />
                    <ReportRow label="Laba Bersih" value={labaRugi.labaBersih} bold highlight />
                    <ReportRow label="Margin Laba" value={`${labaRugi.marginPct}%`} isText />
                    <ReportRow label="Estimasi Pajak" value={labaRugi.taxEstimate} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ═══ 2. Neraca ═══ */}
        <TabsContent value="neraca" className="mt-4">
          {neracaLoading ? <Skeleton className="h-96 rounded-xl" /> : !neraca ? <EmptyReport /> : (
            <Card className="border-0 shadow-md shadow-black/5">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    Laporan Neraca
                    {neraca.balance ? (
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px]">
                        <CheckCircle2 className="h-3 w-3 mr-0.5" /> Seimbang
                      </Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px]">
                        <AlertCircle className="h-3 w-3 mr-0.5" /> Tidak Seimbang
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>{neraca.period} — {business?.businessName}</CardDescription>
                </div>
                <ExportButtons type="neraca" />
              </CardHeader>
              <CardContent>
                <div className="space-y-5">
                  <ReportSection title="Aset" color="emerald">
                    <ReportRow label="Kas & Setara Kas" value={neraca.aset.kas} />
                    <ReportRow label="Piutang Usaha" value={neraca.aset.piutang} />
                    <ReportRow label="Persediaan Barang" value={neraca.aset.persediaan} />
                    <ReportRow label="Total Aset Lancar" value={neraca.aset.totalAsetLancar} bold className="border-t pt-1" />
                    <ReportRow label="Aset Tetap" value={neraca.aset.asetTetap} />
                    <ReportRow label="Total Aset" value={neraca.aset.totalAset} bold highlight className="border-t pt-1" />
                  </ReportSection>
                  <ReportSection title="Kewajiban" color="red">
                    <ReportRow label="Hutang Usaha" value={neraca.kewajiban.hutangUsaha} />
                    <ReportRow label="Hutang Lain-lain" value={neraca.kewajiban.hutangLain} />
                    <ReportRow label="Total Kewajiban" value={neraca.kewajiban.totalKewajiban} bold className="border-t pt-1" />
                  </ReportSection>
                  <ReportSection title="Ekuitas" color="blue">
                    <ReportRow label="Modal" value={neraca.ekuitas.modalAwal} />
                    <ReportRow label="Laba Periode Berjalan" value={neraca.ekuitas.labaPeriode} />
                    <ReportRow label="Prive (Pengambilan Pribadi)" value={neraca.ekuitas.prive} />
                    <ReportRow label="Total Ekuitas" value={neraca.ekuitas.totalEkuitas} bold highlight className="border-t pt-1" />
                  </ReportSection>
                  <div className="border-t-2 pt-4">
                    <ReportRow label="Kewajiban + Ekuitas" value={neraca.kewajiban.totalKewajiban + neraca.ekuitas.totalEkuitas} bold highlight />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ═══ 3. Arus Kas ═══ */}
        <TabsContent value="arus-kas" className="mt-4">
          {akLoading ? <Skeleton className="h-96 rounded-xl" /> : !arusKas ? <EmptyReport /> : (
            <Card className="border-0 shadow-md shadow-black/5">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4">
                <div>
                  <CardTitle className="text-base">Laporan Arus Kas</CardTitle>
                  <CardDescription>{arusKas.period} — {business?.businessName}</CardDescription>
                </div>
                <ExportButtons type="arus-kas" />
              </CardHeader>
              <CardContent>
                <div className="space-y-5">
                  <ReportSection title="Kas Masuk" color="emerald">
                    {Object.entries(arusKas.kasMasuk).filter(([k]) => k !== "total").map(([key, val]) => (
                      <ReportRow key={key} label={key} value={val as number} />
                    ))}
                    <ReportRow label="Total Kas Masuk" value={arusKas.kasMasuk.total} bold className="border-t pt-1" />
                  </ReportSection>
                  <ReportSection title="Kas Keluar" color="red">
                    {Object.entries(arusKas.kasKeluar).filter(([k]) => k !== "total").map(([key, val]) => (
                      <ReportRow key={key} label={key} value={val as number} />
                    ))}
                    <ReportRow label="Total Kas Keluar" value={arusKas.kasKeluar.total} bold className="border-t pt-1" />
                  </ReportSection>
                  <div className="border-t-2 pt-4">
                    <ReportRow label="Arus Kas Bersih" value={arusKas.netKas} bold highlight />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ═══ 4. Perubahan Modal ═══ */}
        <TabsContent value="perubahan-modal" className="mt-4">
          {pmLoading ? <Skeleton className="h-96 rounded-xl" /> : !perubahanModal ? <EmptyReport /> : (
            <Card className="border-0 shadow-md shadow-black/5">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4">
                <div>
                  <CardTitle className="text-base">Laporan Perubahan Modal</CardTitle>
                  <CardDescription>{perubahanModal.period} — {business?.businessName}</CardDescription>
                </div>
                <ExportButtons type="perubahan-modal" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <ReportRow label="Modal Awal Periode" value={perubahanModal.modalAwal} bold />
                  <div className="pl-3 sm:pl-4 space-y-1 border-l-2 border-emerald-200 dark:border-emerald-800 ml-1">
                    <ReportRow label="(+) Penambahan Modal" value={perubahanModal.penambahanModal} />
                    <ReportRow label={`(${perubahanModal.labaBersih >= 0 ? "+" : "-"}) Laba/Rugi Bersih`} value={perubahanModal.labaBersih} />
                    <ReportRow label="(-) Prive / Pengambilan Pribadi" value={perubahanModal.prive} />
                  </div>
                  <div className="border-t-2 pt-3 mt-3">
                    <ReportRow label="Modal Akhir Periode" value={perubahanModal.modalAkhir} bold highlight />
                  </div>
                  <p className="text-xs text-muted-foreground mt-4 pt-2 border-t">
                    Modal Akhir = Modal Awal + Penambahan Modal + Laba Bersih - Prive
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ═══ 5. CALK ═══ */}
        <TabsContent value="calk" className="mt-4">
          {calkLoading ? <Skeleton className="h-96 rounded-xl" /> : !calk ? <EmptyReport /> : (
            <Card className="border-0 shadow-md shadow-black/5">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Catatan atas Laporan Keuangan</CardTitle>
                <CardDescription>{calk.period} — {calk.businessName}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {calk.sections.map((section, idx) => (
                    <div key={idx}>
                      <h3 className="font-semibold text-sm mb-2">{section.title}</h3>
                      <div className="space-y-1 pl-2 sm:pl-3 border-l-2 border-border ml-1">
                        {section.items.map((item, i) => (
                          <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between py-1 text-sm gap-0.5">
                            <span className="text-muted-foreground text-xs sm:text-sm">{item.label}</span>
                            <span className="font-medium text-xs sm:text-sm">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Shared Components ───

function EmptyReport() {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <FileText className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Belum ada data untuk periode ini</p>
      </CardContent>
    </Card>
  );
}

function ReportSection({ title, color, children }: { title: string; color: "emerald" | "red" | "blue"; children: React.ReactNode }) {
  const colorClasses = {
    emerald: "text-emerald-700 dark:text-emerald-400",
    red: "text-red-700 dark:text-red-400",
    blue: "text-blue-700 dark:text-blue-400",
  };
  return (
    <div>
      <h3 className={`font-semibold text-xs sm:text-sm mb-2 uppercase tracking-wide ${colorClasses[color]}`}>{title}</h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function ReportRow({ label, value, bold, highlight, className, isText }: {
  label: string; value: number | string; bold?: boolean; highlight?: boolean; className?: string; isText?: boolean;
}) {
  const numVal = typeof value === "number" ? value : 0;
  const isNeg = numVal < 0;
  return (
    <div className={`flex items-center justify-between py-1 text-xs sm:text-sm ${className ?? ""}`}>
      <span className={bold ? "font-semibold" : "text-muted-foreground"}>{label}</span>
      <span className={`${bold ? "font-semibold" : ""} ${highlight ? (isNeg ? "text-red-600 text-sm sm:text-base" : "text-emerald-600 text-sm sm:text-base") : ""}`}>
        {isText ? value : formatRupiah(numVal)}
      </span>
    </div>
  );
}
