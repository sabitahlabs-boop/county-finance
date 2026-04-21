'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, X } from 'lucide-react';
import { toast } from 'sonner';

// ─── Shared Help Tooltip ───
export function HelpTooltip({ title, content, show }: { title: string; content: string; show: boolean }) {
  const [visible, setVisible] = useState(false);
  if (!show) return null;
  return (
    <div className="relative inline-flex ml-1.5">
      <button
        onClick={() => setVisible(!visible)}
        className="text-slate-500 hover:text-emerald-400 transition-colors"
        title={title}
      >
        <HelpCircle className="w-4 h-4" />
      </button>
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            className="absolute left-6 top-0 z-50 w-72 p-3 rounded-lg bg-slate-800 border border-emerald-500/30 shadow-xl"
          >
            <div className="flex justify-between items-start mb-1.5">
              <span className="text-sm font-semibold text-emerald-400">{title}</span>
              <button onClick={() => setVisible(false)} className="text-slate-500 hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">{content}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Help Toggle Button ───
export function HelpToggleButton({ showHelp, onToggle }: { showHelp: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
        showHelp
          ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
          : 'bg-slate-800 text-slate-500 border border-slate-700'
      }`}
    >
      <HelpCircle className="w-3.5 h-3.5" />
      {showHelp ? 'Bantuan ON' : 'Bantuan OFF'}
    </button>
  );
}

// ─── Hook for help state (shared via localStorage) ───
export function useHelpToggle() {
  const [showHelp, setShowHelp] = useState(() => {
    try { return localStorage.getItem("county_show_help") !== "false"; } catch { return true; }
  });

  const toggleHelp = () => {
    const next = !showHelp;
    setShowHelp(next);
    try { localStorage.setItem("county_show_help", String(next)); } catch {}
    toast.success(next ? "Mode bantuan diaktifkan" : "Mode bantuan dinonaktifkan");
  };

  return { showHelp, toggleHelp };
}

// ─── Help content definitions for all features ───
export const HELP_CONTENT: Record<string, { title: string; content: string }> = {
  // Purchase Order
  po_vs_pengeluaran: {
    title: "Purchase Order vs Pengeluaran",
    content: "Purchase Order = pesanan pembelian ke supplier, untuk tracking barang yang dipesan, status bayar, dan status terima barang. Pengeluaran = biaya operasional harian (listrik, sewa, gaji, dll) yang bukan pembelian stok barang.",
  },
  po_status: {
    title: "Status Purchase Order",
    content: "Setiap PO punya 2 status: Status Bayar (unpaid/partial/paid) dan Status Terima (pending/partial/received). Saat barang diterima, stok otomatis bertambah. Saat dibayar, jurnal kas otomatis tercatat.",
  },

  // Stok Produk
  stok_hpp: {
    title: "HPP (Harga Pokok Penjualan)",
    content: "HPP adalah harga beli/modal per unit. Digunakan untuk menghitung laba kotor. Pastikan HPP selalu up-to-date agar laporan laba rugi akurat.",
  },
  stok_minimum: {
    title: "Stok Minimum",
    content: "Batas minimum stok sebelum peringatan muncul. Jika stok di bawah angka ini, produk akan ditandai 'Stok Rendah' di dashboard.",
  },

  // Transaksi
  transaksi_pemasukan: {
    title: "Pemasukan vs Pengeluaran",
    content: "Pemasukan = uang masuk (penjualan, pendapatan jasa, dll). Pengeluaran = uang keluar (beli stok, bayar listrik, gaji, dll). Transaksi otomatis tercatat di jurnal umum.",
  },
  transaksi_void: {
    title: "Void Transaksi",
    content: "Void = membatalkan transaksi. Berbeda dengan hapus — void tetap tercatat di history sebagai bukti audit. Stok dan saldo akan otomatis di-reverse.",
  },

  // POS
  pos_shift: {
    title: "Shift Kasir",
    content: "Buka shift sebelum mulai transaksi. Shift mencatat siapa kasir, kapan buka/tutup, dan total penjualan per shift. Wajib tutup shift di akhir untuk rekonsiliasi kas.",
  },
  pos_payment: {
    title: "Metode Pembayaran",
    content: "Tunai = uang cash di mesin kasir. Transfer/QRIS = masuk ke rekening bank. Setiap metode otomatis tercatat di rekening masing-masing.",
  },

  // Hutang & Piutang
  hutang_vs_piutang: {
    title: "Hutang vs Piutang",
    content: "Hutang = kamu berhutang ke orang lain (kewajiban). Piutang = orang lain berhutang ke kamu (aset). Keduanya otomatis tercatat di neraca.",
  },

  // Laporan
  laporan_gl: {
    title: "Laporan GL (General Ledger)",
    content: "GL adalah buku besar — semua transaksi tercatat di sini secara double-entry (debit & kredit). Laporan GL lebih akurat karena berdasarkan jurnal, bukan kalkulasi manual.",
  },

  // Supplier
  supplier_info: {
    title: "Data Supplier",
    content: "Supplier = pemasok barang dagangan. Catat data supplier untuk melacak pembelian, hutang, dan riwayat PO per supplier.",
  },

  // Rekening Bank
  rekening_tipe: {
    title: "Tipe Rekening",
    content: "Kas = uang tunai di toko/kasir. Bank = rekening bank (BCA, Mandiri, dll). E-Wallet = saldo digital (GoPay, OVO, dll). Setiap transaksi otomatis menambah/mengurangi saldo rekening terkait.",
  },

  // Klien/Pelanggan
  klien_info: {
    title: "Data Pelanggan",
    content: "Catat data pelanggan untuk: penjualan kredit, loyalty points, deposit, dan laporan penjualan per pelanggan. Tidak wajib — transaksi tanpa data pelanggan juga bisa.",
  },

  // Loyalty
  loyalty_info: {
    title: "Loyalty Points",
    content: "Pelanggan mendapat poin setiap belanja. Poin bisa ditukar diskon. Setting: berapa poin per Rp belanja, dan berapa Rp nilai per poin, bisa diatur di pengaturan.",
  },

  // Produksi / BOM
  produksi_info: {
    title: "Produksi (BOM)",
    content: "Bill of Materials = resep produksi. Contoh: 1 Nasi Goreng = 200g beras + 100g ayam + 50ml minyak. Saat produksi, bahan baku berkurang, barang jadi bertambah, HPP otomatis terhitung.",
  },

  // Gudang
  gudang_info: {
    title: "Multi Gudang",
    content: "Kelola stok di beberapa lokasi berbeda. Transfer stok antar gudang tercatat otomatis. Setiap produk bisa punya stok berbeda di tiap gudang.",
  },

  // Deposit
  deposit_info: {
    title: "Deposit Pelanggan",
    content: "Pelanggan bisa isi saldo deposit di toko kamu. Saldo bisa dipakai untuk bayar transaksi. Refund deposit juga bisa dilakukan.",
  },
};
