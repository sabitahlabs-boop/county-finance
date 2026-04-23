import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Store, ShoppingBag, UtensilsCrossed, Laptop, Factory, MoreHorizontal,
  ArrowRight, ArrowLeft, Check, Sparkles, BarChart3, Package, Receipt,
  Users, Truck, CreditCard, FileText, Calculator, Shield, Clock, Tag,
  Megaphone, Settings
} from "lucide-react";

// ─── Feature definitions (maps to sidebar items) ───
interface FeatureDef {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  layer: number;
  alwaysOn?: boolean;
  desc?: string;
}

export const ALL_FEATURES: FeatureDef[] = [
  // Layer 1 — Always on (not toggleable)
  { key: "dashboard", label: "Dashboard", icon: BarChart3, layer: 1, alwaysOn: true },
  { key: "transaksi", label: "Catat Transaksi", icon: Receipt, layer: 1, alwaysOn: true },
  { key: "stok", label: "Stok Produk", icon: Package, layer: 1, alwaysOn: true },
  { key: "laporan-simple", label: "Laporan Ringkas", icon: FileText, layer: 1, alwaysOn: true },
  { key: "pengaturan", label: "Pengaturan", icon: Settings, layer: 1, alwaysOn: true },
  { key: "panduan", label: "Panduan", icon: FileText, layer: 1, alwaysOn: true },

  // Layer 2 — Muncul saat aktif / toggle
  { key: "pos", label: "Kasir (POS)", icon: Store, layer: 2, desc: "Kasir untuk toko fisik / F&B" },
  { key: "shift", label: "Shift Kasir", icon: Clock, layer: 2, desc: "Kelola jadwal shift karyawan" },
  { key: "pelanggan", label: "Pelanggan", icon: Users, layer: 2, desc: "Database pelanggan & riwayat" },
  { key: "hutang", label: "Hutang & Piutang", icon: CreditCard, layer: 2, desc: "Lacak siapa hutang & siapa piutang" },
  { key: "po", label: "Purchase Order", icon: Truck, layer: 2, desc: "Pesan barang ke supplier" },
  { key: "invoice", label: "Invoice", icon: FileText, layer: 2, desc: "Buat & kirim invoice profesional" },
  { key: "pajak", label: "Pajak", icon: Calculator, layer: 2, desc: "Hitung & lapor pajak UMKM" },
  { key: "loyalty", label: "Program Loyalitas", icon: Tag, layer: 2, desc: "Poin & reward pelanggan setia" },
  { key: "barcode", label: "Barcode & Label", icon: Tag, layer: 2, desc: "Print barcode produk" },
  { key: "peringatan-stok", label: "Peringatan Stok", icon: Shield, layer: 2, desc: "Notifikasi stok hampir habis" },

  // Layer 3 — Power user
  { key: "laporan-detail", label: "Laporan Detail (16+)", icon: BarChart3, layer: 3, desc: "GL, mutasi, per-jam, per-produk, dll" },
  { key: "analitik", label: "Analitik", icon: BarChart3, layer: 3, desc: "Insight bisnis & tren" },
  { key: "fifo", label: "Valuasi FIFO", icon: Package, layer: 3, desc: "Valuasi stok metode FIFO" },
  { key: "jurnal", label: "Jurnal Penyesuaian", icon: FileText, layer: 3, desc: "Entry akuntansi manual" },
  { key: "rekening", label: "Manajemen Rekening", icon: CreditCard, layer: 3, desc: "Chart of accounts lengkap" },
  { key: "stok-advanced", label: "Stok Lanjutan", icon: Package, layer: 3, desc: "Kedaluwarsa, usia, riwayat stok" },
];

export type FeatureKey = string;

// ─── Presets based on business profile ───
const SCALE_PRESETS: Record<string, FeatureKey[]> = {
  pemula: [
    // Layer 1 only (always on) — nothing extra
  ],
  toko_aktif: [
    "pos", "shift", "pelanggan", "hutang", "po", "invoice", "peringatan-stok",
  ],
  bisnis_scale: [
    "pos", "shift", "pelanggan", "hutang", "po", "invoice", "pajak", "loyalty",
    "barcode", "peringatan-stok", "laporan-detail", "analitik", "fifo", "jurnal",
    "rekening", "stok-advanced",
  ],
};

// ─── Business type options ───
const BUSINESS_TYPES = [
  { value: "retail", label: "Toko / Retail", icon: ShoppingBag, desc: "Jual barang fisik" },
  { value: "fnb", label: "Makanan & Minuman", icon: UtensilsCrossed, desc: "Resto, kafe, catering" },
  { value: "online", label: "Online Shop", icon: Laptop, desc: "Jualan di marketplace / sosmed" },
  { value: "jasa", label: "Jasa / Freelance", icon: Store, desc: "Salon, bengkel, konsultan" },
  { value: "produksi", label: "Produksi / Manufaktur", icon: Factory, desc: "Bikin & jual produk sendiri" },
  { value: "lainnya", label: "Lainnya", icon: MoreHorizontal, desc: "Tipe bisnis lain" },
];

const SCALE_OPTIONS = [
  { value: "pemula", label: "Baru Mulai", desc: "< 10 transaksi/hari, kelola sendiri", emoji: "🌱" },
  { value: "toko_aktif", label: "Toko Aktif", desc: "10-50 transaksi/hari, punya karyawan", emoji: "🏪" },
  { value: "bisnis_scale", label: "Bisnis Scale-up", desc: "50+ transaksi/hari, multi-outlet / tim", emoji: "🚀" },
];

interface Props {
  currentBusinessType?: string;
  onComplete: () => void;
}

export default function BusinessProfileWizard({ currentBusinessType, onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [businessType, setBusinessType] = useState(currentBusinessType || "");
  const [businessScale, setBusinessScale] = useState("");
  const [selectedFeatures, setSelectedFeatures] = useState<FeatureKey[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const saveProfile = trpc.business.saveBusinessProfile.useMutation();
  const utils = trpc.useUtils();

  const toggleFeature = (key: FeatureKey) => {
    setSelectedFeatures(prev =>
      prev.includes(key) ? prev.filter(f => f !== key) : [...prev, key]
    );
  };

  const handleScaleSelect = (scale: string) => {
    setBusinessScale(scale);
    // Pre-fill features based on scale
    setSelectedFeatures([...SCALE_PRESETS[scale] || []]);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Always-on features + selected features
      const alwaysOn = ALL_FEATURES.filter(f => f.alwaysOn).map(f => f.key);
      const allEnabled = [...new Set([...alwaysOn, ...selectedFeatures])];

      await saveProfile.mutateAsync({
        businessType,
        businessScale,
        enabledFeatures: allEnabled,
      });
      utils.business.mine.invalidate();
      toast.success("Profil bisnis tersimpan! Sidebar sudah disesuaikan.");
      onComplete();
    } catch {
      toast.error("Gagal menyimpan profil");
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    // Step 0: Tipe Bisnis
    <div key="type" className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold">Bisnis kamu seperti apa?</h2>
        <p className="text-sm text-muted-foreground mt-1">Ini bantu kami sesuaikan tampilan County buat kamu</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {BUSINESS_TYPES.map(bt => {
          const Icon = bt.icon;
          const isSelected = businessType === bt.value;
          return (
            <button
              key={bt.value}
              onClick={() => setBusinessType(bt.value)}
              className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                isSelected
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border hover:border-primary/30 hover:bg-accent/50"
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-sm">{bt.label}</div>
                <div className="text-xs text-muted-foreground">{bt.desc}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>,

    // Step 1: Skala Bisnis
    <div key="scale" className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold">Seberapa besar bisnismu?</h2>
        <p className="text-sm text-muted-foreground mt-1">Kami sesuaikan fitur yang muncul berdasarkan kebutuhanmu</p>
      </div>
      <div className="space-y-3">
        {SCALE_OPTIONS.map(opt => {
          const isSelected = businessScale === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => handleScaleSelect(opt.value)}
              className={`w-full flex items-center gap-4 p-5 rounded-xl border-2 transition-all text-left ${
                isSelected
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border hover:border-primary/30 hover:bg-accent/50"
              }`}
            >
              <span className="text-3xl">{opt.emoji}</span>
              <div>
                <div className="font-semibold">{opt.label}</div>
                <div className="text-sm text-muted-foreground">{opt.desc}</div>
              </div>
              {isSelected && <Check className="w-5 h-5 text-primary ml-auto" />}
            </button>
          );
        })}
      </div>
    </div>,

    // Step 2: Fitur yang ingin diaktifkan
    <div key="features" className="space-y-4">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold">Pilih fitur yang kamu butuhkan</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Sudah kami rekomendasikan berdasarkan skalamu. Kamu bisa ubah kapan saja nanti.
        </p>
      </div>

      {/* Layer 2 features */}
      <div>
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Fitur Operasional</div>
        <div className="grid grid-cols-2 gap-2">
          {ALL_FEATURES.filter(f => f.layer === 2).map(feat => {
            const Icon = feat.icon;
            const isOn = selectedFeatures.includes(feat.key);
            return (
              <button
                key={feat.key}
                onClick={() => toggleFeature(feat.key)}
                className={`flex items-center gap-2.5 p-3 rounded-lg border transition-all text-left text-sm ${
                  isOn
                    ? "border-primary/40 bg-primary/5"
                    : "border-border hover:border-primary/20"
                }`}
              >
                <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                  isOn ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className={`font-medium text-xs ${isOn ? "text-foreground" : "text-muted-foreground"}`}>
                    {feat.label}
                  </div>
                </div>
                {isOn && <Check className="w-3.5 h-3.5 text-primary ml-auto shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Layer 3 features */}
      <div>
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Fitur Lanjutan</div>
        <div className="grid grid-cols-2 gap-2">
          {ALL_FEATURES.filter(f => f.layer === 3).map(feat => {
            const Icon = feat.icon;
            const isOn = selectedFeatures.includes(feat.key);
            return (
              <button
                key={feat.key}
                onClick={() => toggleFeature(feat.key)}
                className={`flex items-center gap-2.5 p-3 rounded-lg border transition-all text-left text-sm ${
                  isOn
                    ? "border-primary/40 bg-primary/5"
                    : "border-border hover:border-primary/20"
                }`}
              >
                <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                  isOn ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className={`font-medium text-xs ${isOn ? "text-foreground" : "text-muted-foreground"}`}>
                    {feat.label}
                  </div>
                </div>
                {isOn && <Check className="w-3.5 h-3.5 text-primary ml-auto shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>,

    // Step 3: Konfirmasi
    <div key="confirm" className="space-y-4">
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-bold">Siap! County disesuaikan untukmu</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Sidebar kamu akan menampilkan {selectedFeatures.length + ALL_FEATURES.filter(f => f.alwaysOn).length} fitur.
          <br />Kamu bisa ubah kapan saja di sidebar → <strong>"Jelajahi Fitur"</strong>.
        </p>
      </div>

      <Card className="bg-accent/30 border-accent">
        <CardContent className="pt-4 pb-3">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Fitur aktif:</div>
          <div className="flex flex-wrap gap-1.5">
            {ALL_FEATURES.filter(f => f.alwaysOn).map(f => (
              <span key={f.key} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                {f.label}
              </span>
            ))}
            {selectedFeatures.map(key => {
              const feat = ALL_FEATURES.find(f => f.key === key);
              return feat ? (
                <span key={key} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-medium">
                  {feat.label}
                </span>
              ) : null;
            })}
          </div>
        </CardContent>
      </Card>

      <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 p-3 text-sm text-blue-700 dark:text-blue-300">
        <strong>Tips:</strong> Setiap kali masuk, kamu bisa klik "Jelajahi Fitur" di sidebar untuk aktifkan fitur baru atau ubah klasifikasi bisnismu.
      </div>
    </div>,
  ];

  const canNext = step === 0 ? !!businessType
    : step === 1 ? !!businessScale
    : step === 2 ? true
    : true;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex items-center gap-1.5 mb-6">
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                i <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Step indicator */}
        <div className="text-xs text-muted-foreground mb-4">
          Langkah {step + 1} dari 4
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {steps[step]}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          {step > 0 ? (
            <Button variant="ghost" onClick={() => setStep(s => s - 1)}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Kembali
            </Button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <Button onClick={() => setStep(s => s + 1)} disabled={!canNext}>
              Lanjut <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Mulai Pakai County"} <Sparkles className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
