import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, Search, ArrowUpRight, ArrowDownRight, Camera, Loader2, CheckCircle2, X, ImageIcon, Receipt, Package, Printer, Pencil, ArrowLeftRight, Ban } from "lucide-react";
import { InvoicePrintDialog } from "@/components/InvoicePrintDialog";
import { formatRupiah, PEMASUKAN_CATEGORIES, PENGELUARAN_CATEGORIES, PAYMENT_METHODS } from "../../../shared/finance";
import { toast } from "sonner";
import { useLocation, useSearch } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ScanToStockDialog } from "@/components/ScanToStockDialog";

// Hook to get user's bank accounts for payment method dropdown
function useBankAccountOptions() {
  const { data: accounts } = trpc.bankAccount.list.useQuery(undefined, { retry: false });
  return accounts ?? [];
}

function PaymentMethodSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const bankAccounts = useBankAccountOptions();
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>
        {PAYMENT_METHODS.map((m) => (<SelectItem key={m} value={m}>{m}</SelectItem>))}
        {bankAccounts.length > 0 && (
          <>
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1 pt-1">Akun Keuangan</div>
            {bankAccounts.map((a: any) => (
              <SelectItem key={`bank-${a.id}`} value={a.accountName}>
                {a.icon || "🏦"} {a.accountName}
              </SelectItem>
            ))}
          </>
        )}
      </SelectContent>
    </Select>
  );
}

type ScanResult = {
  storeName: string;
  date: string;
  items: { name: string; qty: number; price: number; total: number }[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: string;
  category: string;
  confidence: number;
  notes: string;
};

function ScanReceiptDialog({ open, onClose, onResult }: {
  open: boolean;
  onClose: () => void;
  onResult: (result: ScanResult, txType: "pemasukan" | "pengeluaran", mode: "stock" | "expense", bankAccount: string) => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [isPdfFile, setIsPdfFile] = useState(false);
  const [txType, setTxType] = useState<"pemasukan" | "pengeluaran">("pengeluaran");
  const [saveMode, setSaveMode] = useState<"stock" | "expense" | null>(null);
  const [selectedBank, setSelectedBank] = useState<string>("Tunai");
  const bankAccounts = useBankAccountOptions();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setScanning(false);
    setPreview(null);
    setResult(null);
    setError(null);
    setStatusText("");
    setIsPdfFile(false);
    setSaveMode(null);
    setSelectedBank("Tunai");
    // Reset file inputs so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  };

  // Convert image to JPEG via canvas — fixes iOS HEIC and reduces file size
  const convertToJpeg = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const maxDim = 1600;
          let w = img.width, h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) { h = Math.round(h * maxDim / w); w = maxDim; }
            else { w = Math.round(w * maxDim / h); h = maxDim; }
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (!ctx) { reject(new Error("Canvas not supported")); return; }
          ctx.drawImage(img, 0, 0, w, h);
          canvas.toBlob(
            (blob) => {
              URL.revokeObjectURL(objectUrl);
              blob ? resolve(blob) : reject(new Error("Conversion failed"));
            },
            "image/jpeg",
            0.85
          );
        } catch (e) {
          URL.revokeObjectURL(objectUrl);
          reject(e);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Gagal membaca gambar. Coba format lain (JPG/PNG)."));
      };
      img.src = objectUrl;
    });
  };

  const handleFile = async (file: File) => {
    const fileName = file.name.toLowerCase();
    const isPdf = file.type === "application/pdf" || fileName.endsWith(".pdf");
    const isImage = file.type.startsWith("image/") || 
      fileName.match(/\.(jpg|jpeg|png|heic|heif|webp|gif|bmp|tiff)$/);
    
    if (!isPdf && !isImage) {
      toast.error("Format tidak didukung. Gunakan foto (JPG/PNG) atau PDF.");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 15MB");
      return;
    }

    setIsPdfFile(isPdf);
    if (!isPdf) {
      setPreview(URL.createObjectURL(file));
    } else {
      setPreview(null); // No preview for PDF
    }
    setError(null);
    setResult(null);
    setScanning(true);
    setStatusText("Mempersiapkan file...");

    try {
      const formData = new FormData();

      if (isPdf) {
        // Send PDF directly — server handles it
        setStatusText("Mengirim PDF ke server...");
        console.log(`[ScanStruk] Sending PDF: ${(file.size/1024).toFixed(0)}KB`);
        formData.append("receipt", file, file.name || "receipt.pdf");
      } else {
        // Convert image to JPEG first (handles HEIC, reduces size)
        setStatusText("Mengkonversi gambar...");
        try {
          const jpegBlob = await convertToJpeg(file);
          console.log(`[ScanStruk] Original: ${(file.size/1024).toFixed(0)}KB → JPEG: ${(jpegBlob.size/1024).toFixed(0)}KB`);
          formData.append("receipt", jpegBlob, "receipt.jpg");
        } catch (convErr) {
          // If canvas conversion fails (e.g., HEIC on some browsers), send original file
          console.warn(`[ScanStruk] Canvas conversion failed, sending original:`, convErr);
          formData.append("receipt", file, file.name || "receipt.jpg");
        }
      }

      setStatusText("AI sedang membaca struk...");

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000); // 60s timeout for PDF

      const response = await fetch("/api/scan-receipt", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        const errText = await response.text();
        let errMsg = "Server error";
        try {
          const errData = JSON.parse(errText);
          errMsg = errData.error || errMsg;
        } catch { errMsg = errText || errMsg; }
        throw new Error(errMsg);
      }

      const data = await response.json();
      setResult(data);
      setStatusText("");
    } catch (err: any) {
      console.error("[ScanStruk] Error:", err);
      if (err.name === "AbortError") {
        setError("Timeout — proses terlalu lama (>60 detik). Coba foto yang lebih kecil atau koneksi yang lebih stabil.");
      } else if (err.message?.includes("Failed to fetch") || err.message?.includes("NetworkError")) {
        setError("Gagal menghubungi server. Periksa koneksi internet Anda.");
      } else {
        setError(err.message || "Gagal memproses struk. Coba foto yang lebih jelas.");
      }
    } finally {
      setScanning(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { reset(); onClose(); } }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            Scan Struk dengan AI
          </DialogTitle>
        </DialogHeader>

        {!preview && !result && !scanning && (
          <div className="space-y-3">
            {/* Camera button — opens camera directly on mobile */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
            {/* Gallery/file button — opens file picker (gallery, files, PDF) */}
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
            
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed rounded-xl p-6 text-center hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer"
              onClick={() => galleryInputRef.current?.click()}
            >
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Receipt className="h-7 w-7 text-primary" />
              </div>
              <p className="font-semibold text-sm mb-1">Pilih foto atau file struk</p>
              <p className="text-xs text-muted-foreground mb-3">Dari galeri, file manager, atau drag & drop</p>
              <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><ImageIcon className="h-3 w-3" /> JPG, PNG, HEIC</span>
                <span className="flex items-center gap-1"><Receipt className="h-3 w-3" /> PDF</span>
                <span>Maks 15MB</span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="h-4 w-4" />
              Buka Kamera
            </Button>
          </div>
        )}

        {scanning && (
          <div className="space-y-4">
            {preview ? (
              <div className="relative rounded-xl overflow-hidden">
                <img src={preview} alt="Receipt" className="w-full max-h-48 object-cover opacity-50" />
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30">
                  <Loader2 className="h-8 w-8 text-white animate-spin mb-2" />
                  <p className="text-white text-sm font-medium">{statusText || "AI sedang membaca struk..."}</p>
                  <p className="text-white/70 text-xs mt-1">Biasanya 5-15 detik</p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-muted/30 p-8 text-center">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
                <p className="font-medium text-sm">{statusText || "AI sedang membaca struk..."}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {isPdfFile ? "Memproses PDF, biasanya 10-20 detik" : "Biasanya 5-15 detik"}
                </p>
              </div>
            )}
          </div>
        )}

        {!scanning && error && (
          <div className="space-y-4">
            {preview && (
              <div className="rounded-xl overflow-hidden">
                <img src={preview} alt="Receipt" className="w-full max-h-48 object-cover" />
              </div>
            )}
            <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-4 text-center">
              <p className="text-sm text-red-700 dark:text-red-400 font-medium">{error}</p>
              <div className="flex gap-2 justify-center mt-3">
                <Button variant="outline" size="sm" onClick={reset}>Coba Lagi</Button>
              </div>
            </div>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-semibold text-sm">Struk berhasil dibaca!</span>
            </div>

            {preview && (
              <div className="rounded-xl overflow-hidden">
                <img src={preview} alt="Receipt" className="w-full max-h-32 object-cover" />
              </div>
            )}

            {/* Receipt summary */}
            <div className="rounded-xl bg-muted/50 p-4 space-y-2 text-sm">
              {result.storeName && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Toko/Vendor</span>
                  <span className="font-medium">{result.storeName}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tanggal</span>
                <span className="font-medium">{result.date}</span>
              </div>
              {result.confidence > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Akurasi AI</span>
                  <span className="font-medium">{result.confidence}%</span>
                </div>
              )}
              {result.items.length > 0 && (
                <div className="pt-2 border-t space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Item:</p>
                  {result.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span>{item.qty}x {item.name}</span>
                      <span>{formatRupiah(item.total)}</span>
                    </div>
                  ))}
                </div>
              )}
              {(result.tax > 0 || result.discount > 0) && (
                <div className="pt-2 border-t space-y-1">
                  {result.tax > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Pajak (PPN)</span>
                      <span>{formatRupiah(result.tax)}</span>
                    </div>
                  )}
                  {result.discount > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Diskon</span>
                      <span className="text-green-600 dark:text-green-400">-{formatRupiah(result.discount)}</span>
                    </div>
                  )}
                </div>
              )}
              <div className="pt-2 border-t">
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-red-600 dark:text-red-400">{formatRupiah(result.total)}</span>
                </div>
              </div>
            </div>

            {/* STEP 1: Choose mode — stock or expense only */}
            {!saveMode && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-center">Mau diapakan struk ini?</p>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={() => { setSaveMode("stock"); setTxType("pengeluaran"); }}
                    className="flex items-center gap-3 p-4 rounded-xl border-2 border-primary/20 hover:border-primary hover:bg-primary/5 transition-all text-left"
                  >
                    <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                      <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Masukkan ke Stok Item</p>
                      <p className="text-xs text-muted-foreground">Pilih item satu-satu untuk ditambahkan ke stok produk</p>
                    </div>
                  </button>
                  <button
                    onClick={() => { setSaveMode("expense"); setTxType("pengeluaran"); }}
                    className="flex items-center gap-3 p-4 rounded-xl border-2 border-primary/20 hover:border-primary hover:bg-primary/5 transition-all text-left"
                  >
                    <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                      <Receipt className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Catat Pengeluaran Saja</p>
                      <p className="text-xs text-muted-foreground">Catat sebagai transaksi tanpa masuk ke stok</p>
                    </div>
                  </button>
                </div>
                <Button variant="outline" size="sm" className="w-full" onClick={reset}>Scan Ulang</Button>
              </div>
            )}

            {/* STEP 2: Choose bank account + confirm */}
            {saveMode && (
              <div className="space-y-3">
                <div className="rounded-xl bg-primary/5 border border-primary/20 p-3">
                  <p className="text-xs font-medium text-primary mb-0.5">
                    {saveMode === "stock" ? "📦 Masukkan ke Stok Item" : "📝 Catat Pengeluaran Saja"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {saveMode === "stock" 
                      ? "Transaksi akan dicatat & Anda bisa pilih item untuk stok" 
                      : "Transaksi langsung dicatat tanpa masuk stok"}
                  </p>
                </div>

                {/* Transaction type */}
                <div>
                  <Label className="text-xs mb-1.5 block">Jenis Transaksi</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={txType === "pengeluaran" ? "default" : "outline"}
                      size="sm"
                      className={`flex-1 gap-1.5 ${txType === "pengeluaran" ? "bg-red-600 hover:bg-red-700" : ""}`}
                      onClick={() => setTxType("pengeluaran")}
                    >
                      <ArrowDownRight className="h-3.5 w-3.5" /> Pengeluaran
                    </Button>
                    <Button
                      variant={txType === "pemasukan" ? "default" : "outline"}
                      size="sm"
                      className={`flex-1 gap-1.5 ${txType === "pemasukan" ? "bg-emerald-600 hover:bg-emerald-700" : ""}`}
                      onClick={() => setTxType("pemasukan")}
                    >
                      <ArrowUpRight className="h-3.5 w-3.5" /> Pemasukan
                    </Button>
                  </div>
                </div>

                {/* Bank account selection */}
                <div>
                  <Label className="text-xs mb-1.5 block">Dibebankan ke Rekening</Label>
                  <Select value={selectedBank} onValueChange={setSelectedBank}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih rekening" />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map((m) => (<SelectItem key={m} value={m}>{m}</SelectItem>))}
                      {bankAccounts.length > 0 && (
                        <>
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1 pt-1">Akun Keuangan</div>
                          {bankAccounts.map((a: any) => (
                            <SelectItem key={`bank-${a.id}`} value={a.accountName}>
                              {a.icon || "🏦"} {a.accountName}
                            </SelectItem>
                          ))}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 pt-1">
                  <Button variant="outline" className="flex-1" onClick={() => setSaveMode(null)}>
                    Kembali
                  </Button>
                  <Button className="flex-1" onClick={() => { onResult(result, txType, saveMode, selectedBank); reset(); onClose(); }}>
                    {saveMode === "stock" ? "Simpan & Pilih Stok" : "Simpan Transaksi"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function Transaksi() {
  const now = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferForm, setTransferForm] = useState({ fromAccount: "", toAccount: "", amount: "", description: "", date: now.toISOString().substring(0, 10) });
  const { data: bankAccounts } = trpc.bankAccount.list.useQuery(undefined, { retry: false });
  const [scanOpen, setScanOpen] = useState(false);
  const [scanToStockOpen, setScanToStockOpen] = useState(false);
  const [scanToStockItems, setScanToStockItems] = useState<{name:string;qty:number;price:number;total:number}[]>([]);
  const [scanToStockVendor, setScanToStockVendor] = useState<string>("");
  const [invoiceTx, setInvoiceTx] = useState<any>(null);
  const [editTx, setEditTx] = useState<any>(null);
  const [editForm, setEditForm] = useState({ date: "", type: "pemasukan" as "pemasukan" | "pengeluaran", category: "", description: "", amount: "", paymentMethod: "Tunai", notes: "" });
  const { data: business } = trpc.business.mine.useQuery(undefined, { retry: false });
  const searchParams = useSearch();
  const [, setLocation] = useLocation();

  const utils = trpc.useUtils();
  const { data: txList, isLoading } = trpc.transaction.list.useQuery(
    { month, year, type: typeFilter === "all" ? undefined : typeFilter },
    { retry: false }
  );
  const { data: productList } = trpc.product.list.useQuery(undefined, { retry: false });
  const transferMut = trpc.bankAccount.transfer.useMutation({
    onSuccess: () => {
      utils.transaction.list.invalidate();
      utils.bankAccount.balances.invalidate();
      utils.report.dashboard.invalidate();
      setTransferOpen(false);
      setTransferForm({ fromAccount: "", toAccount: "", amount: "", description: "", date: now.toISOString().substring(0, 10) });
      toast.success("Transfer berhasil!");
    },
    onError: (err) => toast.error(err.message),
  });

  const createTx = trpc.transaction.create.useMutation({
    onSuccess: () => {
      utils.transaction.list.invalidate();
      utils.report.dashboard.invalidate();
      utils.product.list.invalidate();
      setDialogOpen(false);
      toast.success("Transaksi berhasil dicatat");
    },
    onError: (err) => toast.error(err.message),
  });
  const updateTx = trpc.transaction.update.useMutation({
    onSuccess: () => {
      utils.transaction.list.invalidate();
      utils.report.dashboard.invalidate();
      setEditTx(null);
      toast.success("Transaksi diperbarui");
    },
    onError: (err) => toast.error(err.message),
  });
  const deleteTx = trpc.transaction.delete.useMutation({
    onSuccess: () => {
      utils.transaction.list.invalidate();
      utils.report.dashboard.invalidate();
      utils.product.list.invalidate();
      toast.success("Transaksi dihapus");
    },
    onError: (err) => toast.error(err.message),
  });
  const voidTx = trpc.transaction.void.useMutation({
    onSuccess: (data) => {
      utils.transaction.list.invalidate();
      utils.report.dashboard.invalidate();
      utils.product.list.invalidate();
      setVoidDialog(null);
      setVoidReason("");
      toast.success(`Transaksi di-void. Jurnal reversal: ${data.reversalCode}`);
    },
    onError: (err) => toast.error(err.message),
  });
  const [voidDialog, setVoidDialog] = useState<any>(null);
  const [voidReason, setVoidReason] = useState("");

  // Form state
  const [form, setForm] = useState({
    date: now.toISOString().substring(0, 10),
    type: "pemasukan" as "pemasukan" | "pengeluaran",
    category: "Penjualan Produk",
    description: "",
    amount: "",
    paymentMethod: "Tunai",
    productId: "",
    productQty: "",
    notes: "",
  });

  // Handle URL params for quick actions from dashboard
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    const action = params.get("action");
    if (action === "income") {
      setForm(prev => ({ ...prev, type: "pemasukan", category: "Penjualan Produk" }));
      setDialogOpen(true);
      setLocation("/transaksi", { replace: true });
    } else if (action === "expense") {
      setForm(prev => ({ ...prev, type: "pengeluaran", category: "Pembelian Stok" }));
      setDialogOpen(true);
      setLocation("/transaksi", { replace: true });
    } else if (action === "scan") {
      setScanOpen(true);
      setLocation("/transaksi", { replace: true });
    }
  }, []);

  const updateForm = (key: string, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "type") {
        next.category = value === "pemasukan" ? "Penjualan Produk" : "Pembelian Stok";
        next.productId = "";
        next.productQty = "";
      }
      return next;
    });
  };

  const handleSubmit = () => {
    if (!form.amount || parseInt(form.amount) <= 0) {
      toast.error("Jumlah harus lebih dari 0");
      return;
    }
    createTx.mutate({
      date: form.date,
      type: form.type,
      category: form.category,
      description: form.description || undefined,
      amount: parseInt(form.amount),
      paymentMethod: form.paymentMethod,
      productId: form.productId ? parseInt(form.productId) : undefined,
      productQty: form.productQty ? parseInt(form.productQty) : undefined,
      notes: form.notes || undefined,
    });
  };

  const resetForm = () => {
    setForm({
      date: now.toISOString().substring(0, 10),
      type: "pemasukan",
      category: "Penjualan Produk",
      description: "",
      amount: "",
      paymentMethod: "Tunai",
      productId: "",
      productQty: "",
      notes: "",
    });
  };

  const handleScanResult = (result: ScanResult, txType: "pemasukan" | "pengeluaran" = "pengeluaran", mode: "stock" | "expense" = "expense", bankAccount: string = "Tunai") => {
    // Save scanned receipt as transaction
    const itemNames = result.items.map(i => i.name).join(", ");
    const desc = result.storeName
      ? `${result.storeName} — ${itemNames || result.category}`
      : itemNames || result.category || "Scan struk";
    const defaultCategory = txType === "pemasukan" ? "Penjualan Produk" : "Pembelian Stok";
    createTx.mutate({
      date: result.date || now.toISOString().substring(0, 10),
      type: txType,
      category: mode === "stock" ? "Pembelian Stok" : (result.category || defaultCategory),
      description: desc.substring(0, 200),
      amount: result.total,
      paymentMethod: bankAccount,
      notes: result.notes || undefined,
    });
    // Only offer stock entry if user chose "Masukkan ke Stok"
    if (mode === "stock" && result.items && result.items.length > 0) {
      setScanToStockItems(result.items);
      setScanToStockVendor(result.storeName || "");
      setTimeout(() => setScanToStockOpen(true), 500);
    } else if (mode === "expense") {
      toast.success("Pengeluaran dicatat ke " + bankAccount);
    }
  };

  const categories = form.type === "pemasukan" ? PEMASUKAN_CATEGORIES : PENGELUARAN_CATEGORIES;

  const filteredTx = useMemo(() => {
    if (!txList) return [];
    if (!searchQuery) return txList;
    const q = searchQuery.toLowerCase();
    return txList.filter((tx: any) =>
      tx.description?.toLowerCase().includes(q) ||
      tx.category.toLowerCase().includes(q) ||
      tx.txCode.toLowerCase().includes(q)
    );
  }, [txList, searchQuery]);

  const totalPemasukan = filteredTx.filter((t: any) => t.type === "pemasukan").reduce((s: number, t: any) => s + t.amount, 0);
  const totalPengeluaran = filteredTx.filter((t: any) => t.type === "pengeluaran").reduce((s: number, t: any) => s + t.amount, 0);

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"][i],
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transaksi</h1>
          <p className="text-sm text-muted-foreground">Catat pemasukan dan pengeluaran bisnis Anda</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setScanOpen(true)} className="gap-2">
            <Camera className="h-4 w-4" /> Scan Struk
          </Button>
          <Button variant="outline" onClick={() => setTransferOpen(true)} className="gap-2">
            <ArrowLeftRight className="h-4 w-4" /> Transfer
          </Button>
          <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="gap-2 shadow-lg shadow-primary/20">
            <Plus className="h-4 w-4" /> Tambah
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-md shadow-black/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total Pemasukan</p>
              <p className="text-lg font-bold text-emerald-600">{formatRupiah(totalPemasukan)}</p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center">
              <ArrowUpRight className="h-4 w-4 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md shadow-black/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total Pengeluaran</p>
              <p className="text-lg font-bold text-red-500">{formatRupiah(totalPengeluaran)}</p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-red-50 dark:bg-red-950 flex items-center justify-center">
              <ArrowDownRight className="h-4 w-4 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md shadow-black/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Selisih</p>
              <p className={`text-lg font-bold ${totalPemasukan - totalPengeluaran >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                {formatRupiah(totalPemasukan - totalPengeluaran)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={String(month)} onValueChange={(v) => setMonth(parseInt(v))}>
          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>
            {months.map((m) => (<SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>))}
          </SelectContent>
        </Select>
        <Select value={String(year)} onValueChange={(v) => setYear(parseInt(v))}>
          <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
          <SelectContent>
            {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Tipe</SelectItem>
            <SelectItem value="pemasukan">Pemasukan</SelectItem>
            <SelectItem value="pengeluaran">Pengeluaran</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Cari transaksi..." className="pl-9" />
        </div>
      </div>

      {/* Transaction List */}
      <Card className="border-0 shadow-md shadow-black/5">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => (<Skeleton key={i} className="h-12" />))}
            </div>
          ) : filteredTx.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-3">
                <Receipt className="h-7 w-7 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium">Belum ada transaksi</p>
              <p className="text-xs text-muted-foreground mt-1">Mulai catat atau scan struk pertama Anda</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left p-3 font-medium text-muted-foreground text-xs">Tanggal</th>
                    <th className="text-left p-3 font-medium text-muted-foreground text-xs">Keterangan</th>
                    <th className="text-left p-3 font-medium text-muted-foreground text-xs">Kategori</th>
                    <th className="text-left p-3 font-medium text-muted-foreground text-xs">Pembayaran</th>
                    <th className="text-right p-3 font-medium text-muted-foreground text-xs">Jumlah</th>
                    <th className="text-right p-3 font-medium text-muted-foreground text-xs w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTx.map((tx: any) => (
                    <tr key={tx.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="p-3 text-muted-foreground text-xs">{tx.date}</td>
                      <td className="p-3 font-medium">{tx.description || "-"}</td>
                      <td className="p-3">
                        <Badge variant="secondary" className="text-xs font-normal">{tx.category}</Badge>
                      </td>
                      <td className="p-3 text-muted-foreground text-xs">{tx.paymentMethod}</td>
                      <td className={`p-3 text-right font-semibold ${tx.type === "pemasukan" ? "text-emerald-600" : "text-red-500"}`}>
                        {tx.type === "pemasukan" ? "+" : "-"}{formatRupiah(tx.amount)}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
                            title="Cetak Invoice"
                            onClick={() => setInvoiceTx(tx)}
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-blue-600 dark:text-blue-400"
                            title="Edit Transaksi"
                            onClick={() => {
                              setEditTx(tx);
                              setEditForm({
                                date: tx.date,
                                type: tx.type,
                                category: tx.category,
                                description: tx.description ?? "",
                                amount: String(tx.amount),
                                paymentMethod: tx.paymentMethod ?? "Tunai",
                                notes: tx.notes ?? "",
                              });
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                            title="Void Transaksi"
                            onClick={() => setVoidDialog(tx)}
                          >
                            <Ban className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Transaction Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (open) resetForm(); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Transaksi Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Tabs value={form.type} onValueChange={(v) => updateForm("type", v)}>
              <TabsList className="w-full">
                <TabsTrigger value="pemasukan" className="flex-1 gap-1.5">
                  <ArrowUpRight className="h-4 w-4 text-emerald-600" /> Pemasukan
                </TabsTrigger>
                <TabsTrigger value="pengeluaran" className="flex-1 gap-1.5">
                  <ArrowDownRight className="h-4 w-4 text-red-500" /> Pengeluaran
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Tanggal</Label>
                <Input type="date" value={form.date} onChange={(e) => updateForm("date", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Kategori</Label>
                <Select value={form.category} onValueChange={(v) => updateForm("category", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Jumlah (Rp)</Label>
              <Input type="number" placeholder="0" value={form.amount} onChange={(e) => updateForm("amount", e.target.value)} className="text-lg font-semibold" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Keterangan</Label>
              <Input value={form.description} onChange={(e) => updateForm("description", e.target.value)} placeholder="Deskripsi singkat" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Metode Pembayaran</Label>
              <PaymentMethodSelect value={form.paymentMethod} onChange={(v) => updateForm("paymentMethod", v)} />
            </div>

            {/* Product Link */}
            {productList && productList.length > 0 && (
              <div className="space-y-3 rounded-xl border p-3 bg-muted/30">
                <p className="text-xs font-medium text-muted-foreground">Link ke Produk (opsional)</p>
                <Select value={form.productId} onValueChange={(v) => updateForm("productId", v)}>
                  <SelectTrigger><SelectValue placeholder="Pilih produk..." /></SelectTrigger>
                  <SelectContent>
                    {productList.map((p: any) => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.name} (stok: {p.stockCurrent})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.productId && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Jumlah Unit</Label>
                    <Input type="number" placeholder="0" value={form.productQty} onChange={(e) => updateForm("productQty", e.target.value)} />
                  </div>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Catatan <span className="text-muted-foreground font-normal">(opsional)</span></Label>
              <Input value={form.notes} onChange={(e) => updateForm("notes", e.target.value)} placeholder="Catatan tambahan" />
            </div>

            <Button onClick={handleSubmit} disabled={createTx.isPending} className="w-full shadow-lg shadow-primary/20">
              {createTx.isPending ? "Menyimpan..." : "Simpan Transaksi"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Scan Receipt Dialog */}
      <ScanReceiptDialog
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        onResult={handleScanResult}
      />

      {/* Scan to Stock Dialog — offer to add scanned items to product stock */}
      <ScanToStockDialog
        open={scanToStockOpen}
        onClose={() => setScanToStockOpen(false)}
        items={scanToStockItems}
        vendorName={scanToStockVendor}
      />

      {/* Transfer Dialog */}
      <Dialog open={transferOpen} onOpenChange={(open) => { setTransferOpen(open); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5 text-[#1E4D9B]" /> Transfer Antar Akun
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-medium">Tanggal</Label>
              <Input type="date" value={transferForm.date} onChange={(e) => setTransferForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs font-medium">Dari Akun</Label>
              <Select value={transferForm.fromAccount} onValueChange={(v) => setTransferForm(f => ({ ...f, fromAccount: v }))}>
                <SelectTrigger><SelectValue placeholder="Pilih akun asal" /></SelectTrigger>
                <SelectContent>
                  {(bankAccounts || []).map((a: any) => (
                    <SelectItem key={a.id} value={a.accountName}>{a.icon || "🏦"} {a.accountName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium">Ke Akun</Label>
              <Select value={transferForm.toAccount} onValueChange={(v) => setTransferForm(f => ({ ...f, toAccount: v }))}>
                <SelectTrigger><SelectValue placeholder="Pilih akun tujuan" /></SelectTrigger>
                <SelectContent>
                  {(bankAccounts || []).filter((a: any) => a.accountName !== transferForm.fromAccount).map((a: any) => (
                    <SelectItem key={a.id} value={a.accountName}>{a.icon || "🏦"} {a.accountName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium">Jumlah (Rp)</Label>
              <Input type="number" placeholder="0" value={transferForm.amount} onChange={(e) => setTransferForm(f => ({ ...f, amount: e.target.value }))} className="text-lg font-semibold" />
              {transferForm.amount && parseInt(transferForm.amount) > 0 && <p className="text-xs text-muted-foreground mt-1">{formatRupiah(parseInt(transferForm.amount))}</p>}
            </div>
            <div>
              <Label className="text-xs font-medium">Keterangan (opsional)</Label>
              <Input value={transferForm.description} onChange={(e) => setTransferForm(f => ({ ...f, description: e.target.value }))} placeholder="Contoh: Top up GoPay" />
            </div>
            <Button
              onClick={() => {
                if (!transferForm.fromAccount || !transferForm.toAccount) { toast.error("Pilih akun asal dan tujuan"); return; }
                if (!transferForm.amount || parseInt(transferForm.amount) <= 0) { toast.error("Jumlah harus lebih dari 0"); return; }
                transferMut.mutate({
                  fromAccount: transferForm.fromAccount,
                  toAccount: transferForm.toAccount,
                  amount: parseInt(transferForm.amount),
                  notes: transferForm.description || undefined,
                  date: transferForm.date,
                });
              }}
              disabled={transferMut.isPending}
              className="w-full bg-gradient-to-r from-[#1E4D9B] to-[#2563EB]"
            >
              {transferMut.isPending ? "Memproses..." : "Transfer Sekarang"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invoice Print Dialog */}
      {invoiceTx && business && (
        <InvoicePrintDialog
          open={!!invoiceTx}
          onClose={() => setInvoiceTx(null)}
          transaction={invoiceTx}
          business={business}
        />
      )}

      {/* Edit Transaction Dialog */}
      <Dialog open={!!editTx} onOpenChange={(open) => { if (!open) setEditTx(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Transaksi</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tanggal</Label>
                <Input type="date" value={editForm.date} onChange={(e) => setEditForm(p => ({ ...p, date: e.target.value }))} />
              </div>
              <div>
                <Label>Tipe</Label>
                <Select value={editForm.type} onValueChange={(v) => setEditForm(p => ({ ...p, type: v as "pemasukan" | "pengeluaran", category: v === "pemasukan" ? PEMASUKAN_CATEGORIES[0] : PENGELUARAN_CATEGORIES[0] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pemasukan">Pemasukan</SelectItem>
                    <SelectItem value="pengeluaran">Pengeluaran</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Kategori</Label>
              <Select value={editForm.category} onValueChange={(v) => setEditForm(p => ({ ...p, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(editForm.type === "pemasukan" ? PEMASUKAN_CATEGORIES : PENGELUARAN_CATEGORIES).map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Deskripsi</Label>
              <Input value={editForm.description} onChange={(e) => setEditForm(p => ({ ...p, description: e.target.value }))} placeholder="Deskripsi transaksi..." />
            </div>
            <div>
              <Label>Jumlah (Rp)</Label>
              <Input type="number" value={editForm.amount} onChange={(e) => setEditForm(p => ({ ...p, amount: e.target.value }))} placeholder="0" />
            </div>
            <div>
              <Label>Metode Pembayaran</Label>
              <PaymentMethodSelect value={editForm.paymentMethod} onChange={(v) => setEditForm(p => ({ ...p, paymentMethod: v }))} />
            </div>
            <div>
              <Label>Catatan</Label>
              <Input value={editForm.notes} onChange={(e) => setEditForm(p => ({ ...p, notes: e.target.value }))} placeholder="Catatan opsional..." />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setEditTx(null)}>Batal</Button>
              <Button
                className="flex-1"
                disabled={updateTx.isPending || !editForm.amount || !editForm.date}
                onClick={() => {
                  if (!editTx) return;
                  updateTx.mutate({
                    id: editTx.id,
                    date: editForm.date,
                    type: editForm.type,
                    category: editForm.category,
                    description: editForm.description,
                    amount: parseInt(editForm.amount),
                    paymentMethod: editForm.paymentMethod,
                    notes: editForm.notes,
                  });
                }}
              >
                {updateTx.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simpan Perubahan"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Void Transaction Dialog */}
      <Dialog open={!!voidDialog} onOpenChange={(open) => { if (!open) { setVoidDialog(null); setVoidReason(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Ban className="h-5 w-5" />
              Void Transaksi
            </DialogTitle>
          </DialogHeader>
          {voidDialog && (
            <div className="space-y-4 pt-2">
              <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Kode</span>
                  <span className="font-mono font-semibold">{voidDialog.txCode}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tanggal</span>
                  <span>{voidDialog.date}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Kategori</span>
                  <span>{voidDialog.category}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Jumlah</span>
                  <span className={`font-semibold ${voidDialog.type === "pemasukan" ? "text-emerald-600" : "text-red-600 dark:text-red-400"}`}>
                    {voidDialog.type === "pemasukan" ? "+" : "-"}{formatRupiah(voidDialog.amount)}
                  </span>
                </div>
              </div>

              <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 p-3 text-sm text-amber-800 dark:text-amber-200 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                <strong>Perhatian:</strong> Void akan membuat jurnal reversal otomatis (transaksi pembalik) dan mengembalikan stok jika ada produk terkait. Transaksi asli tetap tercatat sebagai "voided".
              </div>

              <div className="space-y-2">
                <Label htmlFor="voidReason">Alasan Void <span className="text-destructive">*</span></Label>
                <textarea
                  id="voidReason"
                  placeholder="Contoh: Salah input jumlah, transaksi duplikat, pelanggan batal..."
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => { setVoidDialog(null); setVoidReason(""); }}>
                  Batal
                </Button>
                <Button
                  variant="destructive"
                  disabled={!voidReason.trim() || voidTx.isPending}
                  onClick={() => {
                    voidTx.mutate({ id: voidDialog.id, reason: voidReason.trim() });
                  }}
                >
                  {voidTx.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Ban className="h-4 w-4 mr-1" />}
                  Void Transaksi
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
