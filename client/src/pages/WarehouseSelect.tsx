import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";
import { Warehouse, MapPin, Phone, Hash, ChevronRight, Plus, Search, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function WarehouseSelect() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const { data: warehouses, isLoading } = trpc.warehouseAccess.accessible.useQuery();

  const filtered = (warehouses ?? []).filter(w =>
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    (w.address ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0c1221] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-center pt-12 pb-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-3"
        >
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Pilih Outlet</h1>
          <p className="text-sm text-white/50">Pilih outlet atau gudang untuk memulai</p>
        </motion.div>
      </div>

      {/* Search */}
      <div className="max-w-3xl mx-auto w-full px-4 mb-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <Input
              placeholder="Cari outlet atau gudang..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-white dark:bg-gray-900/5 border-white/10 text-white placeholder:text-white/30 h-11 rounded-xl focus:border-emerald-500/50 focus:ring-emerald-500/20"
            />
          </div>
        </motion.div>
      </div>

      {/* Grid */}
      <div className="max-w-3xl mx-auto w-full px-4 pb-12 flex-1">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-40 rounded-2xl bg-white dark:bg-gray-900/5 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <Warehouse className="h-12 w-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/40">Belum ada outlet terdaftar</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map((wh, idx) => (
              <motion.button
                key={wh.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => {
                  // Store selected warehouse in localStorage and navigate to dashboard
                  localStorage.setItem("county-selected-warehouse", String(wh.id));
                  setLocation("/");
                }}
                className="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900/[0.03] backdrop-blur-sm border border-white/[0.06] p-5 text-left transition-all duration-300 hover:bg-white dark:bg-gray-900/[0.07] hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5"
              >
                {/* Glow effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-emerald-500/0 group-hover:from-emerald-500/5 group-hover:to-transparent transition-all duration-300" />

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <Warehouse className="h-5 w-5 text-emerald-400" />
                    </div>
                    <ChevronRight className="h-4 w-4 text-white/20 group-hover:text-emerald-400 transition-colors mt-1" />
                  </div>

                  <h3 className="text-base font-semibold text-white mb-2 group-hover:text-emerald-50">{wh.name}</h3>

                  <div className="space-y-1.5">
                    {wh.address && (
                      <div className="flex items-center gap-2 text-xs text-white/40">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{wh.address}</span>
                      </div>
                    )}
                    {wh.phone && (
                      <div className="flex items-center gap-2 text-xs text-white/40">
                        <Phone className="h-3 w-3 shrink-0" />
                        <span>{wh.phone}</span>
                      </div>
                    )}
                    {(wh as any).code && (
                      <div className="flex items-center gap-2 text-xs text-white/40">
                        <Hash className="h-3 w-3 shrink-0" />
                        <span className="font-mono">{(wh as any).code}</span>
                      </div>
                    )}
                  </div>

                  {wh.isDefault && (
                    <div className="mt-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-medium">
                      Outlet Utama
                    </div>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
