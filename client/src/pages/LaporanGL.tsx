import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookOpen, CheckCircle2, AlertCircle, TrendingUp, TrendingDown, Scale, FileText, ChevronRight, FileDown, Sheet } from "lucide-react";
import { BULAN_INDONESIA } from "../../../shared/finance";
import { exportToPDF, exportToExcel, fmtRp, ExportColumn } from "@/lib/export";
import { toast } from "sonner";

function formatRp(amount: number): string {
  if (amount === 0) return "Rp 0";
  const abs = Math.abs(amount);
  const formatted = new Intl.NumberFormat("id-ID").format(abs);
  return amount < 0 ? `(Rp ${formatted})` : `Rp ${formatted}`;
}

type AccountRow = { code: string; name: string; parentCode: string | null; isHeader: boolean; amount: number };

function AccountTable({ rows, showAmount = true }: { rows: AccountRow[]; showAmount?: boolean }) {
  if (!rows || rows.length === 0) return <p className="text-sm text-muted-foreground py-2">Tidak ada data</p>;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Kode</TableHead>
          <TableHead>Nama Akun</TableHead>
          {showAmount && <TableHead className="text-right w-[160px]">Saldo</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.filter(r => !r.isHeader || r.amount !== 0).map((row) => (
          <TableRow key={row.code} className={row.isHeader ? "bg-muted/50 font-semibold" : ""}>
            <TableCell className="font-mono text-xs">{row.code}</TableCell>
            <TableCell className={row.parentCode ? "pl-8" : ""}>{row.name}</TableCell>
            {showAmount && (
              <TableCell className={`text-right font-mono text-sm ${row.amount < 0 ? "text-red-600" : ""}`}>
                {formatRp(row.amount)}
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function LaporanGL() {
  const now = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [tab, setTab] = useState("trial-balance");
  const [bbCode, setBbCode] = useState<string | null>(null);

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: BULAN_INDONESIA[i],
  }));

  // Queries
  const { data: trialBalance, isLoading: tbLoading } = trpc.report.trialBalanceGL.useQuery(
    { month, year },
    { retry: false }
  );
  const { data: labaRugi, isLoading: lrLoading } = trpc.report.labaRugiGL.useQuery(
    { month, year },
    { retry: false, enabled: tab === "laba-rugi" || tab === "trial-balance" }
  );
  const { data: neraca, isLoading: neracaLoading } = trpc.report.neracaGL.useQuery(
    { month, year },
    { retry: false, enabled: tab === "neraca" || tab === "trial-balance" }
  );
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  const { data: bukuBesar, isLoading: bbLoading } = trpc.report.bukuBesarGL.useQuery(
    { accountCode: bbCode!, startDate, endDate },
    { retry: false, enabled: !!bbCode }
  );

  const periodLabel = `${BULAN_INDONESIA[month - 1]} ${year}`;

  // ─── Export Handlers ───
  const handleExportTrialBalance = (format: "pdf" | "excel") => {
    if (!trialBalance) return;
    const columns: ExportColumn[] = [
      { header: "Kode", key: "code", width: 10 },
      { header: "Nama Akun", key: "name", width: 30 },
      { header: "Debit (Rp)", key: "totalDebit", width: 18, align: "right", format: (v: any) => fmtRp(v) },
      { header: "Kredit (Rp)", key: "totalCredit", width: 18, align: "right", format: (v: any) => fmtRp(v) },
      { header: "Saldo (Rp)", key: "balance", width: 18, align: "right", format: (v: any) => fmtRp(v) },
    ];
    const data = trialBalance.accounts.filter(a => !a.isHeader && (a.totalDebit > 0 || a.totalCredit > 0));
    data.push({ code: "", name: "TOTAL", accountType: "", normalBalance: "", parentCode: null, isHeader: false, totalDebit: trialBalance.totalDebit, totalCredit: trialBalance.totalCredit, balance: trialBalance.totalDebit - trialBalance.totalCredit });
    const options = {
      title: "Trial Balance (GL)",
      subtitle: periodLabel,
      columns,
      data,
      filename: `trial-balance-gl_${BULAN_INDONESIA[month - 1]}_${year}`,
      orientation: "landscape" as const,
    };
    if (format === "pdf") { exportToPDF(options); toast.success("PDF berhasil diunduh"); }
    else { exportToExcel(options); toast.success("Excel berhasil diunduh"); }
  };

  const handleExportLabaRugi = (format: "pdf" | "excel") => {
    if (!labaRugi) return;
    const columns: ExportColumn[] = [
      { header: "Kode", key: "code", width: 10 },
      { header: "Keterangan", key: "name", width: 30 },
      { header: "Jumlah (Rp)", key: "amount", width: 18, align: "right", format: (v: any) => fmtRp(v) },
    ];
    const data: any[] = [
      ...labaRugi.revenue.filter(r => !r.isHeader).map(r => ({ code: r.code, name: r.name, amount: r.amount })),
      { code: "", name: "Total Pendapatan", amount: labaRugi.totalRevenue },
      ...labaRugi.cogs.filter(r => !r.isHeader).map(r => ({ code: r.code, name: r.name, amount: r.amount })),
      { code: "", name: "Total HPP", amount: labaRugi.totalCOGS },
      { code: "", name: "LABA KOTOR", amount: labaRugi.grossProfit },
      ...labaRugi.expenses.filter(r => !r.isHeader).map(r => ({ code: r.code, name: r.name, amount: r.amount })),
      { code: "", name: "Total Beban", amount: labaRugi.totalExpenses },
      { code: "", name: "LABA BERSIH", amount: labaRugi.netProfit },
    ];
    const options = {
      title: "Laba Rugi (GL)",
      subtitle: periodLabel,
      columns,
      data,
      filename: `laba-rugi-gl_${BULAN_INDONESIA[month - 1]}_${year}`,
      orientation: "portrait" as const,
    };
    if (format === "pdf") { exportToPDF(options); toast.success("PDF berhasil diunduh"); }
    else { exportToExcel(options); toast.success("Excel berhasil diunduh"); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            Laporan Keuangan GL
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Laporan berbasis Jurnal Umum (General Ledger) — standar SAK EMKM
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((m) => (
                <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026, 2027].map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Total Pendapatan
            </div>
            <p className="text-lg font-bold text-green-700">
              {lrLoading ? <Skeleton className="h-6 w-32" /> : formatRp(labaRugi?.totalRevenue ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <TrendingDown className="h-4 w-4 text-red-600" />
              Total Beban
            </div>
            <p className="text-lg font-bold text-red-700">
              {lrLoading ? <Skeleton className="h-6 w-32" /> : formatRp((labaRugi?.totalCOGS ?? 0) + (labaRugi?.totalExpenses ?? 0))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <FileText className="h-4 w-4 text-blue-600" />
              Laba Bersih
            </div>
            <p className={`text-lg font-bold ${(labaRugi?.netProfit ?? 0) >= 0 ? "text-green-700" : "text-red-700"}`}>
              {lrLoading ? <Skeleton className="h-6 w-32" /> : formatRp(labaRugi?.netProfit ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Scale className="h-4 w-4" />
              Neraca Seimbang
            </div>
            {neracaLoading ? (
              <Skeleton className="h-6 w-20" />
            ) : neraca?.balanceCheck ? (
              <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Seimbang
              </Badge>
            ) : (
              <Badge variant="outline" className="text-red-700 border-red-300 bg-red-50">
                <AlertCircle className="h-3.5 w-3.5 mr-1" /> Tidak Seimbang
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trial-balance">Trial Balance</TabsTrigger>
          <TabsTrigger value="laba-rugi">Laba Rugi</TabsTrigger>
          <TabsTrigger value="neraca">Neraca</TabsTrigger>
          <TabsTrigger value="buku-besar">Buku Besar</TabsTrigger>
        </TabsList>

        {/* ═══ Trial Balance ═══ */}
        <TabsContent value="trial-balance">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Trial Balance — {periodLabel}</CardTitle>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => handleExportTrialBalance("pdf")}>
                  <FileDown className="h-4 w-4 mr-1" /> PDF
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleExportTrialBalance("excel")}>
                  <Sheet className="h-4 w-4 mr-1" /> Excel
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {tbLoading ? (
                <div className="space-y-2">{Array(8).fill(0).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Kode</TableHead>
                        <TableHead>Nama Akun</TableHead>
                        <TableHead className="text-right w-[140px]">Debit</TableHead>
                        <TableHead className="text-right w-[140px]">Kredit</TableHead>
                        <TableHead className="text-right w-[140px]">Saldo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trialBalance?.accounts
                        .filter(a => !a.isHeader && (a.totalDebit > 0 || a.totalCredit > 0))
                        .map((acc) => (
                          <TableRow
                            key={acc.code}
                            className="cursor-pointer hover:bg-muted/70"
                            onClick={() => { setBbCode(acc.code); setTab("buku-besar"); }}
                          >
                            <TableCell className="font-mono text-xs">{acc.code}</TableCell>
                            <TableCell className="flex items-center gap-1">
                              {acc.name}
                              <ChevronRight className="h-3 w-3 text-muted-foreground" />
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm">{formatRp(acc.totalDebit)}</TableCell>
                            <TableCell className="text-right font-mono text-sm">{formatRp(acc.totalCredit)}</TableCell>
                            <TableCell className={`text-right font-mono text-sm font-medium ${acc.balance < 0 ? "text-red-600" : ""}`}>
                              {formatRp(acc.balance)}
                            </TableCell>
                          </TableRow>
                        ))}
                      {/* Total row */}
                      <TableRow className="bg-muted/50 font-bold border-t-2">
                        <TableCell />
                        <TableCell>TOTAL</TableCell>
                        <TableCell className="text-right font-mono">{formatRp(trialBalance?.totalDebit ?? 0)}</TableCell>
                        <TableCell className="text-right font-mono">{formatRp(trialBalance?.totalCredit ?? 0)}</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatRp((trialBalance?.totalDebit ?? 0) - (trialBalance?.totalCredit ?? 0))}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                  {trialBalance && trialBalance.totalDebit === trialBalance.totalCredit && (
                    <div className="flex items-center gap-2 mt-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Total Debit = Total Kredit — Jurnal seimbang
                    </div>
                  )}
                  {trialBalance && trialBalance.totalDebit !== trialBalance.totalCredit && (
                    <div className="flex items-center gap-2 mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                      <AlertCircle className="h-4 w-4" />
                      Selisih: {formatRp(trialBalance.totalDebit - trialBalance.totalCredit)} — Periksa jurnal
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ Laba Rugi ═══ */}
        <TabsContent value="laba-rugi">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Laporan Laba Rugi (GL) — {periodLabel}</CardTitle>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => handleExportLabaRugi("pdf")}>
                  <FileDown className="h-4 w-4 mr-1" /> PDF
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleExportLabaRugi("excel")}>
                  <Sheet className="h-4 w-4 mr-1" /> Excel
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {lrLoading ? (
                <div className="space-y-2">{Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
              ) : labaRugi ? (
                <div className="space-y-4">
                  {/* Pendapatan */}
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Pendapatan</h3>
                    <AccountTable rows={labaRugi.revenue} />
                    <div className="flex justify-between items-center mt-1 px-2 py-1.5 bg-green-50 rounded font-semibold text-sm">
                      <span>Total Pendapatan</span>
                      <span className="font-mono text-green-700">{formatRp(labaRugi.totalRevenue)}</span>
                    </div>
                  </div>

                  {/* HPP */}
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Harga Pokok Penjualan</h3>
                    <AccountTable rows={labaRugi.cogs} />
                    <div className="flex justify-between items-center mt-1 px-2 py-1.5 bg-orange-50 rounded font-semibold text-sm">
                      <span>Total HPP</span>
                      <span className="font-mono text-orange-700">{formatRp(labaRugi.totalCOGS)}</span>
                    </div>
                  </div>

                  {/* Laba Kotor */}
                  <div className="flex justify-between items-center px-3 py-2 bg-blue-50 border border-blue-200 rounded-md font-bold">
                    <span>Laba Kotor</span>
                    <span className={`font-mono ${labaRugi.grossProfit >= 0 ? "text-blue-700" : "text-red-700"}`}>
                      {formatRp(labaRugi.grossProfit)}
                    </span>
                  </div>

                  {/* Beban */}
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Beban Operasional</h3>
                    <AccountTable rows={labaRugi.expenses} />
                    <div className="flex justify-between items-center mt-1 px-2 py-1.5 bg-red-50 rounded font-semibold text-sm">
                      <span>Total Beban</span>
                      <span className="font-mono text-red-700">{formatRp(labaRugi.totalExpenses)}</span>
                    </div>
                  </div>

                  {/* Laba Bersih */}
                  <div className={`flex justify-between items-center px-4 py-3 rounded-lg font-bold text-lg ${
                    labaRugi.netProfit >= 0 ? "bg-green-100 border border-green-300" : "bg-red-100 border border-red-300"
                  }`}>
                    <span>Laba Bersih</span>
                    <span className={`font-mono ${labaRugi.netProfit >= 0 ? "text-green-800" : "text-red-800"}`}>
                      {formatRp(labaRugi.netProfit)}
                    </span>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ Neraca ═══ */}
        <TabsContent value="neraca">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Neraca / Balance Sheet (GL) — {periodLabel}</CardTitle>
            </CardHeader>
            <CardContent>
              {neracaLoading ? (
                <div className="space-y-2">{Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
              ) : neraca ? (
                <div className="space-y-4">
                  {/* Aset */}
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Aset</h3>
                    <AccountTable rows={neraca.assets} />
                    <div className="flex justify-between items-center mt-1 px-2 py-1.5 bg-blue-50 rounded font-semibold text-sm">
                      <span>Total Aset</span>
                      <span className="font-mono text-blue-700">{formatRp(neraca.totalAssets)}</span>
                    </div>
                  </div>

                  {/* Liabilitas */}
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Kewajiban</h3>
                    <AccountTable rows={neraca.liabilities} />
                    <div className="flex justify-between items-center mt-1 px-2 py-1.5 bg-orange-50 rounded font-semibold text-sm">
                      <span>Total Kewajiban</span>
                      <span className="font-mono text-orange-700">{formatRp(neraca.totalLiabilities)}</span>
                    </div>
                  </div>

                  {/* Ekuitas */}
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Ekuitas</h3>
                    <AccountTable rows={neraca.equity} />
                    <div className="flex justify-between items-center mt-1 px-2 py-1.5 bg-purple-50 rounded font-semibold text-sm">
                      <span>Total Ekuitas</span>
                      <span className="font-mono text-purple-700">{formatRp(neraca.totalEquity)}</span>
                    </div>
                  </div>

                  {/* Laba Periode Berjalan */}
                  <div className="flex justify-between items-center px-3 py-2 bg-green-50 border border-green-200 rounded-md font-semibold text-sm">
                    <span>Laba Periode Berjalan</span>
                    <span className={`font-mono ${neraca.netProfit >= 0 ? "text-green-700" : "text-red-700"}`}>
                      {formatRp(neraca.netProfit)}
                    </span>
                  </div>

                  {/* Balance Equation */}
                  <div className={`px-4 py-3 rounded-lg border-2 ${
                    neraca.balanceCheck ? "bg-green-50 border-green-300" : "bg-red-50 border-red-300"
                  }`}>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground mb-1">Total Aset</p>
                        <p className="text-lg font-bold font-mono">{formatRp(neraca.totalAssets)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Kewajiban + Ekuitas + Laba</p>
                        <p className="text-lg font-bold font-mono">
                          {formatRp(neraca.totalLiabilities + neraca.totalEquity + neraca.netProfit)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-sm">
                      {neraca.balanceCheck ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-green-700 font-medium">Neraca Seimbang (A = L + E + Laba)</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <span className="text-red-700 font-medium">
                            Selisih: {formatRp(neraca.totalAssets - neraca.totalLiabilities - neraca.totalEquity - neraca.netProfit)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ Buku Besar ═══ */}
        <TabsContent value="buku-besar">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Buku Besar (General Ledger)</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Account Selector */}
              <div className="mb-4">
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Pilih Akun</label>
                <Select value={bbCode ?? ""} onValueChange={(v) => setBbCode(v)}>
                  <SelectTrigger className="w-full max-w-md">
                    <SelectValue placeholder="Pilih kode akun..." />
                  </SelectTrigger>
                  <SelectContent>
                    {trialBalance?.accounts
                      .filter(a => !a.isHeader)
                      .map((acc) => (
                        <SelectItem key={acc.code} value={acc.code}>
                          {acc.code} — {acc.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {!bbCode ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-10 w-10 mx-auto mb-2 opacity-40" />
                  <p>Pilih akun di atas atau klik baris pada Trial Balance untuk melihat detail transaksi</p>
                </div>
              ) : bbLoading ? (
                <div className="space-y-2">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
              ) : bukuBesar && bukuBesar.account ? (
                <div className="space-y-3">
                  {/* Account Info */}
                  <div className="flex items-center gap-3 text-sm bg-muted/50 px-3 py-2 rounded">
                    <Badge variant="outline" className="font-mono">{bukuBesar.account.code}</Badge>
                    <span className="font-semibold">{bukuBesar.account.name}</span>
                    <span className="text-muted-foreground">({bukuBesar.account.accountType} — {bukuBesar.account.normalBalance})</span>
                  </div>

                  {/* Opening Balance */}
                  <div className="flex justify-between text-sm px-2">
                    <span className="text-muted-foreground">Saldo Awal</span>
                    <span className="font-mono font-medium">{formatRp(bukuBesar.openingBalance)}</span>
                  </div>

                  {/* Entries */}
                  {bukuBesar.entries.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">Tidak ada transaksi pada periode ini</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[90px]">Tanggal</TableHead>
                          <TableHead className="w-[100px]">No. Jurnal</TableHead>
                          <TableHead>Keterangan</TableHead>
                          <TableHead className="text-right w-[120px]">Debit</TableHead>
                          <TableHead className="text-right w-[120px]">Kredit</TableHead>
                          <TableHead className="text-right w-[130px]">Saldo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bukuBesar.entries.map((entry, i) => (
                          <TableRow key={i}>
                            <TableCell className="text-xs">{entry.date}</TableCell>
                            <TableCell className="font-mono text-xs">{entry.entryNumber}</TableCell>
                            <TableCell className="text-sm">{entry.description}</TableCell>
                            <TableCell className="text-right font-mono text-sm">
                              {entry.debitAmount > 0 ? formatRp(entry.debitAmount) : "—"}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm">
                              {entry.creditAmount > 0 ? formatRp(entry.creditAmount) : "—"}
                            </TableCell>
                            <TableCell className={`text-right font-mono text-sm font-medium ${entry.runningBalance < 0 ? "text-red-600" : ""}`}>
                              {formatRp(entry.runningBalance)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}

                  {/* Closing Balance */}
                  <div className="flex justify-between text-sm px-2 py-1.5 bg-muted/50 rounded font-semibold">
                    <span>Saldo Akhir</span>
                    <span className="font-mono">{formatRp(bukuBesar.closingBalance)}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">Akun tidak ditemukan</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
