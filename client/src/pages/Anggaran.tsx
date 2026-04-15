import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PiggyBank, Plus, Pencil, Trash2, AlertTriangle,
  CheckCircle2, ChevronLeft, ChevronRight, TrendingUp,
  Receipt, Target, Sparkles, CreditCard, Home, Car,
  Smartphone, Wifi, Zap, Droplets, GraduationCap, Heart,
  Plane, ShoppingBag, Gem, Laptop, Camera, Music,
  CalendarDays, ArrowUpRight
} from "lucide-react";
import { formatRupiah, PENGELUARAN_CATEGORIES, BULAN_INDONESIA } from "../../../shared/finance";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const BUDGET_CATEGORIES = [
  ...PENGELUARAN_CATEGORIES,
  "Marketing",
  "Asuransi",
  "Perlengkapan",
  "Pajak",
  "Lainnya",
];

const BILL_CATEGORIES = [
  { label: "Kredit Rumah/KPR", icon: Home },
  { label: "Kredit Motor/Mobil", icon: Car },
  { label: "Cicilan HP/Gadget", icon: Smartphone },
  { label: "Internet/WiFi", icon: Wifi },
  { label: "Listrik", icon: Zap },
  { label: "Air PDAM", icon: Droplets },
  { label: "Asuransi", icon: Heart },
  { label: "Pendidikan/Sekolah", icon: GraduationCap },
  { label: "Kartu Kredit", icon: CreditCard },
  { label: "Langganan Streaming", icon: Music },
  { label: "Lainnya", icon: Receipt },
];

const DREAM_ICONS = [
  { label: "Traveling", icon: Plane },
  { label: "Gadget", icon: Laptop },
  { label: "Fashion", icon: ShoppingBag },
  { label: "Perhiasan", icon: Gem },
  { label: "Kamera", icon: Camera },
  { label: "Pendidikan", icon: GraduationCap },
  { label: "Rumah", icon: Home },
  { label: "Mobil", icon: Car },
  { label: "Lainnya", icon: Sparkles },
];

export default function Anggaran() {
  const [activeTab, setActiveTab] = useState("tagihan");

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <PiggyBank className="h-6 w-6 text-[#1E4D9B]" />
          Tagihan & Anggaran
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Kelola tagihan rutin, anggaran bulanan, dan tabungan impian Anda</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 h-12">
          <TabsTrigger value="tagihan" className="flex items-center gap-2 text-sm">
            <Receipt className="h-4 w-4" />
            <span className="hidden sm:inline">Tagihan Rutin</span>
            <span className="sm:hidden">Tagihan</span>
          </TabsTrigger>
          <TabsTrigger value="anggaran" className="flex items-center gap-2 text-sm">
            <Target className="h-4 w-4" />
            <span>Anggaran</span>
          </TabsTrigger>
          <TabsTrigger value="impian" className="flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Tabungan Impian</span>
            <span className="sm:hidden">Impian</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tagihan" className="mt-6">
          <TagihanRutinTab />
        </TabsContent>
        <TabsContent value="anggaran" className="mt-6">
          <AnggaranTab />
        </TabsContent>
        <TabsContent value="impian" className="mt-6">
          <TabunganImpianTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ═══════════════════════════════════════════
// TAB 1: Tagihan Rutin (Monthly Bills)
// ═══════════════════════════════════════════
function TagihanRutinTab() {
  const [showForm, setShowForm] = useState(false);
  const [editBill, setEditBill] = useState<any>(null);
  const [showPayBill, setShowPayBill] = useState<any>(null);
  const [payBankAccount, setPayBankAccount] = useState("");
  const [payNotes, setPayNotes] = useState("");
  const [form, setForm] = useState({ name: "", category: "", amount: "", dueDay: "", notes: "" });

  const { data: bills, isLoading } = trpc.monthlyBills.list.useQuery();
  const { data: bankAccounts } = trpc.bankAccount.list.useQuery();
  const utils = trpc.useUtils();

  const createMut = trpc.monthlyBills.create.useMutation({
    onSuccess: () => { utils.monthlyBills.list.invalidate(); setShowForm(false); resetForm(); toast.success("Tagihan berhasil ditambahkan!"); },
    onError: (e: any) => toast.error(e.message),
  });
  const updateMut = trpc.monthlyBills.update.useMutation({
    onSuccess: () => { utils.monthlyBills.list.invalidate(); setShowForm(false); setEditBill(null); resetForm(); toast.success("Tagihan berhasil diperbarui!"); },
    onError: (e: any) => toast.error(e.message),
  });
  const deleteMut = trpc.monthlyBills.delete.useMutation({
    onSuccess: () => { utils.monthlyBills.list.invalidate(); toast.success("Tagihan berhasil dihapus!"); },
    onError: (e: any) => toast.error(e.message),
  });
  const payBillMut = trpc.monthlyBills.pay.useMutation({
    onSuccess: () => {
      utils.monthlyBills.list.invalidate();
      setShowPayBill(null);
      setPayBankAccount("");
      setPayNotes("");
      toast.success("Tagihan berhasil dibayar & tercatat di jurnal!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  function resetForm() {
    setForm({ name: "", category: "", amount: "", dueDay: "", notes: "" });
  }

  function openEdit(bill: any) {
    setEditBill(bill);
    setForm({
      name: bill.name,
      category: bill.category,
      amount: String(bill.amount),
      dueDay: String(bill.dueDay),
      notes: bill.notes || "",
    });
    setShowForm(true);
  }

  function handleSubmit() {
    if (!form.name) { toast.error("Nama tagihan wajib diisi"); return; }
    if (!form.category) { toast.error("Kategori wajib dipilih"); return; }
    const amount = parseInt(form.amount.replace(/\D/g, ""), 10);
    if (!amount || amount <= 0) { toast.error("Jumlah tagihan harus lebih dari 0"); return; }
    const dueDay = parseInt(form.dueDay, 10);
    if (!dueDay || dueDay < 1 || dueDay > 31) { toast.error("Tanggal jatuh tempo harus 1-31"); return; }

    if (editBill) {
      updateMut.mutate({ id: editBill.id, name: form.name, category: form.category, amount, dueDay, notes: form.notes || undefined });
    } else {
      createMut.mutate({ name: form.name, category: form.category, amount, dueDay, notes: form.notes || undefined });
    }
  }

  const totalBills = (bills || []).reduce((s: number, b: any) => s + b.amount, 0);
  const today = new Date().getDate();

  return (
    <div className="space-y-6">
      {/* Header + Add */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Receipt className="h-5 w-5 text-orange-500" />
            Tagihan Rutin Bulanan
          </h2>
          <p className="text-sm text-muted-foreground">Cicilan, langganan, dan beban tetap yang harus dibayar setiap bulan</p>
        </div>
        <Button onClick={() => { resetForm(); setEditBill(null); setShowForm(true); }} className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600">
          <Plus className="h-4 w-4 mr-2" /> Tambah Tagihan
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-0 shadow-md bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/10">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-700 dark:text-orange-400">{formatRupiah(totalBills)}</div>
            <div className="text-xs text-orange-600/70 dark:text-orange-400/60 mt-1">Total Tagihan / Bulan</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{bills?.length || 0}</div>
            <div className="text-xs text-muted-foreground mt-1">Jumlah Tagihan Aktif</div>
          </CardContent>
        </Card>
      </div>

      {/* Bills List */}
      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}</div>
      ) : !bills || bills.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Receipt className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="font-medium text-muted-foreground">Belum ada tagihan rutin</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Tambahkan cicilan, langganan, atau beban tetap bulanan Anda</p>
            <Button variant="outline" className="mt-4" onClick={() => { resetForm(); setEditBill(null); setShowForm(true); }}>
              <Plus className="h-4 w-4 mr-2" /> Tambah Tagihan Pertama
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {bills.map((bill: any) => {
              const billIcon = BILL_CATEGORIES.find(c => c.label === bill.category);
              const IconComp = billIcon?.icon || Receipt;
              const isDueSoon = bill.dueDay >= today && bill.dueDay <= today + 5;
              const isPastDue = bill.dueDay < today;
              return (
                <motion.div key={bill.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <Card className={`border-0 shadow-md ${isDueSoon ? "ring-1 ring-amber-300 dark:ring-amber-700" : isPastDue ? "ring-1 ring-green-300 dark:ring-green-700" : ""}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/20 flex items-center justify-center shrink-0">
                          <IconComp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold truncate">{bill.name}</h3>
                            {isDueSoon && <Badge className="bg-amber-100 text-amber-700 text-[10px] shrink-0">Segera Jatuh Tempo</Badge>}
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-muted-foreground">{bill.category}</span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <CalendarDays className="h-3 w-3" /> Tgl {bill.dueDay} setiap bulan
                            </span>
                          </div>
                          {bill.notes && <p className="text-xs text-muted-foreground/70 mt-1">{bill.notes}</p>}
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-lg font-bold">{formatRupiah(bill.amount)}</div>
                          <div className="flex gap-1 mt-1 justify-end">
                            <Button size="sm" variant="outline" className="h-7 px-2 text-xs gap-1" onClick={() => { setShowPayBill(bill); setPayBankAccount(""); setPayNotes(""); }}>
                              <CreditCard className="h-3 w-3" /> Bayar
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(bill)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => {
                              if (confirm(`Hapus tagihan "${bill.name}"?`)) deleteMut.mutate({ id: bill.id });
                            }}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Pay Bill Dialog */}
      <Dialog open={!!showPayBill} onOpenChange={(open) => { if (!open) { setShowPayBill(null); setPayBankAccount(""); setPayNotes(""); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-orange-500" />
              Bayar Tagihan
            </DialogTitle>
          </DialogHeader>
          {showPayBill && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20">
                <div className="font-medium">{showPayBill.name}</div>
                <div className="text-sm text-muted-foreground">{showPayBill.category} — Jatuh tempo tgl {showPayBill.dueDay}</div>
                <div className="text-lg font-bold mt-1 text-orange-700 dark:text-orange-400">{formatRupiah(showPayBill.amount)}</div>
              </div>
              {bankAccounts && bankAccounts.length > 0 && (
                <div>
                  <Label>Bayar dari Rekening</Label>
                  <Select value={payBankAccount} onValueChange={setPayBankAccount}>
                    <SelectTrigger><SelectValue placeholder="Pilih rekening..." /></SelectTrigger>
                    <SelectContent>
                      {bankAccounts.map((acc: any) => (
                        <SelectItem key={acc.id} value={acc.accountName}>
                          {acc.icon} {acc.accountName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">Saldo rekening akan berkurang & tercatat di jurnal</p>
                </div>
              )}
              <div>
                <Label>Catatan (opsional)</Label>
                <Input value={payNotes} onChange={(e) => setPayNotes(e.target.value)} placeholder="Catatan tambahan..." />
              </div>
              <Button
                onClick={() => payBillMut.mutate({
                  id: showPayBill.id,
                  amount: showPayBill.amount,
                  bankAccountName: payBankAccount || undefined,
                  notes: payNotes || undefined,
                })}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500"
                disabled={payBillMut.isPending}
              >
                {payBillMut.isPending ? "Memproses..." : `Bayar ${formatRupiah(showPayBill.amount)}`}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add/Edit Bill Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) { setShowForm(false); setEditBill(null); resetForm(); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editBill ? "Edit Tagihan" : "Tambah Tagihan Baru"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nama Tagihan *</Label>
              <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Contoh: Cicilan Motor Honda" />
            </div>
            <div>
              <Label>Kategori *</Label>
              <Select value={form.category} onValueChange={(v) => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue placeholder="Pilih kategori tagihan" /></SelectTrigger>
                <SelectContent>
                  {BILL_CATEGORIES.map(c => <SelectItem key={c.label} value={c.label}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Jumlah Tagihan / Bulan *</Label>
              <Input value={form.amount} onChange={(e) => setForm(f => ({ ...f, amount: e.target.value.replace(/\D/g, "") }))} placeholder="Contoh: 1500000" />
              {form.amount && <p className="text-xs text-muted-foreground mt-1">{formatRupiah(parseInt(form.amount) || 0)}</p>}
            </div>
            <div>
              <Label>Tanggal Jatuh Tempo (1-31) *</Label>
              <Input type="number" min={1} max={31} value={form.dueDay} onChange={(e) => setForm(f => ({ ...f, dueDay: e.target.value }))} placeholder="Contoh: 15" />
            </div>
            <div>
              <Label>Catatan</Label>
              <Input value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Catatan (opsional)" />
            </div>
            <Button onClick={handleSubmit} className="w-full bg-gradient-to-r from-orange-500 to-amber-500" disabled={createMut.isPending || updateMut.isPending}>
              {createMut.isPending || updateMut.isPending ? "Menyimpan..." : editBill ? "Simpan Perubahan" : "Tambah Tagihan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ═══════════════════════════════════════════
// TAB 2: Anggaran Bulanan (Budget)
// ═══════════════════════════════════════════
function AnggaranTab() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [showForm, setShowForm] = useState(false);
  const [editBudget, setEditBudget] = useState<any>(null);
  const [form, setForm] = useState({ category: "", budgetAmount: "", notes: "" });

  const period = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}`;

  const { data: budgets, isLoading } = trpc.budget.list.useQuery({ period });
  const { data: spending } = trpc.budget.spending.useQuery({ period });
  const utils = trpc.useUtils();

  const createMut = trpc.budget.create.useMutation({
    onSuccess: () => { utils.budget.list.invalidate(); setShowForm(false); resetForm(); toast.success("Anggaran berhasil ditambahkan!"); },
    onError: (e: any) => toast.error(e.message),
  });
  const updateMut = trpc.budget.update.useMutation({
    onSuccess: () => { utils.budget.list.invalidate(); setShowForm(false); setEditBudget(null); resetForm(); toast.success("Anggaran berhasil diperbarui!"); },
    onError: (e: any) => toast.error(e.message),
  });
  const deleteMut = trpc.budget.delete.useMutation({
    onSuccess: () => { utils.budget.list.invalidate(); toast.success("Anggaran berhasil dihapus!"); },
    onError: (e: any) => toast.error(e.message),
  });

  function resetForm() { setForm({ category: "", budgetAmount: "", notes: "" }); }

  function openEdit(budget: any) {
    setEditBudget(budget);
    setForm({ category: budget.category, budgetAmount: String(budget.budgetAmount), notes: budget.notes || "" });
    setShowForm(true);
  }

  function handleSubmit() {
    if (!form.category) { toast.error("Kategori wajib dipilih"); return; }
    const amount = parseInt(form.budgetAmount.replace(/\D/g, ""), 10);
    if (!amount || amount <= 0) { toast.error("Jumlah anggaran harus lebih dari 0"); return; }
    if (editBudget) {
      updateMut.mutate({ id: editBudget.id, category: form.category, budgetAmount: amount, notes: form.notes || undefined });
    } else {
      createMut.mutate({ period, category: form.category, budgetAmount: amount, notes: form.notes || undefined });
    }
  }

  function prevMonth() {
    if (selectedMonth === 1) { setSelectedMonth(12); setSelectedYear(y => y - 1); }
    else setSelectedMonth(m => m - 1);
  }
  function nextMonth() {
    if (selectedMonth === 12) { setSelectedMonth(1); setSelectedYear(y => y + 1); }
    else setSelectedMonth(m => m + 1);
  }

  const totalBudget = (budgets || []).reduce((s: number, b: any) => s + b.budgetAmount, 0);
  const totalSpent = Object.values(spending || {}).reduce((s: number, v: any) => s + v, 0);
  const overBudgetCount = (budgets || []).filter((b: any) => (spending?.[b.category] || 0) > b.budgetAmount).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Target className="h-5 w-5 text-[#1E4D9B]" />
            Anggaran Bulanan
          </h2>
          <p className="text-sm text-muted-foreground">Atur batas pengeluaran per kategori agar tidak boros</p>
        </div>
        <Button onClick={() => { resetForm(); setEditBudget(null); setShowForm(true); }} className="bg-gradient-to-r from-[#1E4D9B] to-[#2563EB]">
          <Plus className="h-4 w-4 mr-2" /> Tambah Anggaran
        </Button>
      </div>

      {/* Month Selector */}
      <div className="flex items-center justify-center gap-4">
        <Button variant="ghost" size="icon" onClick={prevMonth}><ChevronLeft className="h-5 w-5" /></Button>
        <span className="text-lg font-semibold min-w-[180px] text-center">
          {BULAN_INDONESIA[selectedMonth - 1]} {selectedYear}
        </span>
        <Button variant="ghost" size="icon" onClick={nextMonth}><ChevronRight className="h-5 w-5" /></Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="text-lg font-bold">{formatRupiah(totalBudget)}</div>
            <div className="text-xs text-muted-foreground">Total Anggaran</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="text-lg font-bold">{formatRupiah(totalSpent)}</div>
            <div className="text-xs text-muted-foreground">Total Terpakai</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className={`text-lg font-bold ${totalBudget - totalSpent < 0 ? "text-red-500" : "text-green-600"}`}>
              {formatRupiah(totalBudget - totalSpent)}
            </div>
            <div className="text-xs text-muted-foreground">Sisa Anggaran</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold">{budgets?.length || 0}</span>
              {overBudgetCount > 0 && <Badge variant="destructive" className="text-xs">{overBudgetCount} over</Badge>}
            </div>
            <div className="text-xs text-muted-foreground">Kategori</div>
          </CardContent>
        </Card>
      </div>

      {/* Budget List */}
      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}</div>
      ) : !budgets || budgets.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Target className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">Belum ada anggaran untuk bulan ini</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Buat anggaran per kategori untuk kontrol pengeluaran</p>
            <Button variant="outline" className="mt-4" onClick={() => { resetForm(); setEditBudget(null); setShowForm(true); }}>
              <Plus className="h-4 w-4 mr-2" /> Buat Anggaran
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {budgets.map((budget: any) => {
              const spent = spending?.[budget.category] || 0;
              const pct = budget.budgetAmount > 0 ? Math.round((spent / budget.budgetAmount) * 100) : 0;
              const isOver = spent > budget.budgetAmount;
              const remaining = budget.budgetAmount - spent;
              return (
                <motion.div key={budget.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <Card className={`border-0 shadow-md ${isOver ? "ring-1 ring-red-300 dark:ring-red-800" : ""}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{budget.category}</h3>
                            {isOver ? (
                              <Badge variant="destructive" className="text-xs"><AlertTriangle className="h-3 w-3 mr-1" />Melebihi Batas</Badge>
                            ) : pct >= 80 ? (
                              <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs">Hampir Habis</Badge>
                            ) : (
                              <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs"><CheckCircle2 className="h-3 w-3 mr-1" />Aman</Badge>
                            )}
                          </div>
                          {budget.notes && <p className="text-xs text-muted-foreground">{budget.notes}</p>}
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">{formatRupiah(budget.budgetAmount)}</div>
                          <div className={`text-xs ${isOver ? "text-red-500 font-medium" : "text-muted-foreground"}`}>
                            {isOver ? `Over: ${formatRupiah(Math.abs(remaining))}` : `Sisa: ${formatRupiah(remaining)}`}
                          </div>
                        </div>
                      </div>
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Terpakai: {formatRupiah(spent)}</span>
                          <span>{Math.min(pct, 100)}%</span>
                        </div>
                        <Progress value={Math.min(pct, 100)} className={`h-2 ${isOver ? "[&>div]:bg-red-500" : pct >= 80 ? "[&>div]:bg-amber-500" : ""}`} />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(budget)}>
                          <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => {
                          if (confirm(`Hapus anggaran "${budget.category}"?`)) deleteMut.mutate({ id: budget.id });
                        }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Add/Edit Budget Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) { setShowForm(false); setEditBudget(null); resetForm(); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editBudget ? "Edit Anggaran" : "Tambah Anggaran Baru"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Kategori Pengeluaran *</Label>
              <Select value={form.category} onValueChange={(v) => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                <SelectContent>
                  {BUDGET_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Batas Anggaran *</Label>
              <Input value={form.budgetAmount} onChange={(e) => setForm(f => ({ ...f, budgetAmount: e.target.value.replace(/\D/g, "") }))} placeholder="Contoh: 5000000" />
              {form.budgetAmount && <p className="text-xs text-muted-foreground mt-1">{formatRupiah(parseInt(form.budgetAmount) || 0)}</p>}
            </div>
            <div>
              <Label>Catatan</Label>
              <Input value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Catatan (opsional)" />
            </div>
            <Button onClick={handleSubmit} className="w-full bg-gradient-to-r from-[#1E4D9B] to-[#2563EB]" disabled={createMut.isPending || updateMut.isPending}>
              {createMut.isPending || updateMut.isPending ? "Menyimpan..." : editBudget ? "Simpan Perubahan" : "Tambah Anggaran"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ═══════════════════════════════════════════
// TAB 3: Tabungan Impian (Savings Goals)
// ═══════════════════════════════════════════
function TabunganImpianTab() {
  const [showForm, setShowForm] = useState(false);
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const [addAmount, setAddAmount] = useState("");
  const [addFundsBankAccount, setAddFundsBankAccount] = useState("");
  const [form, setForm] = useState({ name: "", targetAmount: "", icon: "Lainnya", deadline: "" });

  const { data: goals, isLoading } = trpc.savings.list.useQuery();
  const { data: bankAccounts } = trpc.bankAccount.list.useQuery();
  const utils = trpc.useUtils();

  const createMut = trpc.savings.create.useMutation({
    onSuccess: () => { utils.savings.list.invalidate(); setShowForm(false); resetForm(); toast.success("Tabungan impian berhasil dibuat!"); },
    onError: (e: any) => toast.error(e.message),
  });
  const addFundsMut = trpc.savings.addFunds.useMutation({
    onSuccess: (data: any) => {
      utils.savings.list.invalidate();
      setShowAddFunds(false);
      setAddAmount("");
      if (data?.isCompleted) {
        toast.success("Selamat! Target tabungan tercapai! 🎉");
      } else {
        toast.success("Dana berhasil ditambahkan!");
      }
    },
    onError: (e: any) => toast.error(e.message),
  });
  const deleteMut = trpc.savings.delete.useMutation({
    onSuccess: () => { utils.savings.list.invalidate(); toast.success("Tabungan impian dihapus"); },
    onError: (e: any) => toast.error(e.message),
  });

  function resetForm() { setForm({ name: "", targetAmount: "", icon: "Lainnya", deadline: "" }); }

  function handleCreate() {
    if (!form.name) { toast.error("Nama impian wajib diisi"); return; }
    const target = parseInt(form.targetAmount.replace(/\D/g, ""), 10);
    if (!target || target <= 0) { toast.error("Target harus lebih dari 0"); return; }
    createMut.mutate({
      name: form.name,
      targetAmount: target,
      icon: form.icon,
      targetDate: form.deadline || undefined,
    });
  }

  function handleAddFunds() {
    if (!selectedGoal) return;
    const amount = parseInt(addAmount.replace(/\D/g, ""), 10);
    if (!amount || amount <= 0) { toast.error("Jumlah harus lebih dari 0"); return; }
    addFundsMut.mutate({ id: selectedGoal.id, amount, bankAccountName: addFundsBankAccount || undefined });
  }

  const totalTarget = (goals || []).reduce((s: number, g: any) => s + g.targetAmount, 0);
  const totalSaved = (goals || []).reduce((s: number, g: any) => s + g.currentAmount, 0);
  const completedCount = (goals || []).filter((g: any) => g.isCompleted).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Tabungan Impian
          </h2>
          <p className="text-sm text-muted-foreground">Nabung untuk hal-hal yang kamu impikan — traveling, gadget, rumah, dll</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
          <Plus className="h-4 w-4 mr-2" /> Buat Impian Baru
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/10">
          <CardContent className="p-4">
            <div className="text-xl font-bold text-purple-700 dark:text-purple-400">{formatRupiah(totalSaved)}</div>
            <div className="text-xs text-purple-600/70 dark:text-purple-400/60 mt-1">Total Terkumpul</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="text-xl font-bold">{formatRupiah(totalTarget)}</div>
            <div className="text-xs text-muted-foreground mt-1">Total Target</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="text-xl font-bold text-green-600">{completedCount}</div>
            <div className="text-xs text-muted-foreground mt-1">Tercapai</div>
          </CardContent>
        </Card>
      </div>

      {/* Goals List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[1, 2].map(i => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}</div>
      ) : !goals || goals.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Sparkles className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="font-medium text-muted-foreground">Belum ada tabungan impian</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Mulai nabung untuk hal yang kamu inginkan!</p>
            <Button variant="outline" className="mt-4" onClick={() => { resetForm(); setShowForm(true); }}>
              <Plus className="h-4 w-4 mr-2" /> Buat Impian Pertama
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {goals.map((goal: any) => {
              const pct = goal.targetAmount > 0 ? Math.round((goal.currentAmount / goal.targetAmount) * 100) : 0;
              const remaining = goal.targetAmount - goal.currentAmount;
              const dreamIcon = DREAM_ICONS.find(d => d.label === goal.icon);
              const IconComp = dreamIcon?.icon || Sparkles;
              return (
                <motion.div key={goal.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                  <Card className={`border-0 shadow-md overflow-hidden ${goal.isCompleted ? "ring-2 ring-green-400 dark:ring-green-600" : ""}`}>
                    <div className={`h-2 ${goal.isCompleted ? "bg-gradient-to-r from-green-400 to-emerald-500" : "bg-gradient-to-r from-purple-400 to-pink-500"}`} />
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${
                          goal.isCompleted
                            ? "bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/20"
                            : "bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/20"
                        }`}>
                          {goal.isCompleted ? (
                            <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                          ) : (
                            <IconComp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold truncate">{goal.name}</h3>
                            {goal.isCompleted && <Badge className="bg-green-100 text-green-700 text-xs shrink-0">Tercapai! 🎉</Badge>}
                          </div>
                          {goal.deadline && (
                            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                              <CalendarDays className="h-3 w-3" /> Target: {new Date(goal.deadline).toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
                            </p>
                          )}
                          <div className="mt-3">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="font-medium">{formatRupiah(goal.currentAmount)}</span>
                              <span className="text-muted-foreground">{formatRupiah(goal.targetAmount)}</span>
                            </div>
                            <Progress value={Math.min(pct, 100)} className={`h-3 ${goal.isCompleted ? "[&>div]:bg-green-500" : "[&>div]:bg-gradient-to-r [&>div]:from-purple-500 [&>div]:to-pink-500"}`} />
                            <div className="flex justify-between text-xs text-muted-foreground mt-1">
                              <span>{pct}%</span>
                              {!goal.isCompleted && <span>Kurang: {formatRupiah(remaining)}</span>}
                            </div>
                          </div>
                          <div className="flex gap-2 mt-3">
                            {!goal.isCompleted && (
                              <Button size="sm" className="bg-gradient-to-r from-purple-500 to-pink-500 text-white" onClick={() => { setSelectedGoal(goal); setAddAmount(""); setShowAddFunds(true); }}>
                                <ArrowUpRight className="h-3.5 w-3.5 mr-1" /> Tambah Dana
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => {
                              if (confirm(`Hapus impian "${goal.name}"?`)) deleteMut.mutate({ id: goal.id });
                            }}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Create Goal Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) { setShowForm(false); resetForm(); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              Buat Impian Baru
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nama Impian *</Label>
              <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Contoh: Liburan ke Bali" />
            </div>
            <div>
              <Label>Ikon</Label>
              <div className="grid grid-cols-5 gap-2 mt-1">
                {DREAM_ICONS.map(d => {
                  const isSelected = form.icon === d.label;
                  return (
                    <button
                      key={d.label}
                      onClick={() => setForm(f => ({ ...f, icon: d.label }))}
                      className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-all ${
                        isSelected ? "border-purple-500 bg-purple-50 dark:bg-purple-950/30 text-purple-700" : "border-border hover:border-purple-300"
                      }`}
                    >
                      <d.icon className="h-5 w-5" />
                      <span className="truncate w-full text-center text-[10px]">{d.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <Label>Target Dana *</Label>
              <Input value={form.targetAmount} onChange={(e) => setForm(f => ({ ...f, targetAmount: e.target.value.replace(/\D/g, "") }))} placeholder="Contoh: 10000000" />
              {form.targetAmount && <p className="text-xs text-muted-foreground mt-1">{formatRupiah(parseInt(form.targetAmount) || 0)}</p>}
            </div>
            <div>
              <Label>Target Tanggal (opsional)</Label>
              <Input type="month" value={form.deadline} onChange={(e) => setForm(f => ({ ...f, deadline: e.target.value }))} />
            </div>
            <Button onClick={handleCreate} className="w-full bg-gradient-to-r from-purple-500 to-pink-500" disabled={createMut.isPending}>
              {createMut.isPending ? "Membuat..." : "Buat Impian"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Funds Dialog */}
      <Dialog open={showAddFunds} onOpenChange={(open) => { if (!open) { setShowAddFunds(false); setAddAmount(""); setAddFundsBankAccount(""); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Tambah Dana ke "{selectedGoal?.name}"</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedGoal && (
              <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20">
                <div className="text-sm font-medium">Progress: {formatRupiah(selectedGoal.currentAmount)} / {formatRupiah(selectedGoal.targetAmount)}</div>
                <div className="text-xs text-muted-foreground mt-1">Kurang: {formatRupiah(selectedGoal.targetAmount - selectedGoal.currentAmount)}</div>
              </div>
            )}
            <div>
              <Label>Jumlah Dana *</Label>
              <Input value={addAmount} onChange={(e) => setAddAmount(e.target.value.replace(/\D/g, ""))} placeholder="Contoh: 500000" autoFocus />
              {addAmount && <p className="text-xs text-muted-foreground mt-1">{formatRupiah(parseInt(addAmount) || 0)}</p>}
            </div>
            {bankAccounts && bankAccounts.length > 0 && (
              <div>
                <Label>Ambil dari Rekening</Label>
                <Select value={addFundsBankAccount} onValueChange={setAddFundsBankAccount}>
                  <SelectTrigger><SelectValue placeholder="Pilih rekening..." /></SelectTrigger>
                  <SelectContent>
                    {bankAccounts.map((acc: any) => (
                      <SelectItem key={acc.id} value={acc.accountName}>
                        {acc.icon} {acc.accountName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">Saldo rekening akan berkurang & tercatat di jurnal sebagai tabungan</p>
              </div>
            )}
            <Button onClick={handleAddFunds} className="w-full bg-gradient-to-r from-purple-500 to-pink-500" disabled={addFundsMut.isPending}>
              {addFundsMut.isPending ? "Menambahkan..." : "Tambah Dana"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
