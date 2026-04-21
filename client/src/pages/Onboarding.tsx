import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Building2, Receipt, CheckCircle2, ArrowRight, ArrowLeft, Sparkles,
  BookOpen, Store, ShoppingBag, User
} from "lucide-react";
import { BUSINESS_TYPES } from "../../../shared/finance";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const STEPS = [
  { title: "Pilih Mode", desc: "Sesuaikan dengan kebutuhan Anda", icon: User },
  { title: "Info Profil", desc: "Nama dan detail profil Anda", icon: Building2 },
  { title: "Status Pajak", desc: "Sesuaikan dengan profil pajak", icon: Receipt },
  { title: "Selesai!", desc: "Siap mulai mencatat keuangan", icon: CheckCircle2 },
];

const PERSONAL_STEPS = [
  { title: "Pilih Mode", desc: "Sesuaikan dengan kebutuhan Anda", icon: User },
  { title: "Info Profil", desc: "Nama profil keuangan Anda", icon: BookOpen },
  { title: "Selesai!", desc: "Siap mulai mencatat keuangan", icon: CheckCircle2 },
];

export default function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [appMode, setAppMode] = useState<"personal" | "umkm" | null>(null);
  const [form, setForm] = useState({
    businessName: "",
    slug: "",
    businessType: "retail",
    phone: "",
    npwp: "",
    isPkp: false,
    hasEmployees: false,
    employeeCount: 0,
    annualOmzetEstimate: 0,
    annualOmzetLabel: "",
  });

  const createBiz = trpc.business.create.useMutation({
    onSuccess: () => utils.business.mine.invalidate(),
    onError: (err) => toast.error(err.message),
  });
  const utils = trpc.useUtils();

  const steps = appMode === "personal" ? PERSONAL_STEPS : STEPS;

  const updateField = (key: string, value: any) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "businessName") {
        next.slug = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").substring(0, 100);
      }
      return next;
    });
  };

  const canNext = () => {
    if (step === 0) return appMode !== null;
    if (step === 1) return form.businessName.length >= 2;
    return true;
  };

  const handleSubmit = async () => {
    try {
      await createBiz.mutateAsync({
        slug: form.slug || form.businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-").substring(0, 100),
        businessName: form.businessName,
        businessType: appMode === "personal" ? "lainnya" : form.businessType,
        phone: form.phone || undefined,
        npwp: form.npwp || undefined,
        isPkp: form.isPkp,
        hasEmployees: form.hasEmployees,
        employeeCount: form.employeeCount,
        annualOmzetEstimate: form.annualOmzetEstimate,
        appMode: appMode || "umkm",
      });
      await utils.business.mine.invalidate();
      toast.success(appMode === "personal"
        ? "Jurnal keuangan Anda siap digunakan! 📖"
        : "Selamat! Bisnis Anda berhasil didaftarkan 🎉"
      );
      onComplete();
    } catch (err: any) {
      if (err?.data?.code === "CONFLICT" || err?.message?.includes("sudah memiliki bisnis")) {
        await utils.business.mine.invalidate();
        onComplete();
        return;
      }
      toast.error(err.message || "Gagal mendaftarkan");
    }
  };

  const omzetOptions = [
    { label: "< Rp 500 juta/tahun", value: 400000000, note: "Bebas PPh Final", emoji: "🟢" },
    { label: "Rp 500 juta - 4.8 miliar", value: 2000000000, note: "PPh Final 0.5%", emoji: "🟡" },
    { label: "> Rp 4.8 miliar", value: 5000000000, note: "Wajib PPh Badan", emoji: "🔴" },
  ];

  // Get the actual step content index based on mode
  const isPersonal = appMode === "personal";
  const isLastStep = step === steps.length - 1;
  const isConfirmStep = isLastStep;
  const isTaxStep = !isPersonal && step === 2;
  const isInfoStep = step === 1;
  const isModeStep = step === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/30 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo & Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2.5 mb-3 px-4 py-2 rounded-full bg-primary/10">
            <img src="/county-icon.png" alt="County" className="h-6 w-6" />
            <span className="text-xl font-bold text-primary">County</span>
          </div>
          <p className="text-muted-foreground text-sm">
            Setup cepat — hanya {steps.length} langkah
          </p>
        </motion.div>

        {/* Step Indicators */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                i < step ? "bg-primary text-primary-foreground" :
                i === step ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-110" :
                "bg-muted text-muted-foreground"
              }`}>
                {i < step ? "✓" : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={`w-8 sm:w-12 h-0.5 transition-colors duration-300 ${i < step ? "bg-primary" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="shadow-xl border-0 shadow-black/5">
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center gap-3 mb-2">
                  {(() => { const Icon = steps[step].icon; return <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center"><Icon className="h-5 w-5 text-primary" /></div>; })()}
                  <div>
                    <h2 className="text-lg font-bold">{steps[step].title}</h2>
                    <p className="text-sm text-muted-foreground">{steps[step].desc}</p>
                  </div>
                </div>

                {/* Step 0: Mode Selection */}
                {isModeStep && (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">County bisa digunakan untuk kebutuhan yang berbeda. Pilih yang sesuai:</p>
                    <div className="grid gap-3">
                      <button
                        onClick={() => setAppMode("personal")}
                        className={`text-left rounded-2xl border-2 p-5 transition-all ${
                          appMode === "personal"
                            ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10 shadow-md"
                            : "border-transparent bg-muted/50 hover:bg-muted hover:shadow-sm"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`h-12 w-12 rounded-xl flex items-center justify-center shadow-sm ${
                            appMode === "personal" ? "bg-gradient-to-br from-emerald-400 to-teal-500" : "bg-muted"
                          }`}>
                            <BookOpen className={`h-6 w-6 ${appMode === "personal" ? "text-white" : "text-muted-foreground"}`} />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-base">Jurnal Keuangan Pribadi</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Catat pemasukan & pengeluaran harian, lihat arus kas, dan kelola budget pribadi Anda.
                            </p>
                            <div className="flex flex-wrap gap-1.5 mt-2.5">
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium">Catat Keuangan</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium">Grafik Interaktif</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium">Laporan Bulanan</span>
                            </div>
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() => setAppMode("umkm")}
                        className={`text-left rounded-2xl border-2 p-5 transition-all ${
                          appMode === "umkm"
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/50 dark:bg-blue-900/10 shadow-md"
                            : "border-transparent bg-muted/50 hover:bg-muted hover:shadow-sm"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`h-12 w-12 rounded-xl flex items-center justify-center shadow-sm ${
                            appMode === "umkm" ? "bg-gradient-to-br from-[#1E4D9B] to-[#2563EB]" : "bg-muted"
                          }`}>
                            <Store className={`h-6 w-6 ${appMode === "umkm" ? "text-white" : "text-muted-foreground"}`} />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-base">UMKM / Bisnis</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Kelola stok, catat transaksi bisnis, hitung pajak, dan gunakan sistem POS kasir.
                            </p>
                            <div className="flex flex-wrap gap-1.5 mt-2.5">
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">Stok Produk</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">Laporan Laba Rugi</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">Pajak UMKM</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">POS Kasir</span>
                            </div>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 1: Profile Info */}
                {isInfoStep && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        {isPersonal ? "Nama Profil Keuangan" : "Nama Bisnis"}
                      </Label>
                      <Input
                        value={form.businessName}
                        onChange={(e) => updateField("businessName", e.target.value)}
                        placeholder={isPersonal ? "Contoh: Keuangan Pribadi Andi" : "Contoh: Toko Sejahtera"}
                        className="h-11"
                        autoFocus
                      />
                    </div>
                    {!isPersonal && (
                      <>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Tipe Bisnis</Label>
                          <Select value={form.businessType} onValueChange={(v) => updateField("businessType", v)}>
                            <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {BUSINESS_TYPES.map((t) => (
                                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">No. WhatsApp <span className="text-muted-foreground font-normal">(opsional)</span></Label>
                          <Input
                            value={form.phone}
                            onChange={(e) => updateField("phone", e.target.value)}
                            placeholder="08xxxxxxxxxx"
                            className="h-11"
                          />
                        </div>
                      </>
                    )}
                    {isPersonal && (
                      <div className="rounded-xl bg-emerald-50/50 dark:bg-emerald-900/10 p-4">
                        <p className="text-sm text-muted-foreground">
                          Mode Jurnal Pribadi memberikan tampilan yang lebih sederhana dan fokus ke pencatatan pemasukan & pengeluaran harian Anda.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 2: Tax Status (UMKM only) */}
                {isTaxStep && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Estimasi Omzet Tahunan</Label>
                      <div className="grid gap-2">
                        {omzetOptions.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => { updateField("annualOmzetEstimate", opt.value); updateField("annualOmzetLabel", opt.label); }}
                            className={`text-left rounded-xl border-2 p-3.5 transition-all ${
                              form.annualOmzetEstimate === opt.value
                                ? "border-primary bg-primary/5 shadow-sm"
                                : "border-transparent bg-muted/50 hover:bg-muted"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-lg">{opt.emoji}</span>
                              <div>
                                <p className="font-medium text-sm">{opt.label}</p>
                                <p className="text-xs text-muted-foreground">{opt.note}</p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-muted/50 p-4">
                      <div>
                        <p className="font-medium text-sm">Sudah PKP?</p>
                        <p className="text-xs text-muted-foreground">Pengusaha Kena Pajak</p>
                      </div>
                      <Switch checked={form.isPkp} onCheckedChange={(v) => updateField("isPkp", v)} />
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-muted/50 p-4">
                      <div>
                        <p className="font-medium text-sm">Punya karyawan?</p>
                        <p className="text-xs text-muted-foreground">Menentukan kewajiban PPh 21</p>
                      </div>
                      <Switch checked={form.hasEmployees} onCheckedChange={(v) => updateField("hasEmployees", v)} />
                    </div>

                    {form.hasEmployees && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Jumlah Karyawan</Label>
                        <Input
                          type="number"
                          value={form.employeeCount || ""}
                          onChange={(e) => updateField("employeeCount", parseInt(e.target.value) || 0)}
                          className="h-11"
                          placeholder="0"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Confirmation Step */}
                {isConfirmStep && (
                  <div className="space-y-4">
                    <div className="rounded-xl bg-gradient-to-br from-primary/5 to-accent/30 p-5 space-y-3">
                      <div className="flex items-center gap-2 text-primary">
                        <Sparkles className="h-5 w-5" />
                        <span className="font-semibold text-sm">Ringkasan</span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Mode</span>
                          <span className="font-medium">{isPersonal ? "Jurnal Pribadi" : "UMKM / Bisnis"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{isPersonal ? "Nama Profil" : "Nama Bisnis"}</span>
                          <span className="font-medium">{form.businessName}</span>
                        </div>
                        {!isPersonal && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Tipe</span>
                              <span className="font-medium">{BUSINESS_TYPES.find(t => t.value === form.businessType)?.label}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Est. Omzet</span>
                              <span className="font-medium">{form.annualOmzetLabel || "Belum dipilih"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">PKP</span>
                              <span className="font-medium">{form.isPkp ? "Ya" : "Tidak"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Karyawan</span>
                              <span className="font-medium">{form.hasEmployees ? `Ya (${form.employeeCount})` : "Tidak"}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="rounded-xl bg-muted/30 p-4 text-center">
                      <p className="text-sm text-muted-foreground">
                        Anda bisa mengubah mode dan pengaturan kapan saja di menu <strong>Pengaturan</strong>.
                      </p>
                    </div>

                    {/* Panduan Akuntansi CTA */}
                    {appMode === "umkm" && (
                      <a
                        href="/panduan-akuntansi"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-xl border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10 p-4 hover:border-emerald-400 transition-all group"
                      >
                        <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                          <BookOpen className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-emerald-800 dark:text-emerald-300">📚 Baca Panduan Akuntansi</p>
                          <p className="text-xs text-emerald-600/80 dark:text-emerald-400/70 mt-0.5">12 studi kasus tata cara pengisian County yang benar — ditulis untuk pebisnis</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-emerald-400 group-hover:translate-x-1 transition-transform" />
                      </a>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button
            variant="ghost"
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Button>
          {!isLastStep ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canNext()}
              className="gap-2 shadow-lg shadow-primary/20"
            >
              Lanjut <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={createBiz.isPending}
              className="gap-2 shadow-lg shadow-primary/20"
            >
              {createBiz.isPending ? "Menyimpan..." : isPersonal ? "Mulai Jurnal 📖" : "Mulai Gunakan County ✨"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
