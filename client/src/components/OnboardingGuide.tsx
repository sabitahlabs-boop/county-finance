import { useState, useEffect, useCallback, useRef } from "react";
import { X, ChevronRight, ChevronLeft, Sparkles, BookOpen, ArrowRight, Lightbulb, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

// ─── Onboarding Step Definitions ───

export interface OnboardingStep {
  id: string;
  target: string; // CSS selector for the target element
  title: string;
  description: string;
  whyImportant?: string; // Explains WHY this feature matters
  tips?: string[]; // Quick tips for the feature
  position?: "top" | "bottom" | "left" | "right";
  page?: string;
}

// ─── PERSONAL MODE STEPS ───
const PERSONAL_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    target: "[data-onboarding='dashboard-title']",
    title: "Selamat Datang di County! 🎉",
    description: "Ini adalah Dashboard pribadi kamu — pusat kendali keuangan kamu. Di sini kamu bisa lihat total saldo semua rekening, pemasukan & pengeluaran bulan ini, dan sisa anggaran.",
    whyImportant: "Dashboard memberi gambaran cepat kondisi keuangan kamu tanpa harus buka satu-satu halaman. Cukup buka County, langsung tahu posisi keuangan hari ini.",
    tips: [
      "Cek dashboard setiap pagi untuk tahu sisa anggaran hari ini",
      "Perhatikan persentase perubahan — hijau artinya membaik, merah perlu perhatian"
    ],
    position: "bottom",
    page: "/",
  },
  {
    id: "quick-actions",
    target: "[data-onboarding='quick-actions']",
    title: "Aksi Cepat — Catat Dalam Hitungan Detik ⚡",
    description: "Tombol-tombol ini adalah jalan pintas untuk mencatat transaksi. Klik 'Pemasukan' untuk catat gaji, bonus, atau uang masuk. Klik 'Pengeluaran' untuk catat belanja, makan, atau tagihan. Klik 'Scan Struk' untuk foto struk belanja dan otomatis tercatat.",
    whyImportant: "Semakin cepat kamu mencatat, semakin akurat data keuangan kamu. Tombol aksi cepat ini dibuat supaya kamu tidak malas mencatat — cukup 5 detik per transaksi!",
    tips: [
      "Biasakan catat pengeluaran langsung setelah bayar — jangan ditunda",
      "Gunakan Scan Struk untuk belanja supermarket agar tidak perlu ketik manual",
      "Pilih kategori yang tepat supaya laporan bulanan kamu akurat"
    ],
    position: "bottom",
    page: "/",
  },
  {
    id: "ai-summary",
    target: "[data-onboarding='ai-summary']",
    title: "AI Analisis Keuangan 🤖",
    description: "County punya AI yang menganalisis pola keuangan kamu. Klik tombol 'Analisis' dan AI akan memberi skor kesehatan keuangan (1-100), menemukan pola pengeluaran boros, dan memberi saran konkret untuk menghemat.",
    whyImportant: "Banyak orang tidak sadar ke mana uang mereka pergi. AI ini seperti punya konsultan keuangan pribadi yang mengawasi pengeluaran kamu dan memberi peringatan dini.",
    tips: [
      "Jalankan analisis minimal 1x seminggu untuk pantau kesehatan keuangan",
      "Perhatikan saran AI — biasanya menemukan pengeluaran yang bisa dikurangi",
      "Skor di atas 70 artinya keuangan kamu sehat, di bawah 50 perlu perhatian serius"
    ],
    position: "bottom",
    page: "/",
  },
  {
    id: "kpi-cards",
    target: "[data-onboarding='kpi-cards']",
    title: "Kartu Ringkasan Keuangan 📊",
    description: "Empat kartu ini menunjukkan angka paling penting: Total Saldo (semua rekening digabung), Pemasukan bulan ini, Pengeluaran bulan ini, dan Sisa Anggaran. Persentase hijau/merah menunjukkan perbandingan dengan bulan lalu.",
    whyImportant: "Angka-angka ini adalah 'vital signs' keuangan kamu. Seperti tensi dan detak jantung untuk kesehatan tubuh — kalau angkanya tidak normal, kamu harus segera bertindak.",
    tips: [
      "Idealnya pemasukan > pengeluaran setiap bulan",
      "Sisa anggaran negatif berarti kamu sudah melebihi batas — segera kurangi pengeluaran",
      "Klik kartu untuk lihat detail breakdown per kategori"
    ],
    position: "top",
    page: "/",
  },
  {
    id: "sidebar-menu",
    target: "[data-onboarding='sidebar-menu']",
    title: "Menu Navigasi — Semua Fitur Ada di Sini 📋",
    description: "Sidebar ini berisi semua fitur County: Transaksi (catat pemasukan/pengeluaran), Tagihan & Anggaran (atur budget dan tagihan rutin), Tabungan Impian (nabung untuk tujuan tertentu), Laporan (lihat grafik keuangan), dan Pengaturan.",
    whyImportant: "Setiap menu punya fungsi spesifik. Tidak perlu bingung — mulai dari 'Transaksi' untuk catat harian, lalu cek 'Laporan' di akhir bulan untuk evaluasi.",
    tips: [
      "Mulai dari catat transaksi harian dulu — ini fondasi semua fitur lain",
      "Atur anggaran bulanan di 'Tagihan & Anggaran' supaya pengeluaran terkontrol",
      "Cek 'Laporan' di akhir bulan untuk lihat ke mana uang kamu pergi"
    ],
    position: "right",
    page: "/",
  },
  {
    id: "panduan-link",
    target: "[data-onboarding='panduan-link']",
    title: "Butuh Bantuan? Panduan Lengkap Ada di Sini 📖",
    description: "Klik 'Panduan' kapan saja untuk buka panduan lengkap County. Ada penjelasan step-by-step untuk setiap fitur, contoh penggunaan nyata, dan FAQ. Kamu juga bisa download versi PDF untuk dibaca offline.",
    whyImportant: "Tidak perlu hafal semua fitur sekarang. Panduan ini selalu tersedia — kapan pun kamu bingung, tinggal klik dan cari jawabannya.",
    tips: [
      "Bookmark halaman panduan di browser kamu",
      "Download PDF panduan untuk dibaca saat offline",
      "Klik 'Mulai Ulang Tur' di halaman panduan kalau mau lihat tur ini lagi"
    ],
    position: "right",
    page: "/",
  },
];

// ─── UMKM MODE STEPS ───
const UMKM_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    target: "[data-onboarding='dashboard-title']",
    title: "Selamat Datang di County UMKM! 🏪",
    description: "Ini adalah Dashboard bisnis kamu. Di sini kamu bisa lihat omzet harian/bulanan, laba bersih, jumlah transaksi, dan estimasi pajak. Semua data real-time dari transaksi yang kamu catat.",
    whyImportant: "Sebagai pemilik bisnis, kamu harus tahu kondisi bisnis setiap hari. Dashboard ini seperti cockpit pesawat — semua indikator penting ada di satu layar.",
    tips: [
      "Cek dashboard setiap pagi sebelum buka toko",
      "Bandingkan omzet hari ini vs kemarin untuk tahu tren",
      "Perhatikan laba bersih, bukan cuma omzet — omzet besar belum tentu untung"
    ],
    position: "bottom",
    page: "/",
  },
  {
    id: "quick-actions",
    target: "[data-onboarding='quick-actions']",
    title: "Aksi Cepat — Catat Transaksi Bisnis ⚡",
    description: "Tombol 'Pemasukan' untuk catat penjualan atau uang masuk. 'Pengeluaran' untuk catat biaya operasional (beli bahan, bayar listrik, dll). 'Scan Struk' untuk foto nota belanja bahan baku dan otomatis tercatat. 'Buka Kasir' untuk mulai mode POS kasir.",
    whyImportant: "Setiap transaksi yang tidak dicatat = uang yang hilang tanpa jejak. Dengan mencatat semua, kamu bisa tahu persis berapa untung/rugi bisnis kamu.",
    tips: [
      "Catat SEMUA pengeluaran bisnis, sekecil apapun — Rp 5.000 untuk plastik pun penting",
      "Gunakan 'Scan Struk' untuk belanja bahan baku — hemat waktu 90%",
      "Pisahkan uang pribadi dan uang bisnis — jangan dicampur"
    ],
    position: "bottom",
    page: "/",
  },
  {
    id: "ai-summary",
    target: "[data-onboarding='ai-summary']",
    title: "AI Analisis Bisnis 🤖",
    description: "AI County menganalisis data bisnis kamu dan memberi skor kesehatan bisnis (1-100). AI juga menemukan tren penjualan, produk terlaris, jam ramai, dan memberi rekomendasi strategi bisnis.",
    whyImportant: "Data tanpa analisis = angka mati. AI ini mengubah data transaksi kamu jadi insight yang actionable — misalnya 'Penjualan turun 20% di hari Senin, coba buat promo khusus Senin'.",
    tips: [
      "Semakin banyak data transaksi, semakin akurat analisis AI",
      "Jalankan analisis di awal bulan untuk evaluasi bulan lalu",
      "Ikuti rekomendasi AI dan bandingkan hasilnya bulan depan"
    ],
    position: "bottom",
    page: "/",
  },
  {
    id: "kpi-cards",
    target: "[data-onboarding='kpi-cards']",
    title: "Kartu KPI Bisnis 📊",
    description: "Empat angka kunci bisnis: Omzet (total penjualan), Pengeluaran (biaya operasional), Laba Bersih (omzet - pengeluaran), dan Estimasi Pajak. Persentase menunjukkan perbandingan dengan bulan lalu.",
    whyImportant: "KPI ini menjawab pertanyaan paling penting: 'Apakah bisnis saya menghasilkan uang?' Laba bersih positif = bisnis sehat. Negatif = perlu evaluasi segera.",
    tips: [
      "Laba bersih idealnya minimal 20% dari omzet",
      "Kalau pengeluaran naik tapi omzet stagnan, cari tahu penyebabnya",
      "Estimasi pajak membantu kamu siap-siap bayar pajak, tidak kaget di akhir tahun"
    ],
    position: "top",
    page: "/",
  },
  {
    id: "sidebar-menu",
    target: "[data-onboarding='sidebar-menu']",
    title: "Menu Navigasi UMKM 📋",
    description: "Semua fitur bisnis ada di sini: Transaksi (catat jual/beli), Stok Produk (kelola inventaris), Gudang (multi-gudang), Kasir POS (mode kasir), Laporan (grafik bisnis), Pajak (hitung pajak), dan Pengaturan.",
    whyImportant: "County dirancang agar semua kebutuhan bisnis ada dalam satu aplikasi. Tidak perlu pakai Excel, buku tulis, atau aplikasi terpisah lagi.",
    tips: [
      "Mulai dari input produk di 'Stok Produk', lalu gunakan 'Kasir POS' untuk jual",
      "Cek 'Gudang' kalau punya lebih dari 1 lokasi penyimpanan",
      "Buka 'Laporan' setiap minggu untuk pantau tren bisnis"
    ],
    position: "right",
    page: "/",
  },
  {
    id: "panduan-link",
    target: "[data-onboarding='panduan-link']",
    title: "Panduan Lengkap & Bantuan 📖",
    description: "Klik 'Panduan' untuk buka panduan lengkap County dengan 30+ topik. Ada penjelasan detail setiap fitur, contoh penggunaan nyata (Toko Kue Ibu Ani), dan FAQ. Tersedia juga versi PDF untuk download offline.",
    whyImportant: "Tidak perlu hafal semua sekarang. Panduan ini selalu ada — tinggal klik kapan pun kamu butuh bantuan.",
    tips: [
      "Download PDF panduan untuk training karyawan baru",
      "Klik 'Mulai Ulang Tur' di halaman panduan kalau mau lihat tur ini lagi",
      "Bagikan link panduan ke karyawan yang baru pakai County"
    ],
    position: "right",
    page: "/",
  },
];

const ONBOARDING_KEY = "county-onboarding-completed";
const ONBOARDING_STEP_KEY = "county-onboarding-step";

// ─── Tooltip Spotlight Component ───

function TooltipSpotlight({ 
  step, 
  currentIndex, 
  totalSteps, 
  onNext, 
  onPrev, 
  onSkip, 
  onFinish 
}: { 
  step: OnboardingStep; 
  currentIndex: number; 
  totalSteps: number; 
  onNext: () => void; 
  onPrev: () => void; 
  onSkip: () => void; 
  onFinish: () => void;
}) {
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const [showTips, setShowTips] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const isLast = currentIndex === totalSteps - 1;

  useEffect(() => {
    setShowTips(false); // Reset tips when step changes
    const el = document.querySelector(step.target);
    if (el) {
      const rect = el.getBoundingClientRect();
      setPosition({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height,
      });
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [step.target]);

  // Calculate tooltip position
  const getTooltipStyle = (): React.CSSProperties => {
    const padding = 16;
    const tooltipWidth = 380;
    
    switch (step.position) {
      case "bottom":
        return {
          top: position.top + position.height + padding,
          left: Math.max(padding, Math.min(position.left, window.innerWidth - tooltipWidth - padding)),
        };
      case "top":
        return {
          top: Math.max(padding, position.top - padding - (showTips ? 420 : 280)),
          left: Math.max(padding, Math.min(position.left, window.innerWidth - tooltipWidth - padding)),
        };
      case "right":
        return {
          top: position.top,
          left: Math.min(position.left + position.width + padding, window.innerWidth - tooltipWidth - padding),
        };
      case "left":
        return {
          top: position.top,
          left: Math.max(padding, position.left - tooltipWidth - padding),
        };
      default:
        return {
          top: position.top + position.height + padding,
          left: Math.max(padding, position.left),
        };
    }
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 z-[9998] bg-black/50 transition-opacity duration-300"
        onClick={onSkip}
      />
      
      {/* Spotlight cutout */}
      <div
        className="fixed z-[9999] rounded-xl ring-4 ring-blue-400/60 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] transition-all duration-500"
        style={{
          top: position.top - 6,
          left: position.left - 6,
          width: position.width + 12,
          height: position.height + 12,
          pointerEvents: "none",
        }}
      />

      {/* Tooltip card */}
      <motion.div
        ref={tooltipRef}
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.3, type: "spring" }}
        className="fixed z-[10000] w-[380px] max-w-[90vw] rounded-2xl bg-white dark:bg-gray-900 dark:bg-slate-800 shadow-2xl border border-border/50 overflow-hidden"
        style={getTooltipStyle()}
      >
        {/* Progress bar */}
        <div className="h-1.5 bg-muted">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500 rounded-r-full"
            style={{ width: `${((currentIndex + 1) / totalSteps) * 100}%` }}
          />
        </div>

        <div className="p-5">
          {/* Step counter */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 dark:bg-blue-900/30 px-2.5 py-1 rounded-full">
              Langkah {currentIndex + 1} dari {totalSteps}
            </span>
            <button 
              onClick={onSkip}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Content */}
          <h3 className="text-base font-bold text-foreground mb-2">{step.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">{step.description}</p>

          {/* Why Important - always visible */}
          {step.whyImportant && (
            <div className="bg-amber-50 dark:bg-amber-950 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 mb-3">
              <div className="flex items-start gap-2">
                <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-amber-800 dark:text-amber-200 dark:text-amber-300 mb-0.5">Kenapa ini penting?</p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">{step.whyImportant}</p>
                </div>
              </div>
            </div>
          )}

          {/* Tips - expandable */}
          {step.tips && step.tips.length > 0 && (
            <div className="mb-3">
              <button
                onClick={() => setShowTips(!showTips)}
                className="flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:text-blue-300 transition-colors"
              >
                <Info className="h-3.5 w-3.5" />
                {showTips ? "Sembunyikan tips" : `Lihat ${step.tips.length} tips praktis`}
                <ChevronRight className={`h-3 w-3 transition-transform ${showTips ? "rotate-90" : ""}`} />
              </button>
              <AnimatePresence>
                {showTips && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2 bg-blue-50 dark:bg-blue-950 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 space-y-1.5">
                      {step.tips.map((tip, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="text-blue-500 text-xs mt-0.5 shrink-0">💡</span>
                          <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">{tip}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-1">
            <div>
              {currentIndex > 0 && (
                <Button variant="ghost" size="sm" onClick={onPrev} className="text-xs gap-1">
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Kembali
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onSkip} className="text-xs text-muted-foreground">
                Lewati
              </Button>
              {isLast ? (
                <Button size="sm" onClick={onFinish} className="text-xs gap-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                  Selesai! 🎉
                  <Sparkles className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <Button size="sm" onClick={onNext} className="text-xs gap-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                  Lanjut
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// ─── Welcome Modal ───

function WelcomeModal({ onStart, onSkip, mode }: { onStart: () => void; onSkip: () => void; mode?: string }) {
  const isPersonal = mode === "personal";
  
  return (
    <>
      <div className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm" onClick={onSkip} />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.4, type: "spring" }}
        className="fixed z-[9999] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[440px] max-w-[90vw] rounded-3xl bg-white dark:bg-gray-900 dark:bg-slate-800 shadow-2xl overflow-hidden"
      >
        {/* Gradient header */}
        <div className={`p-8 text-center ${isPersonal 
          ? "bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600" 
          : "bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600"
        }`}>
          <div className="h-16 w-16 mx-auto rounded-2xl bg-white dark:bg-gray-900/20 backdrop-blur flex items-center justify-center mb-4">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Selamat Datang di County!
          </h2>
          <p className="text-white/80 text-sm">
            {isPersonal 
              ? "Aplikasi jurnal keuangan pribadi yang cerdas dan mudah digunakan"
              : "Aplikasi akuntansi & manajemen bisnis terlengkap untuk UMKM Indonesia"
            }
          </p>
        </div>

        <div className="p-6">
          {/* Feature highlights */}
          <div className="grid grid-cols-2 gap-2 mb-5">
            {isPersonal ? (
              <>
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 text-center">
                  <p className="text-lg mb-0.5">💰</p>
                  <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Catat Keuangan</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950 dark:bg-blue-900/20 rounded-xl p-3 text-center">
                  <p className="text-lg mb-0.5">📊</p>
                  <p className="text-xs font-medium text-blue-700 dark:text-blue-300">Laporan Otomatis</p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-950 dark:bg-purple-900/20 rounded-xl p-3 text-center">
                  <p className="text-lg mb-0.5">🎯</p>
                  <p className="text-xs font-medium text-purple-700 dark:text-purple-300">Tabungan Impian</p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-950 dark:bg-amber-900/20 rounded-xl p-3 text-center">
                  <p className="text-lg mb-0.5">🤖</p>
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-300">AI Analisis</p>
                </div>
              </>
            ) : (
              <>
                <div className="bg-blue-50 dark:bg-blue-950 dark:bg-blue-900/20 rounded-xl p-3 text-center">
                  <p className="text-lg mb-0.5">🏪</p>
                  <p className="text-xs font-medium text-blue-700 dark:text-blue-300">Kasir POS</p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 text-center">
                  <p className="text-lg mb-0.5">📦</p>
                  <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Stok & Gudang</p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-950 dark:bg-purple-900/20 rounded-xl p-3 text-center">
                  <p className="text-lg mb-0.5">📊</p>
                  <p className="text-xs font-medium text-purple-700 dark:text-purple-300">Laporan Bisnis</p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-950 dark:bg-amber-900/20 rounded-xl p-3 text-center">
                  <p className="text-lg mb-0.5">🤖</p>
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-300">AI Analisis</p>
                </div>
              </>
            )}
          </div>

          <p className="text-sm text-muted-foreground mb-5 text-center">
            Mau kami tunjukkan fitur-fitur utama County?<br/>
            Tur interaktif ini hanya butuh <strong>1 menit</strong> dan akan menjelaskan <strong>kenapa setiap fitur penting</strong>.
          </p>

          <div className="space-y-3">
            <Button 
              onClick={onStart} 
              className={`w-full gap-2 h-11 text-sm font-semibold ${isPersonal
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              }`}
            >
              <BookOpen className="h-4 w-4" />
              Mulai Tur Panduan
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              onClick={onSkip} 
              className="w-full text-muted-foreground text-sm"
            >
              Nanti saja, saya sudah paham
            </Button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// ─── Main Onboarding Guide Component ───

export default function OnboardingGuide({ mode }: { mode?: string }) {
  const [isActive, setIsActive] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  const isPersonal = mode === "personal";
  const steps = isPersonal ? PERSONAL_STEPS : UMKM_STEPS;

  useEffect(() => {
    // Check if onboarding has been completed
    const completed = localStorage.getItem(ONBOARDING_KEY);
    if (!completed) {
      // Show welcome modal after a short delay
      const timer = setTimeout(() => setShowWelcome(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const startTour = useCallback(() => {
    setShowWelcome(false);
    setCurrentStep(0);
    setIsActive(true);
  }, []);

  const skipTour = useCallback(() => {
    setShowWelcome(false);
    setIsActive(false);
    localStorage.setItem(ONBOARDING_KEY, "true");
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, steps.length]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const finishTour = useCallback(() => {
    setIsActive(false);
    localStorage.setItem(ONBOARDING_KEY, "true");
  }, []);

  return (
    <AnimatePresence>
      {showWelcome && (
        <WelcomeModal onStart={startTour} onSkip={skipTour} mode={mode} />
      )}
      {isActive && steps[currentStep] && (
        <TooltipSpotlight
          step={steps[currentStep]}
          currentIndex={currentStep}
          totalSteps={steps.length}
          onNext={nextStep}
          onPrev={prevStep}
          onSkip={skipTour}
          onFinish={finishTour}
        />
      )}
    </AnimatePresence>
  );
}

// ─── Re-trigger button (for Panduan page or settings) ───

export function RestartOnboardingButton() {
  const handleRestart = () => {
    localStorage.removeItem(ONBOARDING_KEY);
    localStorage.removeItem(ONBOARDING_STEP_KEY);
    window.location.href = "/";
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleRestart}
      className="gap-2"
    >
      <Sparkles className="h-4 w-4" />
      Mulai Ulang Tur Panduan
    </Button>
  );
}
