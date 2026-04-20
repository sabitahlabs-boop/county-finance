import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart3, TrendingUp, TrendingDown, ShoppingCart, DollarSign,
  Package, CreditCard, ChevronLeft, ChevronRight, Award
} from "lucide-react";
import { formatRupiah, BULAN_INDONESIA } from "../../../shared/finance";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, AreaChart, Area, Legend
} from "recharts";
import { motion } from "framer-motion";

const CHART_COLORS = ["#1E4D9B", "#F47920", "#4CAF50", "#E91E63", "#9C27B0", "#00BCD4", "#FF9800", "#607D8B", "#795548", "#3F51B5"];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-background border rounded-lg shadow-lg p-3 text-sm">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {formatRupiah(p.value)}</p>
      ))}
    </div>
  );
}

export default function SalesAnalytics() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const { data: analytics, isLoading } = trpc.analytics.sales.useQuery({ year: selectedYear });

  const monthlyData = useMemo(() => {
    if (!analytics) return [];
    return BULAN_INDONESIA.map((name, i) => ({
      name: name.substring(0, 3),
      pemasukan: analytics.monthlySales[i],
      pengeluaran: analytics.monthlyExpenses[i],
      laba: analytics.monthlySales[i] - analytics.monthlyExpenses[i],
    }));
  }, [analytics]);

  const categoryData = useMemo(() => {
    if (!analytics?.salesByCategory) return [];
    return Object.entries(analytics.salesByCategory)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));
  }, [analytics]);

  const paymentData = useMemo(() => {
    if (!analytics?.salesByPaymentMethod) return [];
    return Object.entries(analytics.salesByPaymentMethod)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));
  }, [analytics]);

  const totalSales = analytics?.monthlySales.reduce((s, v) => s + v, 0) || 0;
  const totalExpenses = analytics?.monthlyExpenses.reduce((s, v) => s + v, 0) || 0;
  const totalProfit = totalSales - totalExpenses;
  const avgMonthlySales = totalSales / 12;

  // Find best month
  const bestMonthIdx = analytics?.monthlySales.indexOf(Math.max(...(analytics?.monthlySales || [0]))) ?? 0;

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-[#1E4D9B]" />
            Analitik Penjualan
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Analisis performa penjualan bisnis Anda</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setSelectedYear(y => y - 1)}><ChevronLeft className="h-5 w-5" /></Button>
          <span className="text-lg font-semibold min-w-[60px] text-center">{selectedYear}</span>
          <Button variant="ghost" size="icon" onClick={() => setSelectedYear(y => y + 1)}><ChevronRight className="h-5 w-5" /></Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-lg" />)}</div>
          <Skeleton className="h-80 rounded-lg" />
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30"><DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" /></div>
                  </div>
                  <div className="text-lg font-bold">{formatRupiah(totalSales)}</div>
                  <div className="text-xs text-muted-foreground">Total Penjualan</div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30"><TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" /></div>
                  </div>
                  <div className="text-lg font-bold">{formatRupiah(totalExpenses)}</div>
                  <div className="text-xs text-muted-foreground">Total Pengeluaran</div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30"><TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" /></div>
                  </div>
                  <div className={`text-lg font-bold ${totalProfit >= 0 ? "text-green-600 dark:text-green-400" : "text-red-500"}`}>{formatRupiah(totalProfit)}</div>
                  <div className="text-xs text-muted-foreground">Laba Bersih</div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30"><Award className="h-4 w-4 text-amber-600 dark:text-amber-400" /></div>
                  </div>
                  <div className="text-lg font-bold">{BULAN_INDONESIA[bestMonthIdx]}</div>
                  <div className="text-xs text-muted-foreground">Bulan Terbaik</div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Monthly Sales Chart */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-base">Penjualan vs Pengeluaran Bulanan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`} className="text-xs" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="pemasukan" name="Pemasukan" fill="#1E4D9B" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="pengeluaran" name="Pengeluaran" fill="#F47920" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Profit Trend */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-base">Tren Laba Bersih</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`} className="text-xs" />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="laba" name="Laba Bersih" stroke="#4CAF50" fill="#4CAF50" fillOpacity={0.2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Sales by Category */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-base">Penjualan per Kategori</CardTitle>
              </CardHeader>
              <CardContent>
                {categoryData.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Belum ada data</p>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                          {categoryData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v: number) => formatRupiah(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-base">Metode Pembayaran</CardTitle>
              </CardHeader>
              <CardContent>
                {paymentData.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Belum ada data</p>
                ) : (
                  <div className="space-y-3">
                    {paymentData.map((item, i) => {
                      const pct = totalSales > 0 ? Math.round((item.value / totalSales) * 100) : 0;
                      return (
                        <div key={item.name} className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between text-sm">
                              <span className="truncate">{item.name}</span>
                              <span className="font-medium">{formatRupiah(item.value)}</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                              <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground w-10 text-right">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top Products */}
          {analytics?.topProducts && analytics.topProducts.length > 0 && (
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-4 w-4" /> Top 10 Produk Terlaris
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.topProducts.map((product, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1E4D9B] to-[#2563EB] flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{product.name}</div>
                        <div className="text-xs text-muted-foreground">{product.qty} unit terjual</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-semibold text-sm">{formatRupiah(product.revenue)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
