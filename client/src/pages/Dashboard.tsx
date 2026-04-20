import { useState, useCallback, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp, TrendingDown, DollarSign, Receipt, Wallet, Calculator,
  Package, ArrowUpRight, ArrowDownRight, Camera, Plus, FileText, Sparkles,
  Brain, Lightbulb, RefreshCw, Loader2, AlertCircle, ShoppingBag,
  BookOpen, PiggyBank, CreditCard, Target
} from "lucide-react";
import { formatRupiah, formatTanggalIndonesia, BULAN_INDONESIA } from "../../../shared/finance";
import { useLocation } from "wouter";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { motion, AnimatePresence } from "framer-motion";

// ─── Shared Components ───

function KPICard({ title, value, icon: Icon, change, changeLabel, variant = "default", delay }: {
  title: string; value: string; icon: any; change?: number; changeLabel?: string; variant?: "default" | "success" | "danger" | "info"; delay: number;
}) {
  const isPositive = (change ?? 0) >= 0;
  const variantStyles = {
    default: "border-border/60",
    success: "border-success/20",
    danger: "border-danger/20",
    info: "border-info/20",
  };
  const iconStyles = {
    default: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    danger: "bg-danger/10 text-danger",
    info: "bg-info/10 text-info",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.06, duration: 0.4, ease: "easeOut" }}
    >
      <Card className={`border ${variantStyles[variant]} shadow-sm hover:shadow-md transition-all duration-200`}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
              <p className="text-2xl font-bold tracking-tight">{value}</p>
              {change !== undefined && (
                <div className="flex items-center gap-1.5">
                  <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-xs font-semibold ${
                    isPositive
                      ? "bg-success/10 text-success"
                      : "bg-danger/10 text-danger"
                  }`}>
                    {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {isPositive ? "+" : ""}{change.toFixed(1)}%
                  </span>
                  <span className="text-xs text-muted-foreground">{changeLabel}</span>
                </div>
              )}
            </div>
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${iconStyles[variant]}`}>
              <Icon className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function QuickActionButton({ icon: Icon, label, sublabel, onClick, variant = "default" }: {
  icon: any; label: string; sublabel: string; onClick: () => void; variant?: "success" | "danger" | "primary" | "warning" | "default";
}) {
  const iconBg = {
    success: "bg-success/10 text-success",
    danger: "bg-danger/10 text-danger",
    primary: "bg-primary/10 text-primary",
    warning: "bg-warning/10 text-warning",
    default: "bg-muted text-foreground",
  };

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3.5 transition-all hover:shadow-sm hover:border-border text-left group"
    >
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${iconBg[variant]} transition-colors`}>
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-sm">{label}</p>
        <p className="text-xs text-muted-foreground">{sublabel}</p>
      </div>
    </button>
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
    <Card className="border shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-4.5 w-4.5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">AI Ringkasan</p>
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
    A: { bg: "bg-success/10", text: "text-success" },
    B: { bg: "bg-info/10", text: "text-info" },
    C: { bg: "bg-warning/10", text: "text-warning" },
    D: { bg: "bg-county-orange/10", text: "text-county-orange" },
    F: { bg: "bg-danger/10", text: "text-danger" },
  };

  const scoreColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-info";
    if (score >= 40) return "text-warning";
    return "text-danger";
  };

  return (
    <Card className="border shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-warning/10 flex items-center justify-center">
              <Brain className="h-4.5 w-4.5 text-warning" />
            </div>
            <div>
              <p className="text-sm font-semibold">AI Health Score</p>
              <p className="text-xs text-muted-foreground">Skor kesehatan keuangan</p>
            </div>
          </div>
          {!data && !loading && (
            <Button size="sm" onClick={fetchScore} className="text-xs h-8 gap-1.5">
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
            <Loader2 className="h-5 w-5 animate-spin text-warning" />
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
                <p className={`text-4xl font-black ${scoreColor(data.score)}`}>{data.score}</p>
                <p className="text-xs text-muted-foreground">dari 100</p>
              </div>
              <div className={`px-3 py-1.5 rounded-lg text-sm font-bold ${gradeConfig[data.grade]?.bg || gradeConfig.C.bg} ${gradeConfig[data.grade]?.text || gradeConfig.C.text}`}>
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
                      <div className="bg-success/5 rounded-xl p-3">
                        <p className="text-xs font-bold text-success mb-1.5">Kekuatan:</p>
                        <ul className="space-y-1">
                          {data.strengths.map((s: string, i: number) => (
                            <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                              <span className="text-success mt-0.5 font-bold">+</span> {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {data.weaknesses?.length > 0 && (
                      <div className="bg-danger/5 rounded-xl p-3">
                        <p className="text-xs font-bold text-danger mb-1.5">Perlu Perhatian:</p>
                        <ul className="space-y-1">
                          {data.weaknesses.map((w: string, i: number) => (
                            <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                              <span className="text-danger mt-0.5 font-bold">-</span> {w}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {data.recommendations?.length > 0 && (
                      <div className="bg-info/5 rounded-xl p-3">
                        <p className="text-xs font-bold text-info mb-1.5">Rekomendasi:</p>
                        <ul className="space-y-1">
                          {data.recommendations.map((r: string, i: number) => (
                            <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                              <Lightbulb className="h-3 w-3 text-warning mt-0.5 shrink-0" /> {r}
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

// ─── Transaction Card (Trello-style) ───

function TransactionCard({ tx }: { tx: any }) {
  const isIncome = tx.type === "pemasukan";
  return (
    <div className="card-interactive flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
          isIncome ? "bg-success/10" : "bg-danger/10"
        }`}>
          {isIncome
            ? <ArrowUpRight className="h-4 w-4 text-success" />
            : <ArrowDownRight className="h-4 w-4 text-danger" />
          }
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{tx.description || tx.category}</p>
          <p className="text-xs text-muted-foreground">{tx.category}</p>
        </div>
      </div>
      <span className={`text-sm font-semibold shrink-0 ml-3 ${
        isIncome ? "text-success" : "text-danger"
      }`}>
        {isIncome ? "+" : "-"}{formatRupiah(tx.amount)}
      </span>
    </div>
  );
}

// Group transactions by date
function groupByDate(transactions: any[]) {
  const groups: Record<string, any[]> = {};
  transactions.forEach(tx => {
    const key = tx.date || "Tanpa tanggal";
    if (!groups[key]) groups[key] = [];
    groups[key].push(tx);
  });
  return Object.entries(groups);
}

// ─── Personal Dashboard (legacy — kept for UMKM personal KPIs if needed) ───

function PersonalDashboard() {
  const [, setLocation] = useLocation();
  const { data: business } = trpc.business.mine.useQuery(undefined, { retry: false });
  const { data: kpis, isLoading: kpisLoading } = trpc.report.dashboard.useQuery(undefined, { retry: false });
  const now = useMemo(() => new Date(), []);
  const { data: yearlyOmzet } = trpc.report.yearlyOmzet.useQuery({ year: now.getFullYear() }, { retry: false });
  const { data: recentTx } = trpc.transaction.list.useQuery({ limit: 8 }, { retry: false });

  const personalKpis = useMemo(() => [
    { key: "pemasukan", title: "Pemasukan Bulan Ini", icon: PiggyBank, variant: "success" as const },
    { key: "pengeluaran", title: "Pengeluaran Bulan Ini", icon: CreditCard, variant: "danger" as const },
    { key: "saldo", title: "Saldo Bersih", icon: Wallet, variant: "info" as const },
  ], []);

  const cashflowData = useMemo(() => {
    if (!yearlyOmzet) return [];
    return yearlyOmzet.map((val: number, idx: number) => ({
      month: BULAN_INDONESIA[idx].substring(0, 3),
      pemasukan: val,
    }));
  }, [yearlyOmzet]);

  const categoryData = useMemo(() => {
    if (!recentTx) return [];
    const cats: Record<string, number> = {};
    recentTx.forEach((tx: any) => {
      if (tx.type === "pengeluaran") {
        cats[tx.category] = (cats[tx.category] || 0) + tx.amount;
      }
    });
    const COLORS = [
      "oklch(0.38 0.15 250)", // county-blue
      "oklch(0.68 0.19 50)",  // county-orange
      "oklch(0.62 0.19 145)", // county-green
      "oklch(0.55 0.20 285)", // county-violet
      "oklch(0.55 0.16 200)", // chart-5 teal
      "oklch(0.75 0.16 75)",  // chart-4 yellow
    ];
    return Object.entries(cats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value], i) => ({ name, value, color: COLORS[i % COLORS.length] }));
  }, [recentTx]);

  const pctChange = (current: number, prev: number) => {
    if (prev === 0) return current > 0 ? 100 : 0;
    return ((current - prev) / prev) * 100;
  };

  if (kpisLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48 mb-2 rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (<Skeleton key={i} className="h-28 rounded-xl" />))}
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
            <h1 className="text-2xl font-bold tracking-tight">Jurnal Keuangan</h1>
            <p className="text-muted-foreground text-sm">{formatTanggalIndonesia(new Date())}</p>
          </div>
          <Badge variant="secondary" className="text-xs gap-1.5 w-fit">
            <BookOpen className="h-3 w-3" /> Mode Pribadi
          </Badge>
        </div>
      </motion.div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {personalKpis.map((cfg, i) => (
          <KPICard
            key={cfg.key}
            title={cfg.title}
            value={kpiValues[i].value}
            icon={cfg.icon}
            variant={cfg.variant}
            change={kpiValues[i].change}
            changeLabel={kpiValues[i].changeLabel}
            delay={i}
          />
        ))}
      </div>

      {/* Quick Actions */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickActionButton icon={Plus} label="Catat Pemasukan" sublabel="Tambah pendapatan" onClick={() => setLocation("/transaksi?action=income")} variant="success" />
          <QuickActionButton icon={Receipt} label="Catat Pengeluaran" sublabel="Tambah biaya" onClick={() => setLocation("/transaksi?action=expense")} variant="danger" />
          <QuickActionButton icon={Camera} label="Scan Struk" sublabel="AI baca otomatis" onClick={() => setLocation("/transaksi?action=scan")} variant="primary" />
          <QuickActionButton icon={BookOpen} label="Jurnal" sublabel="Lihat catatan" onClick={() => setLocation("/jurnal")} variant="default" />
        </div>
      </motion.div>

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
          <Card className="border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Arus Kas {now.getFullYear()}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cashflowData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.92 0 0)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v: number) => v >= 1000000 ? `${(v / 1000000).toFixed(0)}jt` : v >= 1000 ? `${(v / 1000).toFixed(0)}rb` : `${v}`} />
                    <Tooltip formatter={(value: number) => [formatRupiah(value), "Pemasukan"]} contentStyle={{ borderRadius: "12px", border: "1px solid oklch(0.91 0.008 250)", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} />
                    <defs>
                      <linearGradient id="areaGradientPersonal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="oklch(0.62 0.19 145)" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="oklch(0.62 0.19 145)" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="pemasukan" stroke="oklch(0.62 0.19 145)" strokeWidth={2} fill="url(#areaGradientPersonal)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Category Breakdown */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border shadow-sm h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Pengeluaran per Kategori</CardTitle>
            </CardHeader>
            <CardContent>
              {categoryData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mb-3">
                    <Target className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium">Belum ada data</p>
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
                        <Tooltip formatter={(value: number) => formatRupiah(value)} contentStyle={{ borderRadius: "12px", border: "1px solid oklch(0.91 0.008 250)", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: "12px" }} />
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

      {/* Recent Transactions — Card-based */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Catatan Terbaru</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setLocation("/transaksi")} className="text-xs text-primary gap-1 rounded-lg">
                Lihat Semua <ArrowUpRight className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!recentTx || recentTx.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="h-14 w-14 rounded-xl bg-muted flex items-center justify-center mb-3">
                  <BookOpen className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">Jurnal masih kosong</p>
                <p className="text-xs text-muted-foreground mt-1 mb-4">Mulai catat pemasukan atau pengeluaran pertama Anda</p>
                <Button size="sm" onClick={() => setLocation("/transaksi?action=income")} className="gap-2 rounded-lg">
                  <Plus className="h-4 w-4" /> Catat Pertama
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {groupByDate(recentTx).map(([date, txs]) => (
                  <div key={date}>
                    <p className="text-xs font-medium text-muted-foreground mb-2">{date}</p>
                    <div className="space-y-1.5">
                      {txs.map((tx: any) => <TransactionCard key={tx.id} tx={tx} />)}
                    </div>
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

// ─── UMKM Dashboard ───

function UMKMDashboard() {
  const [, setLocation] = useLocation();
  const { data: business } = trpc.business.mine.useQuery(undefined, { retry: false });
  const { data: kpis, isLoading: kpisLoading } = trpc.report.dashboard.useQuery(undefined, { retry: false });
  const now = useMemo(() => new Date(), []);
  const { data: yearlyOmzet } = trpc.report.yearlyOmzet.useQuery({ year: now.getFullYear() }, { retry: false });
  const { data: recentTx } = trpc.transaction.list.useQuery({ limit: 8 }, { retry: false });
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
    { key: "omzet", title: "Omzet Bulan Ini", icon: DollarSign, variant: "success" as const },
    { key: "pengeluaran", title: "Total Pengeluaran", icon: Receipt, variant: "danger" as const },
    { key: "laba", title: "Laba Bersih", icon: Wallet, variant: "info" as const },
    { key: "pajak", title: "Estimasi Pajak", icon: Calculator, variant: "default" as const },
  ];

  if (kpisLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48 mb-2 rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (<Skeleton key={i} className="h-28 rounded-xl" />))}
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
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground text-sm">{formatTanggalIndonesia(new Date())}</p>
          </div>
          <Badge variant="secondary" className="text-xs gap-1.5 w-fit">
            <Sparkles className="h-3 w-3" /> AI-Powered
          </Badge>
        </div>
      </motion.div>

      {/* KPI Strip */}
      <div data-onboarding="kpi-cards" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiConfigs.map((cfg, i) => (
          <KPICard
            key={cfg.key}
            title={cfg.title}
            value={kpiValues[i].value}
            icon={cfg.icon}
            variant={cfg.variant}
            change={kpiValues[i].change}
            changeLabel={kpiValues[i].changeLabel}
            delay={i}
          />
        ))}
      </div>

      {/* Quick Actions */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <div data-onboarding="quick-actions" className={`grid grid-cols-2 sm:grid-cols-3 ${posEnabled ? "lg:grid-cols-5" : "lg:grid-cols-4"} gap-3`}>
          <QuickActionButton icon={Plus} label="Catat Pemasukan" sublabel="Tambah pendapatan" onClick={() => setLocation("/transaksi?action=income")} variant="success" />
          <QuickActionButton icon={Receipt} label="Catat Pengeluaran" sublabel="Tambah biaya" onClick={() => setLocation("/transaksi?action=expense")} variant="danger" />
          <QuickActionButton icon={Camera} label="Scan Struk" sublabel="AI baca otomatis" onClick={() => setLocation("/transaksi?action=scan")} variant="primary" />
          <QuickActionButton icon={FileText} label="Lihat Laporan" sublabel="Laba rugi & arus kas" onClick={() => setLocation("/laporan")} variant="default" />
          {posEnabled && (
            <QuickActionButton icon={ShoppingBag} label="Kasir POS" sublabel="Penjualan langsung" onClick={() => setLocation("/pos")} variant="warning" />
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

      {/* Charts & Alerts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="lg:col-span-2">
          <Card className="border shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Omzet Bulanan {now.getFullYear()}</CardTitle>
                <Badge variant="secondary" className="text-xs gap-1">
                  <TrendingUp className="h-3 w-3" /> Trend
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
                    <Tooltip formatter={(value: number) => [formatRupiah(value), "Omzet"]} labelStyle={{ fontWeight: 600 }} contentStyle={{ borderRadius: "12px", border: "1px solid oklch(0.91 0.008 250)", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} />
                    <defs>
                      <linearGradient id="barGradientUmkm" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="oklch(0.38 0.15 250)" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="oklch(0.38 0.15 250)" stopOpacity={0.6} />
                      </linearGradient>
                    </defs>
                    <Bar dataKey="omzet" fill="url(#barGradientUmkm)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Low Stock Alerts */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Card className="border shadow-sm h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Stok Kritis</CardTitle>
                <Badge variant={lowStock && lowStock.length > 0 ? "destructive" : "secondary"} className="text-xs">
                  {lowStock?.length ?? 0}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {!lowStock || lowStock.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center mb-3">
                    <Package className="h-6 w-6 text-success" />
                  </div>
                  <p className="text-sm font-medium">Semua stok aman</p>
                  <p className="text-xs text-muted-foreground mt-1">Tidak ada produk di bawah batas minimum</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {lowStock.slice(0, 5).map((p: any) => {
                    const pct = p.stockMinimum > 0 ? Math.min((p.stockCurrent / p.stockMinimum) * 100, 100) : 0;
                    const barColor = p.stockCurrent === 0
                      ? "bg-danger"
                      : pct <= 50
                        ? "bg-warning"
                        : "bg-county-orange";
                    return (
                      <div key={p.id} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <span className="truncate font-medium">{p.name}</span>
                          <span className="text-muted-foreground text-xs font-medium">{p.stockCurrent}/{p.stockMinimum} {p.unit}</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${Math.max(pct, 5)}%` }} />
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

      {/* Recent Transactions — Card-based, grouped by date */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Transaksi Terbaru</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setLocation("/transaksi")} className="text-xs text-primary gap-1 rounded-lg">
                Lihat Semua <ArrowUpRight className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!recentTx || recentTx.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="h-14 w-14 rounded-xl bg-muted flex items-center justify-center mb-3">
                  <Receipt className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">Belum ada transaksi</p>
                <p className="text-xs text-muted-foreground mt-1 mb-4">Mulai catat transaksi pertama Anda</p>
                <Button size="sm" onClick={() => setLocation("/transaksi?action=income")} className="gap-2 rounded-lg">
                  <Plus className="h-4 w-4" /> Catat Transaksi Pertama
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {groupByDate(recentTx).map(([date, txs]) => (
                  <div key={date}>
                    <p className="text-xs font-medium text-muted-foreground mb-2">{date}</p>
                    <div className="space-y-1.5">
                      {txs.map((tx: any) => <TransactionCard key={tx.id} tx={tx} />)}
                    </div>
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

// ─── Main Dashboard Router ───

import OnboardingGuide from "@/components/OnboardingGuide";

export default function Dashboard() {
  const { data: business } = trpc.business.mine.useQuery(undefined, { retry: false });
  const appMode = business?.appMode ?? "umkm";

  useEffect(() => {
    document.title = "County — Aplikasi Akuntansi & Manajemen Bisnis UMKM";

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
