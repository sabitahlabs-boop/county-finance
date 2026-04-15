import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BookOpen, ArrowUpRight, ArrowDownRight, Plus, Receipt,
  Calendar, Filter, TrendingUp, Wallet,
  PiggyBank, CreditCard, ChevronLeft, ChevronRight,
  Landmark, Smartphone, Banknote, Pencil, Trash2, X
} from "lucide-react";
import { formatRupiah, BULAN_INDONESIA } from "../../../shared/finance";
import { useLocation } from "wouter";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const CATEGORY_COLORS: Record<string, string> = {
  "Penjualan": "#10B981", "Gaji": "#3B82F6", "Freelance": "#8B5CF6",
  "Investasi": "#F59E0B", "Lainnya": "#6B7280", "Makanan": "#EF4444",
  "Transportasi": "#F97316", "Belanja": "#EC4899", "Tagihan": "#6366F1",
  "Hiburan": "#14B8A6", "Kesehatan": "#22C55E", "Pendidikan": "#0EA5E9",
};
const PIE_COLORS = ["#1E4D9B", "#F47920", "#4CAF50", "#E91E63", "#9C27B0", "#00BCD4", "#FF9800", "#607D8B", "#795548", "#3F51B5"];

const ACCOUNT_ICONS: Record<string, { icon: string; emoji: string }> = {
  bank: { icon: "bank", emoji: "🏦" },
  ewallet: { icon: "ewallet", emoji: "📱" },
  cash: { icon: "cash", emoji: "💵" },
};

const PRESET_ACCOUNTS = [
  { name: "BCA", type: "bank" as const, icon: "🏦", color: "#003D79" },
  { name: "BRI", type: "bank" as const, icon: "🏦", color: "#00529C" },
  { name: "BNI", type: "bank" as const, icon: "🏦", color: "#F15A22" },
  { name: "Mandiri", type: "bank" as const, icon: "🏦", color: "#003876" },
  { name: "GoPay", type: "ewallet" as const, icon: "📱", color: "#00AED6" },
  { name: "OVO", type: "ewallet" as const, icon: "📱", color: "#4C3494" },
  { name: "DANA", type: "ewallet" as const, icon: "📱", color: "#108EE9" },
  { name: "ShopeePay", type: "ewallet" as const, icon: "📱", color: "#EE4D2D" },
  { name: "Cash / Tunai", type: "cash" as const, icon: "💵", color: "#16A34A" },
];

function AccountIcon({ type }: { type: string }) {
  if (type === "bank") return <Landmark className="h-4 w-4" />;
  if (type === "ewallet") return <Smartphone className="h-4 w-4" />;
  return <Banknote className="h-4 w-4" />;
}

export default function JurnalPribadi() {
  const [, setLocation] = useLocation();
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [filterType, setFilterType] = useState<"all" | "pemasukan" | "pengeluaran">("all");
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [editAccount, setEditAccount] = useState<any>(null);
  const [newAccount, setNewAccount] = useState({ accountName: "", accountType: "bank" as "bank" | "ewallet" | "cash", icon: "🏦", color: "#3b82f6", initialBalance: 0 });
  const [selectedAccountFilter, setSelectedAccountFilter] = useState<string>("all");

  const { data: transactions, isLoading } = trpc.transaction.list.useQuery(
    { month: selectedMonth, year: selectedYear },
    { retry: false }
  );

  const { data: accountBalances, isLoading: accountsLoading } = trpc.bankAccount.balances.useQuery(undefined, { retry: false });
  const utils = trpc.useUtils();

  const createAccountMut = trpc.bankAccount.create.useMutation({
    onSuccess: () => { utils.bankAccount.balances.invalidate(); setShowAddAccount(false); resetForm(); toast.success("Akun berhasil ditambahkan!"); },
    onError: (e) => toast.error(e.message),
  });
  const updateAccountMut = trpc.bankAccount.update.useMutation({
    onSuccess: () => { utils.bankAccount.balances.invalidate(); setEditAccount(null); toast.success("Akun berhasil diperbarui!"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteAccountMut = trpc.bankAccount.delete.useMutation({
    onSuccess: () => { utils.bankAccount.balances.invalidate(); toast.success("Akun berhasil dihapus!"); },
    onError: (e) => toast.error(e.message),
  });

  const resetForm = () => setNewAccount({ accountName: "", accountType: "bank", icon: "🏦", color: "#3b82f6", initialBalance: 0 });

  // Filtered transactions
  const filteredTx = useMemo(() => {
    if (!transactions) return [];
    let filtered = transactions;
    if (filterType !== "all") filtered = filtered.filter((tx: any) => tx.type === filterType);
    if (selectedAccountFilter !== "all") filtered = filtered.filter((tx: any) => tx.paymentMethod === selectedAccountFilter);
    return filtered;
  }, [transactions, filterType, selectedAccountFilter]);

  // Summary calculations
  const summary = useMemo(() => {
    if (!filteredTx) return { pemasukan: 0, pengeluaran: 0, saldo: 0 };
    const pemasukan = filteredTx.filter((tx: any) => tx.type === "pemasukan").reduce((s: number, tx: any) => s + tx.amount, 0);
    const pengeluaran = filteredTx.filter((tx: any) => tx.type === "pengeluaran").reduce((s: number, tx: any) => s + tx.amount, 0);
    return { pemasukan, pengeluaran, saldo: pemasukan - pengeluaran };
  }, [filteredTx]);

  // Total balance across all accounts
  const totalBalance = useMemo(() => {
    if (!accountBalances || !Array.isArray(accountBalances)) return 0;
    return accountBalances.reduce((sum: number, a: any) => sum + (a.currentBalance || 0), 0);
  }, [accountBalances]);

  // Category breakdown for pie chart
  const categoryBreakdown = useMemo(() => {
    if (!filteredTx) return { income: [] as any[], expense: [] as any[] };
    const incCats: Record<string, number> = {};
    const expCats: Record<string, number> = {};
    filteredTx.forEach((tx: any) => {
      const target = tx.type === "pemasukan" ? incCats : expCats;
      target[tx.category] = (target[tx.category] || 0) + tx.amount;
    });
    const toArray = (cats: Record<string, number>) =>
      Object.entries(cats).sort((a, b) => b[1] - a[1]).map(([name, value], i) => ({ name, value, color: PIE_COLORS[i % PIE_COLORS.length] }));
    return { income: toArray(incCats), expense: toArray(expCats) };
  }, [filteredTx]);

  // Daily trend data
  const dailyTrend = useMemo(() => {
    if (!filteredTx) return [];
    const days: Record<string, { pemasukan: number; pengeluaran: number }> = {};
    filteredTx.forEach((tx: any) => {
      const day = tx.date.split("-")[2];
      if (!days[day]) days[day] = { pemasukan: 0, pengeluaran: 0 };
      if (tx.type === "pemasukan") days[day].pemasukan += tx.amount;
      else days[day].pengeluaran += tx.amount;
    });
    return Object.entries(days).sort((a, b) => a[0].localeCompare(b[0])).map(([day, data]) => ({ day: parseInt(day), ...data }));
  }, [filteredTx]);

  const prevMonth = () => { if (selectedMonth === 1) { setSelectedMonth(12); setSelectedYear(selectedYear - 1); } else setSelectedMonth(selectedMonth - 1); };
  const nextMonth = () => { if (selectedMonth === 12) { setSelectedMonth(1); setSelectedYear(selectedYear + 1); } else setSelectedMonth(selectedMonth + 1); };
  const getCategoryColor = (category: string) => CATEGORY_COLORS[category] || "#6B7280";

  const handlePresetClick = (preset: typeof PRESET_ACCOUNTS[0]) => {
    setNewAccount({ accountName: preset.name, accountType: preset.type, icon: preset.icon, color: preset.color, initialBalance: 0 });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-emerald-600" />
              Jurnal Keuangan
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Catatan pemasukan dan pengeluaran pribadi Anda</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => setLocation("/transaksi?action=income")} className="gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-sm">
              <Plus className="h-4 w-4" /> Pemasukan
            </Button>
            <Button size="sm" variant="outline" onClick={() => setLocation("/transaksi?action=expense")} className="gap-1.5">
              <Receipt className="h-4 w-4" /> Pengeluaran
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Bank Accounts Section */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card className="border-0 shadow-lg ring-1 ring-primary/5 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-blue-600" /> Akun Keuangan
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Total saldo: <span className="font-bold text-foreground">{formatRupiah(totalBalance)}</span></p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setShowAddAccount(true)} className="gap-1.5 rounded-xl text-xs">
                <Plus className="h-3.5 w-3.5" /> Tambah Akun
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {accountsLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
              </div>
            ) : !accountBalances || !Array.isArray(accountBalances) || accountBalances.length === 0 ? (
              <div className="text-center py-8">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <Wallet className="h-7 w-7 text-white" />
                </div>
                <p className="text-sm font-semibold">Belum ada akun keuangan</p>
                <p className="text-xs text-muted-foreground mt-1 mb-3">Tambahkan akun bank, e-wallet, atau cash untuk mulai tracking</p>
                <Button size="sm" onClick={() => setShowAddAccount(true)} className="gap-2 rounded-xl">
                  <Plus className="h-4 w-4" /> Tambah Akun Pertama
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {/* All accounts filter */}
                <div
                  onClick={() => setSelectedAccountFilter("all")}
                  className={`rounded-xl p-3 cursor-pointer transition-all border-2 ${selectedAccountFilter === "all" ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30" : "border-transparent bg-muted/30 hover:bg-muted/50"}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm">
                      <Wallet className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-semibold truncate">Semua Akun</span>
                  </div>
                  <p className="text-sm font-bold">{formatRupiah(totalBalance)}</p>
                </div>

                {accountBalances.map((account: any) => (
                  <div
                    key={account.id}
                    onClick={() => setSelectedAccountFilter(account.accountName)}
                    className={`rounded-xl p-3 cursor-pointer transition-all border-2 group relative ${selectedAccountFilter === account.accountName ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30" : "border-transparent bg-muted/30 hover:bg-muted/50"}`}
                  >
                    <div className="absolute top-1.5 right-1.5 flex gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); setEditAccount(account); }} className="h-6 w-6 sm:h-5 sm:w-5 rounded flex items-center justify-center bg-muted hover:bg-muted-foreground/20" title="Edit akun">
                        <Pencil className="h-3 w-3 sm:h-2.5 sm:w-2.5" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); if (confirm(`Hapus akun "${account.accountName}"? Semua data transaksi terkait tetap tersimpan.`)) deleteAccountMut.mutate({ id: account.id }); }} className="h-6 w-6 sm:h-5 sm:w-5 rounded flex items-center justify-center bg-muted hover:bg-red-100 dark:hover:bg-red-900/30" title="Hapus akun">
                        <Trash2 className="h-3 w-3 sm:h-2.5 sm:w-2.5 text-red-500" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-sm" style={{ backgroundColor: account.color }}>
                        <AccountIcon type={account.accountType} />
                      </div>
                      <span className="text-xs font-semibold truncate">{account.accountName}</span>
                    </div>
                    <p className={`text-sm font-bold ${account.currentBalance >= 0 ? "text-foreground" : "text-red-500"}`}>
                      {formatRupiah(account.currentBalance)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-emerald-600">+{formatRupiah(account.totalIncome)}</span>
                      <span className="text-[10px] text-rose-500">-{formatRupiah(account.totalExpense)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Month Navigator */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="flex items-center justify-center gap-4">
          <Button variant="ghost" size="sm" onClick={prevMonth} className="h-9 w-9 p-0 rounded-xl">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2 bg-card border rounded-xl px-5 py-2.5 shadow-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-bold text-lg">{BULAN_INDONESIA[selectedMonth - 1]} {selectedYear}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={nextMonth} className="h-9 w-9 p-0 rounded-xl">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
        {selectedAccountFilter !== "all" && (
          <div className="flex items-center justify-center mt-2">
            <Badge variant="secondary" className="gap-1.5 text-xs">
              Filter: {selectedAccountFilter}
              <button onClick={() => setSelectedAccountFilter("all")} className="ml-1 hover:text-red-500"><X className="h-3 w-3" /></button>
            </Badge>
          </div>
        )}
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="border-0 shadow-lg ring-1 ring-emerald-500/20 overflow-hidden">
            <CardContent className="p-0">
              <div className="h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500" />
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Pemasukan</p>
                    <p className="text-2xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400 mt-1">{formatRupiah(summary.pemasukan)}</p>
                  </div>
                  <div className="h-12 w-12 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg">
                    <PiggyBank className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-0 shadow-lg ring-1 ring-rose-500/20 overflow-hidden">
            <CardContent className="p-0">
              <div className="h-1.5 bg-gradient-to-r from-rose-400 to-pink-500" />
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Pengeluaran</p>
                    <p className="text-2xl font-extrabold tracking-tight text-rose-600 dark:text-rose-400 mt-1">{formatRupiah(summary.pengeluaran)}</p>
                  </div>
                  <div className="h-12 w-12 rounded-2xl bg-rose-500 flex items-center justify-center shadow-lg">
                    <CreditCard className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className={`border-0 shadow-lg ring-1 overflow-hidden ${summary.saldo >= 0 ? "ring-blue-500/20" : "ring-red-500/20"}`}>
            <CardContent className="p-0">
              <div className={`h-1.5 bg-gradient-to-r ${summary.saldo >= 0 ? "from-blue-500 to-indigo-600" : "from-red-400 to-rose-500"}`} />
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Saldo Bersih</p>
                    <p className={`text-2xl font-extrabold tracking-tight mt-1 ${summary.saldo >= 0 ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400"}`}>
                      {summary.saldo < 0 ? "-" : ""}{formatRupiah(Math.abs(summary.saldo))}
                    </p>
                  </div>
                  <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg ${summary.saldo >= 0 ? "bg-blue-600" : "bg-red-500"}`}>
                    <Wallet className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Daily Trend */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-0 shadow-lg ring-1 ring-primary/5 overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-emerald-400 via-blue-500 to-indigo-500" />
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold">Arus Kas Harian</CardTitle>
            </CardHeader>
            <CardContent>
              {dailyTrend.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <TrendingUp className="h-10 w-10 text-muted-foreground/20 mb-3" />
                  <p className="text-sm text-muted-foreground">Belum ada data bulan ini</p>
                </div>
              ) : (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyTrend}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                      <XAxis dataKey="day" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v: number) => v >= 1000000 ? `${(v / 1000000).toFixed(0)}jt` : v >= 1000 ? `${(v / 1000).toFixed(0)}rb` : `${v}`} />
                      <Tooltip formatter={(value: number, name: string) => [formatRupiah(value), name === "pemasukan" ? "Pemasukan" : "Pengeluaran"]} contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: "12px" }} />
                      <defs>
                        <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10B981" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#10B981" stopOpacity={0.05} />
                        </linearGradient>
                        <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#F43F5E" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#F43F5E" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="pemasukan" stroke="#10B981" strokeWidth={2} fill="url(#incGrad)" />
                      <Area type="monotone" dataKey="pengeluaran" stroke="#F43F5E" strokeWidth={2} fill="url(#expGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Category Pie Charts */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Card className="border-0 shadow-lg ring-1 ring-primary/5 overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-rose-400 via-pink-500 to-purple-500" />
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold">Breakdown Kategori</CardTitle>
            </CardHeader>
            <CardContent>
              {categoryBreakdown.expense.length === 0 && categoryBreakdown.income.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Filter className="h-10 w-10 text-muted-foreground/20 mb-3" />
                  <p className="text-sm text-muted-foreground">Belum ada data bulan ini</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-2 text-center">Pemasukan</p>
                    {categoryBreakdown.income.length > 0 ? (
                      <>
                        <div className="h-28">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart><Pie data={categoryBreakdown.income} cx="50%" cy="50%" innerRadius={25} outerRadius={45} dataKey="value" paddingAngle={3}>{categoryBreakdown.income.map((entry, index) => (<Cell key={index} fill={entry.color} />))}</Pie></PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="space-y-1 mt-2">
                          {categoryBreakdown.income.slice(0, 4).map((cat) => (
                            <div key={cat.name} className="flex items-center justify-between text-[11px]">
                              <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color }} /><span className="text-muted-foreground truncate">{cat.name}</span></div>
                              <span className="font-semibold">{formatRupiah(cat.value)}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (<p className="text-xs text-muted-foreground text-center py-6">Belum ada</p>)}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 mb-2 text-center">Pengeluaran</p>
                    {categoryBreakdown.expense.length > 0 ? (
                      <>
                        <div className="h-28">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart><Pie data={categoryBreakdown.expense} cx="50%" cy="50%" innerRadius={25} outerRadius={45} dataKey="value" paddingAngle={3}>{categoryBreakdown.expense.map((entry, index) => (<Cell key={index} fill={entry.color} />))}</Pie></PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="space-y-1 mt-2">
                          {categoryBreakdown.expense.slice(0, 4).map((cat) => (
                            <div key={cat.name} className="flex items-center justify-between text-[11px]">
                              <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color }} /><span className="text-muted-foreground truncate">{cat.name}</span></div>
                              <span className="font-semibold">{formatRupiah(cat.value)}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (<p className="text-xs text-muted-foreground text-center py-6">Belum ada</p>)}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Transaction List */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card className="border-0 shadow-lg ring-1 ring-primary/5 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-[#1E4D9B] via-[#2563EB] to-[#3B82F6]" />
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="text-base font-bold">Catatan Bulan Ini</CardTitle>
              <div className="flex items-center gap-1.5">
                <Button variant={filterType === "all" ? "default" : "outline"} size="sm" onClick={() => setFilterType("all")} className="text-xs h-7 rounded-lg">Semua</Button>
                <Button variant={filterType === "pemasukan" ? "default" : "outline"} size="sm" onClick={() => setFilterType("pemasukan")} className={`text-xs h-7 rounded-lg ${filterType === "pemasukan" ? "bg-emerald-600 hover:bg-emerald-700" : ""}`}>
                  <ArrowUpRight className="h-3 w-3 mr-1" /> Masuk
                </Button>
                <Button variant={filterType === "pengeluaran" ? "default" : "outline"} size="sm" onClick={() => setFilterType("pengeluaran")} className={`text-xs h-7 rounded-lg ${filterType === "pengeluaran" ? "bg-rose-600 hover:bg-rose-700" : ""}`}>
                  <ArrowDownRight className="h-3 w-3 mr-1" /> Keluar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">{[1, 2, 3, 4].map((i) => (<Skeleton key={i} className="h-14 rounded-xl" />))}</div>
            ) : filteredTx.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center mb-4 shadow-lg">
                  <BookOpen className="h-8 w-8 text-white" />
                </div>
                <p className="text-sm font-semibold">Jurnal masih kosong</p>
                <p className="text-xs text-muted-foreground mt-1 mb-4">Mulai catat pemasukan atau pengeluaran</p>
                <Button size="sm" onClick={() => setLocation("/transaksi?action=income")} className="gap-2 rounded-xl bg-gradient-to-r from-[#1E4D9B] to-[#2563EB] shadow-md">
                  <Plus className="h-4 w-4" /> Catat Sekarang
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTx.map((tx: any) => (
                  <div key={tx.id} className="flex items-center justify-between py-3 px-3 rounded-xl hover:bg-muted/30 transition-colors border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${tx.type === "pemasukan" ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-rose-100 dark:bg-rose-900/30"}`}>
                        {tx.type === "pemasukan" ? <ArrowUpRight className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> : <ArrowDownRight className="h-4 w-4 text-rose-600 dark:text-rose-400" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{tx.description || tx.category}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">{tx.date.split("-").reverse().join("/")}</span>
                          <Badge variant="secondary" className="text-[10px] h-4 px-1.5 rounded-md font-normal" style={{ borderLeft: `3px solid ${getCategoryColor(tx.category)}` }}>
                            {tx.category}
                          </Badge>
                          {tx.paymentMethod && (
                            <Badge variant="outline" className="text-[10px] h-4 px-1.5 rounded-md font-normal">
                              {tx.paymentMethod}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className={`text-sm font-bold ${tx.type === "pemasukan" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                      {tx.type === "pemasukan" ? "+" : "-"}{formatRupiah(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Add Account Dialog */}
      <Dialog open={showAddAccount} onOpenChange={setShowAddAccount}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Plus className="h-5 w-5" /> Tambah Akun Keuangan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Preset quick buttons */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Pilih cepat:</Label>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_ACCOUNTS.map(p => (
                  <Button key={p.name} variant="outline" size="sm" className="text-xs h-7 gap-1 rounded-lg" onClick={() => handlePresetClick(p)}>
                    {p.icon} {p.name}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-xs">Nama Akun</Label>
                <Input placeholder="contoh: BCA, GoPay, Cash" value={newAccount.accountName} onChange={e => setNewAccount({ ...newAccount, accountName: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Tipe</Label>
                <Select value={newAccount.accountType} onValueChange={(v: "bank" | "ewallet" | "cash") => setNewAccount({ ...newAccount, accountType: v, icon: ACCOUNT_ICONS[v].emoji })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank">🏦 Bank</SelectItem>
                    <SelectItem value="ewallet">📱 E-Wallet</SelectItem>
                    <SelectItem value="cash">💵 Cash</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Warna</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={newAccount.color} onChange={e => setNewAccount({ ...newAccount, color: e.target.value })} className="h-9 w-12 rounded-lg border cursor-pointer" />
                  <Input value={newAccount.color} onChange={e => setNewAccount({ ...newAccount, color: e.target.value })} className="flex-1 text-xs" />
                </div>
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Saldo Awal (Rp)</Label>
                <Input type="number" placeholder="0" value={newAccount.initialBalance || ""} onChange={e => setNewAccount({ ...newAccount, initialBalance: Number(e.target.value) || 0 })} />
              </div>
            </div>

            <Button className="w-full" disabled={!newAccount.accountName || createAccountMut.isPending} onClick={() => createAccountMut.mutate(newAccount)}>
              {createAccountMut.isPending ? "Menyimpan..." : "Tambah Akun"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Account Dialog */}
      <Dialog open={!!editAccount} onOpenChange={() => setEditAccount(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Pencil className="h-5 w-5" /> Edit Akun</DialogTitle>
          </DialogHeader>
          {editAccount && (
            <div className="space-y-4">
              <div>
                <Label className="text-xs">Nama Akun</Label>
                <Input value={editAccount.accountName} onChange={e => setEditAccount({ ...editAccount, accountName: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Tipe</Label>
                  <Select value={editAccount.accountType} onValueChange={(v: string) => setEditAccount({ ...editAccount, accountType: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank">🏦 Bank</SelectItem>
                      <SelectItem value="ewallet">📱 E-Wallet</SelectItem>
                      <SelectItem value="cash">💵 Cash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Warna</Label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={editAccount.color} onChange={e => setEditAccount({ ...editAccount, color: e.target.value })} className="h-9 w-12 rounded-lg border cursor-pointer" />
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-xs">Saldo Awal (Rp)</Label>
                <Input type="number" value={editAccount.initialBalance || ""} onChange={e => setEditAccount({ ...editAccount, initialBalance: Number(e.target.value) || 0 })} />
              </div>
              <Button className="w-full" disabled={updateAccountMut.isPending} onClick={() => updateAccountMut.mutate({ id: editAccount.id, accountName: editAccount.accountName, accountType: editAccount.accountType, color: editAccount.color, initialBalance: editAccount.initialBalance })}>
                {updateAccountMut.isPending ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
