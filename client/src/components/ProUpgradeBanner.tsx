import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Zap, X, Check, Star, Crown } from "lucide-react";

// ─── Scalev Payment Link ───
// Replace this with your actual Scalev product payment link
const SCALEV_PAYMENT_URL = "https://scalev.id/checkout/county-pro";

const PRO_FEATURES = [
  { icon: "📦", text: "Produk unlimited (Free: max 20)" },
  { icon: "💳", text: "Transaksi unlimited (Free: max 50/bulan)" },
  { icon: "📊", text: "Laporan keuangan lengkap (semua periode)" },
  { icon: "🧾", text: "Laporan pajak otomatis" },
  { icon: "🤖", text: "AI Scan struk & nota" },
  { icon: "📥", text: "Export PDF & Excel" },
  { icon: "🏪", text: "Multi-kasir & karyawan" },
];

export function ProUpgradeBanner() {
  const { data: planData } = trpc.business.getPlan.useQuery();
  const [dismissed, setDismissed] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Don't show if Pro or dismissed
  if (!planData || planData.isPro || dismissed) return null;

  return (
    <>
      {/* Sticky top banner */}
      <div className="relative flex items-center justify-between gap-3 bg-gradient-to-r from-[#1E4D9B] to-[#2563EB] text-white px-4 py-2.5 text-sm shadow-md">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Zap className="w-4 h-4 text-yellow-300 shrink-0" />
          <span className="font-medium">Anda menggunakan <strong>County Free</strong> — produk terbatas 20, transaksi 50/bulan.</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            className="bg-orange-500 hover:bg-orange-600 text-white border-0 h-7 px-3 text-xs font-semibold"
            onClick={() => setShowModal(true)}
          >
            <Crown className="w-3 h-3 mr-1" />
            Upgrade Pro — Rp 299rb
          </Button>
          <button
            onClick={() => setDismissed(true)}
            className="text-white/70 hover:text-white p-0.5 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Upgrade Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <Crown className="w-6 h-6 text-orange-500" />
              <DialogTitle className="text-xl">Upgrade ke County Pro</DialogTitle>
            </div>
            <DialogDescription className="text-base">
              Satu kali bayar, akses semua fitur selamanya.
            </DialogDescription>
          </DialogHeader>

          {/* Price */}
          <div className="bg-gradient-to-r from-[#1E4D9B] to-[#2563EB] rounded-xl p-4 text-white text-center my-2">
            <div className="text-3xl font-bold">Rp 299.000</div>
            <div className="text-blue-200 text-sm mt-1">Bayar sekali, pakai selamanya</div>
            <Badge className="bg-orange-500 text-white mt-2 text-xs">Hemat Rp 301.000 vs kompetitor/tahun</Badge>
          </div>

          {/* Features */}
          <div className="space-y-2 my-2">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Yang Anda dapatkan:</p>
            {PRO_FEATURES.map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-green-500 shrink-0" />
                <span>{f.icon} {f.text}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="flex flex-col gap-2 mt-2">
            <Button
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold h-11"
              onClick={() => {
                window.open(SCALEV_PAYMENT_URL, "_blank");
                setShowModal(false);
              }}
            >
              <Star className="w-4 h-4 mr-2" />
              Bayar Sekarang via Scalev
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Setelah pembayaran berhasil, akun Anda otomatis diupgrade ke Pro dalam 1–5 menit.
            </p>
            <Button variant="ghost" size="sm" onClick={() => setShowModal(false)} className="text-muted-foreground">
              Nanti saja
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Inline Pro Gate (for individual features) ───
interface ProGateProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ProGate({ feature, children, fallback }: ProGateProps) {
  const { data: planData } = trpc.business.getPlan.useQuery();
  const [showModal, setShowModal] = useState(false);

  if (!planData) return null;
  if (planData.isPro) return <>{children}</>;

  return (
    <>
      <div
        className="relative cursor-pointer group"
        onClick={() => setShowModal(true)}
      >
        <div className="opacity-50 pointer-events-none select-none">
          {fallback ?? children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-lg backdrop-blur-[1px]">
          <div className="flex items-center gap-1.5 bg-orange-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg">
            <Crown className="w-3 h-3" />
            Fitur Pro — {feature}
          </div>
        </div>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-orange-500" />
              Fitur Pro: {feature}
            </DialogTitle>
            <DialogDescription>
              Fitur ini hanya tersedia untuk pengguna County Pro.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-gradient-to-r from-[#1E4D9B] to-[#2563EB] rounded-xl p-4 text-white text-center">
            <div className="text-2xl font-bold">Rp 299.000</div>
            <div className="text-blue-200 text-sm">Bayar sekali, pakai selamanya</div>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold"
              onClick={() => { window.open(SCALEV_PAYMENT_URL, "_blank"); setShowModal(false); }}
            >
              <Star className="w-4 h-4 mr-2" />
              Upgrade ke Pro — Rp 299rb
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>Nanti saja</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
