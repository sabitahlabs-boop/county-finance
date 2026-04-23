import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ALL_FEATURES, type FeatureKey } from "./BusinessProfileWizard";
import { Check, X, Compass, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  currentFeatures: string[];
  businessScale: string;
  onClose: () => void;
  onSaved: () => void;
}

const SCALE_LABELS: Record<string, string> = {
  pemula: "🌱 Baru Mulai",
  toko_aktif: "🏪 Toko Aktif",
  bisnis_scale: "🚀 Bisnis Scale-up",
};

export default function FeatureExplorer({ currentFeatures, businessScale, onClose, onSaved }: Props) {
  const [features, setFeatures] = useState<string[]>(currentFeatures);
  const [isSaving, setIsSaving] = useState(false);

  const updateFeatures = trpc.business.updateEnabledFeatures.useMutation();
  const utils = trpc.useUtils();

  const toggleFeature = (key: string) => {
    setFeatures(prev =>
      prev.includes(key) ? prev.filter(f => f !== key) : [...prev, key]
    );
  };

  const hasChanges = JSON.stringify([...features].sort()) !== JSON.stringify([...currentFeatures].sort());

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const alwaysOn = ALL_FEATURES.filter(f => f.alwaysOn).map(f => f.key);
      const allEnabled = [...new Set([...alwaysOn, ...features])];
      await updateFeatures.mutateAsync({ enabledFeatures: allEnabled });
      utils.business.mine.invalidate();
      toast.success("Fitur sidebar diperbarui!");
      onSaved();
    } catch {
      toast.error("Gagal menyimpan");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleableFeatures = ALL_FEATURES.filter(f => !f.alwaysOn);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-lg max-h-[85vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Compass className="w-4 h-4 text-primary" />
              </div>
              <div>
                <div className="font-semibold text-sm">Jelajahi Fitur</div>
                <div className="text-xs text-muted-foreground">
                  Profilmu: {SCALE_LABELS[businessScale] || businessScale}
                </div>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-accent flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Info banner */}
          <div className="px-4 pt-3">
            <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 p-2.5 text-xs text-blue-700 dark:text-blue-300">
              Aktifkan atau nonaktifkan fitur di bawah. Fitur yang dimatikan hanya disembunyikan dari sidebar — datamu tetap aman dan bisa diaktifkan kembali kapan saja.
            </div>
          </div>

          {/* Feature list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Always-on */}
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Selalu Aktif
              </div>
              <div className="space-y-1">
                {ALL_FEATURES.filter(f => f.alwaysOn).map(feat => {
                  const Icon = feat.icon;
                  return (
                    <div key={feat.key} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-accent/40 text-sm">
                      <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center">
                        <Icon className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <span className="font-medium text-xs">{feat.label}</span>
                      <span className="ml-auto text-xs text-muted-foreground">Wajib</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Layer 2 */}
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Fitur Operasional
              </div>
              <div className="space-y-1">
                {toggleableFeatures.filter(f => f.layer === 2).map(feat => {
                  const Icon = feat.icon;
                  const isOn = features.includes(feat.key);
                  return (
                    <button
                      key={feat.key}
                      onClick={() => toggleFeature(feat.key)}
                      className={`w-full flex items-center gap-2.5 p-2.5 rounded-lg transition-all text-left text-sm ${
                        isOn ? "bg-primary/5 border border-primary/20" : "hover:bg-accent/50 border border-transparent"
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-md flex items-center justify-center ${
                        isOn ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-xs">{feat.label}</div>
                        {"desc" in feat && <div className="text-[10px] text-muted-foreground">{feat.desc}</div>}
                      </div>
                      <div className={`w-8 h-5 rounded-full transition-all flex items-center px-0.5 ${
                        isOn ? "bg-primary" : "bg-muted"
                      }`}>
                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                          isOn ? "translate-x-3" : "translate-x-0"
                        }`} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Layer 3 */}
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Fitur Lanjutan
              </div>
              <div className="space-y-1">
                {toggleableFeatures.filter(f => f.layer === 3).map(feat => {
                  const Icon = feat.icon;
                  const isOn = features.includes(feat.key);
                  return (
                    <button
                      key={feat.key}
                      onClick={() => toggleFeature(feat.key)}
                      className={`w-full flex items-center gap-2.5 p-2.5 rounded-lg transition-all text-left text-sm ${
                        isOn ? "bg-primary/5 border border-primary/20" : "hover:bg-accent/50 border border-transparent"
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-md flex items-center justify-center ${
                        isOn ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-xs">{feat.label}</div>
                        {"desc" in feat && <div className="text-[10px] text-muted-foreground">{feat.desc}</div>}
                      </div>
                      <div className={`w-8 h-5 rounded-full transition-all flex items-center px-0.5 ${
                        isOn ? "bg-primary" : "bg-muted"
                      }`}>
                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                          isOn ? "translate-x-3" : "translate-x-0"
                        }`} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={onClose}>Batal</Button>
            <Button size="sm" onClick={handleSave} disabled={!hasChanges || isSaving}>
              {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
              {hasChanges && <Check className="w-3.5 h-3.5 ml-1" />}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
