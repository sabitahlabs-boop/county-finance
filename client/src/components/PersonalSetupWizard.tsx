import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Wallet, CreditCard, Smartphone, Banknote, ArrowRight, ArrowLeft, Check, Plus, Trash2, Target, Sparkles } from "lucide-react";

const BANK_PRESETS = [
  { name: "BCA", icon: "🏦", color: "#003d79", type: "bank" as const },
  { name: "BRI", icon: "🏦", color: "#00529c", type: "bank" as const },
  { name: "BNI", icon: "🏦", color: "#f15a22", type: "bank" as const },
  { name: "Mandiri", icon: "🏦", color: "#003876", type: "bank" as const },
  { name: "BSI", icon: "🏦", color: "#00a651", type: "bank" as const },
  { name: "CIMB Niaga", icon: "🏦", color: "#7b0c10", type: "bank" as const },
  { name: "GoPay", icon: "📱", color: "#00aed6", type: "ewallet" as const },
  { name: "OVO", icon: "📱", color: "#4c3494", type: "ewallet" as const },
  { name: "DANA", icon: "📱", color: "#108ee9", type: "ewallet" as const },
  { name: "ShopeePay", icon: "📱", color: "#ee4d2d", type: "ewallet" as const },
  { name: "Cash / Tunai", icon: "💵", color: "#16a34a", type: "cash" as const },
];

const BILL_PRESETS = [
  { name: "Kredit Motor", icon: "🏍️", category: "Kredit" },
  { name: "Kredit Rumah / KPR", icon: "🏠", category: "Kredit" },
  { name: "Kredit Mobil", icon: "🚗", category: "Kredit" },
  { name: "Listrik (PLN)", icon: "⚡", category: "Utilitas" },
  { name: "Air (PDAM)", icon: "💧", category: "Utilitas" },
  { name: "Internet / WiFi", icon: "🌐", category: "Utilitas" },
  { name: "Pulsa / Paket Data", icon: "📶", category: "Utilitas" },
  { name: "Netflix / Streaming", icon: "🎬", category: "Langganan" },
  { name: "Spotify", icon: "🎵", category: "Langganan" },
  { name: "Gym / Fitness", icon: "💪", category: "Langganan" },
  { name: "Asuransi", icon: "🛡️", category: "Asuransi" },
  { name: "BPJS Kesehatan", icon: "🏥", category: "Asuransi" },
];

interface AccountEntry {
  name: string;
  type: "bank" | "ewallet" | "cash";
  icon: string;
  color: string;
  balance: string;
}

interface BillEntry {
  name: string;
  amount: string;
  dueDay: string;
  category: string;
  icon: string;
}

export default function PersonalSetupWizard({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(1);
  const [accounts, setAccounts] = useState<AccountEntry[]>([
    { name: "Cash / Tunai", type: "cash", icon: "💵", color: "#16a34a", balance: "" },
  ]);
  const [bills, setBills] = useState<BillEntry[]>([]);
  const [customAccount, setCustomAccount] = useState("");
  const [customBill, setCustomBill] = useState({ name: "", amount: "", dueDay: "1" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createAccountMut = trpc.bankAccount.create.useMutation();
  const createBillMut = trpc.monthlyBills.create.useMutation();
  const completeSetupMut = trpc.business.completePersonalSetup.useMutation();

  const addPresetAccount = (preset: typeof BANK_PRESETS[0]) => {
    if (accounts.find(a => a.name === preset.name)) {
      toast.error(`${preset.name} sudah ditambahkan`);
      return;
    }
    setAccounts([...accounts, { ...preset, balance: "" }]);
  };

  const removeAccount = (idx: number) => {
    setAccounts(accounts.filter((_, i) => i !== idx));
  };

  const updateBalance = (idx: number, val: string) => {
    const updated = [...accounts];
    updated[idx].balance = val;
    setAccounts(updated);
  };

  const addPresetBill = (preset: typeof BILL_PRESETS[0]) => {
    if (bills.find(b => b.name === preset.name)) {
      toast.error(`${preset.name} sudah ditambahkan`);
      return;
    }
    setBills([...bills, { ...preset, amount: "", dueDay: "1" }]);
  };

  const removeBill = (idx: number) => {
    setBills(bills.filter((_, i) => i !== idx));
  };

  const updateBill = (idx: number, field: keyof BillEntry, val: string) => {
    const updated = [...bills];
    updated[idx] = { ...updated[idx], [field]: val };
    setBills(updated);
  };

  const addCustomBill = () => {
    if (!customBill.name.trim()) return;
    setBills([...bills, { ...customBill, category: "Lainnya", icon: "📋" }]);
    setCustomBill({ name: "", amount: "", dueDay: "1" });
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      // Create bank accounts
      for (const acc of accounts) {
        await createAccountMut.mutateAsync({
          accountName: acc.name,
          accountType: acc.type,
          icon: acc.icon,
          color: acc.color,
          initialBalance: acc.balance ? parseInt(acc.balance.replace(/\D/g, "")) : 0,
        });
      }
      // Create monthly bills
      for (const bill of bills) {
        if (bill.name && bill.amount) {
          await createBillMut.mutateAsync({
            name: bill.name,
            amount: parseInt(bill.amount.replace(/\D/g, "")) || 0,
            dueDay: parseInt(bill.dueDay) || 1,
            category: bill.category,
            icon: bill.icon,
          });
        }
      }
      // Mark setup as done
      await completeSetupMut.mutateAsync();
      toast.success("Setup selesai! Selamat menggunakan County 🎉");
      onComplete();
    } catch (e: any) {
      toast.error(e.message || "Gagal menyimpan setup");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (val: string) => {
    const num = val.replace(/\D/g, "");
    if (!num) return "";
    return parseInt(num).toLocaleString("id-ID");
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex-1 flex items-center gap-2">
              <div className={`h-2 flex-1 rounded-full transition-all ${s <= step ? "bg-emerald-500" : "bg-muted"}`} />
            </div>
          ))}
        </div>

        {/* Step 1: Bank Accounts */}
        {step === 1 && (
          <Card className="border-0 shadow-xl">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mb-3">
                <Wallet className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl">Setup Akun Keuangan Kamu</CardTitle>
              <CardDescription className="text-sm max-w-md mx-auto">
                Tambahkan rekening bank, e-wallet, atau cash yang kamu gunakan sehari-hari. 
                <span className="block mt-1 text-emerald-600 font-medium">Ini penting supaya kamu bisa tracking uang masuk & keluar dari mana saja.</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Quick add presets */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Klik untuk menambahkan:</p>
                <div className="flex flex-wrap gap-1.5">
                  {BANK_PRESETS.map(preset => {
                    const added = accounts.find(a => a.name === preset.name);
                    return (
                      <button
                        key={preset.name}
                        onClick={() => addPresetAccount(preset)}
                        disabled={!!added}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          added
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : "bg-muted hover:bg-muted/80 text-foreground"
                        }`}
                      >
                        <span>{preset.icon}</span> {preset.name}
                        {added && <Check className="h-3 w-3" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Added accounts with balance input */}
              {accounts.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Masukkan saldo saat ini:</p>
                  {accounts.map((acc, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-3 rounded-xl bg-muted/50">
                      <span className="text-lg">{acc.icon}</span>
                      <span className="text-sm font-medium flex-shrink-0 w-28">{acc.name}</span>
                      <div className="flex-1 relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">Rp</span>
                        <Input
                          className="pl-9 h-9 text-sm"
                          placeholder="0"
                          value={acc.balance}
                          onChange={(e) => updateBalance(idx, formatCurrency(e.target.value))}
                        />
                      </div>
                      <button onClick={() => removeAccount(idx)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between pt-2">
                <div />
                <Button onClick={() => setStep(2)} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                  Lanjut <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Monthly Bills */}
        {step === 2 && (
          <Card className="border-0 shadow-xl">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center mb-3">
                <CreditCard className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl">Tagihan Bulanan Kamu</CardTitle>
              <CardDescription className="text-sm max-w-md mx-auto">
                Tambahkan pengeluaran rutin yang harus dibayar tiap bulan (kredit, listrik, internet, dll).
                <span className="block mt-1 text-rose-600 font-medium">Ini membantu kamu tahu berapa uang yang "sudah terpakai" sebelum bulan dimulai.</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Quick add presets */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Klik untuk menambahkan:</p>
                <div className="flex flex-wrap gap-1.5">
                  {BILL_PRESETS.map(preset => {
                    const added = bills.find(b => b.name === preset.name);
                    return (
                      <button
                        key={preset.name}
                        onClick={() => addPresetBill(preset)}
                        disabled={!!added}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          added
                            ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                            : "bg-muted hover:bg-muted/80 text-foreground"
                        }`}
                      >
                        <span>{preset.icon}</span> {preset.name}
                        {added && <Check className="h-3 w-3" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Added bills */}
              {bills.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  <p className="text-xs font-medium text-muted-foreground">Isi nominal & tanggal jatuh tempo:</p>
                  {bills.map((bill, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-3 rounded-xl bg-muted/50">
                      <span className="text-lg flex-shrink-0">{bill.icon}</span>
                      <span className="text-xs font-medium flex-shrink-0 w-24 truncate">{bill.name}</span>
                      <div className="flex-1 relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">Rp</span>
                        <Input
                          className="pl-7 h-8 text-xs"
                          placeholder="500.000"
                          value={bill.amount}
                          onChange={(e) => updateBill(idx, "amount", formatCurrency(e.target.value))}
                        />
                      </div>
                      <div className="w-16">
                        <Input
                          className="h-8 text-xs text-center"
                          placeholder="Tgl"
                          type="number"
                          min={1}
                          max={31}
                          value={bill.dueDay}
                          onChange={(e) => updateBill(idx, "dueDay", e.target.value)}
                        />
                      </div>
                      <button onClick={() => removeBill(idx)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Custom bill */}
              <div className="flex items-center gap-2 p-3 rounded-xl border border-dashed">
                <Input
                  className="h-8 text-xs flex-1"
                  placeholder="Tagihan lainnya..."
                  value={customBill.name}
                  onChange={(e) => setCustomBill({ ...customBill, name: e.target.value })}
                />
                <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={addCustomBill} disabled={!customBill.name.trim()}>
                  <Plus className="h-3 w-3" /> Tambah
                </Button>
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="ghost" onClick={() => setStep(1)} className="gap-2">
                  <ArrowLeft className="h-4 w-4" /> Kembali
                </Button>
                <Button onClick={() => setStep(3)} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                  Lanjut <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Summary & Finish */}
        {step === 3 && (
          <Card className="border-0 shadow-xl">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center mb-3">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl">Siap Mulai! 🎉</CardTitle>
              <CardDescription className="text-sm max-w-md mx-auto">
                Berikut ringkasan setup kamu. Kamu bisa menambah atau mengubah semua ini nanti di Pengaturan.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Summary: Accounts */}
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 p-4">
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-2 mb-2">
                  <Wallet className="h-4 w-4" /> {accounts.length} Akun Keuangan
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {accounts.map((acc, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white dark:bg-background text-xs">
                      {acc.icon} {acc.name}
                      {acc.balance && <span className="text-muted-foreground ml-1">Rp {acc.balance}</span>}
                    </span>
                  ))}
                </div>
              </div>

              {/* Summary: Bills */}
              <div className="rounded-xl bg-rose-50 dark:bg-rose-950/30 p-4">
                <p className="text-sm font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-2 mb-2">
                  <CreditCard className="h-4 w-4" /> {bills.length} Tagihan Bulanan
                </p>
                {bills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {bills.map((bill, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white dark:bg-background text-xs">
                        {bill.icon} {bill.name}
                        {bill.amount && <span className="text-muted-foreground ml-1">Rp {bill.amount}</span>}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Belum ada tagihan (bisa ditambah nanti)</p>
                )}
                {bills.length > 0 && (
                  <p className="text-xs font-medium text-rose-600 dark:text-rose-400 mt-2">
                    Total tagihan: Rp {bills.reduce((s, b) => s + (parseInt(b.amount.replace(/\D/g, "")) || 0), 0).toLocaleString("id-ID")}/bulan
                  </p>
                )}
              </div>

              <p className="text-xs text-center text-muted-foreground">
                💡 Tip: Kamu bisa menambah <strong>Tabungan Impian</strong> (nabung untuk traveling, gadget, dll) di menu Dashboard nanti!
              </p>

              <div className="flex justify-between pt-2">
                <Button variant="ghost" onClick={() => setStep(2)} className="gap-2">
                  <ArrowLeft className="h-4 w-4" /> Kembali
                </Button>
                <Button
                  onClick={handleFinish}
                  disabled={isSubmitting}
                  className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                >
                  {isSubmitting ? "Menyimpan..." : "Mulai Pakai County"} <Check className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Skip option */}
        <p className="text-center mt-4">
          <button
            onClick={async () => {
              await completeSetupMut.mutateAsync();
              onComplete();
            }}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Lewati setup, saya mau langsung pakai
          </button>
        </p>
      </div>
    </div>
  );
}
