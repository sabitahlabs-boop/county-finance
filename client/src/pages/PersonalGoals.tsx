import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Target, Shield, Heart, TrendingUp, Building2, Car,
  GraduationCap, Plane, Plus, Trash2, ArrowLeft, Save,
} from "lucide-react";
import { formatRupiah } from "../../../shared/finance";
import { useLocation } from "wouter";
import { toast } from "sonner";

const GOAL_TYPES = [
  { value: "dana_darurat", label: "Dana Darurat", icon: Shield, color: "#EF4444" },
  { value: "dana_pensiun", label: "Dana Pensiun", icon: Heart, color: "#F59E0B" },
  { value: "investasi", label: "Investasi", icon: TrendingUp, color: "#10B981" },
  { value: "rumah", label: "Rumah", icon: Building2, color: "#3B82F6" },
  { value: "kendaraan", label: "Kendaraan", icon: Car, color: "#8B5CF6" },
  { value: "pendidikan", label: "Pendidikan", icon: GraduationCap, color: "#0EA5E9" },
  { value: "liburan", label: "Liburan", icon: Plane, color: "#EC4899" },
  { value: "lainnya", label: "Lainnya", icon: Target, color: "#6B7280" },
] as const;

type GoalType = typeof GOAL_TYPES[number]["value"];

export default function PersonalGoals() {
  const [, setLocation] = useLocation();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    goalType: "lainnya" as GoalType,
    targetAmount: 0,
    currentAmount: 0,
    targetDate: "",
    priority: 5,
  });

  const utils = trpc.useUtils();
  const { data: goals, isLoading } = trpc.personalFinance.getGoals.useQuery(undefined, { retry: false });
  const upsertGoal = trpc.personalFinance.upsertGoal.useMutation({
    onSuccess: () => {
      utils.personalFinance.getGoals.invalidate();
      utils.personalFinance.getDashboard.invalidate();
      setShowForm(false);
      setEditId(null);
      resetForm();
      toast.success("Target keuangan berhasil disimpan");
    },
  });
  const deleteGoal = trpc.personalFinance.deleteGoal.useMutation({
    onSuccess: () => {
      utils.personalFinance.getGoals.invalidate();
      utils.personalFinance.getDashboard.invalidate();
      toast.success("Target berhasil dihapus");
    },
  });

  function resetForm() {
    setFormData({ name: "", goalType: "lainnya", targetAmount: 0, currentAmount: 0, targetDate: "", priority: 5 });
  }

  function startEdit(goal: any) {
    setEditId(goal.id);
    setFormData({
      name: goal.name,
      goalType: goal.goalType,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount || 0,
      targetDate: goal.targetDate || "",
      priority: goal.priority || 5,
    });
    setShowForm(true);
  }

  function handleSave() {
    if (!formData.name.trim()) { toast.error("Nama target harus diisi"); return; }
    if (formData.targetAmount <= 0) { toast.error("Target amount harus > 0"); return; }
    upsertGoal.mutate({
      ...(editId ? { id: editId } : {}),
      name: formData.name,
      goalType: formData.goalType,
      targetAmount: formData.targetAmount,
      currentAmount: formData.currentAmount,
      targetDate: formData.targetDate || undefined,
      priority: formData.priority,
    });
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => setLocation("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Target Keuangan</h1>
              <p className="text-xs text-muted-foreground">Kelola target dan tujuan finansial Anda</p>
            </div>
          </div>
          {!showForm && (
            <Button size="sm" className="gap-2 rounded-xl" onClick={() => { resetForm(); setEditId(null); setShowForm(true); }}>
              <Plus className="h-4 w-4" /> Tambah
            </Button>
          )}
        </div>

        {/* Form */}
        {showForm && (
          <Card className="border-0 shadow-lg ring-1 ring-black/5 dark:ring-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{editId ? "Edit Target" : "Tambah Target Baru"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs">Nama Target</Label>
                <Input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="Contoh: Dana Darurat 6 Bulan" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Tipe</Label>
                <div className="grid grid-cols-4 gap-2 mt-1">
                  {GOAL_TYPES.map(gt => {
                    const Icon = gt.icon;
                    const active = formData.goalType === gt.value;
                    return (
                      <button
                        key={gt.value}
                        onClick={() => setFormData(p => ({ ...p, goalType: gt.value }))}
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-xs transition-all ${active ? "border-amber-400 bg-amber-50 dark:bg-amber-900/20" : "border-muted hover:border-muted-foreground/30"}`}
                      >
                        <Icon className="h-4 w-4" style={{ color: gt.color }} />
                        <span className="truncate w-full text-center">{gt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Target Amount (Rp)</Label>
                  <Input type="number" value={formData.targetAmount || ""} onChange={e => setFormData(p => ({ ...p, targetAmount: Number(e.target.value) }))} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Sudah Terkumpul (Rp)</Label>
                  <Input type="number" value={formData.currentAmount || ""} onChange={e => setFormData(p => ({ ...p, currentAmount: Number(e.target.value) }))} className="mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Target Tanggal</Label>
                  <Input type="date" value={formData.targetDate} onChange={e => setFormData(p => ({ ...p, targetDate: e.target.value }))} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Prioritas (1-10)</Label>
                  <Input type="number" min={1} max={10} value={formData.priority} onChange={e => setFormData(p => ({ ...p, priority: Number(e.target.value) }))} className="mt-1" />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button className="flex-1 gap-2 rounded-xl" onClick={handleSave} disabled={upsertGoal.isPending}>
                  <Save className="h-4 w-4" /> {upsertGoal.isPending ? "Menyimpan..." : "Simpan"}
                </Button>
                <Button variant="outline" className="rounded-xl" onClick={() => { setShowForm(false); setEditId(null); }}>Batal</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Goals List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        ) : !goals || goals.length === 0 ? (
          <Card className="border-0 shadow-md">
            <CardContent className="py-12 text-center">
              <Target className="h-12 w-12 mx-auto mb-3 text-muted-foreground/20" />
              <p className="text-sm text-muted-foreground">Belum ada target keuangan</p>
              <p className="text-xs text-muted-foreground mt-1">Tambahkan target pertama Anda untuk mulai tracking</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {goals.map((goal: any) => {
              const gtConfig = GOAL_TYPES.find(g => g.value === goal.goalType) || GOAL_TYPES[7];
              const GoalIcon = gtConfig.icon;
              const progress = goal.targetAmount > 0 ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)) : 0;
              return (
                <Card
                  key={goal.id}
                  className="border-0 shadow-md ring-1 ring-black/5 dark:ring-white/10 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => startEdit(goal)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: gtConfig.color + "15" }}>
                        <GoalIcon className="h-5 w-5" style={{ color: gtConfig.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-semibold truncate">{goal.name}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold" style={{ color: gtConfig.color }}>{progress}%</span>
                            <Button
                              variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-500"
                              onClick={e => { e.stopPropagation(); deleteGoal.mutate({ id: goal.id }); }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${progress}%`, backgroundColor: gtConfig.color }} />
                        </div>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-[10px] text-muted-foreground">{formatRupiah(goal.currentAmount || 0)}</span>
                          <span className="text-[10px] text-muted-foreground">Target: {formatRupiah(goal.targetAmount)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
