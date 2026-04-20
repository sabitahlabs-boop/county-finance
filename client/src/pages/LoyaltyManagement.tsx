import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Star, Gift, Search, Settings, Users, Zap, Award, TrendingUp, ChevronDown
} from "lucide-react";
import { formatRupiah } from "../../../shared/finance";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

type TierLevel = "Bronze" | "Silver" | "Gold" | "Platinum";

const TIER_COLORS: Record<TierLevel, { bg: string; text: string; icon: string }> = {
  Bronze: { bg: "bg-amber-50 dark:bg-amber-950", text: "text-amber-700 dark:text-amber-300", icon: "🥉" },
  Silver: { bg: "bg-slate-50", text: "text-slate-700", icon: "🥈" },
  Gold: { bg: "bg-yellow-50 dark:bg-yellow-950", text: "text-yellow-700 dark:text-yellow-300", icon: "🥇" },
  Platinum: { bg: "bg-purple-50 dark:bg-purple-950", text: "text-purple-700 dark:text-purple-300", icon: "💎" },
};

export default function LoyaltyManagement() {
  const [search, setSearch] = useState("");
  const [showConfig, setShowConfig] = useState(false);
  const [selectedClient, setSelectedClient] = useState<number | null>(null);
  const [expandedClient, setExpandedClient] = useState<number | null>(null);

  // Queries
  const { data: config, isLoading: configLoading } = trpc.loyalty.getConfig.useQuery();
  const { data: allPoints, isLoading: pointsLoading } = trpc.loyalty.allPoints.useQuery();
  const { data: transactions } = trpc.loyalty.transactions.useQuery(
    { clientId: selectedClient! },
    { enabled: !!selectedClient }
  );
  const { data: clients } = trpc.clientMgmt.list.useQuery();

  const utils = trpc.useUtils();

  // Mutations
  const updateConfigMut = trpc.loyalty.updateConfig.useMutation({
    onSuccess: () => {
      utils.loyalty.getConfig.invalidate();
      setShowConfig(false);
      toast.success("Konfigurasi loyalitas berhasil diperbarui!");
    },
    onError: (e) => toast.error(e.message),
  });

  // Config form state
  const [configForm, setConfigForm] = useState(() => config || {
    isEnabled: false,
    pointsPerAmount: 1,
    amountPerPoint: 10000,
    redemptionRate: 100,
    minRedeemPoints: 100,
    silverThreshold: 500,
    goldThreshold: 2000,
    platinumThreshold: 5000,
  });

  // Update form when config loads
  if (config && JSON.stringify(configForm) !== JSON.stringify(config)) {
    setConfigForm(config);
  }

  function handleConfigSubmit() {
    updateConfigMut.mutate(configForm);
  }

  // Combine loyalty points with client data
  const loyaltyMembers = allPoints?.map(lp => {
    const client = clients?.find(c => c.id === lp.clientId);
    return { ...lp, client };
  }) || [];

  // Filter by search
  const filtered = loyaltyMembers.filter(m =>
    !search ||
    (m.client?.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (m.client?.email || "").toLowerCase().includes(search.toLowerCase())
  );

  // Count by tier
  const tierCounts = {
    Bronze: filtered.filter(m => m.tierLevel === "Bronze").length,
    Silver: filtered.filter(m => m.tierLevel === "Silver").length,
    Gold: filtered.filter(m => m.tierLevel === "Gold").length,
    Platinum: filtered.filter(m => m.tierLevel === "Platinum").length,
  };

  const totalPointsOutstanding = filtered.reduce((sum, m) => sum + m.points, 0);

  if (configLoading || pointsLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6 max-w-6xl mx-auto">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Star className="h-6 w-6 text-yellow-500" />
            Program Loyalitas
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Kelola poin, tier, dan rewards pelanggan</p>
        </div>
        <Button onClick={() => setShowConfig(true)} className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600">
          <Settings className="h-4 w-4 mr-2" /> Pengaturan
        </Button>
      </div>

      {/* Status Badge */}
      {config && (
        <Card className="border-0 shadow-md bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Gift className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-sm font-medium">Status Loyalitas</p>
                <p className="text-xs text-muted-foreground">Program {config.isEnabled ? "Aktif" : "Tidak Aktif"}</p>
              </div>
            </div>
            <Badge variant={config.isEnabled ? "default" : "secondary"}>
              {config.isEnabled ? "✓ Aktif" : "○ Nonaktif"}
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Member</p>
                <p className="text-2xl font-bold mt-1">{filtered.length}</p>
              </div>
              <Users className="h-5 w-5 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Poin Outstanding</p>
                <p className="text-2xl font-bold mt-1">{totalPointsOutstanding.toLocaleString('id-ID')}</p>
              </div>
              <Zap className="h-5 w-5 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Estimated Redemption</p>
                <p className="text-2xl font-bold mt-1">{formatRupiah(totalPointsOutstanding * (config?.redemptionRate || 100))}</p>
              </div>
              <TrendingUp className="h-5 w-5 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Platinum Members</p>
                <p className="text-2xl font-bold mt-1">{tierCounts.Platinum}</p>
              </div>
              <Award className="h-5 w-5 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tier Distribution */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">Distribusi Member per Tier</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(Object.entries(tierCounts) as [TierLevel, number][]).map(([tier, count]) => {
              const colors = TIER_COLORS[tier];
              return (
                <motion.div
                  key={tier}
                  className={`p-4 rounded-lg border-2 ${colors.bg}`}
                  whileHover={{ scale: 1.05 }}
                >
                  <p className="text-sm font-medium mb-1">{TIER_COLORS[tier].icon} {tier}</p>
                  <p className={`text-2xl font-bold ${colors.text}`}>{count}</p>
                  <p className="text-xs text-muted-foreground mt-1">{Math.round((count / Math.max(1, filtered.length)) * 100)}%</p>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari member by name atau email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Members Table */}
      <Card className="border-0 shadow-md overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg">Member Loyalitas ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Nama</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead className="text-right">Poin</TableHead>
                  <TableHead className="text-right">Total Earned</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Tidak ada member loyalitas
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((member) => {
                      const tierInfo = TIER_COLORS[member.tierLevel as TierLevel] || TIER_COLORS.Bronze;
                      const isExpanded = expandedClient === member.clientId;
                      return (
                        <motion.tr
                          key={member.clientId}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="border-b hover:bg-muted/50"
                        >
                          <TableCell className="font-medium">{member.client?.name || "Unknown"}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{member.client?.email || "-"}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`${tierInfo.text} border-current`}>
                              {tierInfo.icon} {member.tierLevel}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">{member.points.toLocaleString('id-ID')}</TableCell>
                          <TableCell className="text-right text-sm">{member.totalEarned.toLocaleString('id-ID')}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpandedClient(isExpanded ? null : member.clientId)}
                              className="h-8 w-8 p-0"
                            >
                              <ChevronDown
                                className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                              />
                            </Button>
                          </TableCell>
                        </motion.tr>
                      );
                    })
                  )}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>

          {/* Expandable transaction history */}
          {filtered.map((member) => {
            if (expandedClient !== member.clientId) return null;
            const memberTransactions = transactions?.filter(t => t.clientId === member.clientId) || [];
            return (
              <motion.div
                key={`details-${member.clientId}`}
                initial={{ height: 0 }}
                animate={{ height: "auto" }}
                exit={{ height: 0 }}
                className="border-t bg-muted/30 overflow-hidden"
              >
                <div className="p-4">
                  <p className="text-sm font-semibold mb-3">Riwayat Transaksi Poin</p>
                  {memberTransactions.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Belum ada transaksi</p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {memberTransactions.map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between text-xs p-2 bg-white dark:bg-gray-900 rounded border">
                          <div>
                            <p className="font-medium">{tx.description}</p>
                            <p className="text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString('id-ID')}</p>
                          </div>
                          <Badge variant={tx.type === "earn" ? "default" : "destructive"}>
                            {tx.type === "earn" ? "+" : "-"}{tx.points}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </CardContent>
      </Card>

      {/* Config Dialog */}
      <Dialog open={showConfig} onOpenChange={setShowConfig}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Pengaturan Loyalitas</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Enable/Disable */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <label className="text-sm font-medium">Aktifkan Program</label>
              <Switch
                checked={configForm.isEnabled}
                onCheckedChange={(checked) =>
                  setConfigForm({ ...configForm, isEnabled: checked })
                }
              />
            </div>

            {configForm.isEnabled && (
              <>
                {/* Points per Amount */}
                <div>
                  <Label className="text-sm">Poin per Pembelian</Label>
                  <p className="text-xs text-muted-foreground mb-2">Misalnya: 1 poin untuk setiap Rp 10.000 belanja</p>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min="1"
                      value={configForm.pointsPerAmount}
                      onChange={(e) =>
                        setConfigForm({ ...configForm, pointsPerAmount: Number(e.target.value) })
                      }
                      placeholder="Poin"
                      className="w-20"
                    />
                    <span className="text-sm self-center">poin untuk setiap</span>
                    <Input
                      type="number"
                      min="1"
                      value={configForm.amountPerPoint}
                      onChange={(e) =>
                        setConfigForm({ ...configForm, amountPerPoint: Number(e.target.value) })
                      }
                      placeholder="Jumlah"
                      className="w-24"
                    />
                    <span className="text-sm self-center">rupiah</span>
                  </div>
                </div>

                {/* Redemption Rate */}
                <div>
                  <Label className="text-sm">Nilai Tukar Poin</Label>
                  <p className="text-xs text-muted-foreground mb-2">Berapa rupiah per poin saat ditukar</p>
                  <div className="flex gap-2">
                    <span className="text-sm self-center">1 poin =</span>
                    <Input
                      type="number"
                      min="1"
                      value={configForm.redemptionRate}
                      onChange={(e) =>
                        setConfigForm({ ...configForm, redemptionRate: Number(e.target.value) })
                      }
                      placeholder="Rupiah"
                      className="flex-1"
                    />
                    <span className="text-sm self-center">rupiah</span>
                  </div>
                </div>

                {/* Min Redeem */}
                <div>
                  <Label className="text-sm">Minimum Poin Tukar</Label>
                  <Input
                    type="number"
                    min="1"
                    value={configForm.minRedeemPoints}
                    onChange={(e) =>
                      setConfigForm({ ...configForm, minRedeemPoints: Number(e.target.value) })
                    }
                    placeholder="Minimum poin"
                  />
                </div>

                {/* Tier Thresholds */}
                <div className="border-t pt-4 mt-4">
                  <p className="text-sm font-semibold mb-3">Ambang Batas Tier</p>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-sm">🥈 Silver (minimal poin)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={configForm.silverThreshold}
                        onChange={(e) =>
                          setConfigForm({ ...configForm, silverThreshold: Number(e.target.value) })
                        }
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">🥇 Gold (minimal poin)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={configForm.goldThreshold}
                        onChange={(e) =>
                          setConfigForm({ ...configForm, goldThreshold: Number(e.target.value) })
                        }
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">💎 Platinum (minimal poin)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={configForm.platinumThreshold}
                        onChange={(e) =>
                          setConfigForm({ ...configForm, platinumThreshold: Number(e.target.value) })
                        }
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowConfig(false)} className="flex-1">
                Batal
              </Button>
              <Button
                onClick={handleConfigSubmit}
                disabled={updateConfigMut.isPending}
                className="flex-1 bg-gradient-to-r from-yellow-500 to-amber-500"
              >
                {updateConfigMut.isPending ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
