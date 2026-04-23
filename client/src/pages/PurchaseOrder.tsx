'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, Edit2, Phone, Mail, MapPin, HelpCircle, X,
  CreditCard, CheckCircle, Clock, Package, Upload, ChevronDown,
  FileText, DollarSign, Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatRupiah } from '../../../shared/finance';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { HelpTooltip, HelpToggleButton, useHelpToggle, HELP_CONTENT } from '@/components/HelpSystem';

// ─── Helper: Rupiah formatting for inputs ───
function formatThousands(n: number): string {
  if (!n) return "";
  return n.toLocaleString("id-ID");
}
function parseRupiahStr(str: string): number {
  const cleaned = str.replace(/\./g, "").replace(/,/g, "");
  return Math.max(0, Math.floor(Number(cleaned) || 0));
}

// ─── Rupiah Input Component ───
function RupiahInput({ value, onChange, placeholder, className }: {
  value: number;
  onChange: (v: number) => void;
  placeholder?: string;
  className?: string;
}) {
  const [display, setDisplay] = useState(value ? formatThousands(value) : "");
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setDisplay(value ? formatThousands(value) : "");
  }, [value, focused]);

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm pointer-events-none">Rp</span>
      <Input
        type="text"
        inputMode="numeric"
        placeholder={placeholder || "0"}
        value={focused ? display : (value ? formatThousands(value) : "")}
        onFocus={() => {
          setFocused(true);
          setDisplay(value ? String(value) : "");
        }}
        onBlur={() => {
          setFocused(false);
          const parsed = parseRupiahStr(display);
          onChange(parsed);
          setDisplay(parsed ? formatThousands(parsed) : "");
        }}
        onChange={(e) => {
          setDisplay(e.target.value);
          const parsed = parseRupiahStr(e.target.value);
          onChange(parsed);
        }}
        className={`pl-10 text-right font-mono text-base ${className || ""}`}
      />
    </div>
  );
}

// ─── Contextual Help Tooltip ───
// HelpTooltip imported from shared component

// ─── Product Autocomplete ───
function ProductAutocomplete({ value, onChange, onBlur, products }: {
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  products: Array<{ id: number; name: string; hpp?: number | null }>;
}) {
  const [focused, setFocused] = useState(false);
  const [search, setSearch] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!search) return products.slice(0, 8);
    const q = search.toLowerCase();
    return products.filter(p => p.name.toLowerCase().includes(q)).slice(0, 8);
  }, [search, products]);

  useEffect(() => { setSearch(value); }, [value]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setFocused(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative flex-1">
      <Input
        placeholder="Cari / ketik nama produk"
        value={search}
        onFocus={() => setFocused(true)}
        onBlur={() => { setTimeout(() => onBlur?.(), 200); }}
        onChange={(e) => {
          setSearch(e.target.value);
          onChange(e.target.value);
          setFocused(true);
        }}
        className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
      />
      {focused && filtered.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
          {filtered.map(p => (
            <button
              key={p.id}
              className="w-full text-left px-3 py-2 text-sm text-white hover:bg-emerald-600/20 flex justify-between items-center"
              onClick={() => {
                setSearch(p.name);
                onChange(p.name);
                setFocused(false);
              }}
            >
              <span>{p.name}</span>
              {p.hpp ? (
                <span className="text-xs text-slate-400">{formatRupiah(p.hpp)}</span>
              ) : null}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface POItem {
  productId?: number;
  productName: string;
  qty: number;
  unitPrice: number;
  totalPrice?: number;
  verified?: boolean; // true = user confirmed this is a new product (not a duplicate)
}

interface SupplierFormData {
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
}

interface POFormData {
  supplierId: number | string;
  date: string;
  description: string;
  items: POItem[];
}

const PaymentStatusBadge = ({ status }: { status: string }) => {
  const variants: Record<string, { bg: string; text: string; label: string; icon: typeof Clock }> = {
    unpaid: { bg: 'bg-red-500/20', text: 'text-red-300', label: 'Belum Bayar', icon: Clock },
    partial: { bg: 'bg-yellow-500/20', text: 'text-yellow-300', label: 'Bayar Sebagian', icon: DollarSign },
    paid: { bg: 'bg-emerald-500/20', text: 'text-emerald-300', label: 'Lunas', icon: CheckCircle },
  };
  const v = variants[status] || variants.unpaid;
  const Icon = v.icon;
  return (
    <Badge className={`${v.bg} ${v.text} border-0 gap-1`}>
      <Icon className="w-3 h-3" /> {v.label}
    </Badge>
  );
};

const ReceiptStatusBadge = ({ status }: { status: string }) => {
  const variants: Record<string, { bg: string; text: string; label: string; icon: typeof Clock }> = {
    pending: { bg: 'bg-gray-500/20', text: 'text-gray-300', label: 'Belum Diterima', icon: Clock },
    partial: { bg: 'bg-yellow-500/20', text: 'text-yellow-300', label: 'Diterima Sebagian', icon: Package },
    received: { bg: 'bg-emerald-500/20', text: 'text-emerald-300', label: 'Sudah Diterima', icon: CheckCircle },
  };
  const v = variants[status] || variants.pending;
  const Icon = v.icon;
  return (
    <Badge className={`${v.bg} ${v.text} border-0 gap-1`}>
      <Icon className="w-3 h-3" /> {v.label}
    </Badge>
  );
};

// ─── Update Status Dialog ───
const UpdateStatusDialog = ({ po, onClose }: { po: any; onClose: () => void }) => {
  const utils = trpc.useUtils();
  const [paymentStatus, setPaymentStatus] = useState(po.paymentStatus || 'unpaid');
  const [receiptStatus, setReceiptStatus] = useState(po.receiptStatus || 'pending');
  const [bankAccountId, setBankAccountId] = useState<string>("");
  const [paidAmount, setPaidAmount] = useState(0);

  const { data: bankAccounts } = trpc.bankAccount.list.useQuery();

  const updatePO = trpc.purchaseOrder.update.useMutation({
    onSuccess: () => {
      utils.purchaseOrder.list.invalidate();
      toast.success("Status PO berhasil diupdate — jurnal otomatis tercatat");
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  // Determine if payment is changing (need bank account selection)
  const isPaymentChanging = paymentStatus !== po.paymentStatus && paymentStatus !== 'unpaid';

  return (
    <div className="space-y-5">
      {/* Accounting info banner */}
      <div className="p-3 rounded-lg bg-blue-900/20 border border-blue-500/20 text-xs text-blue-300">
        <strong>Info Akuntansi:</strong> Perubahan status akan otomatis membuat jurnal GL.
        Barang diterima + belum bayar = Hutang Usaha tercatat di neraca.
        Saat dibayar = Hutang berkurang, Kas berkurang.
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Status Pembayaran</label>
        <div className="grid grid-cols-3 gap-2">
          {([
            { val: 'unpaid', label: 'Belum Bayar', icon: Clock, color: 'border-red-500 bg-red-500/10 text-red-300' },
            { val: 'partial', label: 'Sebagian', icon: DollarSign, color: 'border-yellow-500 bg-yellow-500/10 text-yellow-300' },
            { val: 'paid', label: 'Lunas', icon: CheckCircle, color: 'border-emerald-500 bg-emerald-500/10 text-emerald-300' },
          ] as const).map(opt => (
            <button
              key={opt.val}
              onClick={() => setPaymentStatus(opt.val)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all ${
                paymentStatus === opt.val ? opt.color : 'border-slate-700 bg-slate-800/50 text-slate-400'
              }`}
            >
              <opt.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Status Penerimaan Barang</label>
        <div className="grid grid-cols-3 gap-2">
          {([
            { val: 'pending', label: 'Belum Terima', icon: Clock, color: 'border-gray-500 bg-gray-500/10 text-gray-300' },
            { val: 'partial', label: 'Sebagian', icon: Package, color: 'border-yellow-500 bg-yellow-500/10 text-yellow-300' },
            { val: 'received', label: 'Diterima', icon: CheckCircle, color: 'border-emerald-500 bg-emerald-500/10 text-emerald-300' },
          ] as const).map(opt => (
            <button
              key={opt.val}
              onClick={() => setReceiptStatus(opt.val)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all ${
                receiptStatus === opt.val ? opt.color : 'border-slate-700 bg-slate-800/50 text-slate-400'
              }`}
            >
              <opt.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Bank account selection - shown when payment is changing */}
      {isPaymentChanging && (
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Bayar dari Rekening
          </label>
          <Select value={bankAccountId} onValueChange={setBankAccountId}>
            <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-11">
              <SelectValue placeholder="Pilih rekening pembayaran" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              {bankAccounts?.map((ba) => (
                <SelectItem key={ba.id} value={String(ba.id)} className="text-white hover:bg-slate-700">
                  {ba.accountName} {ba.initialBalance ? `(${formatRupiah(ba.initialBalance)})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Partial payment amount */}
      {paymentStatus === 'partial' && paymentStatus !== po.paymentStatus && (
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Jumlah yang Dibayar
          </label>
          <RupiahInput
            value={paidAmount}
            onChange={setPaidAmount}
            placeholder="Jumlah cicilan"
            className="bg-slate-800 border-slate-700 text-white h-11"
          />
          <p className="text-xs text-slate-500 mt-1">Total PO: {formatRupiah(po.totalAmount)}</p>
        </div>
      )}

      {/* F1.5: Warning if payment changing but no bank account selected */}
      {isPaymentChanging && !bankAccountId && (
        <p className="text-xs text-red-400 flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-400" />
          Wajib pilih rekening pembayaran agar jurnal GL tercatat dengan benar
        </p>
      )}

      <div className="flex gap-2 justify-end pt-2">
        <Button variant="outline" onClick={onClose} className="border-slate-700">Batal</Button>
        <Button
          onClick={() => {
            // F1.5: Block if payment is changing but no bank account selected
            if (isPaymentChanging && !bankAccountId) {
              toast.error("Pilih rekening pembayaran terlebih dahulu");
              return;
            }
            updatePO.mutate({
              id: po.id,
              paymentStatus,
              receiptStatus,
              ...(bankAccountId ? { bankAccountId: Number(bankAccountId) } : {}),
              ...(paymentStatus === 'partial' && paidAmount > 0 ? { paidAmount } : {}),
            });
          }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
          disabled={updatePO.isPending || (isPaymentChanging && !bankAccountId)}
        >
          {updatePO.isPending ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
      </div>
    </div>
  );
};

// ─── CSV Upload Dialog ───
const CSVUploadDialog = () => {
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<POItem[]>([]);
  const [fileName, setFileName] = useState("");

  const { data: suppliers } = trpc.supplier.list.useQuery();
  const [supplierId, setSupplierId] = useState<string>("");
  const createPO = trpc.purchaseOrder.create.useMutation({
    onSuccess: () => {
      utils.purchaseOrder.list.invalidate();
      toast.success("PO dari file berhasil dibuat");
      setOpen(false);
      setPreview([]);
      setFileName("");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
      // Skip header row
      const items: POItem[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(/[,;\t]/);
        if (cols.length >= 3) {
          items.push({
            productName: cols[0]?.trim() || "",
            qty: parseInt(cols[1]?.trim()) || 1,
            unitPrice: parseRupiahStr(cols[2]?.trim() || "0"),
          });
        }
      }
      setPreview(items);
    };
    reader.readAsText(file);
  };

  const handleSubmit = () => {
    if (!supplierId || preview.length === 0) {
      toast.error("Pilih supplier dan pastikan file memiliki data");
      return;
    }
    const total = preview.reduce((s, i) => s + i.qty * i.unitPrice, 0);
    createPO.mutate({
      supplierId: Number(supplierId),
      date: new Date().toISOString().split("T")[0],
      description: `Import dari ${fileName}`,
      items: preview.map(i => ({ ...i, totalPrice: i.qty * i.unitPrice })),
      totalAmount: total,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 gap-2">
          <Upload className="w-4 h-4" />
          Upload CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-900 border-slate-700 max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-white">Import PO dari CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
            <p className="text-xs text-slate-400 mb-2">Format CSV: <code className="text-emerald-400">NamaProduk, Qty, HargaSatuan</code></p>
            <p className="text-xs text-slate-500">Contoh: Sepeda Uwinfly, 10, 10000000</p>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">Supplier</label>
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue placeholder="Pilih supplier" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {suppliers?.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)} className="text-white hover:bg-slate-700">{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <input ref={fileRef} type="file" accept=".csv,.txt,.tsv" className="hidden" onChange={handleFile} />
            <Button
              variant="outline"
              onClick={() => fileRef.current?.click()}
              className="w-full border-dashed border-slate-600 text-slate-300 hover:bg-slate-800 py-8"
            >
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-6 h-6 text-emerald-500" />
                <span>{fileName || "Klik untuk pilih file CSV"}</span>
              </div>
            </Button>
          </div>

          {preview.length > 0 && (
            <div className="bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden">
              <div className="px-3 py-2 bg-slate-800 border-b border-slate-700">
                <span className="text-sm font-medium text-white">Preview ({preview.length} item)</span>
              </div>
              <div className="max-h-40 overflow-y-auto">
                {preview.map((item, i) => (
                  <div key={i} className="flex justify-between px-3 py-1.5 text-xs border-b border-slate-700/50">
                    <span className="text-white">{item.productName}</span>
                    <span className="text-slate-400">{item.qty}x {formatRupiah(item.unitPrice)}</span>
                  </div>
                ))}
              </div>
              <div className="px-3 py-2 flex justify-between text-sm font-medium">
                <span className="text-slate-300">Total</span>
                <span className="text-emerald-400">{formatRupiah(preview.reduce((s, i) => s + i.qty * i.unitPrice, 0))}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-end mt-4">
          <Button variant="outline" onClick={() => setOpen(false)} className="border-slate-700">Batal</Button>
          <Button
            onClick={handleSubmit}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            disabled={preview.length === 0 || !supplierId || createPO.isPending}
          >
            {createPO.isPending ? "Membuat PO..." : "Buat PO dari CSV"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ─── New PO Dialog ───
const NewPODialog = ({ showHelp }: { showHelp: boolean }) => {
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<POFormData>({
    supplierId: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    items: [{ productName: '', qty: 1, unitPrice: 0 }],
  });

  const { data: suppliers } = trpc.supplier.list.useQuery();
  const { data: products } = trpc.product.list.useQuery();
  const createPO = trpc.purchaseOrder.create.useMutation({
    onSuccess: () => {
      utils.purchaseOrder.list.invalidate();
      toast.success("PO berhasil dibuat!");
      setOpen(false);
      setFormData({
        supplierId: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        items: [{ productName: '', qty: 1, unitPrice: 0 }],
      });
    },
    onError: (err) => toast.error(err.message),
  });

  const handleAddItem = () => {
    setFormData({ ...formData, items: [...formData.items, { productName: '', qty: 1, unitPrice: 0 }] });
  };

  const handleRemoveItem = (index: number) => {
    setFormData({ ...formData, items: formData.items.filter((_, i) => i !== index) });
  };

  const handleItemChange = (index: number, field: keyof POItem, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  // ─── Duplicate verification state ───
  const [dupCheck, setDupCheck] = useState<{
    index: number;
    typedName: string;
    matches: Array<{ id: number; name: string; hpp: number | null; stockCurrent?: number }>;
  } | null>(null);

  const handleProductSelect = (index: number, name: string) => {
    const exactMatch = products?.find(p => p.name === name);
    const newItems = [...formData.items];

    if (exactMatch) {
      // User selected from dropdown — exact match, link productId directly
      newItems[index] = {
        ...newItems[index],
        productId: exactMatch.id,
        productName: name,
        unitPrice: exactMatch.hpp || newItems[index].unitPrice,
        verified: true,
      };
      setFormData({ ...formData, items: newItems });
    } else {
      // User typed free text — check for similar products
      newItems[index] = {
        ...newItems[index],
        productId: undefined,
        productName: name,
        verified: false,
      };
      setFormData({ ...formData, items: newItems });
    }
  };

  // Check for similar products when user finishes typing (on blur)
  const handleProductBlur = (index: number) => {
    const item = formData.items[index];
    if (!item.productName || item.verified || item.productId) return;

    const q = item.productName.trim().toLowerCase();
    if (q.length < 2) return;

    const similar = products?.filter(p =>
      p.name.toLowerCase().includes(q) || q.includes(p.name.toLowerCase())
    ) || [];

    if (similar.length > 0) {
      setDupCheck({
        index,
        typedName: item.productName,
        matches: similar.map(p => ({ id: p.id, name: p.name, hpp: p.hpp ?? null, stockCurrent: (p as any).stockCurrent })),
      });
    } else {
      // No similar products — mark as verified new product
      const newItems = [...formData.items];
      newItems[index] = { ...newItems[index], verified: true };
      setFormData({ ...formData, items: newItems });
    }
  };

  const handleDupUseExisting = (productId: number) => {
    if (!dupCheck) return;
    const prod = products?.find(p => p.id === productId);
    const newItems = [...formData.items];
    newItems[dupCheck.index] = {
      ...newItems[dupCheck.index],
      productId,
      productName: prod?.name || dupCheck.typedName,
      unitPrice: prod?.hpp || newItems[dupCheck.index].unitPrice,
      verified: true,
    };
    setFormData({ ...formData, items: newItems });
    setDupCheck(null);
  };

  const handleDupCreateNew = () => {
    if (!dupCheck) return;
    const newItems = [...formData.items];
    newItems[dupCheck.index] = { ...newItems[dupCheck.index], productId: undefined, verified: true };
    setFormData({ ...formData, items: newItems });
    setDupCheck(null);
  };

  const calculateTotal = () => formData.items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);

  const handleSubmit = async () => {
    if (!formData.supplierId) {
      toast.error("Pilih supplier terlebih dahulu");
      return;
    }
    if (formData.items.some(i => !i.productName)) {
      toast.error("Semua item harus memiliki nama produk");
      return;
    }
    // Check if any items haven't been verified yet
    const unverified = formData.items.filter(i => i.productName && !i.verified && !i.productId);
    if (unverified.length > 0) {
      toast.error("Ada item yang belum diverifikasi. Klik di luar field nama produk untuk memverifikasi.");
      return;
    }

    await createPO.mutateAsync({
      supplierId: Number(formData.supplierId),
      date: formData.date,
      description: formData.description,
      items: formData.items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        qty: item.qty,
        unitPrice: item.unitPrice,
        totalPrice: item.qty * item.unitPrice,
      })),
      totalAmount: calculateTotal(),
    });
  };

  return (<>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
          <Plus className="w-4 h-4" />
          Tambah PO
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center">
            Buat Purchase Order Baru
            <HelpTooltip
              title="Apa itu Purchase Order?"
              content="Purchase Order (PO) adalah pesanan pembelian ke supplier/vendor. Gunakan PO untuk mencatat barang yang Anda pesan dari supplier, melacak status pembayaran, dan status penerimaan barang."
              show={showHelp}
            />
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {/* Supplier */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Supplier (vendor/pemasok)</label>
            <Select value={String(formData.supplierId || '')} onValueChange={(val) => setFormData({ ...formData, supplierId: Number(val) })}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-11">
                <SelectValue placeholder="Pilih supplier" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {suppliers?.map((supplier) => (
                  <SelectItem key={supplier.id} value={String(supplier.id)} className="text-white hover:bg-slate-700">
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tanggal */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Tanggal Pemesanan</label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="bg-slate-800 border-slate-700 text-white h-11"
            />
          </div>

          {/* Deskripsi */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Deskripsi / Catatan</label>
            <Input
              placeholder="Contoh: Stok sepeda bulan April"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 h-11"
            />
          </div>

          {/* Items */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">Daftar Barang</label>
            <div className="space-y-3">
              {/* Header */}
              <div className="grid grid-cols-12 gap-2 px-1 text-xs font-medium text-slate-500">
                <div className="col-span-4">Nama Produk</div>
                <div className="col-span-2 text-center">Jumlah</div>
                <div className="col-span-3 text-center">Harga/Unit</div>
                <div className="col-span-3 text-right">Subtotal</div>
              </div>

              {formData.items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-slate-800/30 rounded-lg p-2 border border-slate-700/50">
                  {/* Product name with autocomplete */}
                  <div className="col-span-4">
                    <ProductAutocomplete
                      value={item.productName}
                      onChange={(name) => handleProductSelect(idx, name)}
                      onBlur={() => handleProductBlur(idx)}
                      products={products?.map(p => ({ id: p.id, name: p.name, hpp: p.hpp })) || []}
                    />
                  </div>

                  {/* Qty */}
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min={1}
                      placeholder="Qty"
                      value={item.qty || ""}
                      onChange={(e) => handleItemChange(idx, 'qty', parseInt(e.target.value) || 0)}
                      className="bg-slate-800 border-slate-700 text-white text-center h-10"
                    />
                  </div>

                  {/* Unit Price */}
                  <div className="col-span-3">
                    <RupiahInput
                      value={item.unitPrice}
                      onChange={(v) => handleItemChange(idx, 'unitPrice', v)}
                      placeholder="Harga beli"
                      className="bg-slate-800 border-slate-700 text-white h-10"
                    />
                  </div>

                  {/* Subtotal + delete */}
                  <div className="col-span-3 flex items-center justify-end gap-1 min-w-0">
                    <span className="text-emerald-400 text-sm font-semibold truncate" title={formatRupiah(item.qty * item.unitPrice)}>
                      {formatRupiah(item.qty * item.unitPrice)}
                    </span>
                    {formData.items.length > 1 && (
                      <button
                        onClick={() => handleRemoveItem(idx)}
                        className="text-slate-500 hover:text-red-400 transition-colors p-1 flex-shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleAddItem}
              className="mt-3 border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <Plus className="w-4 h-4 mr-1" />
              Tambah Item
            </Button>
          </div>

          {/* Total */}
          <div className="bg-emerald-900/20 rounded-lg p-4 border border-emerald-500/20">
            <div className="flex justify-between items-center">
              <span className="text-slate-300 font-medium">Total Pembelian</span>
              <span className="text-emerald-400 font-bold text-xl">{formatRupiah(calculateTotal())}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-end mt-4">
          <Button variant="outline" onClick={() => setOpen(false)} className="border-slate-700">
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            disabled={createPO.isPending}
          >
            {createPO.isPending ? "Membuat PO..." : "Buat PO"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    {/* ─── Duplicate Product Verification Dialog ─── */}
    {dupCheck && (
      <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setDupCheck(null)}>
        <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-md w-full p-5" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
              <Package className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">Produk serupa ditemukan</h3>
              <p className="text-slate-400 text-xs mt-0.5">
                Kamu mengetik "<span className="text-white font-medium">{dupCheck.typedName}</span>".
                Apakah ini produk yang sudah ada?
              </p>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            {dupCheck.matches.map((match) => (
              <button
                key={match.id}
                onClick={() => handleDupUseExisting(match.id)}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-700 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all text-left"
              >
                <div>
                  <div className="text-white text-sm font-medium">{match.name}</div>
                  <div className="text-slate-500 text-xs mt-0.5">
                    {match.hpp ? `HPP: ${formatRupiah(match.hpp)}` : "Belum ada HPP"}
                  </div>
                </div>
                <div className="text-emerald-400 text-xs font-semibold px-2 py-1 rounded-full bg-emerald-500/10">
                  Gunakan ini
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={handleDupCreateNew}
            className="w-full py-2.5 rounded-xl border border-dashed border-slate-600 text-slate-400 hover:text-white hover:border-slate-500 transition-colors text-sm font-medium"
          >
            + Tambahkan sebagai produk baru
          </button>
        </div>
      </div>
    )}
  </>
  );
};

const NewSupplierDialog = () => {
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<SupplierFormData>({
    name: '', contactPerson: '', phone: '', email: '', address: '',
  });

  const createSupplier = trpc.supplier.create.useMutation({
    onSuccess: () => { utils.supplier.list.invalidate(); toast.success("Supplier berhasil ditambahkan"); setOpen(false); setFormData({ name: '', contactPerson: '', phone: '', email: '', address: '' }); },
    onError: (err) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
          <Plus className="w-4 h-4" /> Tambah Supplier
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white">Tambah Supplier Baru</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {([
            { key: 'name', label: 'Nama Supplier', ph: 'PT. Contoh Supplier' },
            { key: 'contactPerson', label: 'Nama Kontak', ph: 'Nama PIC' },
            { key: 'phone', label: 'No. Telepon', ph: '+62 8XX-XXXX-XXXX' },
            { key: 'email', label: 'Email', ph: 'email@supplier.com' },
            { key: 'address', label: 'Alamat', ph: 'Alamat lengkap' },
          ] as const).map(f => (
            <div key={f.key}>
              <label className="block text-sm text-slate-300 mb-2">{f.label}</label>
              <Input
                placeholder={f.ph}
                value={(formData as any)[f.key]}
                onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 h-11"
              />
            </div>
          ))}
        </div>
        <div className="flex gap-2 justify-end mt-6">
          <Button variant="outline" onClick={() => setOpen(false)} className="border-slate-700">Batal</Button>
          <Button onClick={() => createSupplier.mutate(formData)} className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={createSupplier.isPending}>
            {createSupplier.isPending ? "Menambahkan..." : "Tambah Supplier"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const PurchaseOrdersTab = ({ showHelp }: { showHelp: boolean }) => {
  const { data: purchaseOrders, isLoading } = trpc.purchaseOrder.list.useQuery();
  const { data: suppliers } = trpc.supplier.list.useQuery();
  const utils = trpc.useUtils();
  const [editPO, setEditPO] = useState<any>(null);

  const deletePO = trpc.purchaseOrder.delete.useMutation({
    onSuccess: () => { utils.purchaseOrder.list.invalidate(); toast.success("PO berhasil dihapus"); },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Edit status dialog */}
      <Dialog open={!!editPO} onOpenChange={(v) => !v && setEditPO(null)}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">
              Update Status — {editPO?.poNumber}
            </DialogTitle>
          </DialogHeader>
          {editPO && <UpdateStatusDialog po={editPO} onClose={() => setEditPO(null)} />}
        </DialogContent>
      </Dialog>

      {!purchaseOrders || purchaseOrders.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
          <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 mb-1">Belum ada Purchase Order</p>
          <p className="text-slate-500 text-sm">Klik "Tambah PO" untuk membuat pesanan pembelian pertama</p>
        </motion.div>
      ) : (
        <div className="grid gap-4">
          {purchaseOrders.map((po, idx) => (
            <motion.div
              key={po.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700 rounded-xl p-5 hover:border-emerald-500/30 transition-all duration-200 backdrop-blur-sm group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">{po.poNumber}</h3>
                  <p className="text-sm text-slate-400">{suppliers?.find(s => s.id === po.supplierId)?.name || 'Supplier tidak diketahui'}</p>
                  {po.description && <p className="text-xs text-slate-500 mt-1">{po.description}</p>}
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditPO(po)}
                    className="text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10"
                    title="Update Status"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (confirm("Hapus PO ini?")) deletePO.mutate({ id: po.id });
                    }}
                    className="text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                    title="Hapus PO"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                <div>
                  <span className="text-slate-500 text-xs">Tanggal Pesan</span>
                  <p className="text-white">{new Date(po.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-xs">Total Pembelian</span>
                  <p className="text-emerald-400 font-bold text-lg">{formatRupiah(po.totalAmount)}</p>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap items-center">
                <PaymentStatusBadge status={po.paymentStatus} />
                <ReceiptStatusBadge status={po.receiptStatus} />
                {po.paymentStatus === 'unpaid' && (
                  <button
                    onClick={() => setEditPO(po)}
                    className="text-xs text-emerald-400 hover:text-emerald-300 underline underline-offset-2 ml-2"
                  >
                    Tandai Lunas
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

const SupplierTab = () => {
  const { data: suppliers, isLoading } = trpc.supplier.list.useQuery();
  const utils2 = trpc.useUtils();
  const deleteSupplier = trpc.supplier.delete.useMutation({
    onSuccess: () => { utils2.supplier.list.invalidate(); toast.success("Supplier berhasil dihapus"); },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!suppliers || suppliers.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
          <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">Belum ada supplier</p>
          <p className="text-slate-500 text-sm">Tambahkan supplier/vendor terlebih dahulu</p>
        </motion.div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {suppliers.map((supplier, idx) => (
            <motion.div
              key={supplier.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700 rounded-xl p-5 hover:border-emerald-500/30 transition-all duration-200 backdrop-blur-sm group"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-base font-semibold text-white">{supplier.name}</h3>
                  {supplier.contactPerson && <p className="text-sm text-slate-400">{supplier.contactPerson}</p>}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (confirm("Hapus supplier ini?")) deleteSupplier.mutate({ id: supplier.id });
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-1.5 text-sm">
                {supplier.phone && (
                  <div className="flex items-center gap-2 text-slate-300">
                    <Phone className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{supplier.phone}</span>
                  </div>
                )}
                {supplier.email && (
                  <div className="flex items-center gap-2 text-slate-300">
                    <Mail className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="break-all">{supplier.email}</span>
                  </div>
                )}
                {supplier.address && (
                  <div className="flex items-start gap-2 text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span className="text-xs">{supplier.address}</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function PurchaseOrderPage() {
  const { showHelp, toggleHelp } = useHelpToggle();

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        <div className="mb-8 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold text-white">Purchase Order</h1>
              <HelpTooltip
                title="Purchase Order vs Pengeluaran"
                content="Purchase Order = pesanan pembelian ke supplier, untuk tracking barang yang dipesan, status bayar, dan status terima barang. Pengeluaran = biaya operasional harian (listrik, sewa, gaji, dll) yang bukan pembelian stok barang."
                show={showHelp}
              />
            </div>
            <p className="text-slate-400 mt-1">Kelola pesanan pembelian barang ke supplier</p>
          </div>
          <HelpToggleButton showHelp={showHelp} onToggle={toggleHelp} />
        </div>

        {showHelp && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-6 p-4 rounded-xl bg-gradient-to-r from-emerald-900/20 to-blue-900/20 border border-emerald-500/20"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-600/20 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="font-medium text-emerald-400">Purchase Order (PO)</p>
                  <p className="text-slate-400 text-xs mt-0.5">Untuk pembelian barang/stok ke supplier. Bisa track status bayar & terima barang.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-blue-400">Pengeluaran (di menu Transaksi)</p>
                  <p className="text-slate-400 text-xs mt-0.5">Untuk biaya operasional: listrik, sewa, gaji, transport — bukan pembelian stok.</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <Tabs defaultValue="purchase-orders" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-800 border border-slate-700 p-1 mb-6">
            <TabsTrigger value="purchase-orders" className="text-slate-300 data-[state=active]:text-white data-[state=active]:bg-emerald-600/20 rounded-lg transition-all">
              Purchase Orders
            </TabsTrigger>
            <TabsTrigger value="suppliers" className="text-slate-300 data-[state=active]:text-white data-[state=active]:bg-emerald-600/20 rounded-lg transition-all">
              Supplier
            </TabsTrigger>
          </TabsList>

          <TabsContent value="purchase-orders" className="mt-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">Daftar Purchase Order</h2>
              <div className="flex gap-2">
                <CSVUploadDialog />
                <NewPODialog showHelp={showHelp} />
              </div>
            </div>
            <PurchaseOrdersTab showHelp={showHelp} />
          </TabsContent>

          <TabsContent value="suppliers" className="mt-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">Daftar Supplier</h2>
              <NewSupplierDialog />
            </div>
            <SupplierTab />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
