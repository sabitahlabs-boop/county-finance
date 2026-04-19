import { useState, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { motion, useInView } from "framer-motion";
import {
  Check, X, ChevronDown, ArrowRight, Menu, XIcon,
  Camera, BarChart3, Calculator, Package, ShoppingCart, FileText,
  Brain, HandCoins, PiggyBank, BookOpen,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

// ─── Brand Tokens ───
const C = {
  teal: "#2BA48F",
  tealDark: "#238B79",
  navy: "#1E3A5F",
  cream: "#FAFAF7",
  orange: "#F59E0B",
  orangeLight: "#FEF3C7",
  success: "#34D399",
  gray50: "#F9FAFB",
  gray100: "#F3F4F6",
  gray200: "#E5E7EB",
  gray400: "#9CA3AF",
  gray500: "#6B7280",
  gray600: "#4B5563",
  gray700: "#374151",
  gray800: "#1F2937",
  gray900: "#111827",
  white: "#FFFFFF",
  danger: "#EF4444",
};

const LOGO_URL = "/county-icon.png";
const SALE_PRICE = 299000;
const ORIGINAL_PRICE = 2000000;
const WA_URL = "https://wa.me/6285693932042?text=Halo%2C%20saya%20tertarik%20dengan%20County";

// Unsplash images — Indonesian UMKM / small business transactions
const HERO_IMG = "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80"; // person at cafe register
const IMG_WARUNG = "https://images.unsplash.com/photo-1556740758-90de374c12ad?w=600&q=80"; // small shop transaction
const IMG_MARKET = "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=600&q=80"; // market seller
const IMG_CAFE = "https://images.unsplash.com/photo-1559305616-3f99cd43e353?w=600&q=80"; // barista/cafe

function formatRp(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

// ─── Animated wrapper ───
function Ani({ children, className = "", delay = 0, y = 30, style }: { children: React.ReactNode; className?: string; delay?: number; y?: number; style?: React.CSSProperties }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.55, delay, ease: "easeOut" }} className={className} style={style}>
      {children}
    </motion.div>
  );
}

// ─── FAQ Accordion ───
function FAQ({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: `1px solid ${C.gray200}` }}>
      <button onClick={() => setOpen(!open)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 0", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: "16px", color: C.navy, paddingRight: "16px" }}>{q}</span>
        <ChevronDown style={{ width: 20, height: 20, color: C.gray400, transition: "transform 0.3s", transform: open ? "rotate(180deg)" : "rotate(0)" }} />
      </button>
      <motion.div initial={false} animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }} transition={{ duration: 0.3 }} style={{ overflow: "hidden" }}>
        <p style={{ paddingBottom: "20px", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "15px", lineHeight: 1.7, color: C.gray500 }}>{a}</p>
      </motion.div>
    </div>
  );
}

// ─── Savings Calculator ───
function SavingsCalc({ buyUrl }: { buyUrl: string }) {
  const [years, setYears] = useState(3);
  const competitorMonthly = 150000;
  const competitorTotal = competitorMonthly * 12 * years;
  const savings = competitorTotal - SALE_PRICE;
  const savingsPercent = Math.round((savings / competitorTotal) * 100);

  return (
    <div style={{ background: C.white, borderRadius: "16px", padding: "32px", boxShadow: "0 4px 24px rgba(0,0,0,0.06)", border: `1px solid ${C.gray200}` }}>
      <div style={{ marginBottom: "24px" }}>
        <label style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "14px", fontWeight: 600, color: C.navy, display: "block", marginBottom: "12px" }}>
          Berapa lama Anda akan pakai aplikasi pembukuan?
        </label>
        <div style={{ display: "flex", gap: "8px" }}>
          {[1, 2, 3, 5].map(y => (
            <button key={y} onClick={() => setYears(y)} style={{
              flex: 1, padding: "10px", borderRadius: "10px", border: `2px solid ${years === y ? C.teal : C.gray200}`,
              background: years === y ? `${C.teal}10` : C.white, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 600, fontSize: "14px", color: years === y ? C.teal : C.gray500, transition: "all 0.2s",
            }}>
              {y} Tahun
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
        <div style={{ padding: "16px", borderRadius: "12px", background: "#FEE2E2" }}>
          <div style={{ fontSize: "12px", fontWeight: 600, color: C.danger, marginBottom: "4px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Aplikasi Lain ({years} tahun)</div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: C.danger, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{formatRp(competitorTotal)}</div>
          <div style={{ fontSize: "12px", color: C.gray500, marginTop: "2px" }}>{formatRp(competitorMonthly)}/bulan</div>
        </div>
        <div style={{ padding: "16px", borderRadius: "12px", background: "#DCFCE7" }}>
          <div style={{ fontSize: "12px", fontWeight: 600, color: "#16A34A", marginBottom: "4px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>County (selamanya)</div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "#16A34A", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{formatRp(SALE_PRICE)}</div>
          <div style={{ fontSize: "12px", color: C.gray500, marginTop: "2px" }}>Sekali bayar</div>
        </div>
      </div>

      <div style={{ textAlign: "center", padding: "16px", borderRadius: "12px", background: C.orangeLight, marginBottom: "20px" }}>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: "32px", fontWeight: 700, color: C.orange }}>HEMAT {savingsPercent}%</div>
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "14px", color: C.gray600 }}>Anda hemat <strong>{formatRp(savings)}</strong> dalam {years} tahun</div>
      </div>

      <a href={buyUrl} target="_blank" rel="noopener noreferrer" style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
        width: "100%", padding: "14px", borderRadius: "12px", background: C.teal, color: C.white,
        fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: "16px",
        textDecoration: "none", transition: "background 0.2s", border: "none", cursor: "pointer",
      }}>
        Beli Sekarang — {formatRp(SALE_PRICE)} <ArrowRight style={{ width: 18, height: 18 }} />
      </a>
    </div>
  );
}

// ─── Comparison row for competitor table ───
const competitors = [
  { name: "Jurnal.id", monthly: 499000 },
  { name: "Accurate", monthly: 300000 },
  { name: "Kledo", monthly: 149000 },
  { name: "BukuWarung", monthly: 0, label: "Gratis (fitur terbatas)" },
];

// ─── Main Landing Page ───
export default function LandingPage() {
  useAuth();
  const [mobileMenu, setMobileMenu] = useState(false);

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

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileMenu(false);
  };

  // Shared styles
  const heading = (size: string = "40px") => ({
    fontFamily: "'Fraunces', serif",
    fontSize: size,
    fontWeight: 700 as const,
    color: C.navy,
    lineHeight: 1.2,
    letterSpacing: "-0.5px",
  });

  const body = (size: string = "16px") => ({
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: size,
    lineHeight: 1.7,
    color: C.gray500,
  });

  return (
    <div style={{ background: C.cream, color: C.gray900, fontFamily: "'Plus Jakarta Sans', sans-serif", overflowX: "hidden" as const }}>

      {/* ═══════════════ NAV ═══════════════ */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: `${C.cream}F2`, backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${C.gray200}`,
      }}>
        <div style={{ maxWidth: "1120px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: "64px", padding: "0 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <img src={LOGO_URL} alt="County" style={{ height: 32, width: 32 }} />
            <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: "20px", color: C.navy }}>County</span>
          </div>

          {/* Desktop links */}
          <div style={{ display: "flex", alignItems: "center", gap: "32px" }} className="hidden md:flex">
            {[["fitur", "Fitur"], ["harga", "Harga"], ["faq", "FAQ"]].map(([id, label]) => (
              <button key={id} onClick={() => scrollTo(id)} style={{ background: "none", border: "none", cursor: "pointer", fontWeight: 500, fontSize: "14px", color: C.gray600 }}>{label}</button>
            ))}
            <button onClick={handleLogin} style={{ background: "none", border: "none", cursor: "pointer", fontWeight: 600, fontSize: "14px", color: C.navy }}>Masuk</button>
            <a href={WA_URL} target="_blank" rel="noopener noreferrer" style={{
              padding: "10px 20px", borderRadius: "10px", background: C.navy, color: C.white,
              fontWeight: 600, fontSize: "14px", textDecoration: "none", transition: "opacity 0.2s",
            }}>
              Tanya via WhatsApp
            </a>
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden" onClick={() => setMobileMenu(!mobileMenu)} style={{ background: "none", border: "none", cursor: "pointer", padding: "8px" }}>
            {mobileMenu ? <XIcon style={{ width: 24, height: 24, color: C.navy }} /> : <Menu style={{ width: 24, height: 24, color: C.navy }} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenu && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{ padding: "16px 24px 24px", borderTop: `1px solid ${C.gray200}`, background: C.cream }} className="md:hidden">
            {[["fitur", "Fitur"], ["harga", "Harga"], ["faq", "FAQ"]].map(([id, label]) => (
              <button key={id} onClick={() => scrollTo(id)} style={{ display: "block", width: "100%", textAlign: "left", padding: "12px 0", background: "none", border: "none", cursor: "pointer", fontWeight: 500, fontSize: "16px", color: C.gray600, borderBottom: `1px solid ${C.gray100}` }}>{label}</button>
            ))}
            <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
              <button onClick={handleLogin} style={{ flex: 1, padding: "12px", borderRadius: "10px", border: `1px solid ${C.gray200}`, background: C.white, cursor: "pointer", fontWeight: 600, fontSize: "14px", color: C.navy }}>Masuk</button>
              <a href={WA_URL} target="_blank" rel="noopener noreferrer" style={{ flex: 1, padding: "12px", borderRadius: "10px", background: C.navy, color: C.white, fontWeight: 600, fontSize: "14px", textDecoration: "none", textAlign: "center" }}>WhatsApp</a>
            </div>
          </motion.div>
        )}
      </nav>

      {/* ═══════════════ HERO ═══════════════ */}
      <section style={{ padding: "80px 24px 60px", maxWidth: "1120px", margin: "0 auto" }}>
        <div style={{ display: "grid", gap: "48px", alignItems: "center" }} className="grid-cols-1 md:grid-cols-2">
          <div>
            <Ani>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                padding: "6px 16px", borderRadius: "100px", background: `${C.teal}15`,
                marginBottom: "24px",
              }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.success, display: "inline-block" }} />
                <span style={{ fontWeight: 600, fontSize: "13px", color: C.teal, letterSpacing: "0.5px", textTransform: "uppercase" as const }}>
                  SEKALI BAYAR · PAKAI SELAMANYA
                </span>
              </div>
            </Ani>

            <Ani delay={0.1}>
              <h1 style={{ ...heading("48px"), marginBottom: "24px" }}>
                Pembukuan UMKM,{" "}
                <span style={{ fontStyle: "italic", color: C.teal }}>sekali bayar</span>{" "}
                beres selamanya.
              </h1>
            </Ani>

            <Ani delay={0.2}>
              <p style={{ ...body("18px"), marginBottom: "32px", maxWidth: "480px" }}>
                Satu aplikasi untuk jurnal keuangan, pembukuan, dan POS. Dirancang khusus buat UMKM Indonesia — nggak perlu langganan bulanan yang mahal.
              </p>
            </Ani>

            <Ani delay={0.3}>
              <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "12px", marginBottom: "20px" }}>
                <button onClick={handleCTA} style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  padding: "16px 28px", borderRadius: "12px", background: C.teal, color: C.white,
                  fontWeight: 700, fontSize: "16px", border: "none", cursor: "pointer", transition: "background 0.2s",
                }}>
                  Beli Sekarang — {formatRp(SALE_PRICE)} <ArrowRight style={{ width: 18, height: 18 }} />
                </button>
                <a href={WA_URL} target="_blank" rel="noopener noreferrer" style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  padding: "16px 28px", borderRadius: "12px", background: C.white, color: C.navy,
                  fontWeight: 600, fontSize: "16px", border: `1px solid ${C.gray200}`, textDecoration: "none", cursor: "pointer",
                }}>
                  Tanya via WhatsApp
                </a>
              </div>
            </Ani>

            <Ani delay={0.4}>
              <p style={{ fontSize: "13px", color: C.gray400 }}>
                Langsung pakai di browser · Tanpa install
              </p>
            </Ani>
          </div>

          {/* Hero image */}
          <Ani delay={0.2} className="hidden md:block">
            <div style={{ position: "relative" }}>
              <img src={HERO_IMG} alt="UMKM Indonesia melakukan transaksi" style={{
                width: "100%", height: "420px", objectFit: "cover" as const,
                borderRadius: "20px", boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
              }} />
              {/* Floating savings badge */}
              <div style={{
                position: "absolute", bottom: "-16px", left: "24px",
                padding: "12px 20px", borderRadius: "12px", background: C.orange,
                color: C.white, fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: "18px",
                boxShadow: "0 8px 24px rgba(245,158,11,0.3)",
              }}>
                HEMAT 92%
              </div>
            </div>
          </Ani>
        </div>
      </section>

      {/* ═══════════════ SOCIAL PROOF STRIP ═══════════════ */}
      <section style={{ padding: "32px 24px", borderTop: `1px solid ${C.gray200}`, borderBottom: `1px solid ${C.gray200}` }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", display: "flex", justifyContent: "center", gap: "48px", flexWrap: "wrap" as const, textAlign: "center" as const }}>
          {[
            ["500+", "UMKM Pengguna"],
            ["10rb+", "Transaksi Dicatat"],
            ["Rp 0", "Biaya Bulanan"],
            ["24/7", "Akses Kapan Saja"],
          ].map(([num, label], i) => (
            <div key={i}>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: "28px", fontWeight: 700, color: C.navy }}>{num}</div>
              <div style={{ fontSize: "13px", color: C.gray400, fontWeight: 500, marginTop: "4px" }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════ UMKM STORIES — Humanistic Images ═══════════════ */}
      <section style={{ padding: "80px 24px", maxWidth: "1120px", margin: "0 auto" }}>
        <Ani className="text-center" style={{ textAlign: "center" as const, marginBottom: "48px" }}>
          <p style={{ fontSize: "13px", fontWeight: 600, color: C.teal, textTransform: "uppercase" as const, letterSpacing: "1px", marginBottom: "12px" }}>CERITA UMKM</p>
          <h2 style={{ ...heading("36px") }}>
            Dari warung sampai kafe,{" "}
            <span style={{ fontStyle: "italic", color: C.teal }}>County mengerti</span>
          </h2>
        </Ani>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
          {[
            { img: IMG_WARUNG, title: "Warung & Toko Kelontong", desc: "Catat penjualan harian, kelola stok, dan lihat laporan laba rugi tanpa perlu belajar akuntansi." },
            { img: IMG_MARKET, title: "Pedagang Pasar", desc: "Dari catatan di buku tulis ke digital. Semua transaksi tercatat rapi di satu tempat." },
            { img: IMG_CAFE, title: "Kafe & Restoran", desc: "Sistem POS lengkap dengan multi-pembayaran, cetak struk, dan analitik penjualan." },
          ].map((item, i) => (
            <Ani key={i} delay={i * 0.1}>
              <div style={{ borderRadius: "16px", overflow: "hidden", background: C.white, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: `1px solid ${C.gray200}` }}>
                <img src={item.img} alt={item.title} style={{ width: "100%", height: "200px", objectFit: "cover" as const }} />
                <div style={{ padding: "24px" }}>
                  <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: "20px", fontWeight: 700, color: C.navy, marginBottom: "8px" }}>{item.title}</h3>
                  <p style={{ ...body("14px") }}>{item.desc}</p>
                </div>
              </div>
            </Ani>
          ))}
        </div>
      </section>

      {/* ═══════════════ FEATURES ═══════════════ */}
      <section id="fitur" style={{ padding: "80px 24px", background: C.white }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <Ani style={{ textAlign: "center" as const, marginBottom: "48px" }}>
            <p style={{ fontSize: "13px", fontWeight: 600, color: C.teal, textTransform: "uppercase" as const, letterSpacing: "1px", marginBottom: "12px" }}>FITUR LENGKAP</p>
            <h2 style={{ ...heading("36px"), marginBottom: "16px" }}>
              Semua yang bisnis Anda butuhkan,{" "}
              <span style={{ fontStyle: "italic", color: C.teal }}>dalam satu aplikasi</span>
            </h2>
            <p style={{ ...body(), maxWidth: "560px", margin: "0 auto" }}>
              Dari pencatatan transaksi sampai analisis AI — County menangani semuanya.
            </p>
          </Ani>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
            {[
              { icon: Camera, title: "AI Scan Struk", desc: "Foto struk belanja, AI otomatis mencatat transaksi dan update stok." },
              { icon: Brain, title: "AI Health Score", desc: "Skor kesehatan keuangan bisnis dari AI — lengkap dengan rekomendasi." },
              { icon: ShoppingCart, title: "Kasir POS", desc: "Sistem kasir lengkap: keranjang, diskon, multi pembayaran, cetak struk." },
              { icon: Package, title: "Manajemen Stok", desc: "Tracking inventaris real-time, alert stok rendah, import CSV." },
              { icon: FileText, title: "Laporan Otomatis", desc: "Laba rugi, arus kas, dan KPI bisnis — export ke PDF atau CSV." },
              { icon: HandCoins, title: "Hutang & Piutang", desc: "Kelola tagihan, cicilan, dan notifikasi jatuh tempo otomatis." },
              { icon: Calculator, title: "Pajak UMKM", desc: "Hitung otomatis PP 55, PPh 21, PPN — dengan pengingat jatuh tempo." },
              { icon: PiggyBank, title: "Anggaran Cerdas", desc: "Buat budget per kategori, pantau progress, dan alert saat melebihi." },
              { icon: BarChart3, title: "Analitik Penjualan", desc: "Grafik penjualan, produk terlaris, analisa per kategori & pembayaran." },
              { icon: BookOpen, title: "Jurnal Pribadi", desc: "Mode terpisah untuk keuangan pribadi — catatan, anggaran, dan laporan." },
            ].map((f, i) => (
              <Ani key={i} delay={i * 0.04}>
                <div style={{
                  padding: "24px", borderRadius: "14px", border: `1px solid ${C.gray200}`,
                  background: C.cream, display: "flex", gap: "16px", transition: "box-shadow 0.2s",
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: "10px",
                    background: `${C.teal}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <f.icon style={{ width: 22, height: 22, color: C.teal }} />
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 700, fontSize: "15px", color: C.navy, marginBottom: "4px" }}>{f.title}</h3>
                    <p style={{ fontSize: "13px", lineHeight: 1.6, color: C.gray500 }}>{f.desc}</p>
                  </div>
                </div>
              </Ani>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ COMPARISON TABLE ═══════════════ */}
      <section style={{ padding: "80px 24px", background: C.cream }}>
        <div style={{ maxWidth: "720px", margin: "0 auto" }}>
          <Ani style={{ textAlign: "center" as const, marginBottom: "40px" }}>
            <p style={{ fontSize: "13px", fontWeight: 600, color: C.teal, textTransform: "uppercase" as const, letterSpacing: "1px", marginBottom: "12px" }}>PERBANDINGAN</p>
            <h2 style={{ ...heading("36px") }}>
              Kenapa <span style={{ fontStyle: "italic", color: C.teal }}>County lebih hemat?</span>
            </h2>
          </Ani>

          <Ani>
            <div style={{ borderRadius: "16px", overflow: "hidden", border: `1px solid ${C.gray200}`, background: C.white }}>
              <table style={{ width: "100%", borderCollapse: "collapse" as const, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "14px" }}>
                <thead>
                  <tr style={{ background: C.navy }}>
                    <th style={{ padding: "14px 20px", textAlign: "left" as const, color: C.white, fontWeight: 600 }}>Aplikasi</th>
                    <th style={{ padding: "14px 20px", textAlign: "right" as const, color: C.white, fontWeight: 600 }}>Biaya / Bulan</th>
                    <th style={{ padding: "14px 20px", textAlign: "right" as const, color: C.white, fontWeight: 600 }}>1 Tahun</th>
                  </tr>
                </thead>
                <tbody>
                  {competitors.map((c, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${C.gray100}` }}>
                      <td style={{ padding: "14px 20px", color: C.gray700 }}>{c.name}</td>
                      <td style={{ padding: "14px 20px", textAlign: "right" as const, color: C.gray500 }}>
                        {c.monthly === 0 ? c.label : formatRp(c.monthly)}
                      </td>
                      <td style={{ padding: "14px 20px", textAlign: "right" as const, color: C.danger, fontWeight: 600 }}>
                        {c.monthly === 0 ? "-" : formatRp(c.monthly * 12)}
                      </td>
                    </tr>
                  ))}
                  <tr style={{ background: `${C.teal}08` }}>
                    <td style={{ padding: "14px 20px", fontWeight: 700, color: C.teal }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <img src={LOGO_URL} alt="" style={{ width: 20, height: 20 }} /> County
                      </div>
                    </td>
                    <td style={{ padding: "14px 20px", textAlign: "right" as const, fontWeight: 700, color: C.teal }}>Rp 0</td>
                    <td style={{ padding: "14px 20px", textAlign: "right" as const, fontWeight: 700, color: C.teal }}>{formatRp(SALE_PRICE)} (selamanya)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Ani>
        </div>
      </section>

      {/* ═══════════════ BEFORE / AFTER ═══════════════ */}
      <section style={{ padding: "80px 24px", background: C.white }}>
        <div style={{ maxWidth: "720px", margin: "0 auto" }}>
          <Ani style={{ textAlign: "center" as const, marginBottom: "40px" }}>
            <h2 style={{ ...heading("36px") }}>
              Dari manual jadi <span style={{ fontStyle: "italic", color: C.teal }}>otomatis</span>
            </h2>
          </Ani>

          <Ani>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: "12px" }}>
              {[
                { bad: "Pembukuan manual di Excel", good: "Pencatatan otomatis + AI" },
                { bad: "Bayar langganan bulanan", good: "Sekali bayar, akses selamanya" },
                { bad: "Laporan tidak akurat", good: "Real-time dan presisi" },
                { bad: "Data tersebar di banyak tempat", good: "Satu platform terpusat" },
                { bad: "Lupa bayar tagihan", good: "Notifikasi jatuh tempo otomatis" },
                { bad: "Input stok satu per satu", good: "AI Scan Struk, auto masuk stok" },
              ].map((item, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  padding: "14px 20px", borderRadius: "12px", background: C.cream, border: `1px solid ${C.gray200}`,
                }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#FEE2E2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <X style={{ width: 14, height: 14, color: C.danger }} />
                  </div>
                  <span style={{ fontSize: "14px", color: C.gray400, textDecoration: "line-through", flex: 1 }}>{item.bad}</span>
                  <ArrowRight style={{ width: 16, height: 16, color: C.gray400, flexShrink: 0 }} />
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#DCFCE7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Check style={{ width: 14, height: 14, color: "#16A34A" }} />
                  </div>
                  <span style={{ fontSize: "14px", fontWeight: 600, color: C.navy, flex: 1 }}>{item.good}</span>
                </div>
              ))}
            </div>
          </Ani>
        </div>
      </section>

      {/* ═══════════════ PRICING + CALCULATOR ═══════════════ */}
      <section id="harga" style={{ padding: "80px 24px", background: C.cream }}>
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <Ani style={{ textAlign: "center" as const, marginBottom: "40px" }}>
            <p style={{ fontSize: "13px", fontWeight: 600, color: C.teal, textTransform: "uppercase" as const, letterSpacing: "1px", marginBottom: "12px" }}>HARGA</p>
            <h2 style={{ ...heading("36px"), marginBottom: "16px" }}>
              Satu harga,{" "}
              <span style={{ fontStyle: "italic", color: C.teal }}>semua fitur</span>
            </h2>
            <p style={{ ...body(), maxWidth: "440px", margin: "0 auto" }}>
              Tanpa biaya bulanan. Bayar sekali, gunakan selamanya. Hitung sendiri berapa yang Anda hemat.
            </p>
          </Ani>

          <Ani>
            <SavingsCalc buyUrl={buyUrl} />
          </Ani>

          <Ani delay={0.1}>
            <div style={{ marginTop: "24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {[
                "Semua fitur tanpa batasan",
                "AI Scan Struk & Health Score",
                "Kasir POS lengkap",
                "Mode Pribadi + UMKM",
                "Laporan & analitik",
                "Free update selamanya",
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: C.gray600 }}>
                  <Check style={{ width: 16, height: 16, color: C.success, flexShrink: 0 }} />
                  {item}
                </div>
              ))}
            </div>
          </Ani>
        </div>
      </section>

      {/* ═══════════════ FAQ ═══════════════ */}
      <section id="faq" style={{ padding: "80px 24px", background: C.white }}>
        <div style={{ maxWidth: "640px", margin: "0 auto" }}>
          <Ani style={{ textAlign: "center" as const, marginBottom: "40px" }}>
            <p style={{ fontSize: "13px", fontWeight: 600, color: C.teal, textTransform: "uppercase" as const, letterSpacing: "1px", marginBottom: "12px" }}>FAQ</p>
            <h2 style={{ ...heading("36px") }}>Pertanyaan Umum</h2>
          </Ani>

          <Ani>
            <div>
              {[
                { q: "Untuk siapa County dibuat?", a: "County dirancang untuk siapa saja yang ingin mengelola keuangan secara profesional — mulai dari individu yang ingin mencatat keuangan pribadi, pemilik UMKM, freelancer, hingga startup. Ada dua mode: Jurnal Pribadi dan UMKM." },
                { q: "Apakah bisa diakses di HP dan Laptop?", a: "Ya! County adalah web app yang responsive dan mendukung PWA (Progressive Web App). Anda bisa install County di HP seperti aplikasi native, dan juga akses dari laptop melalui browser." },
                { q: "Apakah saya perlu keahlian akuntansi?", a: "Tidak sama sekali. County memiliki tampilan yang sangat ramah pengguna sehingga siapa pun bisa langsung menggunakannya. Ditambah AI yang membantu analisis keuangan secara otomatis." },
                { q: "Apakah data saya aman?", a: "Tentu. Data Anda disimpan di server cloud terenkripsi dengan sistem autentikasi OAuth yang aman. Kami tidak pernah menjual atau membagikan data pengguna." },
                { q: "Apakah benar bayar sekali saja?", a: "Ya. Rp 299.000 sekali bayar, akses selamanya. Tidak ada biaya bulanan, tidak ada biaya tersembunyi. Semua fitur termasuk update di masa depan." },
                { q: "Bagaimana cara mendapatkan akses?", a: "Klik tombol Beli, selesaikan pembayaran, lalu Anda akan mendapat akses langsung ke semua fitur. Proses aktivasi cepat dan mudah." },
              ].map((faq, i) => <FAQ key={i} q={faq.q} a={faq.a} />)}
            </div>
          </Ani>
        </div>
      </section>

      {/* ═══════════════ FINAL CTA ═══════════════ */}
      <section style={{ padding: "80px 24px", background: C.navy, textAlign: "center" as const }}>
        <div style={{ maxWidth: "560px", margin: "0 auto" }}>
          <Ani>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: "36px", fontWeight: 700, color: C.white, lineHeight: 1.2, marginBottom: "16px" }}>
              Siap kelola keuangan{" "}
              <span style={{ fontStyle: "italic", color: C.success }}>lebih baik?</span>
            </h2>
            <p style={{ fontSize: "16px", lineHeight: 1.7, color: "rgba(255,255,255,0.7)", marginBottom: "32px" }}>
              Bergabung dengan ratusan UMKM Indonesia yang sudah beralih ke County. Sekali bayar, pakai selamanya.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap" as const, justifyContent: "center", gap: "12px" }}>
              <button onClick={handleCTA} style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "16px 32px", borderRadius: "12px", background: C.teal, color: C.white,
                fontWeight: 700, fontSize: "16px", border: "none", cursor: "pointer",
              }}>
                Beli Sekarang — {formatRp(SALE_PRICE)} <ArrowRight style={{ width: 18, height: 18 }} />
              </button>
              <a href={WA_URL} target="_blank" rel="noopener noreferrer" style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "16px 32px", borderRadius: "12px", background: "rgba(255,255,255,0.1)", color: C.white,
                fontWeight: 600, fontSize: "16px", border: "1px solid rgba(255,255,255,0.2)", textDecoration: "none",
              }}>
                Tanya via WhatsApp
              </a>
            </div>
          </Ani>
        </div>
      </section>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer style={{ padding: "32px 24px", background: C.navy, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ maxWidth: "1120px", margin: "0 auto", display: "flex", flexWrap: "wrap" as const, alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <img src={LOGO_URL} alt="County" style={{ height: 24, width: 24 }} />
            <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: "16px", color: C.white }}>County</span>
            <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)" }}>Aplikasi Keuangan All-in-One</span>
          </div>
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)" }}>
            &copy; {new Date().getFullYear()} County. All rights reserved.
          </p>
        </div>
      </footer>

      {/* ═══════════════ STICKY MOBILE CTA ═══════════════ */}
      <div className="md:hidden" style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
        background: `${C.white}F5`, backdropFilter: "blur(16px)",
        borderTop: `1px solid ${C.gray200}`, padding: "12px 16px",
        boxShadow: "0 -4px 20px rgba(0,0,0,0.08)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "12px", color: C.gray400, textDecoration: "line-through" }}>{formatRp(ORIGINAL_PRICE)}</div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: "20px", fontWeight: 700, color: C.teal }}>{formatRp(SALE_PRICE)}</div>
            <div style={{ fontSize: "11px", color: C.gray400 }}>Lifetime</div>
          </div>
          <button onClick={handleCTA} style={{
            display: "flex", alignItems: "center", gap: "8px",
            padding: "14px 24px", borderRadius: "12px", background: C.teal, color: C.white,
            fontWeight: 700, fontSize: "15px", border: "none", cursor: "pointer",
          }}>
            Beli Sekarang <ArrowRight style={{ width: 16, height: 16 }} />
          </button>
        </div>
      </div>

      {/* Bottom padding for mobile sticky CTA */}
      <div className="md:hidden" style={{ height: "80px" }} />
    </div>
  );
}
