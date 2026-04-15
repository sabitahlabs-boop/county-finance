import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Crown, Check, X, Sparkles, Zap, Shield, Infinity, Camera, FileText,
  Brain, TrendingUp, Loader2, CheckCircle2, PartyPopper
} from "lucide-react";
import { formatRupiah, PRO_PRICE, PLAN_LIMITS } from "../../../shared/finance";
import { toast } from "sonner";
import { useLocation, useSearch } from "wouter";
import { motion } from "framer-motion";

function FeatureRow({ included, text, highlight }: { included: boolean; text: string; highlight?: boolean }) {
  return (
    <div className={`flex items-start gap-3 py-2 ${highlight ? "font-medium" : ""}`}>
      {included ? (
        <Check className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
      ) : (
        <X className="h-4 w-4 text-muted-foreground/40 mt-0.5 shrink-0" />
      )}
      <span className={`text-sm ${included ? "text-foreground" : "text-muted-foreground/60 line-through"}`}>
        {text}
      </span>
    </div>
  );
}

export default function Upgrade() {
  const { user } = useAuth();
  const { data: business } = trpc.business.mine.useQuery(undefined, { enabled: !!user, retry: false });
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();
  const searchParams = useSearch();

  const isPro = business?.plan === "pro";

  // Handle Stripe redirect
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    const status = params.get("status");
    const sessionId = params.get("session_id");

    if (status === "success" && sessionId) {
      // Verify payment
      fetch(`/api/stripe/verify-payment?session_id=${sessionId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.paid) {
            toast.success("Pembayaran berhasil! Selamat datang di County Pro!");
          }
        })
        .catch(() => {});
      // Clean URL
      setLocation("/upgrade", { replace: true });
    } else if (status === "cancelled") {
      toast.info("Pembayaran dibatalkan");
      setLocation("/upgrade", { replace: true });
    }
  }, []);

  const handleUpgrade = async () => {
    if (!business || !user) {
      toast.error("Silakan login dan buat bisnis terlebih dahulu");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: business.id,
          userId: user.id,
          businessName: business.businessName,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Gagal membuat sesi pembayaran");
      }

      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      } else {
        throw new Error("URL pembayaran tidak tersedia");
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal memulai pembayaran");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 rounded-full px-4 py-1.5 text-sm font-medium mb-4">
          <Crown className="h-4 w-4" />
          Upgrade ke Pro
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Pilih Paket yang Tepat untuk Bisnis Anda
        </h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Mulai gratis, upgrade kapan saja. Sekali beli, akses selamanya.
        </p>
      </motion.div>

      {/* Success Banner */}
      {isPro && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="border-0 shadow-lg bg-gradient-to-r from-emerald-50 to-teal-50">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0">
                <PartyPopper className="h-7 w-7 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-bold text-emerald-800 text-lg">Anda sudah Pro!</h3>
                <p className="text-sm text-emerald-700">Nikmati semua fitur unlimited County. Terima kasih atas kepercayaan Anda.</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Free Plan */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className={`border-0 shadow-md shadow-black/5 h-full ${!isPro ? "ring-2 ring-primary/20" : ""}`}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Free</CardTitle>
                  <CardDescription>Untuk mencoba</CardDescription>
                </div>
                {!isPro && <Badge>Paket Anda</Badge>}
              </div>
              <div className="pt-2">
                <span className="text-3xl font-bold">Rp 0</span>
                <span className="text-muted-foreground text-sm ml-1">selamanya</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              <FeatureRow included text={`${PLAN_LIMITS.free.maxTransactions} transaksi`} highlight />
              <FeatureRow included text={`${PLAN_LIMITS.free.maxProducts} produk`} />
              <FeatureRow included text="Dashboard & KPI" />
              <FeatureRow included text="AI Scan Struk" />
              <FeatureRow included text="AI Insights" />
              <FeatureRow included text="Kalkulator Pajak" />
              <FeatureRow included={false} text="Unlimited transaksi" />
              <FeatureRow included={false} text="Unlimited produk" />
              <FeatureRow included={false} text="Export laporan (CSV)" />
              <FeatureRow included={false} text="AI Health Score" />
              <FeatureRow included={false} text="AI Smart Suggestions" />
              <FeatureRow included={false} text="Hapus transaksi" />
            </CardContent>
          </Card>
        </motion.div>

        {/* Pro Plan */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className={`border-0 shadow-xl h-full relative overflow-hidden ${isPro ? "ring-2 ring-amber-400" : "ring-2 ring-primary/30"}`}>
            {/* Recommended badge */}
            {!isPro && (
              <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-orange-500 text-white text-xs font-bold px-4 py-1 rounded-bl-xl">
                RECOMMENDED
              </div>
            )}
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Crown className="h-5 w-5 text-amber-500" /> Pro
                  </CardTitle>
                  <CardDescription>Untuk bisnis serius</CardDescription>
                </div>
                {isPro && <Badge className="bg-amber-500 text-white">Paket Anda</Badge>}
              </div>
              <div className="pt-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg text-muted-foreground line-through decoration-red-500">Rp 2.000.000</span>
                  <Badge className="bg-red-500 text-white border-0 text-xs">HEMAT 85%</Badge>
                </div>
                <span className="text-3xl font-bold">{formatRupiah(PRO_PRICE)}</span>
                <span className="text-muted-foreground text-sm ml-1">sekali beli · lifetime</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              <FeatureRow included text="Unlimited transaksi" highlight />
              <FeatureRow included text="Unlimited produk" highlight />
              <FeatureRow included text="Dashboard & KPI" />
              <FeatureRow included text="AI Scan Struk" />
              <FeatureRow included text="AI Insights & Summary" />
              <FeatureRow included text="AI Health Score" />
              <FeatureRow included text="AI Smart Suggestions" />
              <FeatureRow included text="Kalkulator Pajak" />
              <FeatureRow included text="Export laporan (CSV)" />
              <FeatureRow included text="Hapus transaksi" />
              <FeatureRow included text="Laporan Laba Rugi & Arus Kas" />
              <FeatureRow included text="Semua fitur selamanya" />

              <div className="pt-4">
                {!isPro ? (
                  <Button
                    onClick={handleUpgrade}
                    disabled={loading || !business}
                    className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/25 gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Memproses...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4" /> Upgrade Sekarang — {formatRupiah(PRO_PRICE)}
                      </>
                    )}
                  </Button>
                ) : (
                  <Button disabled className="w-full h-12 gap-2 bg-amber-500">
                    <CheckCircle2 className="h-4 w-4" /> Aktif Selamanya
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* AI Features Showcase */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-0 shadow-md shadow-black/5">
          <CardHeader className="text-center pb-2">
            <CardTitle className="flex items-center justify-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-primary" /> Fitur AI yang Tersedia
            </CardTitle>
            <CardDescription>Semua paket mendapatkan akses ke fitur AI dasar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: Camera, title: "Scan Struk", desc: "Foto struk, AI baca otomatis", plan: "Free & Pro" },
                { icon: Brain, title: "Auto Kategorisasi", desc: "AI tentukan kategori transaksi", plan: "Free & Pro" },
                { icon: TrendingUp, title: "Health Score", desc: "Skor kesehatan keuangan AI", plan: "Pro Only" },
                { icon: Sparkles, title: "Smart Suggestions", desc: "Saran cerdas untuk bisnis", plan: "Pro Only" },
              ].map((f, i) => (
                <div key={i} className="rounded-xl border p-4 text-center space-y-2 hover:shadow-sm transition-shadow">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <p className="font-semibold text-sm">{f.title}</p>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                  <Badge variant={f.plan.includes("Free") ? "secondary" : "default"} className="text-xs">
                    {f.plan}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Trust badges */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground py-4"
      >
        <div className="flex items-center gap-1.5">
          <Shield className="h-4 w-4" /> Pembayaran Aman via Stripe
        </div>
        <div className="flex items-center gap-1.5">
          <Infinity className="h-4 w-4" /> Sekali Beli, Akses Selamanya
        </div>
        <div className="flex items-center gap-1.5">
          <Zap className="h-4 w-4" /> Aktivasi Instan
        </div>
      </motion.div>
    </div>
  );
}
