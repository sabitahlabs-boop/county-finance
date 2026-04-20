import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Calculator, BookOpen, History, CheckCircle2, Clock, AlertTriangle, Info, TrendingUp, BarChart3, CalendarClock, Scale, Receipt, Building2, Users, Percent } from "lucide-react";
import { formatRupiah, BULAN_INDONESIA } from "../../../shared/finance";
import { toast } from "sonner";

// ─── Tax Constants ───
const PTKP_OPTIONS = [
  { code: "TK/0", label: "Belum Kawin, Tanpa Tanggungan", amount: 54_000_000 },
  { code: "TK/1", label: "Belum Kawin, 1 Tanggungan", amount: 58_500_000 },
  { code: "TK/2", label: "Belum Kawin, 2 Tanggungan", amount: 63_000_000 },
  { code: "TK/3", label: "Belum Kawin, 3 Tanggungan", amount: 67_500_000 },
  { code: "K/0", label: "Kawin, Tanpa Tanggungan", amount: 58_500_000 },
  { code: "K/1", label: "Kawin, 1 Tanggungan", amount: 63_000_000 },
  { code: "K/2", label: "Kawin, 2 Tanggungan", amount: 67_500_000 },
  { code: "K/3", label: "Kawin, 3 Tanggungan", amount: 72_000_000 },
];

const PPH21_BRACKETS = [
  { limit: 60_000_000, rate: 0.05 },
  { limit: 250_000_000, rate: 0.15 },
  { limit: 500_000_000, rate: 0.25 },
  { limit: 5_000_000_000, rate: 0.30 },
  { limit: Infinity, rate: 0.35 },
];

const NPPN_RATES: Record<string, number> = {
  "Perdagangan": 0.20,
  "Jasa": 0.25,
  "Manufaktur": 0.125,
  "Konstruksi": 0.135,
  "Transportasi": 0.12,
  "Lainnya": 0.25,
};

const TAX_DEADLINES = [
  { name: "PPh 21 (Karyawan)", day: 10, desc: "Setor paling lambat tanggal 10 bulan berikutnya" },
  { name: "PPh Final UMKM 0.5%", day: 15, desc: "Setor paling lambat tanggal 15 bulan berikutnya" },
  { name: "PPN", day: 15, desc: "Setor paling lambat akhir bulan berikutnya, lapor tanggal 15" },
  { name: "SPT Tahunan OP", day: 0, month: 3, desc: "Batas akhir 31 Maret setiap tahun" },
  { name: "SPT Tahunan Badan", day: 0, month: 4, desc: "Batas akhir 30 April setiap tahun" },
];

// ─── Calculation Helpers ───
function calcPPhUMKM(omzetBulanan: number, omzetTahunan: number): { pajak: number; bebas: boolean; batasRp500jt: number; sisaBatas: number } {
  const batasRp500jt = 500_000_000;
  if (omzetTahunan <= batasRp500jt) {
    return { pajak: 0, bebas: true, batasRp500jt, sisaBatas: batasRp500jt - omzetTahunan };
  }
  const pajak = Math.round(omzetBulanan * 0.005);
  return { pajak, bebas: false, batasRp500jt, sisaBatas: 0 };
}

function calcPPN(hargaJual: number, tarifPersen: number, isInclusive: boolean): { dpp: number; ppn: number; total: number } {
  const tarif = tarifPersen / 100;
  if (isInclusive) {
    const dpp = Math.round(hargaJual / (1 + tarif));
    const ppn = hargaJual - dpp;
    return { dpp, ppn, total: hargaJual };
  }
  const ppn = Math.round(hargaJual * tarif);
  return { dpp: hargaJual, ppn, total: hargaJual + ppn };
}

function calcPPh21(gajiTahunan: number, ptkpCode: string): { pkp: number; pajak: number; ptkp: number; efektifRate: number } {
  const ptkpItem = PTKP_OPTIONS.find(p => p.code === ptkpCode) || PTKP_OPTIONS[0];
  const ptkp = ptkpItem.amount;
  const pkp = Math.max(0, gajiTahunan - ptkp);
  let pajak = 0;
  let remaining = pkp;
  let prevLimit = 0;
  for (const bracket of PPH21_BRACKETS) {
    const taxable = Math.min(remaining, bracket.limit - prevLimit);
    if (taxable <= 0) break;
    pajak += Math.round(taxable * bracket.rate);
    remaining -= taxable;
    prevLimit = bracket.limit;
  }
  const efektifRate = gajiTahunan > 0 ? (pajak / gajiTahunan) * 100 : 0;
  return { pkp, pajak, ptkp, efektifRate };
}

function calcPPh23(nilaiJasa: number, jenis: "jasa" | "dividen"): { tarif: number; pajak: number } {
  const tarif = jenis === "dividen" ? 0.15 : 0.02;
  return { tarif, pajak: Math.round(nilaiJasa * tarif) };
}

function calcTaxPlanning(omzetTahunan: number, biayaTahunan: number, sektorNPPN: string): {
  final: { pajak: number; efektif: number };
  nppn: { norma: number; pkp: number; pajak: number; efektif: number };
  pembukuan: { labaFiskal: number; pajak: number; efektif: number };
  rekomendasi: string;
} {
  // 1. PPh Final 0.5%
  const finalPajak = Math.round(omzetTahunan * 0.005);
  const finalEfektif = omzetTahunan > 0 ? (finalPajak / omzetTahunan) * 100 : 0;

  // 2. NPPN
  const normaRate = NPPN_RATES[sektorNPPN] || 0.25;
  const nppnPKP = Math.max(0, Math.round(omzetTahunan * normaRate) - 54_000_000);
  let nppnPajak = 0;
  let nppnRemaining = nppnPKP;
  let nppnPrev = 0;
  for (const b of PPH21_BRACKETS) {
    const taxable = Math.min(nppnRemaining, b.limit - nppnPrev);
    if (taxable <= 0) break;
    nppnPajak += Math.round(taxable * b.rate);
    nppnRemaining -= taxable;
    nppnPrev = b.limit;
  }
  const nppnEfektif = omzetTahunan > 0 ? (nppnPajak / omzetTahunan) * 100 : 0;

  // 3. Pembukuan
  const labaFiskal = Math.max(0, omzetTahunan - biayaTahunan);
  const pembPKP = Math.max(0, labaFiskal - 54_000_000);
  let pembPajak = 0;
  let pembRemaining = pembPKP;
  let pembPrev = 0;
  for (const b of PPH21_BRACKETS) {
    const taxable = Math.min(pembRemaining, b.limit - pembPrev);
    if (taxable <= 0) break;
    pembPajak += Math.round(taxable * b.rate);
    pembRemaining -= taxable;
    pembPrev = b.limit;
  }
  const pembEfektif = omzetTahunan > 0 ? (pembPajak / omzetTahunan) * 100 : 0;

  // Rekomendasi
  const options = [
    { name: "PPh Final 0.5%", pajak: finalPajak },
    { name: "NPPN", pajak: nppnPajak },
    { name: "Pembukuan", pajak: pembPajak },
  ];
  options.sort((a, b) => a.pajak - b.pajak);
  const rekomendasi = `${options[0].name} paling hemat (${formatRupiah(options[0].pajak)}). Hemat ${formatRupiah(options[options.length - 1].pajak - options[0].pajak)} dibanding ${options[options.length - 1].name}.`;

  return {
    final: { pajak: finalPajak, efektif: finalEfektif },
    nppn: { norma: normaRate * 100, pkp: nppnPKP, pajak: nppnPajak, efektif: nppnEfektif },
    pembukuan: { labaFiskal, pajak: pembPajak, efektif: pembEfektif },
    rekomendasi,
  };
}

export default function Pajak() {
  const now = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selectedTax, setSelectedTax] = useState<any>(null);

  const { data: taxRules, isLoading: rulesLoading } = trpc.tax.rules.useQuery(undefined, { retry: false });
  const { data: taxCalc, isLoading: calcLoading } = trpc.tax.calculate.useQuery({ month, year }, { retry: false });
  const { data: payments } = trpc.tax.payments.useQuery(undefined, { retry: false });
  const { data: summary } = trpc.report.summary.useQuery({ month, year }, { retry: false });
  const { data: yearlyOmzetData } = trpc.report.yearlyOmzet.useQuery({ year }, { retry: false });

  const recordPayment = trpc.tax.recordPayment.useMutation({
    onSuccess: () => {
      trpc.useUtils().tax.payments.invalidate();
      setPaymentOpen(false);
      toast.success("Pembayaran pajak dicatat");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const [payForm, setPayForm] = useState<{
    paymentDate: string;
    ntpn: string;
    notes: string;
    taxCode?: string;
    manualAmount?: string;
  }>({
    paymentDate: now.toISOString().substring(0, 10),
    ntpn: "",
    notes: "",
    taxCode: "PPH_FINAL_05",
    manualAmount: "",
  });

  const totalTax = taxCalc?.reduce((s: number, t: any) => s + t.amount, 0) ?? 0;
  const yearlyOmzet = yearlyOmzetData?.reduce((s: number, v: number) => s + v, 0) ?? 0;
  const omzetSampaiSekarang = yearlyOmzetData?.slice(0, month).reduce((s: number, v: number) => s + v, 0) ?? 0;

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: BULAN_INDONESIA[i],
  }));

  // Due date logic
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const dueDate = `15 ${BULAN_INDONESIA[nextMonth - 1]} ${nextYear}`;
  const dueDateObj = new Date(nextYear, nextMonth - 1, 15);
  const daysUntilDue = Math.ceil((dueDateObj.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  // ─── Kalkulator States ───
  const [umkmOmzetBulanan, setUmkmOmzetBulanan] = useState("");
  const [umkmOmzetTahunan, setUmkmOmzetTahunan] = useState("");
  const [umkmResult, setUmkmResult] = useState<ReturnType<typeof calcPPhUMKM> | null>(null);

  const [ppnHarga, setPpnHarga] = useState("");
  const [ppnTarif, setPpnTarif] = useState("11");
  const [ppnInclusive, setPpnInclusive] = useState(false);
  const [ppnResult, setPpnResult] = useState<ReturnType<typeof calcPPN> | null>(null);

  const [pph21Gaji, setPph21Gaji] = useState("");
  const [pph21Ptkp, setPph21Ptkp] = useState("TK/0");
  const [pph21Result, setPph21Result] = useState<ReturnType<typeof calcPPh21> | null>(null);

  const [pph23Nilai, setPph23Nilai] = useState("");
  const [pph23Jenis, setPph23Jenis] = useState<"jasa" | "dividen">("jasa");
  const [pph23Result, setPph23Result] = useState<ReturnType<typeof calcPPh23> | null>(null);

  // Tax Planning States
  const [tpOmzet, setTpOmzet] = useState("");
  const [tpBiaya, setTpBiaya] = useState("");
  const [tpSektor, setTpSektor] = useState("Perdagangan");
  const [tpResult, setTpResult] = useState<ReturnType<typeof calcTaxPlanning> | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pajak</h1>
        <p className="text-sm text-muted-foreground">Hitung, rencanakan, dan kelola kewajiban pajak bisnis Anda</p>
      </div>

      <Tabs defaultValue="ringkasan">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="ringkasan"><BarChart3 className="h-4 w-4 mr-1.5" /> Ringkasan</TabsTrigger>
          <TabsTrigger value="kalkulator"><Calculator className="h-4 w-4 mr-1.5" /> Kalkulator</TabsTrigger>
          <TabsTrigger value="planning"><Scale className="h-4 w-4 mr-1.5" /> Tax Planning</TabsTrigger>
          <TabsTrigger value="deadline"><CalendarClock className="h-4 w-4 mr-1.5" /> Deadline</TabsTrigger>
          <TabsTrigger value="rules"><BookOpen className="h-4 w-4 mr-1.5" /> Aturan</TabsTrigger>
          <TabsTrigger value="history"><History className="h-4 w-4 mr-1.5" /> Riwayat</TabsTrigger>
        </TabsList>

        {/* ═══════════════ RINGKASAN TAB ═══════════════ */}
        <TabsContent value="ringkasan" className="space-y-4 mt-4">
          {/* Period Selector */}
          <div className="flex items-center gap-3">
            <Select value={String(month)} onValueChange={(v) => setMonth(parseInt(v))}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                {months.map((m) => (<SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>))}
              </SelectContent>
            </Select>
            <Select value={String(year)} onValueChange={(v) => setYear(parseInt(v))}>
              <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Due Date Alert */}
          <Card className={`border-0 shadow-md shadow-black/5 ${daysUntilDue <= 5 ? "ring-1 ring-orange-300 bg-orange-50 dark:bg-orange-950/20" : ""}`}>
            <CardContent className="p-4 flex items-center gap-3">
              {daysUntilDue <= 0 ? (
                <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
              ) : daysUntilDue <= 5 ? (
                <Clock className="h-5 w-5 text-orange-500 shrink-0" />
              ) : (
                <Info className="h-5 w-5 text-blue-500 shrink-0" />
              )}
              <div>
                <p className="text-sm font-medium">
                  Batas setor PPh Final: <strong>{dueDate}</strong>
                </p>
                <p className="text-xs text-muted-foreground">
                  {daysUntilDue > 0 ? `${daysUntilDue} hari lagi` : daysUntilDue === 0 ? "Hari ini!" : `Terlambat ${Math.abs(daysUntilDue)} hari — denda Rp 100.000`}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-0 shadow-md shadow-black/5">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground font-medium">Omzet Bulan Ini</p>
                <p className="text-xl font-bold">{formatRupiah(summary?.totalPemasukan ?? 0)}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md shadow-black/5">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground font-medium">Omzet Tahun {year}</p>
                <p className="text-xl font-bold">{formatRupiah(omzetSampaiSekarang)}</p>
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Batas bebas PPh</span>
                    <span>{Math.min(100, Math.round((omzetSampaiSekarang / 500_000_000) * 100))}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${omzetSampaiSekarang > 500_000_000 ? "bg-red-500" : omzetSampaiSekarang > 400_000_000 ? "bg-orange-500" : "bg-emerald-500"}`}
                      style={{ width: `${Math.min(100, (omzetSampaiSekarang / 500_000_000) * 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {omzetSampaiSekarang <= 500_000_000
                      ? `Sisa ${formatRupiah(500_000_000 - omzetSampaiSekarang)} sebelum kena pajak`
                      : "Sudah melewati batas Rp 500 juta — wajib setor PPh Final 0.5%"
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md shadow-black/5">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground font-medium">Pengeluaran</p>
                <p className="text-xl font-bold">{formatRupiah(summary?.totalPengeluaran ?? 0)}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md shadow-black/5 bg-primary/5">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Estimasi Pajak Bulan Ini</p>
                <p className="text-xl font-bold text-primary">{formatRupiah(totalTax)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Action: Catat Pembayaran */}
          <Card className="border-dashed border-primary/30 bg-primary/5">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Catat Pembayaran Pajak</p>
                <p className="text-xs text-muted-foreground">Sudah bayar pajak? Catat di sini agar tercatat di riwayat & GL</p>
              </div>
              <Button onClick={() => {
                setSelectedTax(null);
                setPaymentOpen(true);
                setPayForm({ paymentDate: now.toISOString().substring(0, 10), ntpn: "", notes: "" });
              }}>
                <CheckCircle2 className="h-4 w-4 mr-1.5" /> Catat Pembayaran
              </Button>
            </CardContent>
          </Card>

          {/* Tax Breakdown */}
          {calcLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (<Skeleton key={i} className="h-24 rounded-xl" />))}
            </div>
          ) : !taxCalc || taxCalc.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Calculator className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Tidak ada kewajiban pajak untuk periode ini</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {taxCalc.map((tax: any, idx: number) => (
                <Card key={idx} className="border-0 shadow-md shadow-black/5">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{tax.taxName}</h3>
                          <Badge variant={tax.amount > 0 ? "default" : "secondary"} className="text-xs">
                            {tax.taxCode}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{tax.reason}</p>
                        {tax.referenceLaw && (
                          <p className="text-xs text-muted-foreground">Dasar: {tax.referenceLaw}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{formatRupiah(tax.amount)}</p>
                        {tax.rate > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {(tax.rate * 100).toFixed(1)}% x {formatRupiah(tax.basis)}
                          </p>
                        )}
                      </div>
                    </div>
                    {tax.amount > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <Button size="sm" variant="outline" onClick={() => {
                          setSelectedTax(tax);
                          setPaymentOpen(true);
                          setPayForm({ paymentDate: now.toISOString().substring(0, 10), ntpn: "", notes: "" });
                        }}>
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Catat Pembayaran
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Yearly Omzet Chart */}
          {yearlyOmzetData && (
            <Card className="border-0 shadow-md shadow-black/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Omzet Bulanan {year}</CardTitle>
                <CardDescription>Tracking omzet untuk perhitungan batas PPh Final Rp 500 juta</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-1 h-32">
                  {yearlyOmzetData.map((val: number, idx: number) => {
                    const maxVal = Math.max(...yearlyOmzetData, 1);
                    const height = (val / maxVal) * 100;
                    const isCurrentMonth = idx === month - 1;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full relative" style={{ height: "100px" }}>
                          <div
                            className={`absolute bottom-0 w-full rounded-t transition-all ${isCurrentMonth ? "bg-primary" : "bg-primary/30"}`}
                            style={{ height: `${Math.max(height, 2)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground">{BULAN_INDONESIA[idx].substring(0, 3)}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 pt-3 border-t flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total omzet {year}:</span>
                  <span className="font-bold">{formatRupiah(yearlyOmzet)}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ═══════════════ KALKULATOR TAB ═══════════════ */}
        <TabsContent value="kalkulator" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* PPh UMKM 0.5% */}
            <Card className="border-0 shadow-md shadow-black/5">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <Receipt className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">PPh UMKM 0.5%</CardTitle>
                    <CardDescription className="text-xs">PP 55/2022 — Tarif final untuk UMKM</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Omzet Bulan Ini</Label>
                  <Input type="number" placeholder="Contoh: 50000000" value={umkmOmzetBulanan} onChange={(e) => setUmkmOmzetBulanan(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Total Omzet Tahun Ini (Kumulatif)</Label>
                  <Input type="number" placeholder="Contoh: 400000000" value={umkmOmzetTahunan} onChange={(e) => setUmkmOmzetTahunan(e.target.value)} />
                  <p className="text-xs text-muted-foreground">Dari data County: {formatRupiah(omzetSampaiSekarang)}</p>
                </div>
                <Button className="w-full" onClick={() => {
                  const bln = parseFloat(umkmOmzetBulanan) || 0;
                  const thn = parseFloat(umkmOmzetTahunan) || omzetSampaiSekarang;
                  setUmkmResult(calcPPhUMKM(bln, thn));
                }}>
                  Hitung PPh UMKM
                </Button>
                {umkmResult && (
                  <div className={`rounded-lg p-3 space-y-2 ${umkmResult.bebas ? "bg-emerald-50 dark:bg-emerald-950/20" : "bg-orange-50 dark:bg-orange-950/20"}`}>
                    <div className="flex items-center gap-2">
                      {umkmResult.bebas ? (
                        <Badge className="bg-emerald-500 text-white">BEBAS PAJAK</Badge>
                      ) : (
                        <Badge className="bg-orange-500 text-white">WAJIB SETOR</Badge>
                      )}
                    </div>
                    <p className="text-lg font-bold">{formatRupiah(umkmResult.pajak)}</p>
                    {umkmResult.bebas ? (
                      <p className="text-xs text-muted-foreground">
                        Omzet tahunan masih di bawah Rp 500 juta. Sisa batas: {formatRupiah(umkmResult.sisaBatas)}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        0.5% x {formatRupiah(parseFloat(umkmOmzetBulanan) || 0)} = {formatRupiah(umkmResult.pajak)}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">Dasar hukum: PP 55 Tahun 2022</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* PPN */}
            <Card className="border-0 shadow-md shadow-black/5">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Percent className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-base">PPN (Pajak Pertambahan Nilai)</CardTitle>
                    <CardDescription className="text-xs">Wajib jika PKP (omzet &gt; Rp 4.8 M/tahun)</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Harga Jual / Nilai Transaksi</Label>
                  <Input type="number" placeholder="Contoh: 1000000" value={ppnHarga} onChange={(e) => setPpnHarga(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Tarif PPN</Label>
                  <Select value={ppnTarif} onValueChange={setPpnTarif}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="11">11% (2022-2024)</SelectItem>
                      <SelectItem value="12">12% (2025+)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="ppn-inclusive" checked={ppnInclusive} onChange={(e) => setPpnInclusive(e.target.checked)} className="rounded" />
                  <Label htmlFor="ppn-inclusive" className="text-xs cursor-pointer">Harga sudah termasuk PPN (inklusif)</Label>
                </div>
                <Button className="w-full" onClick={() => {
                  const harga = parseFloat(ppnHarga) || 0;
                  setPpnResult(calcPPN(harga, parseFloat(ppnTarif), ppnInclusive));
                }}>
                  Hitung PPN
                </Button>
                {ppnResult && (
                  <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-3 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">DPP (Dasar Pengenaan Pajak)</span>
                      <span className="font-medium">{formatRupiah(ppnResult.dpp)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">PPN {ppnTarif}%</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">{formatRupiah(ppnResult.ppn)}</span>
                    </div>
                    <div className="flex justify-between text-sm border-t pt-1 mt-1">
                      <span className="font-medium">Total</span>
                      <span className="font-bold">{formatRupiah(ppnResult.total)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* PPh 21 */}
            <Card className="border-0 shadow-md shadow-black/5">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <CardTitle className="text-base">PPh 21 (Karyawan)</CardTitle>
                    <CardDescription className="text-xs">Tarif progresif berdasarkan PKP</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Gaji Bruto per Tahun</Label>
                  <Input type="number" placeholder="Contoh: 120000000" value={pph21Gaji} onChange={(e) => setPph21Gaji(e.target.value)} />
                  <p className="text-xs text-muted-foreground">Atau gaji bulanan x 12</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Status PTKP</Label>
                  <Select value={pph21Ptkp} onValueChange={setPph21Ptkp}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PTKP_OPTIONS.map((p) => (
                        <SelectItem key={p.code} value={p.code}>{p.code} — {p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full" onClick={() => {
                  const gaji = parseFloat(pph21Gaji) || 0;
                  setPph21Result(calcPPh21(gaji, pph21Ptkp));
                }}>
                  Hitung PPh 21
                </Button>
                {pph21Result && (
                  <div className="rounded-lg bg-purple-50 dark:bg-purple-950/20 p-3 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">PTKP</span>
                      <span className="font-medium">{formatRupiah(pph21Result.ptkp)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">PKP (Penghasilan Kena Pajak)</span>
                      <span className="font-medium">{formatRupiah(pph21Result.pkp)}</span>
                    </div>
                    <div className="flex justify-between text-sm border-t pt-1 mt-1">
                      <span className="font-medium">PPh 21 per Tahun</span>
                      <span className="font-bold text-purple-600 dark:text-purple-400">{formatRupiah(pph21Result.pajak)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">PPh 21 per Bulan</span>
                      <span className="font-medium">{formatRupiah(Math.round(pph21Result.pajak / 12))}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tarif Efektif</span>
                      <span className="font-medium">{pph21Result.efektifRate.toFixed(2)}%</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* PPh 23 */}
            <Card className="border-0 shadow-md shadow-black/5">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <Building2 className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <CardTitle className="text-base">PPh 23 (Jasa & Dividen)</CardTitle>
                    <CardDescription className="text-xs">Dipotong oleh pemberi penghasilan</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Nilai Bruto Jasa / Dividen</Label>
                  <Input type="number" placeholder="Contoh: 10000000" value={pph23Nilai} onChange={(e) => setPph23Nilai(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Jenis Penghasilan</Label>
                  <Select value={pph23Jenis} onValueChange={(v: any) => setPph23Jenis(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="jasa">Jasa (tarif 2%)</SelectItem>
                      <SelectItem value="dividen">Dividen / Bunga / Royalti (tarif 15%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full" onClick={() => {
                  const nilai = parseFloat(pph23Nilai) || 0;
                  setPph23Result(calcPPh23(nilai, pph23Jenis));
                }}>
                  Hitung PPh 23
                </Button>
                {pph23Result && (
                  <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 p-3 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tarif PPh 23</span>
                      <span className="font-medium">{(pph23Result.tarif * 100)}%</span>
                    </div>
                    <div className="flex justify-between text-sm border-t pt-1 mt-1">
                      <span className="font-medium">PPh 23 yang dipotong</span>
                      <span className="font-bold text-amber-600 dark:text-amber-400">{formatRupiah(pph23Result.pajak)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Yang diterima (netto)</span>
                      <span className="font-medium">{formatRupiah((parseFloat(pph23Nilai) || 0) - pph23Result.pajak)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══════════════ TAX PLANNING TAB ═══════════════ */}
        <TabsContent value="planning" className="space-y-4 mt-4">
          <Card className="border-0 shadow-md shadow-black/5">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Tax Planning Simulator
              </CardTitle>
              <CardDescription>
                Bandingkan 3 skema pajak untuk menemukan yang paling hemat buat bisnis Anda.
                Berlaku untuk UMKM dengan omzet di bawah Rp 4.8 miliar/tahun.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Omzet Tahunan</Label>
                  <Input type="number" placeholder="Contoh: 600000000" value={tpOmzet} onChange={(e) => setTpOmzet(e.target.value)} />
                  <p className="text-xs text-muted-foreground">Dari data County: {formatRupiah(yearlyOmzet)}</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Total Biaya Operasional Tahunan</Label>
                  <Input type="number" placeholder="Contoh: 400000000" value={tpBiaya} onChange={(e) => setTpBiaya(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Sektor Usaha (untuk NPPN)</Label>
                  <Select value={tpSektor} onValueChange={setTpSektor}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.keys(NPPN_RATES).map((s) => (
                        <SelectItem key={s} value={s}>{s} (Norma {NPPN_RATES[s] * 100}%)</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={() => {
                const omzet = parseFloat(tpOmzet) || yearlyOmzet;
                const biaya = parseFloat(tpBiaya) || 0;
                setTpResult(calcTaxPlanning(omzet, biaya, tpSektor));
              }}>
                Bandingkan 3 Skema Pajak
              </Button>

              {tpResult && (
                <div className="space-y-4">
                  {/* Comparison Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="text-left p-3 font-medium">Skema</th>
                          <th className="text-right p-3 font-medium">Pajak Tahunan</th>
                          <th className="text-right p-3 font-medium">Tarif Efektif</th>
                          <th className="text-left p-3 font-medium">Keterangan</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className={`border-b ${tpResult.final.pajak <= tpResult.nppn.pajak && tpResult.final.pajak <= tpResult.pembukuan.pajak ? "bg-emerald-50 dark:bg-emerald-950/20" : ""}`}>
                          <td className="p-3 font-medium">
                            PPh Final 0.5%
                            {tpResult.final.pajak <= tpResult.nppn.pajak && tpResult.final.pajak <= tpResult.pembukuan.pajak && (
                              <Badge className="ml-2 bg-emerald-500 text-white text-xs">TERHEMAT</Badge>
                            )}
                          </td>
                          <td className="p-3 text-right font-bold">{formatRupiah(tpResult.final.pajak)}</td>
                          <td className="p-3 text-right">{tpResult.final.efektif.toFixed(2)}%</td>
                          <td className="p-3 text-xs text-muted-foreground">0.5% x omzet bruto. Berlaku maks 7 tahun.</td>
                        </tr>
                        <tr className={`border-b ${tpResult.nppn.pajak < tpResult.final.pajak && tpResult.nppn.pajak <= tpResult.pembukuan.pajak ? "bg-emerald-50 dark:bg-emerald-950/20" : ""}`}>
                          <td className="p-3 font-medium">
                            NPPN
                            {tpResult.nppn.pajak < tpResult.final.pajak && tpResult.nppn.pajak <= tpResult.pembukuan.pajak && (
                              <Badge className="ml-2 bg-emerald-500 text-white text-xs">TERHEMAT</Badge>
                            )}
                          </td>
                          <td className="p-3 text-right font-bold">{formatRupiah(tpResult.nppn.pajak)}</td>
                          <td className="p-3 text-right">{tpResult.nppn.efektif.toFixed(2)}%</td>
                          <td className="p-3 text-xs text-muted-foreground">Norma {tpResult.nppn.norma}% x omzet → PKP {formatRupiah(tpResult.nppn.pkp)} → tarif progresif</td>
                        </tr>
                        <tr className={`${tpResult.pembukuan.pajak < tpResult.final.pajak && tpResult.pembukuan.pajak < tpResult.nppn.pajak ? "bg-emerald-50 dark:bg-emerald-950/20" : ""}`}>
                          <td className="p-3 font-medium">
                            Pembukuan
                            {tpResult.pembukuan.pajak < tpResult.final.pajak && tpResult.pembukuan.pajak < tpResult.nppn.pajak && (
                              <Badge className="ml-2 bg-emerald-500 text-white text-xs">TERHEMAT</Badge>
                            )}
                          </td>
                          <td className="p-3 text-right font-bold">{formatRupiah(tpResult.pembukuan.pajak)}</td>
                          <td className="p-3 text-right">{tpResult.pembukuan.efektif.toFixed(2)}%</td>
                          <td className="p-3 text-xs text-muted-foreground">Laba fiskal {formatRupiah(tpResult.pembukuan.labaFiskal)} → tarif progresif</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Recommendation */}
                  <div className="rounded-lg bg-primary/5 p-4">
                    <div className="flex items-start gap-2">
                      <TrendingUp className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-sm">Rekomendasi</p>
                        <p className="text-sm text-muted-foreground mt-1">{tpResult.rekomendasi}</p>
                      </div>
                    </div>
                  </div>

                  {/* Visual Comparison */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Perbandingan Visual</p>
                    {[
                      { label: "PPh Final 0.5%", value: tpResult.final.pajak, color: "bg-emerald-500" },
                      { label: "NPPN", value: tpResult.nppn.pajak, color: "bg-blue-500" },
                      { label: "Pembukuan", value: tpResult.pembukuan.pajak, color: "bg-purple-500" },
                    ].map((item) => {
                      const maxVal = Math.max(tpResult.final.pajak, tpResult.nppn.pajak, tpResult.pembukuan.pajak, 1);
                      return (
                        <div key={item.label} className="flex items-center gap-3">
                          <span className="text-xs w-24 text-right text-muted-foreground">{item.label}</span>
                          <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                            <div className={`h-full ${item.color} rounded-full transition-all flex items-center justify-end pr-2`} style={{ width: `${Math.max((item.value / maxVal) * 100, 5)}%` }}>
                              <span className="text-[10px] text-white font-medium">{formatRupiah(item.value)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════ DEADLINE TAB ═══════════════ */}
        <TabsContent value="deadline" className="space-y-4 mt-4">
          <Card className="border-0 shadow-md shadow-black/5">
            <CardHeader>
              <CardTitle className="text-base">Kalender Deadline Pajak</CardTitle>
              <CardDescription>Jangan sampai telat — denda administrasi Rp 100.000 - Rp 1.000.000</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {TAX_DEADLINES.map((dl, idx) => {
                let deadlineDate: Date;
                let deadlineStr: string;
                if (dl.day === 0 && dl.month) {
                  // Annual deadline
                  deadlineDate = new Date(year, dl.month - 1, dl.month === 3 ? 31 : 30);
                  deadlineStr = `${dl.month === 3 ? "31 Maret" : "30 April"} ${year}`;
                } else {
                  // Monthly deadline
                  const nm = month === 12 ? 1 : month + 1;
                  const ny = month === 12 ? year + 1 : year;
                  deadlineDate = new Date(ny, nm - 1, dl.day);
                  deadlineStr = `${dl.day} ${BULAN_INDONESIA[nm - 1]} ${ny}`;
                }
                const daysLeft = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                const isUrgent = daysLeft <= 7 && daysLeft > 0;
                const isOverdue = daysLeft <= 0;

                return (
                  <div key={idx} className={`flex items-center gap-3 p-3 rounded-lg ${isOverdue ? "bg-red-50 dark:bg-red-950/20" : isUrgent ? "bg-orange-50 dark:bg-orange-950/20" : "bg-muted/30"}`}>
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${isOverdue ? "bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400" : isUrgent ? "bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400" : "bg-primary/10 text-primary"}`}>
                      {isOverdue ? <AlertTriangle className="h-5 w-5" /> : isUrgent ? <Clock className="h-5 w-5" /> : <CalendarClock className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{dl.name}</p>
                      <p className="text-xs text-muted-foreground">{dl.desc}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium">{deadlineStr}</p>
                      <p className={`text-xs ${isOverdue ? "text-red-600 dark:text-red-400 font-medium" : isUrgent ? "text-orange-600 dark:text-orange-400 font-medium" : "text-muted-foreground"}`}>
                        {isOverdue ? `Terlambat ${Math.abs(daysLeft)} hari` : daysLeft === 0 ? "Hari ini!" : `${daysLeft} hari lagi`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Denda Info */}
          <Card className="border-0 shadow-md shadow-black/5">
            <CardHeader>
              <CardTitle className="text-base">Denda Keterlambatan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left p-3 font-medium">Jenis Pelanggaran</th>
                      <th className="text-right p-3 font-medium">Denda</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b"><td className="p-3">Telat lapor SPT Masa PPh</td><td className="p-3 text-right font-medium text-red-600 dark:text-red-400">Rp 100.000</td></tr>
                    <tr className="border-b"><td className="p-3">Telat lapor SPT Masa PPN</td><td className="p-3 text-right font-medium text-red-600 dark:text-red-400">Rp 500.000</td></tr>
                    <tr className="border-b"><td className="p-3">Telat lapor SPT Tahunan OP</td><td className="p-3 text-right font-medium text-red-600 dark:text-red-400">Rp 100.000</td></tr>
                    <tr className="border-b"><td className="p-3">Telat lapor SPT Tahunan Badan</td><td className="p-3 text-right font-medium text-red-600 dark:text-red-400">Rp 1.000.000</td></tr>
                    <tr><td className="p-3">Telat setor pajak</td><td className="p-3 text-right font-medium text-red-600 dark:text-red-400">2% per bulan dari pajak terutang</td></tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════ RULES TAB ═══════════════ */}
        <TabsContent value="rules" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tabel Aturan Pajak</CardTitle>
              <CardDescription>Aturan pajak yang berlaku saat ini berdasarkan regulasi Indonesia</CardDescription>
            </CardHeader>
            <CardContent>
              {rulesLoading ? (
                <Skeleton className="h-40" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="text-left p-3 font-medium">Kode</th>
                        <th className="text-left p-3 font-medium">Nama</th>
                        <th className="text-right p-3 font-medium">Tarif</th>
                        <th className="text-left p-3 font-medium">Basis</th>
                        <th className="text-left p-3 font-medium">Kondisi</th>
                        <th className="text-left p-3 font-medium">Dasar Hukum</th>
                      </tr>
                    </thead>
                    <tbody>
                      {taxRules?.map((rule: any) => (
                        <tr key={rule.id} className="border-b last:border-0">
                          <td className="p-3"><Badge variant="secondary" className="text-xs font-mono">{rule.taxCode}</Badge></td>
                          <td className="p-3">{rule.taxName}</td>
                          <td className="p-3 text-right font-medium">
                            {parseFloat(rule.rate) === -1 ? "TER" : `${(parseFloat(rule.rate) * 100).toFixed(1)}%`}
                          </td>
                          <td className="p-3 text-muted-foreground">{rule.basis}</td>
                          <td className="p-3 text-xs text-muted-foreground">
                            {rule.conditionField ? `${rule.conditionField} ${rule.conditionOperator} ${rule.conditionValue}` : "-"}
                          </td>
                          <td className="p-3 text-xs text-muted-foreground">{rule.referenceLaw || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════ HISTORY TAB ═══════════════ */}
        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Riwayat Pembayaran Pajak</CardTitle>
            </CardHeader>
            <CardContent>
              {!payments || payments.length === 0 ? (
                <div className="py-8 text-center">
                  <History className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Belum ada riwayat pembayaran</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="text-left p-3 font-medium">Periode</th>
                        <th className="text-left p-3 font-medium">Jenis</th>
                        <th className="text-right p-3 font-medium">Jumlah</th>
                        <th className="text-left p-3 font-medium">Tgl Bayar</th>
                        <th className="text-left p-3 font-medium">NTPN</th>
                        <th className="text-left p-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p: any) => (
                        <tr key={p.id} className="border-b last:border-0">
                          <td className="p-3">{p.periodMonth}</td>
                          <td className="p-3"><Badge variant="secondary" className="text-xs">{p.taxCode}</Badge></td>
                          <td className="p-3 text-right font-medium">{formatRupiah(p.taxAmount)}</td>
                          <td className="p-3 text-muted-foreground">{p.paymentDate || "-"}</td>
                          <td className="p-3 font-mono text-xs">{p.ntpn || "-"}</td>
                          <td className="p-3">
                            <Badge variant={p.status === "LUNAS" ? "default" : p.status === "TERLAMBAT" ? "destructive" : "secondary"} className="text-xs">
                              {p.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Record Payment Dialog */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Catat Pembayaran Pajak</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            {selectedTax ? (
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-sm font-medium">{selectedTax.taxName}</p>
                <p className="text-lg font-bold">{formatRupiah(selectedTax.amount ?? 0)}</p>
                <p className="text-xs text-muted-foreground">Periode: {BULAN_INDONESIA[month - 1]} {year}</p>
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs">Jenis Pajak</Label>
                  <Select value={payForm.taxCode || "PPH_FINAL_05"} onValueChange={(v) => setPayForm({ ...payForm, taxCode: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PPH_FINAL_05">PPh Final 0.5%</SelectItem>
                      <SelectItem value="PPN">PPN</SelectItem>
                      <SelectItem value="PPH_21">PPh 21</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Jumlah Pembayaran (Rp)</Label>
                  <Input type="number" value={payForm.manualAmount || ""} onChange={(e) => setPayForm({ ...payForm, manualAmount: e.target.value })} placeholder="Contoh: 500000" />
                </div>
              </>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs">Tanggal Pembayaran</Label>
              <Input type="date" value={payForm.paymentDate} onChange={(e) => setPayForm({ ...payForm, paymentDate: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">NTPN (Nomor Transaksi Penerimaan Negara)</Label>
              <Input value={payForm.ntpn} onChange={(e) => setPayForm({ ...payForm, ntpn: e.target.value })} placeholder="Opsional" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Catatan</Label>
              <Input value={payForm.notes} onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })} placeholder="Catatan tambahan" />
            </div>
            <Button className="w-full" disabled={recordPayment.isPending} onClick={() => {
              const periodStr = `${year}-${String(month).padStart(2, "0")}`;
              if (selectedTax) {
                recordPayment.mutate({
                  periodMonth: periodStr,
                  taxCode: selectedTax.taxCode,
                  omzetAmount: selectedTax.basis,
                  taxAmount: selectedTax.amount,
                  paymentDate: payForm.paymentDate,
                  ntpn: payForm.ntpn || undefined,
                  status: "LUNAS",
                  notes: payForm.notes || undefined,
                });
              } else {
                const amount = parseInt(payForm.manualAmount || "0");
                if (amount <= 0) { toast.error("Masukkan jumlah pembayaran"); return; }
                recordPayment.mutate({
                  periodMonth: periodStr,
                  taxCode: payForm.taxCode || "PPH_FINAL_05",
                  omzetAmount: 0,
                  taxAmount: amount,
                  paymentDate: payForm.paymentDate,
                  ntpn: payForm.ntpn || undefined,
                  status: "LUNAS",
                  notes: payForm.notes || undefined,
                });
              }
            }}>
              {recordPayment.isPending ? "Menyimpan..." : "Simpan Pembayaran"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
