import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { motion, useInView } from "framer-motion";
import {
  Camera, BarChart3, Calculator, Package, ShoppingCart, FileText,
  Brain, Sparkles, TrendingUp, Shield, Zap, Clock, Check, X,
  ChevronRight, Star, Users, ArrowRight, Timer, Flame, Crown,
  QrCode, Receipt, PieChart, AlertTriangle, Gift,
  MonitorSmartphone, Lock, BookOpen, Store, Wallet, LineChart,
  ChevronDown, ArrowLeftRight, HandCoins, PiggyBank, Bell
} from "lucide-react";
import { trpc } from "@/lib/trpc";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663380060214/BWbi9ugLsQu4nq5jm7TSFB/county-logo-new_8e4282c5.png";
const ORIGINAL_PRICE = 2000000;
const SALE_PRICE = 299000;
const DISCOUNT_PERCENT = Math.round((1 - SALE_PRICE / ORIGINAL_PRICE) * 100);

// Countdown timer hook — resets every 24h
function useCountdown() {
  const getTarget = () => {
    const stored = localStorage.getItem("county_countdown_target");
    if (stored) {
      const t = parseInt(stored);
      if (t > Date.now()) return t;
    }
    const target = Date.now() + 24 * 60 * 60 * 1000;
    localStorage.setItem("county_countdown_target", target.toString());
    return target;
  };

  const [target] = useState(getTarget);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, target - Date.now());
      setTimeLeft({
        hours: Math.floor(diff / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  return timeLeft;
}

function formatRp(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

// Animated section wrapper
function AnimatedSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// FAQ Accordion item
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-200 dark:border-gray-700">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 px-1 text-left hover:opacity-80 transition-opacity"
      >
        <span className="font-bold text-base pr-4">{q}</span>
        <ChevronDown className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <p className="pb-5 px-1 text-sm text-muted-foreground leading-relaxed">{a}</p>
      </motion.div>
    </div>
  );
}

export default function LandingPage() {
  useAuth();
  const countdown = useCountdown();
  const [soldCount] = useState(() => Math.floor(Math.random() * 30) + 170); // 170-199
  const [quotaLeft] = useState(() => Math.floor(Math.random() * 5) + 6); // 6-10

  // Detect affiliate ref code from URL
  const [refCode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("ref") || "";
  });

  // Resolve affiliate's Scalev URL if ref code exists
  const { data: affiliateData } = trpc.affiliate.resolve.useQuery(
    { refCode },
    { enabled: !!refCode, staleTime: Infinity }
  );

  const DEFAULT_SCALEV_URL = "https://county.myscalev.com/p/county";
  const buyUrl = (affiliateData?.scalevUrl) || DEFAULT_SCALEV_URL;

  const handleBuyPro = () => { window.open(buyUrl, "_blank"); };
  const handleCTA = handleBuyPro;
  const handleLogin = () => { window.location.href = getLoginUrl(); };

  return (
    <div className="min-h-screen bg-[#f0f4f8] dark:bg-background text-foreground overflow-x-hidden">

      {/* ========== TOP TRUST BAR ========== */}
      <div className="bg-white dark:bg-card border-b py-3 px-4">
        <div className="max-w-lg mx-auto flex items-center justify-center gap-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Shield className="h-4 w-4 text-primary" />
            <span className="font-medium">Mudah</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="h-4 w-4 text-primary" />
            <span className="font-medium">Cepat</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Lock className="h-4 w-4 text-primary" />
            <span className="font-medium">Aman</span>
          </div>
        </div>
      </div>

      {/* ========== BONUS BANNER (Yellow) ========== */}
      <div className="bg-gradient-to-r from-amber-400 to-yellow-400 dark:from-amber-600 dark:to-yellow-600 py-4 px-4">
        <div className="max-w-lg mx-auto text-center">
          <div className="inline-block bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-md mb-2">
            Khusus Hari Ini
          </div>
          <p className="text-sm font-bold text-gray-900">
            <Gift className="h-4 w-4 inline mr-1" />
            Dapatkan <span className="text-red-700">Bonus Spesial</span> untuk pembelian hari ini!
          </p>
          <p className="text-xs text-gray-800 mt-1">
            Hemat total <span className="font-extrabold">{formatRp(ORIGINAL_PRICE - SALE_PRICE)}</span> dari harga normal
          </p>
        </div>
      </div>

      {/* ========== HERO SECTION ========== */}
      <section className="py-12 md:py-16 px-4">
        <div className="max-w-lg mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-4xl mb-4"
          >
            🚀
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight mb-4 text-gray-900 dark:text-foreground"
          >
            Revolusi Pengelolaan Keuangan{" "}
            <span className="bg-gradient-to-r from-primary to-emerald-500 bg-clip-text text-transparent">
              Bisnis & Pribadi Anda!
            </span>
          </motion.h1>

          {/* App Logo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center gap-2 mb-4"
          >
            <img src={LOGO_URL} alt="County" className="h-16 w-16 drop-shadow-lg" />
            <div>
              <h2 className="text-xl font-extrabold text-primary">County</h2>
              <p className="text-xs text-muted-foreground">Aplikasi Keuangan All-in-One AI</p>
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-base text-muted-foreground mb-6 leading-relaxed"
          >
            Solusi lengkap untuk mengelola keuangan bisnis & pribadi dengan mudah, cepat, dan akurat.
            <strong className="text-foreground"> Didukung teknologi AI.</strong>
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="text-sm font-semibold text-primary mb-6"
          >
            Bisa Diakses di HP, Tablet & Laptop — Install sebagai Aplikasi (PWA)
          </motion.p>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-4"
          >
            <Button
              onClick={handleBuyPro}
              size="lg"
              className="w-full h-14 text-lg font-bold shadow-xl gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 rounded-xl"
            >
              <ArrowRight className="h-5 w-5" /> Ambil Promo Sekarang
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
          >
            <Button
              onClick={handleLogin}
              variant="outline"
              size="lg"
              className="w-full h-12 text-base font-semibold gap-2 rounded-xl"
            >
              Masuk / Coba Gratis
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ========== DESCRIPTION ========== */}
      <section className="px-4 pb-12">
        <div className="max-w-lg mx-auto">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground leading-relaxed">
                County adalah aplikasi manajemen keuangan <strong>All-in-One</strong> berbasis web yang bisa diakses di HP maupun laptop, dengan tampilan yang intuitif, simple dan mudah dipahami sehingga <strong>tidak memerlukan keahlian akuntansi khusus</strong> untuk mengoperasikannya.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ========== PROBLEM → SOLUTION ========== */}
      <section className="px-4 pb-16">
        <div className="max-w-lg mx-auto">
          <AnimatedSection className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight underline decoration-primary decoration-2 underline-offset-8">
              Dari Repot Input Data Keuangan Jadi Simpel
            </h2>
          </AnimatedSection>

          <AnimatedSection>
            <div className="space-y-4">
              {[
                { bad: "Bayar Bulanan?", good: "Cukup sekali bayar akses selamanya" },
                { bad: "Pembukuan manual", good: "Otomatisasi lengkap + AI" },
                { bad: "Laporan tidak akurat", good: "Real-time & presisi" },
                { bad: "Lupa bayar tagihan", good: "Notifikasi jatuh tempo" },
                { bad: "Sulit analisa performa", good: "Laporan KPI detail + AI Health Score" },
                { bad: "Anggaran berantakan", good: "Perencanaan anggaran mudah" },
                { bad: "Data tersebar dimana-mana", good: "Satu platform, semua data" },
                { bad: "Input stok manual satu-satu", good: "AI Scan Struk → Auto Stok" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 bg-white dark:bg-card rounded-xl p-4 shadow-sm">
                  <div className="shrink-0 mt-0.5">
                    <div className="h-6 w-6 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center">
                      <X className="h-3.5 w-3.5 text-red-500" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground line-through">{item.bad}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                      <div className="flex items-center gap-1.5">
                        <div className="h-5 w-5 rounded-full bg-green-100 dark:bg-green-950/30 flex items-center justify-center shrink-0">
                          <Check className="h-3 w-3 text-green-600" />
                        </div>
                        <p className="text-sm font-semibold text-foreground">{item.good}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ========== NEW FEATURES BANNER ========== */}
      <section className="px-4 pb-12">
        <div className="max-w-lg mx-auto">
          <AnimatedSection>
            <div className="bg-gradient-to-r from-primary/10 to-emerald-500/10 dark:from-primary/20 dark:to-emerald-500/20 rounded-2xl p-6 text-center border border-primary/20">
              <p className="text-sm font-bold text-foreground mb-3">
                Dapatkan Berbagai Fitur Manajemen Keuangan untuk membantu memudahkan analisa keuangan Anda
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {["AI Scan Struk", "POS Kasir", "Multi Mode", "Mini Calculator", "Hutang & Piutang", "Anggaran"].map((tag) => (
                  <Badge key={tag} className="bg-red-500 text-white border-0 text-xs font-bold">
                    NEW 🔥 {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ========== FEATURE LIST (Dana Cerdas Style) ========== */}
      <section id="fitur" className="px-4 pb-16 bg-white dark:bg-card py-16">
        <div className="max-w-lg mx-auto">
          <AnimatedSection className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2">
              Semua yang Anda Butuhkan Dalam{" "}
              <span className="text-primary">1 Aplikasi Terpusat</span>
            </h2>
            <p className="text-sm text-muted-foreground">Cukup daftar dan mulai atur keuangan Anda</p>
          </AnimatedSection>

          <div className="space-y-6">
            {/* Feature Group 1 */}
            <AnimatedSection>
              <FeatureGroup
                title="Manajemen Keuangan Terpusat"
                emoji="🔥"
                items={[
                  "DASHBOARD cantik dan powerful untuk melihat detail arus keuangan",
                  "Kelola transaksi, invoice, & laporan (Export invoice, Laporan sebagai PDF/CSV)",
                  "Pantau stok inventory real-time — otomatis pengurangan stock",
                  "Manajemen Client — lihat seluruh invoice dari client",
                  "Notifikasi jatuh tempo otomatis",
                  "Import Massal Produk dari CSV",
                ]}
              />
            </AnimatedSection>

            <AnimatedSection delay={0.05}>
              <FeatureGroup
                title="AI-Powered Features"
                emoji="🤖"
                isNew
                items={[
                  "AI Scan Struk — foto struk, otomatis tercatat",
                  "AI Scan → Auto Stok — langsung masuk inventaris",
                  "AI Ringkasan Keuangan Bulanan",
                  "AI Health Score — skor kesehatan keuangan bisnis",
                ]}
              />
            </AnimatedSection>

            <AnimatedSection delay={0.1}>
              <FeatureGroup
                title="Kasir POS (Point of Sale)"
                emoji="🔥🔥🔥"
                isNew
                items={[
                  "Sistem kasir lengkap untuk penjualan langsung",
                  "Keranjang belanja, diskon, multi metode pembayaran",
                  "Cetak struk + QRIS Payment",
                  "Stok otomatis berkurang saat penjualan",
                ]}
              />
            </AnimatedSection>

            <AnimatedSection delay={0.15}>
              <FeatureGroup
                title="Manajemen Stok/Produk"
                emoji="🔥"
                items={[
                  "Tambah produk dengan foto",
                  "Kalkulator COGS/HPP berbasis komposisi bahan",
                  "Tracking stok & riwayat perubahan",
                  "Import produk via CSV",
                  "Alert stok rendah otomatis",
                ]}
              />
            </AnimatedSection>

            <AnimatedSection delay={0.2}>
              <FeatureGroup
                title="Manajemen Hutang & Piutang"
                emoji="🔥"
                items={[
                  "Tambah hutang/piutang",
                  "Tracking Pembayaran cicilan by status",
                  "Analisa Hutang/Piutang",
                  "Notifikasi jatuh tempo",
                ]}
              />
            </AnimatedSection>

            <AnimatedSection delay={0.25}>
              <FeatureGroup
                title="Transfer Antar Akun"
                emoji="🔥"
                items={[
                  "Transfer saldo antar bank/e-wallet (BCA → GoPay dll)",
                  "Auto update saldo kedua akun",
                  "Tercatat otomatis di riwayat transaksi",
                ]}
              />
            </AnimatedSection>

            <AnimatedSection delay={0.3}>
              <FeatureGroup
                title="Manajemen Bank dan Kas"
                emoji="🔥"
                items={[
                  "Buat Akun Bank dan Kas Tunai tanpa batas",
                  "Tracking pengeluaran per Bank",
                  "Auto Debit/Kredit untuk tiap pembuatan transaksi",
                ]}
              />
            </AnimatedSection>

            <AnimatedSection delay={0.35}>
              <FeatureGroup
                title="Perencanaan Anggaran Cerdas"
                emoji="🔥"
                isNew
                items={[
                  "Buat anggaran bulanan per kategori",
                  "Monitoring progress anggaran real-time",
                  "Alert otomatis jika melebihi anggaran",
                ]}
              />
            </AnimatedSection>

            <AnimatedSection delay={0.4}>
              <FeatureGroup
                title="Analitik Dashboard Penjualan"
                emoji="🔥"
                isNew
                items={[
                  "Grafik penjualan bulanan & harian",
                  "Top produk terlaris",
                  "Analisa per kategori & metode pembayaran",
                ]}
              />
            </AnimatedSection>

            <AnimatedSection delay={0.45}>
              <FeatureGroup
                title="Laporan Lengkap & Akurat"
                emoji="🔥"
                items={[
                  "Dashboard keuangan real-time",
                  "Laporan profit & loss otomatis",
                  "Laporan KPI performa bisnis",
                  "Export data ke CSV/Excel",
                ]}
              />
            </AnimatedSection>

            <AnimatedSection delay={0.5}>
              <FeatureGroup
                title="Kalkulator Pajak & Pencatatan"
                emoji="🔥"
                isNew
                items={[
                  "Hitung pajak UMKM otomatis (PP 55, PPh 21, PPN)",
                  "Pengingat jatuh tempo pajak",
                  "Riwayat pembayaran pajak",
                ]}
              />
            </AnimatedSection>

            {/* NEW Feature badges */}
            <AnimatedSection delay={0.55}>
              <div className="space-y-3 pt-4">
                {[
                  "Mini Kalkulator — aktifkan di halaman setting",
                  "Invoice Footer Feature (ttd & bank transfer rek)",
                  "Jurnal Keuangan Pribadi — mode khusus personal",
                  "PWA Support — install di HP seperti aplikasi native",
                  "Dua Mode: Pribadi & UMKM — switch kapan saja",
                ].map((feat, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600 shrink-0" />
                    <span className="text-sm">
                      <span className="text-red-500 font-bold">NEW🔥</span> — {feat}
                    </span>
                  </div>
                ))}
              </div>
            </AnimatedSection>

            {/* Free Update */}
            <AnimatedSection delay={0.6}>
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-2xl p-5 text-center border border-green-200 dark:border-green-800">
                <p className="text-lg font-extrabold text-green-700 dark:text-green-400">
                  🔥🔥 GRATIS UPDATE SELAMANYA 🔥🔥
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Semua fitur baru di masa depan, Anda dapatkan secara gratis
                </p>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ========== PRICE COMPARISON TABLE ========== */}
      <section id="perbandingan" className="px-4 py-16">
        <div className="max-w-lg mx-auto">
          <AnimatedSection className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2">
              Perbandingan Total Biaya
            </h2>
            <p className="text-sm text-muted-foreground">
              Aplikasi keuangan langganan bulanan vs County (sekali bayar)
            </p>
          </AnimatedSection>

          <AnimatedSection>
            <Card className="border-0 shadow-xl overflow-hidden">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-3 font-semibold text-xs">Aplikasi</th>
                        <th className="p-3 text-right font-semibold text-xs">Biaya 3 Tahun</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { name: "Mekari Jurnal (Essentials)", cost: "Rp 17.200.000", highlight: false },
                        { name: "Accurate Online (Dasar)", cost: "Rp 13.300.000", highlight: false },
                        { name: "Moka POS", cost: "Rp 10.764.000", highlight: false },
                        { name: "Kledo (Pro)", cost: "Rp 7.600.000", highlight: false },
                        { name: "Majoo", cost: "Rp 8.964.000", highlight: false },
                      ].map((row, i) => (
                        <tr key={i} className="border-b">
                          <td className="p-3 text-muted-foreground text-xs">{row.name}</td>
                          <td className="p-3 text-right text-muted-foreground text-xs font-medium">{row.cost}</td>
                        </tr>
                      ))}
                      <tr className="bg-primary/5 border-t-2 border-primary">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <img src={LOGO_URL} alt="County" className="h-5 w-5" />
                            <span className="font-bold text-primary text-sm">County (Lifetime)</span>
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          <span className="font-extrabold text-primary text-lg">{formatRp(SALE_PRICE)}</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </AnimatedSection>

          {/* Savings highlight */}
          <AnimatedSection className="mt-6">
            <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 rounded-2xl p-5 text-center border border-red-200 dark:border-red-800">
              <AlertTriangle className="h-6 w-6 text-red-500 mx-auto mb-2" />
              <p className="text-lg font-extrabold mb-1">
                Total yang Anda Hemat: <span className="text-red-500">{formatRp(ORIGINAL_PRICE - SALE_PRICE)}+</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Kompetitor menagih Rp 249.000 - Rp 349.000 <strong>setiap bulan</strong>.
                County cuma <strong>{formatRp(SALE_PRICE)} sekali seumur hidup</strong>.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ========== PRICING CARD ========== */}
      <section id="harga" className="px-4 py-16 bg-white dark:bg-card">
        <div className="max-w-lg mx-auto">
          <AnimatedSection className="text-center mb-6">
            <p className="text-base text-muted-foreground mb-2">
              Ya, saya ingin mengoptimalkan manajemen keuangan usaha saya, jadi berapa biaya investasinya?
            </p>
            <p className="text-sm text-muted-foreground">
              Dengan berbagai fitur dan kemudahan yang akan anda dapatkan, cukup investasikan
            </p>
            <p className="text-2xl font-extrabold text-red-500 line-through decoration-2 mt-2">
              {formatRp(ORIGINAL_PRICE)} saja
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Tanpa biaya bulanan dan aktif selamanya, cukup bayar sekali, gunakan selama-lamanya.
            </p>
          </AnimatedSection>

          <AnimatedSection className="text-center mb-8">
            <p className="text-sm text-muted-foreground mb-1">
              Eitts... Tapi tunggu dulu, Untuk <strong>pembeli tercepat</strong> kami akan berikan Harga spesial
            </p>
            <p className="text-sm text-muted-foreground">Dari :</p>
            <p className="text-xl text-muted-foreground line-through">{formatRp(ORIGINAL_PRICE)}</p>
            <p className="text-sm text-muted-foreground mt-1">Menjadi :</p>
            <p className="text-5xl md:text-6xl font-extrabold text-primary mt-2">
              {formatRp(SALE_PRICE)}
            </p>
          </AnimatedSection>

          {/* Pricing Card */}
          <AnimatedSection>
            <Card className="border-0 shadow-2xl overflow-hidden">
              <CardContent className="p-8">
                <div className="text-center space-y-6">
                  {/* Badge */}
                  <Badge className="bg-emerald-500 text-white border-0 text-sm font-semibold gap-1">
                    <Sparkles className="h-3.5 w-3.5" /> Penawaran Terbatas
                  </Badge>

                  {/* Title */}
                  <div>
                    <h3 className="text-2xl font-extrabold">Lisensi Lifetime, Satu Kali Bayar</h3>
                    <p className="text-sm text-muted-foreground mt-1">Akses selamanya tanpa biaya bulanan.</p>
                  </div>

                  {/* Price */}
                  <div className="flex items-center justify-center gap-3">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Harga Normal</p>
                      <p className="text-sm text-muted-foreground line-through">{formatRp(ORIGINAL_PRICE)}</p>
                    </div>
                    <div className="text-5xl font-extrabold text-primary">
                      {formatRp(SALE_PRICE)}
                    </div>
                  </div>

                  {/* Quota progress */}
                  <div>
                    <div className="flex items-center gap-2 justify-center text-sm mb-2">
                      <div className="h-4 w-4 rounded-full bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                      </div>
                      <span className="text-muted-foreground">Kuota Promo Tersedia</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(soldCount / (soldCount + quotaLeft)) * 100}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                      />
                    </div>
                    <div className="flex justify-between text-xs mt-1.5">
                      <span className="text-muted-foreground">Terjual: {soldCount}</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Kuota Promo Tersisa: {quotaLeft}</span>
                    </div>
                  </div>

                  {/* Countdown */}
                  <div>
                    <div className="flex items-center gap-2 justify-center text-sm mb-3">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Waktu Berakhir Dalam</span>
                    </div>
                    <div className="flex justify-center gap-3">
                      {[
                        { val: countdown.hours, label: "JAM" },
                        { val: countdown.minutes, label: "MENIT" },
                        { val: countdown.seconds, label: "DETIK" },
                      ].map((t, i) => (
                        <div key={i} className="text-center">
                          <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl px-4 py-3 min-w-[60px]">
                            <span className="text-3xl font-extrabold font-mono">{String(t.val).padStart(2, "0")}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground mt-1 block">{t.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </AnimatedSection>
        </div>
      </section>

      {/* ========== FEATURE COMPARISON (County vs Others) ========== */}
      <section className="px-4 py-16">
        <div className="max-w-lg mx-auto">
          <AnimatedSection className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2">
              Kenapa Pilih <span className="text-primary">County</span>?
            </h2>
          </AnimatedSection>

          <AnimatedSection>
            <Card className="border-0 shadow-xl overflow-hidden">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-3 font-semibold">Fitur</th>
                        <th className="p-3 text-center">
                          <div className="flex flex-col items-center gap-0.5">
                            <img src={LOGO_URL} alt="County" className="h-5 w-5" />
                            <span className="font-bold text-primary text-[10px]">County</span>
                          </div>
                        </th>
                        <th className="p-3 text-center text-muted-foreground">Moka</th>
                        <th className="p-3 text-center text-muted-foreground">Majoo</th>
                        <th className="p-3 text-center text-muted-foreground">Jurnal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { feature: "Model Bayar", county: "Sekali", moka: "Bulanan", majoo: "Bulanan", jurnal: "Bulanan" },
                        { feature: "AI Scan Struk", county: "check", moka: "x", majoo: "x", jurnal: "x" },
                        { feature: "AI Analisis", county: "check", moka: "x", majoo: "x", jurnal: "x" },
                        { feature: "Kasir POS", county: "check", moka: "check", majoo: "check", jurnal: "x" },
                        { feature: "Stok Produk", county: "check", moka: "check", majoo: "check", jurnal: "check" },
                        { feature: "Kalkulator HPP", county: "check", moka: "x", majoo: "x", jurnal: "x" },
                        { feature: "Kalkulator Pajak", county: "check", moka: "x", majoo: "x", jurnal: "check" },
                        { feature: "Hutang/Piutang", county: "check", moka: "x", majoo: "check", jurnal: "check" },
                        { feature: "Anggaran", county: "check", moka: "x", majoo: "x", jurnal: "check" },
                        { feature: "Jurnal Pribadi", county: "check", moka: "x", majoo: "x", jurnal: "x" },
                        { feature: "PWA (Install HP)", county: "check", moka: "x", majoo: "x", jurnal: "x" },
                        { feature: "QRIS Payment", county: "check", moka: "check", majoo: "check", jurnal: "x" },
                      ].map((row, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="p-2.5 font-medium">{row.feature}</td>
                          {["county", "moka", "majoo", "jurnal"].map((col) => {
                            const val = row[col as keyof typeof row];
                            return (
                              <td key={col} className="p-2.5 text-center">
                                {val === "check" ? (
                                  <Check className={`h-4 w-4 mx-auto ${col === "county" ? "text-green-600" : "text-green-500"}`} />
                                ) : val === "x" ? (
                                  <X className="h-4 w-4 mx-auto text-red-400" />
                                ) : (
                                  <span className={col === "county" ? "font-bold text-primary" : "text-muted-foreground"}>{val}</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </AnimatedSection>
        </div>
      </section>

      {/* ========== CTA SECTION ========== */}
      <section className="px-4 py-12 bg-gradient-to-r from-amber-400 to-yellow-400 dark:from-amber-600 dark:to-yellow-600">
        <div className="max-w-lg mx-auto text-center">
          <p className="text-sm font-bold text-gray-900 mb-1">
            Sebelum kuota promo terpenuhi, segera AMBIL dan amankan kesempatan harga spesial ini
          </p>
          <p className="text-xs text-gray-800 mb-4">
            Harga akan kembali normal ketika kuota promo telah terpenuhi.
          </p>
          <Button
            onClick={handleCTA}
            size="lg"
            className="w-full h-14 text-lg font-bold shadow-xl gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 rounded-xl"
          >
            <Zap className="h-5 w-5" /> Beli County Pro — {formatRp(SALE_PRICE)}
          </Button>
          <p className="text-xs text-gray-800 mt-3 font-semibold">
            Sekali bayar akses selamanya. Tanpa ada biaya bulanan.
          </p>
        </div>
      </section>

      {/* ========== TESTIMONIALS ========== */}
      <section id="testimoni" className="px-4 py-16 bg-white dark:bg-card">
        <div className="max-w-lg mx-auto">
          <AnimatedSection className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2">
              Dipercaya Pemilik Bisnis di Seluruh Indonesia
            </h2>
          </AnimatedSection>

          <div className="space-y-4">
            {[
              {
                name: "Rina Sari",
                role: "Pemilik Toko Kue, Bandung",
                text: "Dulu saya pakai Moka, bayar Rp 300rb tiap bulan. Sekarang pakai County, bayar sekali aja Rp 299rb. Fitur AI scan struk-nya luar biasa, tinggal foto langsung tercatat. Hemat banget!",
              },
              {
                name: "Ahmad Fauzi",
                role: "Pemilik Warung Makan, Surabaya",
                text: "Yang paling saya suka itu fitur scan struk langsung masuk stok. Dulu saya harus input satu-satu, sekarang tinggal foto struk belanja bahan, langsung masuk semua. Keren parah!",
              },
              {
                name: "Maya Putri",
                role: "Owner Coffee Shop, Jakarta",
                text: "Kalkulator HPP-nya membantu banget. Sekarang saya tahu persis berapa modal per cup kopi. Ternyata margin saya cuma 15%! Langsung saya adjust harga. Terima kasih County!",
              },
              {
                name: "Budi Santoso",
                role: "Distributor, Semarang",
                text: "Rp 299rb untuk selamanya itu gila sih, di tempat lain setahun bisa Rp 4 juta. Fitur lengkap, AI canggih, dan support cepat. No brainer!",
              },
              {
                name: "Dewi Lestari",
                role: "Pemilik Salon, Bali",
                text: "Laporan pajaknya membantu banget. Dulu saya bingung hitung pajak UMKM, sekarang County yang hitungin. AI ringkasannya juga kasih saran yang actionable.",
              },
              {
                name: "Hendra Wijaya",
                role: "Pemilik Toko Elektronik, Medan",
                text: "POS kasir-nya smooth, stok management-nya lengkap, dan yang paling penting MURAH. Bayar sekali doang. Sudah 6 bulan pakai, tidak ada masalah sama sekali.",
              },
            ].map((t, i) => (
              <AnimatedSection key={i} delay={i * 0.05}>
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex gap-0.5 mb-3">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed italic mb-3">"{t.text}"</p>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center text-white font-bold text-sm">
                        {t.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ========== FAQ SECTION ========== */}
      <section className="px-4 py-16">
        <div className="max-w-lg mx-auto">
          <AnimatedSection className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              FAQ
            </h2>
          </AnimatedSection>

          <AnimatedSection>
            <div>
              {[
                {
                  q: "Untuk siapa County dibuat?",
                  a: "County dirancang untuk siapa saja yang ingin mengelola keuangan secara profesional — mulai dari individu yang ingin mencatat keuangan pribadi, pemilik UMKM, freelancer, hingga startup. Ada dua mode: Jurnal Pribadi dan UMKM.",
                },
                {
                  q: "Apakah bisa diakses di HP dan Laptop?",
                  a: "Ya. County adalah web app yang responsive dan mendukung PWA (Progressive Web App). Anda bisa install County di HP seperti aplikasi native, dan juga akses dari laptop melalui browser.",
                },
                {
                  q: "Apakah saya perlu keahlian akuntansi?",
                  a: "Tidak sama sekali. County memiliki tampilan yang sangat ramah pengguna sehingga siapa pun bisa langsung menggunakannya. Ditambah AI yang membantu analisis keuangan secara otomatis.",
                },
                {
                  q: "Apakah data saya aman?",
                  a: "Tentu. Data Anda disimpan di server cloud terenkripsi dengan sistem autentikasi OAuth yang aman. Kami tidak pernah menjual atau membagikan data pengguna.",
                },
                {
                  q: "Apakah lisensinya lifetime?",
                  a: "Ya! Dengan sekali bayar Rp 299.000, Anda mendapatkan lisensi seumur hidup (lifetime). Tidak ada biaya langganan bulanan atau tahunan. Semua pembaruan fitur di masa mendatang juga gratis.",
                },
                {
                  q: "Bagaimana cara mendapatkan akses?",
                  a: "Klik tombol Beli, selesaikan pembayaran, lalu Anda akan mendapat akses langsung ke semua fitur Pro. Proses aktivasi cepat dan mudah.",
                },
                {
                  q: "Apakah benar bayar sekali saja?",
                  a: "Ya! Rp 299.000 sekali bayar, akses selamanya. Tidak ada biaya bulanan, tidak ada biaya tersembunyi. Semua fitur termasuk update di masa depan.",
                },
              ].map((faq, i) => (
                <FAQItem key={i} q={faq.q} a={faq.a} />
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ========== FINAL CTA ========== */}
      <section className="px-4 py-16 bg-gradient-to-b from-primary/5 to-emerald-500/5 dark:from-primary/10 dark:to-emerald-500/10">
        <div className="max-w-lg mx-auto text-center">
          <AnimatedSection>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-4">
              Jangan Tunda Lagi.
              <br />
              <span className="text-primary">Bisnis Anda Butuh County.</span>
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Setiap hari tanpa County, Anda kehilangan waktu berjam-jam untuk input manual.
              Mulai sekarang, biar AI yang kerja untuk Anda.
            </p>
            <Button
              onClick={handleCTA}
              size="lg"
              className="w-full h-14 text-lg font-bold shadow-xl gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 rounded-xl mb-3"
            >
              <Zap className="h-5 w-5" /> Dapatkan County Pro — {formatRp(SALE_PRICE)}
            </Button>
            <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
              <span className="line-through decoration-red-500">{formatRp(ORIGINAL_PRICE)}</span>
              <ArrowRight className="h-3 w-3" />
              <span className="font-bold text-primary">{formatRp(SALE_PRICE)} Lifetime</span>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="py-8 border-t bg-white dark:bg-card">
        <div className="max-w-lg mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <img src={LOGO_URL} alt="County" className="h-6 w-6" />
            <span className="font-bold">County</span>
          </div>
          <p className="text-xs text-muted-foreground mb-2">
            Aplikasi Keuangan All-in-One AI
          </p>
          <p className="text-xs text-muted-foreground">
            Terima kasih atas kepercayaan dalam menggunakan aplikasi kami
          </p>
          <p className="text-xs text-muted-foreground mt-4">
            &copy; {new Date().getFullYear()} County. All rights reserved.
          </p>
        </div>
      </footer>

      {/* ========== STICKY MOBILE CTA ========== */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 dark:bg-card/95 backdrop-blur-xl border-t p-3 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-xs text-muted-foreground line-through">{formatRp(ORIGINAL_PRICE)}</div>
            <div className="text-lg font-extrabold text-primary leading-tight">{formatRp(SALE_PRICE)}</div>
            <div className="text-[10px] text-muted-foreground">Lifetime · Sekali bayar</div>
          </div>
          <Button
            onClick={handleCTA}
            className="h-12 px-6 font-bold shadow-lg gap-1.5 shrink-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white border-0 rounded-xl"
          >
            <Zap className="h-4 w-4" /> Beli Sekarang
          </Button>
        </div>
      </div>
    </div>
  );
}

// ========== FEATURE GROUP COMPONENT ==========
function FeatureGroup({ title, emoji, items, isNew = false }: { title: string; emoji: string; items: string[]; isNew?: boolean }) {
  return (
    <div className="bg-[#f0f4f8] dark:bg-muted/30 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <Check className="h-5 w-5 text-green-600 shrink-0" />
        <h3 className="font-bold text-base">
          {isNew && <span className="text-red-500 mr-1">NEW🔥</span>}
          <span className="underline decoration-1 underline-offset-4">{title}</span>{" "}
          <span>{emoji}</span>
        </h3>
      </div>
      <ul className="space-y-2 ml-7">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
            <span className="text-muted-foreground mt-1 shrink-0">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
