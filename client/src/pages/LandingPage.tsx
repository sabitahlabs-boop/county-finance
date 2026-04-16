import { useState, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { motion, useInView } from "framer-motion";
import {
  Camera, BarChart3, Calculator, Package, ShoppingCart, FileText,
  Brain, Sparkles, Shield, Zap, Check, X,
  ChevronRight, ArrowRight, ChevronDown,
  Lock, BookOpen, Wallet, HandCoins, PiggyBank, Bell
} from "lucide-react";
import { trpc } from "@/lib/trpc";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663380060214/BWbi9ugLsQu4nq5jm7TSFB/county-logo-new_8e4282c5.png";
const SALE_PRICE = 299000;
const ORIGINAL_PRICE = 2000000;

function formatRp(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

function AnimatedSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 px-1 text-left hover:opacity-80 transition-opacity"
      >
        <span className="font-semibold text-sm pr-4">{q}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <p className="pb-4 px-1 text-sm text-muted-foreground leading-relaxed">{a}</p>
      </motion.div>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="flex gap-4 p-4 rounded-xl border border-border/60 bg-card">
      <div className="h-10 w-10 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <p className="font-semibold text-sm mb-1">{title}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

export default function LandingPage() {
  useAuth();

  const [refCode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("ref") || "";
  });

  const { data: affiliateData } = trpc.affiliate.resolve.useQuery(
    { refCode },
    { enabled: !!refCode, staleTime: Infinity }
  );

  const DEFAULT_SCALEV_URL = "https://county.myscalev.com/p/county";
  const buyUrl = affiliateData?.scalevUrl || DEFAULT_SCALEV_URL;

  const handleCTA = () => window.open(buyUrl, "_blank");
  const handleLogin = () => { window.location.href = getLoginUrl(); };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

      {/* ─── Nav Bar ─── */}
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border/50">
        <div className="max-w-4xl mx-auto flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2.5">
            <img src={LOGO_URL} alt="County" className="h-7 w-7" />
            <span className="font-bold text-foreground">County</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleLogin} className="text-sm">
              Masuk
            </Button>
            <Button size="sm" onClick={handleCTA} className="text-sm gap-1.5">
              Coba Sekarang <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="pt-16 pb-12 md:pt-24 md:pb-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Badge variant="secondary" className="mb-6 text-xs gap-1.5">
              <Sparkles className="h-3 w-3" /> AI-Powered Finance App
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-5xl font-bold tracking-tight leading-tight mb-5"
          >
            Kelola keuangan bisnis dan pribadi dalam{" "}
            <span className="text-primary">satu platform</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base md:text-lg text-muted-foreground mb-8 max-w-lg mx-auto"
          >
            Pencatatan otomatis, laporan real-time, dan AI yang membantu analisis keuangan Anda. Dirancang untuk UMKM Indonesia.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Button size="lg" onClick={handleCTA} className="w-full sm:w-auto gap-2">
              Mulai Sekarang — {formatRp(SALE_PRICE)} <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={handleLogin} className="w-full sm:w-auto">
              Masuk ke Akun
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-6 mt-8 text-xs text-muted-foreground"
          >
            <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-success" /> Sekali bayar, akses selamanya</span>
            <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-success" /> Free update selamanya</span>
            <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-success" /> Tanpa biaya bulanan</span>
          </motion.div>
        </div>
      </section>

      {/* ─── Trust Signals ─── */}
      <section className="py-8 px-4 border-y border-border/50 bg-muted/30">
        <div className="max-w-3xl mx-auto grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-foreground">500+</p>
            <p className="text-xs text-muted-foreground">Pengguna aktif</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">24/7</p>
            <p className="text-xs text-muted-foreground">Akses kapan saja</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">2 Mode</p>
            <p className="text-xs text-muted-foreground">Pribadi & UMKM</p>
          </div>
        </div>
      </section>

      {/* ─── Features Grid ─── */}
      <section id="fitur" className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <AnimatedSection className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">
              Semua yang bisnis Anda butuhkan
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Dari pencatatan transaksi sampai analisis AI — County menangani semuanya.
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AnimatedSection><FeatureCard icon={Camera} title="AI Scan Struk" description="Foto struk belanja, AI otomatis mencatat transaksi dan update stok." /></AnimatedSection>
            <AnimatedSection delay={0.05}><FeatureCard icon={Brain} title="AI Health Score" description="Skor kesehatan keuangan bisnis dari AI — lengkap dengan rekomendasi." /></AnimatedSection>
            <AnimatedSection delay={0.1}><FeatureCard icon={ShoppingCart} title="Kasir POS" description="Sistem kasir lengkap: keranjang, diskon, multi pembayaran, cetak struk." /></AnimatedSection>
            <AnimatedSection delay={0.15}><FeatureCard icon={Package} title="Manajemen Stok" description="Tracking inventaris real-time, alert stok rendah, import CSV, COGS calculator." /></AnimatedSection>
            <AnimatedSection delay={0.2}><FeatureCard icon={FileText} title="Laporan Otomatis" description="Laba rugi, arus kas, dan KPI bisnis — export ke PDF atau CSV." /></AnimatedSection>
            <AnimatedSection delay={0.25}><FeatureCard icon={HandCoins} title="Hutang & Piutang" description="Kelola tagihan, cicilan, dan notifikasi jatuh tempo otomatis." /></AnimatedSection>
            <AnimatedSection delay={0.3}><FeatureCard icon={Calculator} title="Pajak UMKM" description="Hitung otomatis PP 55, PPh 21, PPN — dengan pengingat jatuh tempo." /></AnimatedSection>
            <AnimatedSection delay={0.35}><FeatureCard icon={PiggyBank} title="Anggaran Cerdas" description="Buat budget per kategori, pantau progress, dan alert saat melebihi." /></AnimatedSection>
            <AnimatedSection delay={0.4}><FeatureCard icon={BarChart3} title="Analitik Penjualan" description="Grafik penjualan, produk terlaris, analisa per kategori & pembayaran." /></AnimatedSection>
            <AnimatedSection delay={0.45}><FeatureCard icon={BookOpen} title="Jurnal Pribadi" description="Mode terpisah untuk keuangan pribadi — catatan, anggaran, dan laporan." /></AnimatedSection>
          </div>
        </div>
      </section>

      {/* ─── Comparison: Before / After ─── */}
      <section className="py-16 px-4 bg-muted/30 border-y border-border/50">
        <div className="max-w-2xl mx-auto">
          <AnimatedSection className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
              Dari manual jadi otomatis
            </h2>
          </AnimatedSection>

          <AnimatedSection>
            <div className="space-y-3">
              {[
                { bad: "Pembukuan manual di Excel", good: "Pencatatan otomatis + AI" },
                { bad: "Bayar langganan bulanan", good: "Sekali bayar, akses selamanya" },
                { bad: "Laporan tidak akurat", good: "Real-time dan presisi" },
                { bad: "Data tersebar di banyak tempat", good: "Satu platform terpusat" },
                { bad: "Lupa bayar tagihan", good: "Notifikasi jatuh tempo otomatis" },
                { bad: "Input stok satu per satu", good: "AI Scan Struk, auto masuk stok" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border/60">
                  <div className="h-6 w-6 rounded-full bg-danger/10 flex items-center justify-center shrink-0">
                    <X className="h-3 w-3 text-danger" />
                  </div>
                  <span className="text-sm text-muted-foreground line-through flex-1">{item.bad}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <div className="h-6 w-6 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                    <Check className="h-3 w-3 text-success" />
                  </div>
                  <span className="text-sm font-medium flex-1">{item.good}</span>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section id="harga" className="py-16 px-4">
        <div className="max-w-md mx-auto">
          <AnimatedSection className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">
              Satu harga, semua fitur
            </h2>
            <p className="text-sm text-muted-foreground">
              Tanpa biaya bulanan. Bayar sekali, gunakan selamanya.
            </p>
          </AnimatedSection>

          <AnimatedSection>
            <Card className="border-2 border-primary/20 shadow-lg">
              <CardContent className="p-8">
                <div className="text-center space-y-5">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Lisensi Lifetime</p>
                    <div className="flex items-baseline justify-center gap-2">
                      <span className="text-sm text-muted-foreground line-through">{formatRp(ORIGINAL_PRICE)}</span>
                      <span className="text-4xl font-bold text-primary">{formatRp(SALE_PRICE)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Sekali bayar, akses selamanya</p>
                  </div>

                  <div className="space-y-2.5 text-left">
                    {[
                      "Semua fitur tanpa batasan",
                      "AI Scan Struk & Health Score",
                      "Kasir POS lengkap",
                      "Mode Pribadi + UMKM",
                      "Laporan & analitik",
                      "Free update selamanya",
                      "PWA — install di HP",
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2.5 text-sm">
                        <Check className="h-4 w-4 text-success shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>

                  <Button size="lg" onClick={handleCTA} className="w-full gap-2">
                    Dapatkan County — {formatRp(SALE_PRICE)} <ArrowRight className="h-4 w-4" />
                  </Button>

                  <p className="text-xs text-muted-foreground">
                    Hemat {formatRp(ORIGINAL_PRICE - SALE_PRICE)} dari harga normal
                  </p>
                </div>
              </CardContent>
            </Card>
          </AnimatedSection>
        </div>
      </section>

      {/* ─── Why County vs Others ─── */}
      <section className="py-16 px-4 bg-muted/30 border-y border-border/50">
        <div className="max-w-3xl mx-auto">
          <AnimatedSection className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">
              Kenapa County?
            </h2>
          </AnimatedSection>

          <AnimatedSection>
            <Card className="border shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-medium text-muted-foreground">Fitur</th>
                      <th className="p-3 text-center font-semibold text-primary">County</th>
                      <th className="p-3 text-center font-medium text-muted-foreground">Kompetitor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { feature: "AI Scan Struk", county: true, others: false },
                      { feature: "AI Health Score", county: true, others: false },
                      { feature: "Mode Pribadi + UMKM", county: true, others: false },
                      { feature: "Kasir POS", county: true, others: true },
                      { feature: "Manajemen Stok", county: true, others: true },
                      { feature: "Laporan Keuangan", county: true, others: true },
                      { feature: "Tanpa biaya bulanan", county: true, others: false },
                      { feature: "Biaya 3 tahun", county: "Rp 299rb", others: "Rp 5-10jt+" },
                    ].map((row, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="p-3 text-sm">{row.feature}</td>
                        <td className="p-3 text-center">
                          {typeof row.county === "boolean" ? (
                            row.county ? <Check className="h-4 w-4 text-success mx-auto" /> : <X className="h-4 w-4 text-muted-foreground mx-auto" />
                          ) : (
                            <span className="font-semibold text-success">{row.county}</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {typeof row.others === "boolean" ? (
                            row.others ? <Check className="h-4 w-4 text-muted-foreground mx-auto" /> : <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />
                          ) : (
                            <span className="text-muted-foreground">{row.others}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </AnimatedSection>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <AnimatedSection className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Pertanyaan Umum</h2>
          </AnimatedSection>

          <AnimatedSection>
            <div>
              {[
                { q: "Untuk siapa County dibuat?", a: "County dirancang untuk siapa saja yang ingin mengelola keuangan secara profesional — mulai dari individu yang ingin mencatat keuangan pribadi, pemilik UMKM, freelancer, hingga startup. Ada dua mode: Jurnal Pribadi dan UMKM." },
                { q: "Apakah bisa diakses di HP dan Laptop?", a: "Ya. County adalah web app yang responsive dan mendukung PWA (Progressive Web App). Anda bisa install County di HP seperti aplikasi native, dan juga akses dari laptop melalui browser." },
                { q: "Apakah saya perlu keahlian akuntansi?", a: "Tidak sama sekali. County memiliki tampilan yang sangat ramah pengguna sehingga siapa pun bisa langsung menggunakannya. Ditambah AI yang membantu analisis keuangan secara otomatis." },
                { q: "Apakah data saya aman?", a: "Tentu. Data Anda disimpan di server cloud terenkripsi dengan sistem autentikasi OAuth yang aman. Kami tidak pernah menjual atau membagikan data pengguna." },
                { q: "Apakah benar bayar sekali saja?", a: "Ya. Rp 299.000 sekali bayar, akses selamanya. Tidak ada biaya bulanan, tidak ada biaya tersembunyi. Semua fitur termasuk update di masa depan." },
                { q: "Bagaimana cara mendapatkan akses?", a: "Klik tombol Beli, selesaikan pembayaran, lalu Anda akan mendapat akses langsung ke semua fitur. Proses aktivasi cepat dan mudah." },
              ].map((faq, i) => (
                <FAQItem key={i} q={faq.q} a={faq.a} />
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="py-16 px-4 bg-muted/30 border-t border-border/50">
        <div className="max-w-lg mx-auto text-center">
          <AnimatedSection>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4">
              Siap kelola keuangan lebih baik?
            </h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              Bergabung dengan ratusan UMKM Indonesia yang sudah beralih ke County.
            </p>
            <Button size="lg" onClick={handleCTA} className="gap-2 mb-3">
              Dapatkan County — {formatRp(SALE_PRICE)} <ArrowRight className="h-4 w-4" />
            </Button>
            <p className="text-xs text-muted-foreground">
              Lisensi lifetime. Tanpa biaya bulanan.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="py-8 border-t bg-card">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={LOGO_URL} alt="County" className="h-5 w-5" />
            <span className="font-semibold text-sm">County</span>
            <span className="text-xs text-muted-foreground">Aplikasi Keuangan All-in-One AI</span>
          </div>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} County. All rights reserved.
          </p>
        </div>
      </footer>

      {/* ─── Sticky Mobile CTA ─── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card/95 backdrop-blur-xl border-t p-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-xs text-muted-foreground line-through">{formatRp(ORIGINAL_PRICE)}</div>
            <div className="text-lg font-bold text-primary leading-tight">{formatRp(SALE_PRICE)}</div>
            <div className="text-[10px] text-muted-foreground">Lifetime</div>
          </div>
          <Button onClick={handleCTA} className="h-11 px-5 font-semibold shrink-0 gap-1.5">
            Beli Sekarang <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Bottom padding for mobile sticky CTA */}
      <div className="h-20 md:hidden" />
    </div>
  );
}
