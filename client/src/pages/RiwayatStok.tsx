import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, TrendingUp, TrendingDown, RefreshCw, Package } from "lucide-react";
import { formatRupiah } from "../../../shared/finance";

const MOVEMENT_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  in: { label: "Stok Masuk", color: "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800", icon: <TrendingUp className="h-3 w-3" /> },
  out: { label: "Stok Keluar", color: "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800", icon: <TrendingDown className="h-3 w-3" /> },
  adjustment: { label: "Penyesuaian", color: "bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800", icon: <RefreshCw className="h-3 w-3" /> },
  opening: { label: "Stok Awal", color: "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800", icon: <Package className="h-3 w-3" /> },
};

export default function RiwayatStok() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const { data: logs, isLoading } = trpc.product.allStockHistory.useQuery(undefined, { retry: false });
  const { data: productList } = trpc.product.list.useQuery(undefined, { retry: false });

  const filtered = useMemo(() => {
    if (!logs) return [];
    return logs.filter((log) => {
      const matchSearch =
        !search ||
        (log.productName ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (log.productSku ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (log.notes ?? "").toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === "all" || log.movementType === typeFilter;
      return matchSearch && matchType;
    });
  }, [logs, search, typeFilter]);

  // Summary stats
  const stats = useMemo(() => {
    if (!logs) return { in: 0, out: 0, adjustment: 0 };
    return logs.reduce(
      (acc, l) => {
        if (l.movementType === "in") acc.in += l.qty;
        else if (l.movementType === "out") acc.out += l.qty;
        else if (l.movementType === "adjustment") acc.adjustment += 1;
        return acc;
      },
      { in: 0, out: 0, adjustment: 0 }
    );
  }, [logs]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
  };

  const formatTime = (ts: Date | string) => {
    return new Date(ts).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Riwayat Stok</h1>
        <p className="text-sm text-muted-foreground mt-1">Log pergerakan stok semua produk</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Masuk</p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">+{stats.in.toLocaleString("id-ID")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900">
                <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Keluar</p>
                <p className="text-xl font-bold text-red-600 dark:text-red-400">-{stats.out.toLocaleString("id-ID")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900">
                <RefreshCw className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Penyesuaian</p>
                <p className="text-xl font-bold text-orange-600 dark:text-orange-400">{stats.adjustment}x</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Log Pergerakan Stok</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari produk atau catatan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Semua Tipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tipe</SelectItem>
                <SelectItem value="in">Stok Masuk</SelectItem>
                <SelectItem value="out">Stok Keluar</SelectItem>
                <SelectItem value="adjustment">Penyesuaian</SelectItem>
                <SelectItem value="opening">Stok Awal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Belum ada riwayat stok</p>
              <p className="text-sm mt-1">Pergerakan stok akan muncul di sini setelah ada transaksi produk</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left p-3 font-medium">Tanggal</th>
                    <th className="text-left p-3 font-medium">Produk</th>
                    <th className="text-left p-3 font-medium">Tipe</th>
                    <th className="text-right p-3 font-medium">Qty</th>
                    <th className="text-right p-3 font-medium">Stok Sebelum</th>
                    <th className="text-right p-3 font-medium">Stok Sesudah</th>
                    <th className="text-left p-3 font-medium">Catatan</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((log) => {
                    const mv = MOVEMENT_LABELS[log.movementType] ?? MOVEMENT_LABELS.adjustment;
                    const qtyDisplay = log.direction > 0 ? `+${log.qty}` : `-${log.qty}`;
                    const qtyColor = log.direction > 0 ? "text-green-600 dark:text-green-400 font-semibold" : "text-red-600 dark:text-red-400 font-semibold";
                    return (
                      <tr key={log.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="p-3 whitespace-nowrap">
                          <div className="font-medium">{formatDate(log.date)}</div>
                          <div className="text-xs text-muted-foreground">{formatTime(log.createdAt)}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium">{log.productName ?? "—"}</div>
                          {log.productSku && <div className="text-xs text-muted-foreground">{log.productSku}</div>}
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className={`text-xs gap-1 ${mv.color}`}>
                            {mv.icon}
                            {mv.label}
                          </Badge>
                        </td>
                        <td className={`p-3 text-right ${qtyColor}`}>{qtyDisplay} {log.productUnit ?? "pcs"}</td>
                        <td className="p-3 text-right text-muted-foreground">{log.stockBefore.toLocaleString("id-ID")}</td>
                        <td className="p-3 text-right font-medium">{log.stockAfter.toLocaleString("id-ID")}</td>
                        <td className="p-3 text-muted-foreground max-w-xs truncate">{log.notes ?? "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="text-xs text-muted-foreground text-right mt-3">
                Menampilkan {filtered.length} dari {logs?.length ?? 0} entri
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
