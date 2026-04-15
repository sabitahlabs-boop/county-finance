import { useState, useCallback, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp, TrendingDown, DollarSign, Receipt, Wallet, Calculator,
  Package, ArrowUpRight, ArrowDownRight, Camera, Plus, FileText, Sparkles,
  Brain, Lightbulb, RefreshCw, Crown, Loader2, AlertCircle, ShoppingBag,
  BookOpen, PiggyBank, CreditCard, Target
} from "lucide-react";
import { formatRupiah, formatTanggalIndonesia, BULAN_INDONESIA } from "../../../shared/finance";
import { useLocation } from "wouter";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { motion, AnimatePresence } from "framer-motion";

// ─── Shared Components ───

function KPICard({ title, value, icon: Icon, change, changeLabel, gradient, iconBg, ring, delay }: {
  title: string; value: string; icon: any; change?: number; changeLabel?: string; gradient: string; iconBg: string; ring: string; delay: number;
}) {
  const isPositive = (change ?? 0) >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: delay * 0.08, duration: 0.5, type: "spring" }}
    >
      <Card className={`overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 ring-1 ${ring}`}>
        <CardContent className="p-0">
          <div className={`h-1.5 bg-gradient-to-r ${gradient}`} />
          <div className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{title}</p>
                <p className="text-2xl font-extrabold tracking-tight">{value}</p>
                {change !== undefined && (
                  <div className="flex items-center gap-1.5">
                    <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-bold ${isPositive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                      {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {isPositive ? "+" : ""}{change.toFixed(1)}%
                    </div>
                    <span className="text-xs text-muted-foreground">{changeLabel}</span>
                  </div>
                )}
              </div>
              <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${iconBg} shadow-lg`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function QuickActionButton({ icon: Icon, label, sublabel, onClick, gradient }: {
  icon: any; label: string; sublabel: string; onClick: () => void; gradient: string; iconColor?: string;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="flex items-center gap-3 rounded-2xl border border-border/50 bg-card p-4 transition-all hover:shadow-md text-left group"
    >
      <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className="font-semibold text-sm">{label}</p>
        <p className="text-xs text-muted-foreground">{sublabel}</p>
      </div>
    </motion.button>
  );
}

// ─── AI Components ───

function AISummary({ businessId, businessName, appMode }: { businessId: number; businessName: string; appMode?: string }) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/dashboard-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, businessName, appMode }),
      });
      if (!res.ok) throw new Error("Gagal memuat ringkasan AI");
      const data = await res.json();
      setSummary(data.summary);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [businessId, businessName]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return (
    <Card className="border-0 shadow-lg ring-1 ring-blue-500/10 overflow-hidden hover:shadow-xl transition-all">
      <div className="h-1.5 bg-gradient-to-r from-[#1E4D9B] via-[#2563EB] to-[#3B82F6]" />
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#1E4D9B] to-[#2563EB] flex items-center justify-center shadow-md">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold">AI Ringkasan</p>
              <p className="text-xs text-muted-foreground">Analisis otomatis bulan ini</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchSummary} disabled={loading} className="h-8 w-8 p-0 rounded-lg">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
        {loading && !summary && (
          <div className="space-y-2.5">
            <Skeleton className="h-4 w-full rounded-lg" />
            <Skeleton className="h-4 w-4/5 rounded-lg" />
            <Skeleton className="h-4 w-3/5 rounded-lg" />
          </div>
        )}
        {error && !summary && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
            <AlertCircle className="h-4 w-4" />
            <span>Tidak dapat memuat ringkasan. Coba lagi nanti.</span>
          </div>
        )}
        {summary && (
          <p className="text-sm text-foreground/80 leading-relaxed">{summary}</p>
        )}
      </CardContent>
    </Card>
  );
}

function AIHealthScore({ businessId }: { businessId: number }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const fetchScore = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/health-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId }),
      });
      if (!res.ok) throw new Error("Failed");
      const result = await res.json();
      setData(result);
    } catch {
      // Silently fail — not critical
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  const gradeConfig: Record<string, { bg: string; text: string }> = {
    A: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400" },
    B: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400" },
    C: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400" },
    D: { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-400" },
    F: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400" },
  };

  const scoreColor = (score: number) => {
    if (score >= 80) return "from-emerald-400 to-teal-500";
    if (score >= 60) return "from-blue-400 to-indigo-500";
    if (score >= 40) return "from-amber-400 to-orange-500";
    return "from-red-400 to-rose-500";
  };

  return (
    <Card className="border-0 shadow-lg ring-1 ring-amber-500/10 overflow-hidden hover:shadow-xl transition-all">
      <div className="h-1.5 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500" />
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold">AI Health Score</p>
              <p className="text-xs text-muted-foreground">Skor kesehatan keuangan</p>
            </div>
          </div>
          {!data && !loading && (
            <Button size="sm" onClick={fetchScore} className="text-xs h-8 gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-sm">
              <Sparkles className="h-3 w-3" /> Analisis
            </Button>
          )}
          {data && (
            <Button variant="ghost" size="sm" onClick={fetchScore} disabled={loading} className="h-8 w-8 p-0 rounded-lg">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          )}
        </div>

        {loading && !data && (
          <div className="flex items-center gap-3 py-4">
            <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
            <span className="text-sm text-muted-foreground">AI sedang menganalisis keuangan Anda...</span>
          </div>
        )}

        {!data && !loading && (
          <div className="text-center py-6 bg-muted/30 rounded-xl">
            <Brain className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Klik "Analisis" untuk mendapatkan skor kesehatan keuangan dari AI</p>
          </div>
        )}

        {data && (
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className={`text-4xl font-black bg-gradient-to-br ${scoreColor(data.score)} bg-clip-text text-transparent`}>{data.score}</p>
                <p className="text-xs text-muted-foreground">dari 100</p>
              </div>
              <div className={`px-3 py-1.5 rounded-xl text-sm font-bold ${gradeConfig[data.grade]?.bg || gradeConfig.C.bg} ${gradeConfig[data.grade]?.text || gradeConfig.C.text}`}>
                Grade {data.grade}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-snug">{data.summary}</p>
              </div>
            </div>

            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-3 pt-2">
                    <div className="flex gap-2">
                      <Badge variant="secondary" className="text-xs rounded-lg">{data.cashFlowStatus}</Badge>
                      <Badge variant="secondary" className="text-xs rounded-lg">Laba: {data.profitTrend}</Badge>
                    </div>
                    {data.strengths?.length > 0 && (
                      <div className="bg-emerald-50/50 dark:bg-emerald-900/10 rounded-xl p-3">
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1.5">Kekuatan:</p>
                        <ul className="space-y-1">
                          {data.strengths.map((s: string, i: number) => (
                            <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                              <span className="text-emerald-500 mt-0.5 font-bold">+</span> {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {data.weaknesses?.length > 0 && (
                      <div className="bg-red-50/50 dark:bg-red-900/10 rounded-xl p-3">
                        <p className="text-xs font-bold text-red-600 dark:text-red-400 mb-1.5">Perlu Perhatian:</p>
                        <ul className="space-y-1">
                          {data.weaknesses.map((w: string, i: number) => (
                            <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                              <span className="text-red-500 mt-0.5 font-bold">-</span> {w}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {data.recommendations?.length > 0 && (
                      <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-xl p-3">
                        <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-1.5">Rekomendasi:</p>
                        <ul className="space-y-1">
                          {data.recommendations.map((r: string, i: number) => (
                            <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                              <Lightbulb className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" /> {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)} className="w-full text-xs h-8 rounded-lg">
              {expanded ? "Sembunyikan Detail" : "Lihat Detail Analisis"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Personal Dashboard ───

import PersonalSetupWizard from "@/components/PersonalSetupWizard";

function PersonalDashboard() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const { data: business } = trpc.business.mine.useQuery(undefined, { retry: false });
  const { data: kpis, isLoading: kpisLoading } = trpc.report.dashboard.useQuery(undefined, { retry: false });
  const [setupDone, setSetupDone] = useState(false);
  const now = useMemo(() => new Date(), []);
  const { data: yearlyOmzet } = trpc.report.yearlyOmzet.useQuery({ year: now.getFullYear() }, { retry: false });
  const { data: recentTx } = trpc.transaction.list.useQuery({ limit: 8 }, { retry: false });

  // ALL hooks must be called before any conditional return (React Rules of Hooks)
  const personalKpis = useMemo(() => [
    { key: "pemasukan", title: "Pemasukan Bulan Ini", icon: PiggyBank, gradient: "from-emerald-400 to-teal-500", iconBg: "bg-emerald-500", ring: "ring-emerald-500/20" },
    { key: "pengeluaran", title: "Pengeluaran Bulan Ini", icon: CreditCard, gradient: "from-rose-400 to-pink-500", iconBg: "bg-rose-500", ring: "ring-rose-500/20" },
    { key: "saldo", title: "Saldo Bersih", icon: Wallet, gradient: "from-blue-500 to-indigo-600", iconBg: "bg-blue-600", ring: "ring-blue-500/20" },
  ], []);

  // Cashflow trend data
  const cashflowData = useMemo(() => {
    if (!yearlyOmzet) return [];
    return yearlyOmzet.map((val: number, idx: number) => ({
      month: BULAN_INDONESIA[idx].substring(0, 3),
      pemasukan: val,
    }));
  }, [yearlyOmzet]);

  // Category breakdown from recent transactions
  const categoryData = useMemo(() => {
    if (!recentTx) return [];
    const cats: Record<string, number> = {};
    recentTx.forEach((tx: any) => {
      if (tx.type === "pengeluaran") {
        cats[tx.category] = (cats[tx.category] || 0) + tx.amount;
      }
    });
    const COLORS = ["#1E4D9B", "#F47920", "#4CAF50", "#E91E63", "#9C27B0", "#00BCD4", "#FF9800", "#607D8B"];
    return Object.entries(cats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value], i) => ({ name, value, color: COLORS[i % COLORS.length] }));
  }, [recentTx]);

  // Show setup wizard for first-time personal mode users
  const showSetupWizard = business && !business.personalSetupDone && !setupDone;

  if (showSetupWizard) {
    return (
      <PersonalSetupWizard onComplete={() => {
        setSetupDone(true);
        utils.business.mine.invalidate();
      }} />
    );
  }

  const pctChange = (current: number, prev: number) => {
    if (prev === 0) return current > 0 ? 100 : 0;
    return ((current - prev) / prev) * 100;
  };

  if (kpisLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48 mb-2 rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (<Skeleton key={i} className="h-36 rounded-2xl" />))}
        </div>
      </div>
    );
  }

  const kpiValues = [
    { value: formatRupiah(kpis?.omzetBulanIni ?? 0), change: pctChange(kpis?.omzetBulanIni ?? 0, kpis?.omzetLastMonth ?? 0), changeLabel: "vs bulan lalu" },
    { value: formatRupiah(kpis?.totalPengeluaran ?? 0), change: pctChange(kpis?.totalPengeluaran ?? 0, kpis?.pengeluaranLastMonth ?? 0), changeLabel: "vs bulan lalu" },
    { value: formatRupiah(kpis?.labaBersih ?? 0), change: pctChange(kpis?.labaBersih ?? 0, kpis?.labaLastMonth ?? 0), changeLabel: "vs bulan lalu" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Jurnal Keuangan</h1>
            <p className="text-muted-foreground text-sm">{formatTanggalIndonesia(new Date())}</p>
          </div>
          <Badge className="text-xs gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0 shadow-sm w-fit">
            <BookOpen className="h-3 w-3" /> Mode Pribadi
          </Badge>
        </div>
      </motion.div>

      {/* Quick Actions — simplified for personal */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickActionButton
            icon={Plus}
            label="Catat Pemasukan"
            sublabel="Tambah pendapatan"
            onClick={() => setLocation("/transaksi?action=income")}
            gradient="from-emerald-400 to-teal-500"
          />
          <QuickActionButton
            icon={Receipt}
            label="Catat Pengeluaran"
            sublabel="Tambah biaya"
            onClick={() => setLocation("/transaksi?action=expense")}
            gradient="from-rose-400 to-pink-500"
          />
          <QuickActionButton
            icon={Camera}
            label="Scan Struk"
            sublabel="AI baca otomatis"
            onClick={() => setLocation("/transaksi?action=scan")}
            gradient="from-blue-500 to-indigo-600"
          />
          <QuickActionButton
            icon={BookOpen}
            label="Jurnal"
            sublabel="Lihat catatan"
            onClick={() => setLocation("/jurnal")}
            gradient="from-emerald-500 to-teal-600"
          />
        </div>
      </motion.div>

      {/* KPI Cards — 3 cards for personal */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {personalKpis.map((cfg, i) => (
          <KPICard
            key={cfg.key}
            title={cfg.title}
            value={kpiValues[i].value}
            icon={cfg.icon}
            gradient={cfg.gradient}
            iconBg={cfg.iconBg}
            ring={cfg.ring}
            change={kpiValues[i].change}
            changeLabel={kpiValues[i].changeLabel}
            delay={i}
          />
        ))}
      </div>

      {/* AI Summary */}
      {business && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <AISummary businessId={business.id} businessName={business.businessName} appMode="personal" />
        </motion.div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Cashflow Trend */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2">
          <Card className="border-0 shadow-lg ring-1 ring-primary/5 overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500" />
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold">Arus Kas {now.getFullYear()}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cashflowData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.92 0 0)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v: number) => v >= 1000000 ? `${(v / 1000000).toFixed(0)}jt` : v >= 1000 ? `${(v / 1000).toFixed(0)}rb` : `${v}`} />
                    <Tooltip formatter={(value: number) => [formatRupiah(value), "Pemasukan"]} contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }} />
                    <defs>
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10B981" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#10B981" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="pemasukan" stroke="#10B981" strokeWidth={2.5} fill="url(#areaGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Category Breakdown */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-0 shadow-lg ring-1 ring-rose-500/10 h-full overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-rose-400 to-pink-500" />
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold">Pengeluaran per Kategori</CardTitle>
            </CardHeader>
            <CardContent>
              {categoryData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center mb-3 shadow-lg">
                    <Target className="h-7 w-7 text-white" />
                  </div>
                  <p className="text-sm font-semibold">Belum ada data</p>
                  <p className="text-xs text-muted-foreground mt-1">Catat pengeluaran untuk melihat breakdown</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="h-32 flex justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={categoryData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value" paddingAngle={3}>
                          {categoryData.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatRupiah(value)} contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: "12px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-1.5">
                    {categoryData.map((cat) => (
                      <div key={cat.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                          <span className="text-muted-foreground">{cat.name}</span>
                        </div>
                        <span className="font-semibold">{formatRupiah(cat.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Transactions */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card className="border-0 shadow-lg ring-1 ring-primary/5 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-[#1E4D9B] via-[#2563EB] to-[#3B82F6]" />
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold">Catatan Terbaru</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setLocation("/transaksi")} className="text-xs text-primary gap-1 rounded-lg">
                Lihat Semua <ArrowUpRight className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!recentTx || recentTx.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center mb-4 shadow-lg">
                  <BookOpen className="h-8 w-8 text-white" />
                </div>
                <p className="text-sm font-semibold">Jurnal masih kosong</p>
                <p className="text-xs text-muted-foreground mt-1 mb-4">Mulai catat pemasukan atau pengeluaran pertama Anda</p>
                <Button size="sm" onClick={() => setLocation("/transaksi?action=income")} className="gap-2 rounded-xl bg-gradient-to-r from-[#1E4D9B] to-[#2563EB] shadow-md">
                  <Plus className="h-4 w-4" /> Catat Pertama
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {recentTx.map((tx: any) => (
                  <div key={tx.id} className="flex items-center justify-between py-2.5 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${tx.type === "pemasukan" ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-rose-100 dark:bg-rose-900/30"}`}>
                        {tx.type === "pemasukan" ? <ArrowUpRight className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> : <ArrowDownRight className="h-4 w-4 text-rose-600 dark:text-rose-400" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{tx.description || tx.category}</p>
                        <p className="text-xs text-muted-foreground">{tx.date}</p>
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
    </div>
  );
}

// ─── UMKM Dashboard (original) ───

function UMKMDashboard() {
  const [, setLocation] = useLocation();
  const { data: business } = trpc.business.mine.useQuery(undefined, { retry: false });
  const { data: kpis, isLoading: kpisLoading } = trpc.report.dashboard.useQuery(undefined, { retry: false });
  const now = useMemo(() => new Date(), []);
  const { data: yearlyOmzet } = trpc.report.yearlyOmzet.useQuery({ year: now.getFullYear() }, { retry: false });
  const { data: recentTx } = trpc.transaction.list.useQuery({ limit: 5 }, { retry: false });
  const { data: lowStock } = trpc.product.lowStock.useQuery(undefined, { retry: false });

  const posEnabled = business?.posEnabled ?? false;

  const chartData = useMemo(() => {
    if (!yearlyOmzet) return [];
    return yearlyOmzet.map((val: number, idx: number) => ({
      month: BULAN_INDONESIA[idx].substring(0, 3),
      omzet: val,
    }));
  }, [yearlyOmzet]);

  const pctChange = (current: number, prev: number) => {
    if (prev === 0) return current > 0 ? 100 : 0;
    return ((current - prev) / prev) * 100;
  };

  const kpiConfigs = [
    { key: "omzet", title: "Omzet Bulan Ini", icon: DollarSign, gradient: "from-emerald-400 to-teal-500", iconBg: "bg-emerald-500", ring: "ring-emerald-500/20" },
    { key: "pengeluaran", title: "Total Pengeluaran", icon: Receipt, gradient: "from-rose-400 to-pink-500", iconBg: "bg-rose-500", ring: "ring-rose-500/20" },
    { key: "laba", title: "Laba Bersih", icon: Wallet, gradient: "from-blue-500 to-indigo-600", iconBg: "bg-blue-600", ring: "ring-blue-500/20" },
    { key: "pajak", title: "Estimasi Pajak", icon: Calculator, gradient: "from-blue-400 to-indigo-500", iconBg: "bg-blue-500", ring: "ring-blue-500/20" },
  ];

  if (kpisLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48 mb-2 rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (<Skeleton key={i} className="h-36 rounded-2xl" />))}
        </div>
      </div>
    );
  }

  const kpiValues = [
    { value: formatRupiah(kpis?.omzetBulanIni ?? 0), change: pctChange(kpis?.omzetBulanIni ?? 0, kpis?.omzetLastMonth ?? 0), changeLabel: "vs bulan lalu" },
    { value: formatRupiah(kpis?.totalPengeluaran ?? 0), change: pctChange(kpis?.totalPengeluaran ?? 0, kpis?.pengeluaranLastMonth ?? 0), changeLabel: "vs bulan lalu" },
    { value: formatRupiah(kpis?.labaBersih ?? 0), change: pctChange(kpis?.labaBersih ?? 0, kpis?.labaLastMonth ?? 0), changeLabel: "vs bulan lalu" },
    { value: formatRupiah(kpis?.estimasiPajak ?? 0) },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div data-onboarding="dashboard-title">
            <h1 className="text-2xl font-extrabold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground text-sm">{formatTanggalIndonesia(new Date())}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="text-xs gap-1.5 bg-gradient-to-r from-[#1E4D9B] to-[#2563EB] text-white border-0 shadow-sm">
              <Sparkles className="h-3 w-3" /> AI-Powered
            </Badge>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <div data-onboarding="quick-actions" className={`grid grid-cols-2 sm:grid-cols-3 ${posEnabled ? "lg:grid-cols-5" : "lg:grid-cols-4"} gap-3`}>
          <QuickActionButton icon={Plus} label="Catat Pemasukan" sublabel="Tambah pendapatan" onClick={() => setLocation("/transaksi?action=income")} gradient="from-emerald-400 to-teal-500" />
          <QuickActionButton icon={Receipt} label="Catat Pengeluaran" sublabel="Tambah biaya" onClick={() => setLocation("/transaksi?action=expense")} gradient="from-rose-400 to-pink-500" />
          <QuickActionButton icon={Camera} label="Scan Struk" sublabel="AI baca otomatis" onClick={() => setLocation("/transaksi?action=scan")} gradient="from-blue-500 to-indigo-600" />
          <QuickActionButton icon={FileText} label="Lihat Laporan" sublabel="Laba rugi & arus kas" onClick={() => setLocation("/laporan")} gradient="from-blue-400 to-indigo-500" />
          {posEnabled && (
            <QuickActionButton icon={ShoppingBag} label="Kasir POS" sublabel="Penjualan langsung" onClick={() => setLocation("/pos")} gradient="from-amber-400 to-orange-500" />
          )}
        </div>
      </motion.div>

      {/* AI Summary + Health Score Row */}
      {business && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div data-onboarding="ai-summary" className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AISummary businessId={business.id} businessName={business.businessName} appMode="umkm" />
            <AIHealthScore businessId={business.id} />
          </div>
        </motion.div>
      )}

      {/* KPI Cards */}
      <div data-onboarding="kpi-cards" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiConfigs.map((cfg, i) => (
          <KPICard
            key={cfg.key}
            title={cfg.title}
            value={kpiValues[i].value}
            icon={cfg.icon}
            gradient={cfg.gradient}
            iconBg={cfg.iconBg}
            ring={cfg.ring}
            change={kpiValues[i].change}
            changeLabel={kpiValues[i].changeLabel}
            delay={i}
          />
        ))}
      </div>

      {/* Charts & Alerts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="lg:col-span-2">
          <Card className="border-0 shadow-lg ring-1 ring-primary/5 overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500" />
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold">Omzet Bulanan {now.getFullYear()}</CardTitle>
                <Badge className="text-xs bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0">
                  <TrendingUp className="h-3 w-3 mr-1" /> Trend
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.92 0 0)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v: number) => v >= 1000000 ? `${(v / 1000000).toFixed(0)}jt` : v >= 1000 ? `${(v / 1000).toFixed(0)}rb` : `${v}`} />
                    <Tooltip formatter={(value: number) => [formatRupiah(value), "Omzet"]} labelStyle={{ fontWeight: 600 }} contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }} />
                    <Bar dataKey="omzet" fill="url(#barGradientUmkm)" radius={[8, 8, 0, 0]} />
                    <defs>
                      <linearGradient id="barGradientUmkm" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="oklch(0.65 0.20 270)" />
                        <stop offset="100%" stopColor="oklch(0.55 0.18 300)" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Low Stock Alerts */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Card className="border-0 shadow-lg ring-1 ring-rose-500/10 h-full overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-rose-400 to-pink-500" />
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold">Stok Kritis</CardTitle>
                <Badge className={`text-xs border-0 ${lowStock && lowStock.length > 0 ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"}`}>
                  {lowStock?.length ?? 0}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {!lowStock || lowStock.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mb-3 shadow-lg">
                    <Package className="h-7 w-7 text-white" />
                  </div>
                  <p className="text-sm font-semibold">Semua stok aman</p>
                  <p className="text-xs text-muted-foreground mt-1">Tidak ada produk di bawah batas minimum</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {lowStock.slice(0, 5).map((p: any) => {
                    const pct = p.stockMinimum > 0 ? Math.min((p.stockCurrent / p.stockMinimum) * 100, 100) : 0;
                    const gradient = p.stockCurrent === 0 ? "from-red-500 to-rose-500" : pct <= 50 ? "from-orange-400 to-amber-500" : "from-yellow-400 to-amber-400";
                    return (
                      <div key={p.id} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <span className="truncate font-medium">{p.name}</span>
                          <span className="text-muted-foreground text-xs font-semibold">{p.stockCurrent}/{p.stockMinimum} {p.unit}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all bg-gradient-to-r ${gradient}`} style={{ width: `${Math.max(pct, 5)}%` }} />
                        </div>
                      </div>
                    );
                  })}
                  {lowStock.length > 5 && (
                    <Button variant="ghost" size="sm" onClick={() => setLocation("/stok")} className="w-full text-xs rounded-lg">
                      Lihat semua ({lowStock.length})
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Transactions */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card className="border-0 shadow-lg ring-1 ring-primary/5 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-[#1E4D9B] via-[#2563EB] to-[#3B82F6]" />
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold">Transaksi Terbaru</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setLocation("/transaksi")} className="text-xs text-primary gap-1 rounded-lg">
                Lihat Semua <ArrowUpRight className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!recentTx || recentTx.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center mb-4 shadow-lg">
                  <Receipt className="h-8 w-8 text-white" />
                </div>
                <p className="text-sm font-semibold">Belum ada transaksi</p>
                <p className="text-xs text-muted-foreground mt-1 mb-4">Mulai catat transaksi pertama Anda</p>
                <Button size="sm" onClick={() => setLocation("/transaksi?action=income")} className="gap-2 rounded-xl bg-gradient-to-r from-[#1E4D9B] to-[#2563EB] shadow-md">
                  <Plus className="h-4 w-4" /> Catat Transaksi Pertama
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Tanggal</th>
                      <th className="text-left py-2.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Keterangan</th>
                      <th className="text-left py-2.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Kategori</th>
                      <th className="text-right py-2.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Jumlah</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTx.map((tx: any) => (
                      <tr key={tx.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="py-3 text-muted-foreground text-xs">{tx.date}</td>
                        <td className="py-3 font-medium">{tx.description || tx.category}</td>
                        <td className="py-3"><Badge variant="secondary" className="text-xs font-normal rounded-lg">{tx.category}</Badge></td>
                        <td className={`py-3 text-right font-bold ${tx.type === "pemasukan" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                          {tx.type === "pemasukan" ? "+" : "-"}{formatRupiah(tx.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

// ─── Main Dashboard Router ───

import OnboardingGuide from "@/components/OnboardingGuide";

export default function Dashboard() {
  const { data: business } = trpc.business.mine.useQuery(undefined, { retry: false });
  const appMode = business?.appMode ?? "umkm";

  useEffect(() => {
    document.title = "County — Aplikasi Akuntansi & Manajemen Bisnis UMKM";

    // Set meta keywords
    let metaKeywords = document.querySelector('meta[name="keywords"]') as HTMLMetaElement | null;
    if (!metaKeywords) {
      metaKeywords = document.createElement("meta");
      metaKeywords.name = "keywords";
      document.head.appendChild(metaKeywords);
    }
    metaKeywords.content = "akuntansi, UMKM, manajemen bisnis, pembukuan, keuangan, POS, kasir, stok, gudang, laporan keuangan, pajak, invoice, Indonesia, aplikasi bisnis, pencatatan keuangan";
  }, []);

  return (
    <>
      {appMode === "personal" ? <PersonalDashboard /> : <UMKMDashboard />}
      <OnboardingGuide mode={appMode} />
    </>
  );
}
