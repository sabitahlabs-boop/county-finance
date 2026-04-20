import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Home, Lightbulb, TrendingUp, Wallet, PiggyBank,
  Shield, Target, ArrowUpRight, ArrowDownRight,
  CircleDollarSign, ChevronRight, BarChart3, Heart,
  Car, GraduationCap, Plane, Building2, Sparkles,
} from "lucide-react";
import { formatRupiah } from "../../../shared/finance";
import { motion } from "framer-motion";
import { useLocation } from "wouter";

// ─── Goal Icons Map ───
const GOAL_ICONS: Record<string, { icon: typeof Shield; color: string }> = {
  dana_darurat: { icon: Shield, color: "#EF4444" },
  dana_pensiun: { icon: Heart, color: "#F59E0B" },
  investasi: { icon: TrendingUp, color: "#10B981" },
  rumah: { icon: Building2, color: "#3B82F6" },
  kendaraan: { icon: Car, color: "#8B5CF6" },
  pendidikan: { icon: GraduationCap, color: "#0EA5E9" },
  liburan: { icon: Plane, color: "#EC4899" },
  lainnya: { icon: Target, color: "#6B7280" },
};

// ─── Financial Ratio Labels ───
const RATIO_CONFIG = [
  { key: "liquidity", label: "Dana Darurat", desc: "Target: 6x pengeluaran bulanan", ideal: 1, icon: Shield, color: "#EF4444" },
  { key: "savingsRate", label: "Rasio Tabungan", desc: "Target: ≥ 20% penghasilan", ideal: 0.2, icon: PiggyBank, color: "#10B981" },
  { key: "debtRatio", label: "Rasio Hutang", desc: "Target: ≤ 30% penghasilan", ideal: 0.3, icon: Wallet, color: "#F97316", inverted: true },
  { key: "insuranceCoverage", label: "Proteksi Asuransi", desc: "Target: 10x penghasilan tahunan", ideal: 10, icon: Heart, color: "#6366F1" },
  { key: "investmentRatio", label: "Rasio Investasi", desc: "Target: ≥ 5x penghasilan tahunan", ideal: 5, icon: TrendingUp, color: "#8B5CF6" },
];

function getRatioScore(value: number, ideal: number, inverted?: boolean): { percentage: number; status: string; color: string } {
  if (inverted) {
    // For debt ratio: lower is better
    const pct = ideal > 0 ? Math.min(100, Math.round(((ideal - Math.min(value, ideal)) / ideal) * 100)) : 0;
    return {
      percentage: pct,
      status: value <= ideal * 0.5 ? "Sangat Baik" : value <= ideal ? "Aman" : "Perlu Perhatian",
      color: value <= ideal * 0.5 ? "#10B981" : value <= ideal ? "#F59E0B" : "#EF4444",
    };
  }
  const pct = ideal > 0 ? Math.min(100, Math.round((value / ideal) * 100)) : 0;
  return {
    percentage: pct,
    status: pct >= 100 ? "Sangat Baik" : pct >= 50 ? "Cukup Baik" : "Perlu Ditingkatkan",
    color: pct >= 100 ? "#10B981" : pct >= 50 ? "#F59E0B" : "#EF4444",
  };
}

// ─── Bottom Nav Item ───
function BottomNavItem({ icon: Icon, label, active, onClick }: { icon: typeof Home; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl transition-all ${active ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground hover:text-foreground"}`}
    >
      <Icon className={`h-5 w-5 ${active ? "scale-110" : ""} transition-transform`} />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}

export default function PersonalDashboard() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("home");

  const { data: dashboard, isLoading } = trpc.personalFinance.getDashboard.useQuery(undefined, { retry: false });

  if (isLoading) {
    return (
      <div className="space-y-4 pb-20">
        <Skeleton className="h-32 rounded-2xl" />
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  if (!dashboard) return null;

  const { totalAssets, totalLiabilities, netWorth, totalIncome, totalExpenses, cashflow, goals, financialRatios, profile } = dashboard;
  const overallScore = Math.round(
    (RATIO_CONFIG.reduce((sum, r) => {
      const v = (financialRatios as any)[r.key] || 0;
      return sum + getRatioScore(v, r.ideal, r.inverted).percentage;
    }, 0)) / RATIO_CONFIG.length
  );

  return (
    <div className="space-y-5 pb-24">
      {/* ─── Greeting ─── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              Hi, {(profile as any)?.fullName || "Pengguna"}!
            </h1>
            <p className="text-sm text-muted-foreground">Ringkasan keuangan Anda hari ini</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg">
            <CircleDollarSign className="h-6 w-6 text-white" />
          </div>
        </div>
      </motion.div>

      {/* ─── Net Worth Card ─── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card className="border-0 shadow-xl ring-1 ring-black/5 dark:ring-white/10 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500" />
          <CardContent className="p-5">
            <div className="text-center">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Kekayaan Bersih</p>
              <p className={`text-3xl font-extrabold mt-1 ${netWorth >= 0 ? "text-foreground" : "text-red-500"}`}>
                {formatRupiah(netWorth)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Total Aset</p>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                  <ArrowUpRight className="h-3.5 w-3.5" /> {formatRupiah(totalAssets)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Total Liabilitas</p>
                <p className="text-sm font-bold text-rose-600 dark:text-rose-400 flex items-center justify-center gap-1">
                  <ArrowDownRight className="h-3.5 w-3.5" /> {formatRupiah(totalLiabilities)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Cashflow Summary ─── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-0 shadow-md ring-1 ring-emerald-500/10 overflow-hidden">
            <div className="h-1 bg-emerald-500" />
            <CardContent className="p-3 text-center">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase">Pemasukan</p>
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1">{formatRupiah(totalIncome)}</p>
              <p className="text-[10px] text-muted-foreground">/bulan</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md ring-1 ring-rose-500/10 overflow-hidden">
            <div className="h-1 bg-rose-500" />
            <CardContent className="p-3 text-center">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase">Pengeluaran</p>
              <p className="text-sm font-bold text-rose-600 dark:text-rose-400 mt-1">{formatRupiah(totalExpenses)}</p>
              <p className="text-[10px] text-muted-foreground">/bulan</p>
            </CardContent>
          </Card>
          <Card className={`border-0 shadow-md ring-1 overflow-hidden ${cashflow >= 0 ? "ring-blue-500/10" : "ring-red-500/10"}`}>
            <div className={`h-1 ${cashflow >= 0 ? "bg-blue-500" : "bg-red-500"}`} />
            <CardContent className="p-3 text-center">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase">Arus Kas</p>
              <p className={`text-sm font-bold mt-1 ${cashflow >= 0 ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400"}`}>
                {cashflow >= 0 ? "+" : ""}{formatRupiah(cashflow)}
              </p>
              <p className="text-[10px] text-muted-foreground">/bulan</p>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* ─── Financial Health Score ─── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card className="border-0 shadow-lg ring-1 ring-black/5 dark:ring-white/10 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500" />
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-teal-500" /> Kesehatan Keuangan
              </CardTitle>
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-extrabold" style={{ color: overallScore >= 70 ? "#10B981" : overallScore >= 40 ? "#F59E0B" : "#EF4444" }}>
                  {overallScore}
                </span>
                <span className="text-xs text-muted-foreground">/100</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {RATIO_CONFIG.map(r => {
              const value = (financialRatios as any)[r.key] || 0;
              const score = getRatioScore(value, r.ideal, r.inverted);
              return (
                <div key={r.key} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <r.icon className="h-3.5 w-3.5" style={{ color: r.color }} />
                      <span className="text-xs font-medium">{r.label}</span>
                    </div>
                    <Badge variant="secondary" className="text-[10px] h-5" style={{ color: score.color, borderColor: score.color + "40" }}>
                      {score.status}
                    </Badge>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${score.percentage}%`, backgroundColor: score.color }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground">{r.desc}</p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Financial Goals ─── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="border-0 shadow-lg ring-1 ring-black/5 dark:ring-white/10 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400" />
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Target className="h-4 w-4 text-amber-500" /> Target Keuangan
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs h-7 gap-1" onClick={() => setLocation("/pf-goals")}>
                Lihat Semua <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {goals.length === 0 ? (
              <div className="text-center py-8">
                <Target className="h-10 w-10 mx-auto mb-3 text-muted-foreground/20" />
                <p className="text-sm text-muted-foreground">Belum ada target keuangan</p>
                <Button variant="outline" size="sm" className="mt-3 gap-2 rounded-xl" onClick={() => setLocation("/pf-goals")}>
                  <Sparkles className="h-4 w-4" /> Tambah Target
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {goals.map((goal: any) => {
                  const goalConfig = GOAL_ICONS[goal.goalType] || GOAL_ICONS.lainnya;
                  const GoalIcon = goalConfig.icon;
                  return (
                    <div key={goal.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer">
                      <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: goalConfig.color + "15" }}>
                        <GoalIcon className="h-5 w-5" style={{ color: goalConfig.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-semibold truncate">{goal.name}</p>
                          <span className="text-xs font-bold" style={{ color: goalConfig.color }}>{goal.progress}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${goal.progress}%`, backgroundColor: goalConfig.color }} />
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[10px] text-muted-foreground">{formatRupiah(goal.currentAmount)}</span>
                          <span className="text-[10px] text-muted-foreground">Target: {formatRupiah(goal.targetAmount)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Quick Tips ─── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <Card className="border-0 shadow-md ring-1 ring-amber-500/10 overflow-hidden">
          <div className="h-1 bg-amber-400" />
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                <Lightbulb className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">Tips Keuangan</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {overallScore >= 70
                    ? "Keuangan Anda dalam kondisi baik! Pertahankan kebiasaan menabung dan berinvestasi."
                    : overallScore >= 40
                    ? "Fokus tingkatkan dana darurat ke 6x pengeluaran bulanan dan mulai berinvestasi minimal 10% penghasilan."
                    : "Prioritaskan membangun dana darurat dan kurangi rasio hutang di bawah 30% penghasilan."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Bottom Navigation ─── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-t">
        <div className="max-w-lg mx-auto flex items-center justify-around py-1 px-2">
          <BottomNavItem icon={Home} label="Home" active={activeTab === "home"} onClick={() => { setActiveTab("home"); setLocation("/"); }} />
          <BottomNavItem icon={Lightbulb} label="Advice" active={activeTab === "advice"} onClick={() => { setActiveTab("advice"); }} />
          <BottomNavItem icon={TrendingUp} label="Invest" active={activeTab === "invest"} onClick={() => { setActiveTab("invest"); }} />
          <BottomNavItem icon={Wallet} label="Net Worth" active={activeTab === "networth"} onClick={() => { setActiveTab("networth"); }} />
          <BottomNavItem icon={PiggyBank} label="Budget" active={activeTab === "budget"} onClick={() => { setActiveTab("budget"); setLocation("/anggaran"); }} />
        </div>
      </div>
    </div>
  );
}
