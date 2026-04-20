import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  User, Wallet, ShoppingBag, Shield, TrendingUp, Home, Car,
  CreditCard, Heart, ChevronRight, ChevronLeft, Check, Plus,
  Minus, Trash2, Sparkles, Building2, Briefcase, GraduationCap,
  CircleDollarSign, Landmark, PiggyBank,
} from "lucide-react";
import { formatRupiah } from "../../../shared/finance";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

// ─── Step definitions ───
const STEPS = [
  { num: 1, title: "Data Diri", desc: "Informasi dasar keuangan", icon: User, color: "#F59E0B" },
  { num: 2, title: "Arus Pemasukan", desc: "Sumber penghasilan bulanan", icon: Wallet, color: "#10B981" },
  { num: 3, title: "Arus Pengeluaran", desc: "Alokasi pengeluaran bulanan", icon: ShoppingBag, color: "#EF4444" },
  { num: 4, title: "Asuransi", desc: "Polis proteksi yang dimiliki", icon: Shield, color: "#6366F1" },
  { num: 5, title: "Dana Darurat", desc: "Kesiapan proteksi finansial", icon: Heart, color: "#EC4899" },
  { num: 6, title: "Investasi", desc: "Portfolio investasi", icon: TrendingUp, color: "#8B5CF6" },
  { num: 7, title: "Aset Kekayaan", desc: "Properti, kendaraan, dll", icon: Home, color: "#0EA5E9" },
  { num: 8, title: "Liabilitas", desc: "Utang dan cicilan", icon: CreditCard, color: "#F97316" },
  { num: 9, title: "Warisan", desc: "Legacy planning", icon: GraduationCap, color: "#14B8A6" },
];

// ─── Types ───
interface IncomeEntry { id?: number; name: string; category: string; amount: number; }
interface ExpenseEntry { id?: number; name: string; category: string; budgetAmount: number; icon: string; color: string; }
interface InsuranceEntry { id?: number; name: string; insuranceType: string; provider: string; premiumAmount: number; coverageAmount: number; }
interface AssetEntry { id?: number; name: string; assetType: string; subType: string; currentValue: number; icon: string; }
interface LiabilityEntry { id?: number; name: string; liabilityType: string; totalAmount: number; remainingAmount: number; monthlyPayment: number; interestRate: number; }

// ─── Counter Component ───
function Counter({ value, onChange, min = 0, max = 100, label }: { value: number; onChange: (v: number) => void; min?: number; max?: number; label: string }) {
  return (
    <div>
      <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</Label>
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" className="h-9 w-9 p-0 rounded-full" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}>
          <Minus className="h-4 w-4" />
        </Button>
        <span className="text-2xl font-bold w-12 text-center tabular-nums">{value}</span>
        <Button variant="outline" size="sm" className="h-9 w-9 p-0 rounded-full" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── Rupiah Input ───
function RupiahInput({ value, onChange, label, placeholder }: { value: number; onChange: (v: number) => void; label: string; placeholder?: string }) {
  return (
    <div>
      <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</Label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">Rp</span>
        <Input
          type="number"
          className="pl-10"
          placeholder={placeholder || "0"}
          value={value || ""}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
        />
      </div>
    </div>
  );
}

// ─── EXPENSE PRESETS ───
const EXPENSE_PRESETS = [
  { name: "Makanan & Minuman", category: "kebutuhan", icon: "🍜", color: "#EF4444" },
  { name: "Transportasi", category: "kebutuhan", icon: "🚗", color: "#F97316" },
  { name: "Listrik & Air", category: "kebutuhan", icon: "💡", color: "#F59E0B" },
  { name: "Internet & Telpon", category: "kebutuhan", icon: "📱", color: "#3B82F6" },
  { name: "Sewa / Kos", category: "kebutuhan", icon: "🏠", color: "#8B5CF6" },
  { name: "Belanja / Shopping", category: "keinginan", icon: "🛍️", color: "#EC4899" },
  { name: "Hiburan", category: "keinginan", icon: "🎬", color: "#14B8A6" },
  { name: "Gym / Olahraga", category: "keinginan", icon: "🏋️", color: "#22C55E" },
  { name: "Tabungan", category: "tabungan", icon: "🐷", color: "#6366F1" },
  { name: "Cicilan KPR/KPA", category: "cicilan", icon: "🏦", color: "#0EA5E9" },
  { name: "Asuransi Jiwa", category: "asuransi", icon: "🛡️", color: "#D946EF" },
  { name: "Asuransi Kesehatan", category: "asuransi", icon: "❤️", color: "#F43F5E" },
];

// ─── INVESTMENT PRESETS ───
const INVESTMENT_SUBTYPES = [
  { name: "Saham", icon: "📈" },
  { name: "Reksadana", icon: "📊" },
  { name: "Obligasi", icon: "📜" },
  { name: "Deposito", icon: "🏦" },
  { name: "Kripto", icon: "₿" },
  { name: "Emas", icon: "🥇" },
  { name: "P2P Lending", icon: "🤝" },
];

// ─── LIABILITY TYPES ───
const LIABILITY_TYPES = [
  { value: "kpr", label: "KPR (Kredit Rumah)" },
  { value: "kpa", label: "KPA (Kredit Kendaraan)" },
  { value: "kta", label: "KTA (Kredit Tanpa Agunan)" },
  { value: "kartu_kredit", label: "Kartu Kredit" },
  { value: "pinjaman_online", label: "Pinjaman Online" },
  { value: "cicilan", label: "Cicilan Lainnya" },
  { value: "lainnya", label: "Utang Lainnya" },
];

export default function PersonalSetupWizard({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const utils = trpc.useUtils();

  // ─── Step 1: Data Diri ───
  const [profile, setProfile] = useState({
    fullName: "", age: 25, maritalStatus: "single" as string, dependents: 0, occupation: "",
  });

  // ─── Step 2: Pemasukan ───
  const [incomes, setIncomes] = useState<IncomeEntry[]>([
    { name: "Gaji Bulanan", category: "gaji", amount: 0 },
  ]);

  // ─── Step 3: Pengeluaran ───
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([
    { name: "Makanan & Minuman", category: "kebutuhan", budgetAmount: 0, icon: "🍜", color: "#EF4444" },
    { name: "Transportasi", category: "kebutuhan", budgetAmount: 0, icon: "🚗", color: "#F97316" },
  ]);

  // ─── Step 4: Asuransi ───
  const [insurances, setInsurances] = useState<InsuranceEntry[]>([]);
  const [hasInsurance, setHasInsurance] = useState(false);

  // ─── Step 5: Dana Darurat ───
  const [emergencyFund, setEmergencyFund] = useState(0);

  // ─── Step 6: Investasi ───
  const [investments, setInvestments] = useState<AssetEntry[]>([]);
  const [hasInvestment, setHasInvestment] = useState(false);

  // ─── Step 7: Aset Kekayaan ───
  const [assets, setAssets] = useState<AssetEntry[]>([]);

  // ─── Step 8: Liabilitas ───
  const [liabilities, setLiabilities] = useState<LiabilityEntry[]>([]);
  const [hasLiability, setHasLiability] = useState(false);

  // ─── Step 9: Warisan ───
  const [heritageStatus, setHeritageStatus] = useState<string>("belum_siap");

  // ─── Mutations ───
  const upsertProfileMut = trpc.personalFinance.upsertProfile.useMutation();
  const upsertIncomeMut = trpc.personalFinance.upsertIncomeSource.useMutation();
  const upsertExpenseMut = trpc.personalFinance.upsertExpenseCategory.useMutation();
  const upsertInsuranceMut = trpc.personalFinance.upsertInsurance.useMutation();
  const upsertAssetMut = trpc.personalFinance.upsertAsset.useMutation();
  const upsertLiabilityMut = trpc.personalFinance.upsertLiability.useMutation();
  const upsertHeritageMut = trpc.personalFinance.upsertHeritage.useMutation();
  const upsertGoalMut = trpc.personalFinance.upsertGoal.useMutation();

  // ─── Computed ───
  const totalIncome = useMemo(() => incomes.reduce((s, i) => s + i.amount, 0), [incomes]);
  const totalExpense = useMemo(() => expenses.reduce((s, e) => s + e.budgetAmount, 0), [expenses]);
  const cashflow = totalIncome - totalExpense;

  const canNext = () => {
    if (step === 0) return profile.fullName.length >= 2;
    return true;
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleFinish = async () => {
    setIsSaving(true);
    try {
      // Save profile
      await upsertProfileMut.mutateAsync({
        fullName: profile.fullName,
        age: profile.age,
        maritalStatus: profile.maritalStatus as any,
        dependents: profile.dependents,
        occupation: profile.occupation,
        monthlyIncome: totalIncome,
        setupCompleted: true,
        setupStep: 9,
      });

      // Save incomes
      for (const inc of incomes) {
        if (inc.amount > 0) {
          await upsertIncomeMut.mutateAsync({ name: inc.name, category: inc.category as any, amount: inc.amount });
        }
      }

      // Save expenses
      for (const exp of expenses) {
        if (exp.budgetAmount > 0) {
          await upsertExpenseMut.mutateAsync({ name: exp.name, category: exp.category as any, budgetAmount: exp.budgetAmount, icon: exp.icon, color: exp.color });
        }
      }

      // Save insurances
      for (const ins of insurances) {
        if (ins.premiumAmount > 0) {
          await upsertInsuranceMut.mutateAsync({ name: ins.name, insuranceType: ins.insuranceType as any, provider: ins.provider, premiumAmount: ins.premiumAmount, coverageAmount: ins.coverageAmount });
        }
      }

      // Save emergency fund as asset
      if (emergencyFund > 0) {
        await upsertAssetMut.mutateAsync({ name: "Dana Darurat", assetType: "likuid", subType: "dana_darurat", currentValue: emergencyFund, icon: "🛡️" });
      }

      // Save investments
      for (const inv of investments) {
        if (inv.currentValue > 0) {
          await upsertAssetMut.mutateAsync({ name: inv.name, assetType: "investasi", subType: inv.subType, currentValue: inv.currentValue, icon: inv.icon });
        }
      }

      // Save other assets
      for (const asset of assets) {
        if (asset.currentValue > 0) {
          await upsertAssetMut.mutateAsync({ name: asset.name, assetType: asset.assetType as any, subType: asset.subType, currentValue: asset.currentValue, icon: asset.icon });
        }
      }

      // Save liabilities
      for (const lib of liabilities) {
        if (lib.totalAmount > 0) {
          await upsertLiabilityMut.mutateAsync({ name: lib.name, liabilityType: lib.liabilityType as any, totalAmount: lib.totalAmount, remainingAmount: lib.remainingAmount, monthlyPayment: lib.monthlyPayment, interestRate: lib.interestRate });
        }
      }

      // Save heritage
      await upsertHeritageMut.mutateAsync({ heritageStatus: heritageStatus as any });

      // Create default goals
      const monthlyExpense = totalExpense || totalIncome * 0.6;
      await upsertGoalMut.mutateAsync({ name: "Dana Darurat", goalType: "dana_darurat", targetAmount: monthlyExpense * 6, currentAmount: emergencyFund, priority: 1, icon: "🛡️", color: "#EF4444" });
      await upsertGoalMut.mutateAsync({ name: "Dana Pensiun", goalType: "dana_pensiun", targetAmount: totalIncome * 12 * 20, currentAmount: 0, priority: 2, icon: "🏖️", color: "#F59E0B" });
      await upsertGoalMut.mutateAsync({ name: "Investasi Umum", goalType: "investasi", targetAmount: totalIncome * 12 * 5, currentAmount: investments.reduce((s, i) => s + i.currentValue, 0), priority: 3, icon: "📈", color: "#10B981" });

      await utils.personalFinance.getDashboard.invalidate();
      await utils.personalFinance.getProfile.invalidate();
      toast.success("Setup keuangan selesai! 🎉");
      onComplete();
    } catch (e: any) {
      toast.error(e.message || "Gagal menyimpan data");
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Step Renderers ───
  const renderStep = () => {
    switch (step) {
      case 0: return renderDataDiri();
      case 1: return renderPemasukan();
      case 2: return renderPengeluaran();
      case 3: return renderAsuransi();
      case 4: return renderDanaDarurat();
      case 5: return renderInvestasi();
      case 6: return renderAsetKekayaan();
      case 7: return renderLiabilitas();
      case 8: return renderWarisan();
      default: return null;
    }
  };

  // ─── Step 1: Data Diri ───
  const renderDataDiri = () => (
    <div className="space-y-6">
      <div>
        <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Nama Lengkap</Label>
        <Input
          placeholder="Masukkan nama Anda"
          value={profile.fullName}
          onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
          className="h-11"
        />
      </div>
      <div className="grid grid-cols-2 gap-6">
        <Counter label="Usia" value={profile.age} onChange={(v) => setProfile({ ...profile, age: v })} min={17} max={100} />
        <Counter label="Jumlah Tanggungan" value={profile.dependents} onChange={(v) => setProfile({ ...profile, dependents: v })} min={0} max={20} />
      </div>
      <div>
        <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Status Pernikahan</Label>
        <Select value={profile.maritalStatus} onValueChange={(v) => setProfile({ ...profile, maritalStatus: v })}>
          <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="single">Belum Menikah</SelectItem>
            <SelectItem value="married">Menikah</SelectItem>
            <SelectItem value="divorced">Cerai</SelectItem>
            <SelectItem value="widowed">Duda/Janda</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Pekerjaan</Label>
        <Input
          placeholder="contoh: Karyawan, Wiraswasta, Freelancer"
          value={profile.occupation}
          onChange={(e) => setProfile({ ...profile, occupation: e.target.value })}
          className="h-11"
        />
      </div>
    </div>
  );

  // ─── Step 2: Pemasukan ───
  const renderPemasukan = () => (
    <div className="space-y-4">
      {incomes.map((inc, i) => (
        <div key={i} className="flex items-end gap-3 p-3 rounded-xl bg-muted/30 border">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Input placeholder="Nama sumber" value={inc.name} onChange={(e) => { const n = [...incomes]; n[i].name = e.target.value; setIncomes(n); }} className="h-9 text-sm" />
              <Select value={inc.category} onValueChange={(v) => { const n = [...incomes]; n[i].category = v; setIncomes(n); }}>
                <SelectTrigger className="w-32 h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="gaji">Gaji</SelectItem>
                  <SelectItem value="bonus">Bonus</SelectItem>
                  <SelectItem value="freelance">Freelance</SelectItem>
                  <SelectItem value="investasi">Investasi</SelectItem>
                  <SelectItem value="bisnis">Bisnis</SelectItem>
                  <SelectItem value="lainnya">Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <RupiahInput label="" value={inc.amount} onChange={(v) => { const n = [...incomes]; n[i].amount = v; setIncomes(n); }} placeholder="Jumlah per bulan" />
          </div>
          {incomes.length > 1 && (
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-red-500" onClick={() => setIncomes(incomes.filter((_, j) => j !== i))}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
      <Button variant="outline" size="sm" className="w-full gap-2 rounded-xl" onClick={() => setIncomes([...incomes, { name: "", category: "lainnya", amount: 0 }])}>
        <Plus className="h-4 w-4" /> Tambah Sumber Pemasukan
      </Button>
      <div className="mt-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Total Pemasukan / bulan</span>
          <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatRupiah(totalIncome)}</span>
        </div>
      </div>
    </div>
  );

  // ─── Step 3: Pengeluaran ───
  const renderPengeluaran = () => (
    <div className="space-y-4">
      {/* Quick add presets */}
      <div>
        <Label className="text-xs font-medium text-muted-foreground mb-2 block">Tambah cepat:</Label>
        <div className="flex flex-wrap gap-1.5">
          {EXPENSE_PRESETS.filter(p => !expenses.find(e => e.name === p.name)).slice(0, 6).map(p => (
            <Button key={p.name} variant="outline" size="sm" className="text-xs h-7 gap-1 rounded-lg" onClick={() => setExpenses([...expenses, { ...p, budgetAmount: 0 }])}>
              {p.icon} {p.name}
            </Button>
          ))}
        </div>
      </div>

      {expenses.map((exp, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center text-sm" style={{ backgroundColor: exp.color + "20" }}>
            {exp.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{exp.name}</p>
            <Badge variant="secondary" className="text-[10px]">{exp.category}</Badge>
          </div>
          <div className="w-36">
            <div className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">Rp</span>
              <Input type="number" className="pl-8 h-8 text-sm" value={exp.budgetAmount || ""} onChange={(e) => { const n = [...expenses]; n[i].budgetAmount = Number(e.target.value) || 0; setExpenses(n); }} />
            </div>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 shrink-0" onClick={() => setExpenses(expenses.filter((_, j) => j !== i))}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}

      {/* Summary */}
      <div className="space-y-2 p-4 rounded-xl bg-muted/50 border">
        <div className="flex justify-between text-sm">
          <span className="text-emerald-600 dark:text-emerald-400">Total Pemasukan</span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatRupiah(totalIncome)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-rose-600 dark:text-rose-400">Total Pengeluaran</span>
          <span className="font-bold text-rose-600 dark:text-rose-400">{formatRupiah(totalExpense)}</span>
        </div>
        <hr className="border-border" />
        <div className="flex justify-between text-sm">
          <span className={`font-semibold ${cashflow >= 0 ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400"}`}>Arus Kas / bulan</span>
          <span className={`font-bold ${cashflow >= 0 ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400"}`}>
            {cashflow >= 0 ? "+" : ""}{formatRupiah(cashflow)}
          </span>
        </div>
      </div>
    </div>
  );

  // ─── Step 4: Asuransi ───
  const renderAsuransi = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/30 border">
        <Shield className="h-5 w-5 text-indigo-500" />
        <span className="text-sm font-medium flex-1">Apakah Anda memiliki asuransi?</span>
        <Switch checked={hasInsurance} onCheckedChange={setHasInsurance} />
      </div>

      {hasInsurance && (
        <>
          {insurances.map((ins, i) => (
            <div key={i} className="p-3 rounded-xl bg-muted/30 border space-y-2">
              <div className="flex items-center gap-2">
                <Input placeholder="Nama polis" value={ins.name} onChange={(e) => { const n = [...insurances]; n[i].name = e.target.value; setInsurances(n); }} className="h-9 text-sm flex-1" />
                <Select value={ins.insuranceType} onValueChange={(v) => { const n = [...insurances]; n[i].insuranceType = v; setInsurances(n); }}>
                  <SelectTrigger className="w-36 h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="jiwa">Jiwa</SelectItem>
                    <SelectItem value="kesehatan">Kesehatan</SelectItem>
                    <SelectItem value="kendaraan">Kendaraan</SelectItem>
                    <SelectItem value="properti">Properti</SelectItem>
                    <SelectItem value="pendidikan">Pendidikan</SelectItem>
                    <SelectItem value="lainnya">Lainnya</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-red-500" onClick={() => setInsurances(insurances.filter((_, j) => j !== i))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <RupiahInput label="Premi / bulan" value={ins.premiumAmount} onChange={(v) => { const n = [...insurances]; n[i].premiumAmount = v; setInsurances(n); }} />
                <RupiahInput label="Uang Pertanggungan" value={ins.coverageAmount} onChange={(v) => { const n = [...insurances]; n[i].coverageAmount = v; setInsurances(n); }} />
              </div>
            </div>
          ))}
          <Button variant="outline" size="sm" className="w-full gap-2 rounded-xl" onClick={() => setInsurances([...insurances, { name: "", insuranceType: "jiwa", provider: "", premiumAmount: 0, coverageAmount: 0 }])}>
            <Plus className="h-4 w-4" /> Tambah Polis Asuransi
          </Button>
        </>
      )}

      {!hasInsurance && (
        <div className="text-center py-8 text-muted-foreground">
          <Shield className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Tidak apa-apa! Anda bisa menambahkan nanti.</p>
        </div>
      )}
    </div>
  );

  // ─── Step 5: Dana Darurat ───
  const renderDanaDarurat = () => {
    const idealFund = totalExpense > 0 ? totalExpense * 6 : totalIncome * 0.6 * 6;
    const percentage = idealFund > 0 ? Math.min(100, Math.round((emergencyFund / idealFund) * 100)) : 0;
    return (
      <div className="space-y-6">
        <div className="text-center p-6 rounded-xl bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border border-amber-200 dark:border-amber-800">
          <Heart className="h-10 w-10 mx-auto mb-3 text-amber-500" />
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Dana Darurat Ideal</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{formatRupiah(idealFund)}</p>
          <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-1">= 6x pengeluaran bulanan Anda</p>
        </div>

        <RupiahInput label="Dana Darurat Anda Saat Ini" value={emergencyFund} onChange={setEmergencyFund} />

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{percentage}%</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percentage}%`, backgroundColor: percentage >= 100 ? "#10B981" : percentage >= 50 ? "#F59E0B" : "#EF4444" }} />
          </div>
          <p className="text-xs text-muted-foreground">
            {percentage >= 100 ? "Selamat! Dana darurat Anda sudah mencukupi." : percentage >= 50 ? "Bagus! Tinggal sedikit lagi menuju ideal." : "Mari bangun dana darurat Anda secara bertahap."}
          </p>
        </div>
      </div>
    );
  };

  // ─── Step 6: Investasi ───
  const renderInvestasi = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/30 border">
        <TrendingUp className="h-5 w-5 text-purple-500" />
        <span className="text-sm font-medium flex-1">Apakah Anda memiliki investasi?</span>
        <Switch checked={hasInvestment} onCheckedChange={setHasInvestment} />
      </div>

      {hasInvestment && (
        <>
          {/* Quick add */}
          <div className="flex flex-wrap gap-1.5">
            {INVESTMENT_SUBTYPES.filter(t => !investments.find(i => i.subType === t.name)).map(t => (
              <Button key={t.name} variant="outline" size="sm" className="text-xs h-7 gap-1 rounded-lg" onClick={() => setInvestments([...investments, { name: t.name, assetType: "investasi", subType: t.name, currentValue: 0, icon: t.icon }])}>
                {t.icon} {t.name}
              </Button>
            ))}
          </div>

          {investments.map((inv, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border">
              <span className="text-lg">{inv.icon}</span>
              <span className="text-sm font-medium flex-1">{inv.name}</span>
              <div className="w-40">
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">Rp</span>
                  <Input type="number" className="pl-8 h-8 text-sm" value={inv.currentValue || ""} onChange={(e) => { const n = [...investments]; n[i].currentValue = Number(e.target.value) || 0; setInvestments(n); }} />
                </div>
              </div>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500" onClick={() => setInvestments(investments.filter((_, j) => j !== i))}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}

          {investments.length > 0 && (
            <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
              <div className="flex justify-between text-sm">
                <span className="text-purple-700 dark:text-purple-300">Total Investasi</span>
                <span className="font-bold text-purple-600 dark:text-purple-400">{formatRupiah(investments.reduce((s, i) => s + i.currentValue, 0))}</span>
              </div>
            </div>
          )}
        </>
      )}

      {!hasInvestment && (
        <div className="text-center py-8 text-muted-foreground">
          <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Anda bisa mulai investasi kapan saja!</p>
        </div>
      )}
    </div>
  );

  // ─── Step 7: Aset Kekayaan ───
  const renderAsetKekayaan = () => (
    <div className="space-y-4">
      {/* Quick add */}
      <div className="flex flex-wrap gap-1.5">
        {[
          { name: "Rumah", type: "guna", sub: "properti", icon: "🏠" },
          { name: "Apartemen", type: "guna", sub: "properti", icon: "🏢" },
          { name: "Mobil", type: "guna", sub: "kendaraan", icon: "🚗" },
          { name: "Motor", type: "guna", sub: "kendaraan", icon: "🏍️" },
          { name: "Tanah", type: "guna", sub: "properti", icon: "🏞️" },
          { name: "Tabungan", type: "likuid", sub: "tabungan", icon: "🏦" },
          { name: "E-Wallet", type: "likuid", sub: "ewallet", icon: "📱" },
          { name: "Kas / Cash", type: "likuid", sub: "cash", icon: "💵" },
        ].filter(t => !assets.find(a => a.name === t.name)).map(t => (
          <Button key={t.name} variant="outline" size="sm" className="text-xs h-7 gap-1 rounded-lg" onClick={() => setAssets([...assets, { name: t.name, assetType: t.type, subType: t.sub, currentValue: 0, icon: t.icon }])}>
            {t.icon} {t.name}
          </Button>
        ))}
      </div>

      {assets.map((asset, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border">
          <span className="text-lg">{asset.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{asset.name}</p>
            <Badge variant="secondary" className="text-[10px]">{asset.assetType === "likuid" ? "Likuid" : "Aset Guna"}</Badge>
          </div>
          <div className="w-40">
            <div className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">Rp</span>
              <Input type="number" className="pl-8 h-8 text-sm" value={asset.currentValue || ""} onChange={(e) => { const n = [...assets]; n[i].currentValue = Number(e.target.value) || 0; setAssets(n); }} />
            </div>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500" onClick={() => setAssets(assets.filter((_, j) => j !== i))}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}

      {assets.length === 0 && (
        <div className="text-center py-6 text-muted-foreground">
          <Home className="h-10 w-10 mx-auto mb-2 opacity-20" />
          <p className="text-sm">Pilih aset di atas untuk mulai menambahkan</p>
        </div>
      )}

      {assets.length > 0 && (
        <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800">
          <div className="flex justify-between text-sm">
            <span className="text-sky-700 dark:text-sky-300">Total Aset</span>
            <span className="font-bold text-sky-600 dark:text-sky-400">{formatRupiah(assets.reduce((s, a) => s + a.currentValue, 0))}</span>
          </div>
        </div>
      )}
    </div>
  );

  // ─── Step 8: Liabilitas ───
  const renderLiabilitas = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/30 border">
        <CreditCard className="h-5 w-5 text-orange-500" />
        <span className="text-sm font-medium flex-1">Apakah Anda memiliki utang/cicilan?</span>
        <Switch checked={hasLiability} onCheckedChange={setHasLiability} />
      </div>

      {hasLiability && (
        <>
          {liabilities.map((lib, i) => (
            <div key={i} className="p-3 rounded-xl bg-muted/30 border space-y-2">
              <div className="flex items-center gap-2">
                <Input placeholder="Nama utang" value={lib.name} onChange={(e) => { const n = [...liabilities]; n[i].name = e.target.value; setLiabilities(n); }} className="h-9 text-sm flex-1" />
                <Select value={lib.liabilityType} onValueChange={(v) => { const n = [...liabilities]; n[i].liabilityType = v; setLiabilities(n); }}>
                  <SelectTrigger className="w-40 h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LIABILITY_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-red-500" onClick={() => setLiabilities(liabilities.filter((_, j) => j !== i))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <RupiahInput label="Total Utang" value={lib.totalAmount} onChange={(v) => { const n = [...liabilities]; n[i].totalAmount = v; n[i].remainingAmount = v; setLiabilities(n); }} />
                <RupiahInput label="Sisa Utang" value={lib.remainingAmount} onChange={(v) => { const n = [...liabilities]; n[i].remainingAmount = v; setLiabilities(n); }} />
                <RupiahInput label="Cicilan / bulan" value={lib.monthlyPayment} onChange={(v) => { const n = [...liabilities]; n[i].monthlyPayment = v; setLiabilities(n); }} />
              </div>
            </div>
          ))}
          <Button variant="outline" size="sm" className="w-full gap-2 rounded-xl" onClick={() => setLiabilities([...liabilities, { name: "", liabilityType: "lainnya", totalAmount: 0, remainingAmount: 0, monthlyPayment: 0, interestRate: 0 }])}>
            <Plus className="h-4 w-4" /> Tambah Utang/Cicilan
          </Button>

          {liabilities.length > 0 && (
            <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800">
              <div className="flex justify-between text-sm">
                <span className="text-orange-700 dark:text-orange-300">Total Sisa Utang</span>
                <span className="font-bold text-orange-600 dark:text-orange-400">{formatRupiah(liabilities.reduce((s, l) => s + l.remainingAmount, 0))}</span>
              </div>
            </div>
          )}
        </>
      )}

      {!hasLiability && (
        <div className="text-center py-8 text-muted-foreground">
          <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Hebat! Bebas utang adalah langkah bagus.</p>
        </div>
      )}
    </div>
  );

  // ─── Step 9: Warisan ───
  const renderWarisan = () => (
    <div className="space-y-6">
      <div className="text-center p-6 rounded-xl bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/30 border border-teal-200 dark:border-teal-800">
        <GraduationCap className="h-10 w-10 mx-auto mb-3 text-teal-500" />
        <p className="text-sm font-medium text-teal-800 dark:text-teal-200">Perencanaan Warisan</p>
        <p className="text-xs text-teal-600/70 dark:text-teal-400/70 mt-1">Sudahkah Anda menyiapkan rencana warisan/legacy?</p>
      </div>

      <div className="space-y-3">
        {[
          { value: "sudah_siap", label: "Sudah Siap", desc: "Saya sudah punya surat wasiat / rencana warisan", icon: "✅" },
          { value: "sedang_proses", label: "Sedang Proses", desc: "Saya sedang dalam proses mempersiapkan", icon: "⏳" },
          { value: "belum_siap", label: "Belum Siap", desc: "Saya belum memikirkan tentang ini", icon: "📋" },
        ].map(opt => (
          <div
            key={opt.value}
            onClick={() => setHeritageStatus(opt.value)}
            className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${heritageStatus === opt.value ? "border-teal-500 bg-teal-50 dark:bg-teal-950/30" : "border-transparent bg-muted/30 hover:bg-muted/50"}`}
          >
            <span className="text-2xl">{opt.icon}</span>
            <div>
              <p className="text-sm font-semibold">{opt.label}</p>
              <p className="text-xs text-muted-foreground">{opt.desc}</p>
            </div>
            {heritageStatus === opt.value && <Check className="h-5 w-5 text-teal-500 ml-auto" />}
          </div>
        ))}
      </div>
    </div>
  );

  const currentStep = STEPS[step];
  const isLastStep = step === STEPS.length - 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-amber-50/20 dark:to-amber-950/10 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <CircleDollarSign className="h-7 w-7 text-amber-500" />
            <h1 className="text-xl font-bold">County Jurnal Pribadi</h1>
          </div>
          <p className="text-sm text-muted-foreground">Setup keuangan Anda — langkah {step + 1} dari {STEPS.length}</p>
        </motion.div>

        {/* Progress Bar */}
        <div className="flex gap-1 mb-6">
          {STEPS.map((s, i) => (
            <div key={i} className="flex-1 h-1.5 rounded-full overflow-hidden bg-muted">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: i <= step ? "100%" : "0%", backgroundColor: currentStep.color }}
              />
            </div>
          ))}
        </div>

        {/* Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="border-0 shadow-xl ring-1 ring-black/5 dark:ring-white/10 overflow-hidden">
              {/* Step header stripe */}
              <div className="h-1.5" style={{ backgroundColor: currentStep.color }} />

              {/* Step title */}
              <div className="px-6 pt-5 pb-3 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: currentStep.color + "20" }}>
                  <currentStep.icon className="h-5 w-5" style={{ color: currentStep.color }} />
                </div>
                <div>
                  <h2 className="text-lg font-bold">{currentStep.title}</h2>
                  <p className="text-xs text-muted-foreground">{currentStep.desc}</p>
                </div>
                <Badge variant="secondary" className="ml-auto text-xs">{step + 1}/{STEPS.length}</Badge>
              </div>

              {/* Content */}
              <CardContent className="px-6 pb-6">
                {renderStep()}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="ghost"
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" /> Kembali
          </Button>

          {isLastStep ? (
            <Button
              onClick={handleFinish}
              disabled={isSaving}
              className="gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white shadow-lg"
            >
              {isSaving ? "Menyimpan..." : (
                <>
                  <Sparkles className="h-4 w-4" /> Selesai & Lihat Dashboard
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={() => setStep(Math.min(STEPS.length - 1, step + 1))}
              disabled={!canNext()}
              className="gap-2"
              style={{ backgroundColor: currentStep.color }}
            >
              Lanjut <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Skip option */}
        {!isLastStep && step > 0 && (
          <div className="text-center mt-3">
            <button
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setStep(Math.min(STEPS.length - 1, step + 1))}
            >
              Lewati untuk sekarang →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
