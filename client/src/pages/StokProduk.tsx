import { useState, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Package, Pencil, Trash2, ArrowUp, History, AlertTriangle, Search, Upload, Download, ImageIcon, FileSpreadsheet, Camera, X, Loader2, Calculator, Warehouse } from "lucide-react";
import { formatRupiah, PRODUCT_UNITS } from "../../../shared/finance";
import { generateSKU } from "../../../shared/productCategories";
import { toast } from "sonner";
import { COGSCalculator } from "@/components/COGSCalculator";
import { getProxiedImageUrl } from "@/lib/utils";
import { HelpTooltip, HelpToggleButton, useHelpToggle, HELP_CONTENT } from "@/components/HelpSystem";

// ─── Image Upload Helper ───
function ImageUploader({ currentUrl, onUpload }: { currentUrl?: string | null; onUpload: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl ? getProxiedImageUrl(currentUrl) : null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Hanya file gambar"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Maks 5MB"); return; }
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/upload-image", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload gagal");
      const { url } = await res.json();
      onUpload(url);
      setPreview(url);
      toast.success("Gambar diupload");
    } catch {
      toast.error("Gagal upload gambar");
      setPreview(currentUrl ? getProxiedImageUrl(currentUrl) : null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-xs">Foto Produk</Label>
      <div
        className="relative w-full h-28 rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all overflow-hidden"
        onClick={() => inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        {uploading ? (
          <div className="flex flex-col items-center gap-1">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-xs text-muted-foreground">Uploading...</span>
          </div>
        ) : preview ? (
          <>
            <img src={preview} alt="Product" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <Camera className="h-5 w-5 text-white" />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <ImageIcon className="h-6 w-6" />
            <span className="text-xs">Tambah Foto</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Bulk CSV Import Dialog ───
function BulkImportDialog({ open, onClose, onImport }: {
  open: boolean;
  onClose: () => void;
  onImport: (products: any[]) => void;
}) {
  const [parsed, setParsed] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const parseCSV = (text: string) => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) { setError("File CSV harus memiliki header dan minimal 1 baris data"); return; }

    const header = lines[0].toLowerCase();
    const hasHeader = header.includes("nama") || header.includes("name") || header.includes("harga") || header.includes("hpp");
    const dataLines = hasHeader ? lines.slice(1) : lines;

    const products: any[] = [];
    for (let i = 0; i < dataLines.length; i++) {
      const cols = dataLines[i].split(",").map(c => c.trim().replace(/^"|"$/g, ""));
      if (cols.length < 3) continue;
      const name = cols[0];
      if (!name) continue;
      products.push({
        name,
        sku: cols[1] || undefined,
        category: cols[2] || undefined,
        hpp: parseInt(cols[3]) || 0,
        sellingPrice: parseInt(cols[4]) || 0,
        stockCurrent: parseInt(cols[5]) || 0,
        stockMinimum: parseInt(cols[6]) || 0,
        unit: cols[7] || "pcs",
      });
    }
    if (products.length === 0) { setError("Tidak ada data produk yang valid ditemukan"); return; }
    setError(null);
    setParsed(products);
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      parseCSV(text);
    };
    reader.readAsText(file);
  };

  const reset = () => { setParsed([]); setError(null); };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { reset(); onClose(); } }}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Import Produk Massal (CSV)
          </DialogTitle>
        </DialogHeader>

        {parsed.length === 0 ? (
          <div className="space-y-4">
            <div
              className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
              onClick={() => fileRef.current?.click()}
            >
              <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              <Upload className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
              <p className="font-semibold text-sm mb-1">Upload file CSV</p>
              <p className="text-xs text-muted-foreground">Klik untuk pilih file</p>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-300">{error}</div>
            )}

            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <p className="text-xs font-semibold">Format CSV yang didukung:</p>
              <code className="block text-xs bg-background rounded p-2 overflow-x-auto whitespace-pre">
{`Nama,SKU,Kategori,HPP,Harga Jual,Stok,Min Stok,Satuan
Nasi Goreng,SKU-001,Makanan,8000,15000,50,10,porsi
Es Teh,SKU-002,Minuman,2000,5000,100,20,gelas
Kopi Susu,SKU-003,Minuman,5000,12000,30,5,gelas`}
              </code>
              <p className="text-xs text-muted-foreground">Kolom wajib: Nama, HPP, Harga Jual. Kolom lain opsional.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{parsed.length} produk ditemukan</p>
              <Button variant="ghost" size="sm" onClick={reset}>
                <X className="h-4 w-4 mr-1" /> Reset
              </Button>
            </div>

            <div className="max-h-60 overflow-y-auto rounded-lg border">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="text-left p-2 font-medium">Nama</th>
                    <th className="text-left p-2 font-medium">SKU</th>
                    <th className="text-right p-2 font-medium">HPP</th>
                    <th className="text-right p-2 font-medium">Harga Jual</th>
                    <th className="text-right p-2 font-medium">Stok</th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.map((p, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2 font-medium">{p.name}</td>
                      <td className="p-2 text-muted-foreground">{p.sku || "-"}</td>
                      <td className="p-2 text-right">{formatRupiah(p.hpp)}</td>
                      <td className="p-2 text-right">{formatRupiah(p.sellingPrice)}</td>
                      <td className="p-2 text-right">{p.stockCurrent}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Button className="w-full" onClick={() => { onImport(parsed); reset(); onClose(); }}>
              <Upload className="h-4 w-4 mr-2" /> Import {parsed.length} Produk
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ───
export default function StokProduk() {
  const { showHelp, toggleHelp } = useHelpToggle();
  const [addOpen, setAddOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [adjustProduct, setAdjustProduct] = useState<any>(null);
  const [logProduct, setLogProduct] = useState<number | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [cogsProduct, setCogsProduct] = useState<any>(null);

  const utils = trpc.useUtils();
  const { data: products, isLoading } = trpc.product.list.useQuery(undefined, { retry: false });
  const { data: dbCategories = [] } = trpc.category.list.useQuery(undefined, { retry: false });
  // Build top-level and subcategory lists from DB
  const topLevelCats = (dbCategories as any[]).filter(c => !c.parentId);
  const getDbSubcategories = (parentId: number) => (dbCategories as any[]).filter(c => c.parentId === parentId);
  const { data: stockLogs } = trpc.product.stockLogs.useQuery(
    { productId: logProduct! },
    { enabled: !!logProduct, retry: false }
  );

  const createProd = trpc.product.create.useMutation({
    onSuccess: () => { utils.product.list.invalidate(); setAddOpen(false); setImageUrl(""); toast.success("Produk ditambahkan"); },
    onError: (err) => toast.error(err.message),
  });
  const updateProd = trpc.product.update.useMutation({
    onSuccess: () => { utils.product.list.invalidate(); setEditProduct(null); toast.success("Produk diperbarui"); },
    onError: (err) => toast.error(err.message),
  });
  const deleteProd = trpc.product.delete.useMutation({
    onSuccess: () => { utils.product.list.invalidate(); toast.success("Produk dihapus"); },
    onError: (err) => toast.error(err.message),
  });
  const adjustStock = trpc.product.adjustStock.useMutation({
    onSuccess: (data) => {
      utils.product.list.invalidate();
      setAdjustProduct(null);
      toast.success(`Stok diperbarui: ${data.stockBefore} → ${data.stockAfter}`);
    },
    onError: (err) => toast.error(err.message),
  });
  const bulkCreate = trpc.product.bulkCreate.useMutation({
    onSuccess: (data) => {
      utils.product.list.invalidate();
      toast.success(`${data.imported} produk berhasil diimport`);
    },
    onError: (err) => toast.error(err.message),
  });

  const [addForm, setAddForm] = useState({ name: "", sku: "", category: "", subcategory: "", hpp: "", sellingPrice: "", stockCurrent: "0", stockMinimum: "0", unit: "pcs", productType: "barang" as "barang" | "jasa", priceType: "fixed" as "fixed" | "dynamic", discountPercent: "0", warehouseId: "" });
  const { data: warehouseList = [] } = trpc.warehouse.list.useQuery();
  const [adjustForm, setAdjustForm] = useState({ qty: "", type: "in" as "in" | "out" | "adjustment", notes: "" });

  const filtered = products?.filter((p: any) =>
    !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  ) ?? [];

  const totalValue = filtered.reduce((s: number, p: any) => s + (p.stockCurrent * p.hpp), 0);
  const lowStockCount = filtered.filter((p: any) => p.stockCurrent <= p.stockMinimum).length;

  const handleExportCSV = () => {
    if (!products || products.length === 0) { toast.error("Tidak ada produk untuk diexport"); return; }
    const header = "Nama,SKU,Kategori,HPP,Harga Jual,Stok,Min Stok,Satuan";
    const rows = products.map((p: any) => [
      `"${p.name}"`, p.sku || "", p.category || "",
      p.hpp, p.sellingPrice, p.stockCurrent, p.stockMinimum, p.unit
    ].join(","));
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "produk-stok.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success("File CSV berhasil didownload");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight">Stok Produk</h1>
            <HelpTooltip
              title={HELP_CONTENT.stok_hpp.title}
              content={HELP_CONTENT.stok_hpp.content}
              show={showHelp}
            />
          </div>
          <p className="text-sm text-muted-foreground">Kelola produk dan pantau stok bisnis Anda</p>
        </div>
        <HelpToggleButton showHelp={showHelp} onToggle={toggleHelp} />
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setBulkOpen(true)}>
            <Upload className="h-4 w-4 mr-1.5" /> Import CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-1.5" /> Export CSV
          </Button>
          <Dialog open={addOpen} onOpenChange={(open) => { setAddOpen(open); if (open) { setAddForm({ name: "", sku: "", category: "", subcategory: "", hpp: "", sellingPrice: "", stockCurrent: "0", stockMinimum: "0", unit: "pcs", productType: "barang", priceType: "fixed", discountPercent: "0", warehouseId: "" }); setImageUrl(""); } }}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1.5" /> Tambah Produk</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Produk Baru</DialogTitle></DialogHeader>
              <div className="space-y-3 pt-2">
                <ImageUploader currentUrl={null} onUpload={(url) => setImageUrl(url)} />
                <div className="space-y-1.5">
                  <Label className="text-xs">Tipe *</Label>
                  <div className="flex gap-2">
                    <Button type="button" size="sm" variant={addForm.productType === "barang" ? "default" : "outline"} className="flex-1" onClick={() => setAddForm({ ...addForm, productType: "barang" })}>
                      Barang
                    </Button>
                    <Button type="button" size="sm" variant={addForm.productType === "jasa" ? "default" : "outline"} className="flex-1" onClick={() => setAddForm({ ...addForm, productType: "jasa", stockCurrent: "0", stockMinimum: "0" })}>
                      Jasa
                    </Button>
                  </div>
                  {addForm.productType === "jasa" && (
                    <p className="text-[10px] text-blue-500">Jasa tidak memerlukan stok — stok tidak berkurang saat dijual via POS</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Nama {addForm.productType === "jasa" ? "Jasa" : "Produk"} *</Label>
                  <Input
                    value={addForm.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      const autoSku = name.length >= 2 && !addForm.sku ? generateSKU(name) : addForm.sku;
                      setAddForm({ ...addForm, name, sku: autoSku });
                    }}
                    placeholder={addForm.productType === "jasa" ? "Nama jasa (contoh: Servis AC)" : "Nama produk"}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">SKU <span className="text-muted-foreground">(auto-generate)</span></Label>
                  <div className="flex gap-2">
                    <Input value={addForm.sku} onChange={(e) => setAddForm({ ...addForm, sku: e.target.value })} placeholder="SKU-001" className="flex-1" />
                    <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={() => setAddForm({ ...addForm, sku: generateSKU(addForm.name || "PRD") })}>
                      Generate
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Kategori</Label>
                    {topLevelCats.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic py-1">Belum ada kategori. Buat di <a href="/pengaturan" className="underline text-primary">Pengaturan → Kategori</a></p>
                    ) : (
                      <Select value={addForm.category} onValueChange={(v) => setAddForm({ ...addForm, category: v, subcategory: "" })}>
                        <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                        <SelectContent>
                          {topLevelCats.map((c: any) => (<SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Sub-kategori</Label>
                    <Select value={addForm.subcategory} onValueChange={(v) => setAddForm({ ...addForm, subcategory: v })} disabled={!addForm.category}>
                      <SelectTrigger><SelectValue placeholder={addForm.category ? "Pilih sub-kategori" : "Pilih kategori dulu"} /></SelectTrigger>
                      <SelectContent>
                        {getDbSubcategories(parseInt(addForm.category)).map((s: any) => (<SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Harga Modal (HPP) *</Label>
                  <Input type="number" value={addForm.hpp} onChange={(e) => setAddForm({ ...addForm, hpp: e.target.value })} placeholder="0" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Tipe Harga Jual</Label>
                  <Select value={addForm.priceType} onValueChange={(v) => setAddForm({ ...addForm, priceType: v as "fixed" | "dynamic" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Harga Pasti (dengan diskon %)</SelectItem>
                      <SelectItem value="dynamic">Harga Dinamis (input saat transaksi)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {addForm.priceType === "fixed" ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Harga Jual *</Label>
                      <Input type="number" value={addForm.sellingPrice} onChange={(e) => setAddForm({ ...addForm, sellingPrice: e.target.value })} placeholder="0" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Diskon Default (%)</Label>
                      <Input type="number" min="0" max="100" value={addForm.discountPercent} onChange={(e) => setAddForm({ ...addForm, discountPercent: e.target.value })} placeholder="0" />
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-3 text-xs text-amber-700 dark:text-amber-300">
                    Harga akan diinput manual saat transaksi di POS/Kasir.
                  </div>
                )}
                {addForm.productType === "barang" && (<div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Stok Awal</Label>
                    <Input type="number" value={addForm.stockCurrent} onChange={(e) => setAddForm({ ...addForm, stockCurrent: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1">
                      <Label className="text-xs">Stok Minimum</Label>
                      <HelpTooltip
                        title={HELP_CONTENT.stok_minimum.title}
                        content={HELP_CONTENT.stok_minimum.content}
                        show={showHelp}
                      />
                    </div>
                    <Input type="number" value={addForm.stockMinimum} onChange={(e) => setAddForm({ ...addForm, stockMinimum: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Satuan</Label>
                    <Select value={addForm.unit} onValueChange={(v) => setAddForm({ ...addForm, unit: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PRODUCT_UNITS.map((u) => (<SelectItem key={u} value={u}>{u}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>)}
                {/* Warehouse selector */}
                {warehouseList.length > 0 && (
                  <div className="space-y-1.5">
                    <Label className="text-xs flex items-center gap-1.5"><Warehouse className="h-3.5 w-3.5" /> Gudang Tujuan</Label>
                    <Select value={addForm.warehouseId} onValueChange={(v) => setAddForm({ ...addForm, warehouseId: v })}>
                      <SelectTrigger><SelectValue placeholder="Pilih gudang (default: gudang utama)" /></SelectTrigger>
                      <SelectContent>
                        {warehouseList.filter((w: any) => w.isActive).map((w: any) => (
                          <SelectItem key={w.id} value={String(w.id)}>
                            {w.name} {w.isDefault ? "(Utama)" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[10px] text-muted-foreground">Stok awal akan masuk ke gudang ini</p>
                  </div>
                )}
                <Button className="w-full" disabled={createProd.isPending || !addForm.name} onClick={() => {
                  const catObj = topLevelCats.find((c: any) => String(c.id) === addForm.category);
                  const subObj = getDbSubcategories(parseInt(addForm.category)).find((s: any) => String(s.id) === addForm.subcategory);
                  const categoryStr = subObj ? `${catObj?.name} / ${subObj.name}` : (catObj?.name || undefined);
                  createProd.mutate({
                    name: addForm.name, sku: addForm.sku || undefined, category: categoryStr,
                    hpp: parseInt(addForm.hpp) || 0, sellingPrice: parseInt(addForm.sellingPrice) || 0,
                    stockCurrent: addForm.productType === "jasa" ? 0 : (parseInt(addForm.stockCurrent) || 0),
                    stockMinimum: addForm.productType === "jasa" ? 0 : (parseInt(addForm.stockMinimum) || 0),
                    unit: addForm.unit, imageUrl: imageUrl || undefined,
                    productType: addForm.productType,
                    priceType: addForm.priceType,
                    discountPercent: parseFloat(addForm.discountPercent) || 0,
                    warehouseId: addForm.warehouseId ? parseInt(addForm.warehouseId) : undefined,
                  });
                }}>
                  {createProd.isPending ? "Menyimpan..." : "Simpan Produk"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-md shadow-black/5 bg-gradient-to-br from-emerald-50 to-white">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium">Total Produk</p>
            <p className="text-2xl font-bold">{filtered.length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md shadow-black/5 bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium">Nilai Stok (HPP)</p>
            <p className="text-2xl font-bold">{formatRupiah(totalValue)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md shadow-black/5 bg-gradient-to-br from-orange-50 to-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Stok Kritis</p>
              <p className="text-2xl font-bold">{lowStockCount}</p>
            </div>
            {lowStockCount > 0 && <AlertTriangle className="h-5 w-5 text-orange-500" />}
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Cari produk..." className="pl-9" />
      </div>

      {/* Product Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (<Skeleton key={i} className="h-64 rounded-xl" />))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <Package className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="font-medium text-muted-foreground">Belum ada produk</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">Tambahkan produk satu per satu atau import dari CSV</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setBulkOpen(true)}>
                <Upload className="h-4 w-4 mr-1.5" /> Import CSV
              </Button>
              <Button size="sm" onClick={() => setAddOpen(true)}>
                <Plus className="h-4 w-4 mr-1.5" /> Tambah Produk
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p: any) => {
            const isLow = p.stockCurrent <= p.stockMinimum;
            const margin = p.sellingPrice > 0 ? ((p.sellingPrice - p.hpp) / p.sellingPrice * 100).toFixed(1) : "0";
            return (
              <Card key={p.id} className={`border-0 shadow-md shadow-black/5 hover:shadow-lg transition-all overflow-hidden group ${isLow ? "ring-1 ring-orange-300" : ""}`}>
                {/* Product Image */}
                <div className="relative h-36 bg-gradient-to-br from-muted/30 to-muted/10 overflow-hidden">
                  {p.imageUrl ? (
                    <img src={getProxiedImageUrl(p.imageUrl) ?? undefined} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-12 w-12 text-muted-foreground/20" />
                    </div>
                  )}
                  {isLow && (
                    <Badge variant="destructive" className="absolute top-2 right-2 text-xs shadow-sm">
                      <AlertTriangle className="h-3 w-3 mr-1" /> Stok Rendah
                    </Badge>
                  )}
                  {p.category && (
                    <Badge variant="secondary" className="absolute top-2 left-2 text-xs shadow-sm">{p.category}</Badge>
                  )}
                </div>

                <CardContent className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold truncate">{p.name}</h3>
                    {p.sku && <p className="text-xs text-muted-foreground font-mono">{p.sku}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">HPP</p>
                      <p className="font-medium truncate" title={formatRupiah(p.hpp)}>{formatRupiah(p.hpp)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Harga Jual</p>
                      <p className="font-medium text-emerald-600 truncate" title={formatRupiah(p.sellingPrice)}>{formatRupiah(p.sellingPrice)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Stok</p>
                      <p className={`font-medium ${isLow ? "text-orange-600 dark:text-orange-400" : ""}`}>{p.stockCurrent} {p.unit}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Margin</p>
                      <p className="font-medium">{margin}%</p>
                    </div>
                  </div>
                  {/* Warehouse distribution link */}
                  <WarehouseDistribution productId={p.id} />

                  <div className="flex gap-1.5 pt-1">
                    <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => {
                      setAdjustProduct(p);
                      setAdjustForm({ qty: "", type: "in", notes: "" });
                    }}>
                      <ArrowUp className="h-3 w-3 mr-1" /> Stok
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setCogsProduct(p)} title="Kalkulator HPP">
                      <Calculator className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setLogProduct(p.id)}>
                      <History className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setEditProduct(p)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 text-xs text-destructive hover:text-destructive" onClick={() => {
                      if (confirm(`Hapus produk "${p.name}"?`)) deleteProd.mutate({ id: p.id });
                    }}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Bulk Import Dialog */}
      <BulkImportDialog
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        onImport={(products) => bulkCreate.mutate({ products })}
      />

      {/* Adjust Stock Dialog */}
      <Dialog open={!!adjustProduct} onOpenChange={(open) => { if (!open) setAdjustProduct(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Sesuaikan Stok — {adjustProduct?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <p className="text-sm text-muted-foreground">Stok saat ini: <strong>{adjustProduct?.stockCurrent} {adjustProduct?.unit}</strong></p>
            <div className="space-y-1.5">
              <Label className="text-xs">Tipe</Label>
              <Select value={adjustForm.type} onValueChange={(v: any) => setAdjustForm({ ...adjustForm, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">Stok Masuk</SelectItem>
                  <SelectItem value="out">Stok Keluar</SelectItem>
                  <SelectItem value="adjustment">Penyesuaian</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Jumlah</Label>
              <Input type="number" value={adjustForm.qty} onChange={(e) => setAdjustForm({ ...adjustForm, qty: e.target.value })} placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Catatan</Label>
              <Input value={adjustForm.notes} onChange={(e) => setAdjustForm({ ...adjustForm, notes: e.target.value })} placeholder="Alasan penyesuaian" />
            </div>
            <Button className="w-full" disabled={adjustStock.isPending || !adjustForm.qty} onClick={() => {
              adjustStock.mutate({
                productId: adjustProduct.id,
                qty: parseInt(adjustForm.qty),
                type: adjustForm.type,
                notes: adjustForm.notes || undefined,
              });
            }}>
              {adjustStock.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={!!editProduct} onOpenChange={(open) => { if (!open) setEditProduct(null); }}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Produk</DialogTitle></DialogHeader>
          {editProduct && (
            <EditProductForm product={editProduct} onSave={(data) => {
              updateProd.mutate({ id: editProduct.id, ...data });
            }} isPending={updateProd.isPending} />
          )}
        </DialogContent>
      </Dialog>

      {/* Stock Log Dialog */}
      <Dialog open={!!logProduct} onOpenChange={(open) => { if (!open) setLogProduct(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Riwayat Stok</DialogTitle></DialogHeader>
          <div className="max-h-80 overflow-y-auto">
            {!stockLogs || stockLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Belum ada riwayat</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 font-medium">Tanggal</th>
                    <th className="text-left py-2 font-medium">Tipe</th>
                    <th className="text-right py-2 font-medium">Qty</th>
                    <th className="text-right py-2 font-medium">Stok</th>
                  </tr>
                </thead>
                <tbody>
                  {stockLogs.map((log: any) => (
                    <tr key={log.id} className="border-b last:border-0">
                      <td className="py-2 text-muted-foreground">{log.date}</td>
                      <td className="py-2">
                        <Badge variant="secondary" className="text-xs">{log.movementType}</Badge>
                      </td>
                      <td className={`py-2 text-right font-medium ${log.direction > 0 ? "text-emerald-600" : "text-red-500"}`}>
                        {log.direction > 0 ? "+" : "-"}{log.qty}
                      </td>
                      <td className="py-2 text-right text-muted-foreground">{log.stockBefore} → {log.stockAfter}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* COGS Calculator Dialog */}
      {cogsProduct && (
        <COGSCalculator
          open={!!cogsProduct}
          onClose={() => setCogsProduct(null)}
          productId={cogsProduct.id}
          productName={cogsProduct.name}
          currentHpp={cogsProduct.hpp}
          sellingPrice={cogsProduct.sellingPrice}
        />
      )}
    </div>
  );
}

function EditProductForm({ product, onSave, isPending }: { product: any; onSave: (data: any) => void; isPending: boolean }) {
  const { data: dbCategories = [] } = trpc.category.list.useQuery(undefined, { retry: false });
  const topLevelCats = (dbCategories as any[]).filter((c: any) => !c.parentId);
  const getDbSubcategories = (parentId: number) => (dbCategories as any[]).filter((c: any) => c.parentId === parentId);

  // Try to match existing category string to DB IDs
  const parseCategory = (catStr: string) => {
    if (!catStr) return { category: "", subcategory: "" };
    const parts = catStr.split(" / ");
    const catName = parts[0];
    const subName = parts[1];
    const catObj = (dbCategories as any[]).find((c: any) => !c.parentId && c.name === catName);
    if (catObj) {
      const subObj = (dbCategories as any[]).find((c: any) => c.parentId === catObj.id && c.name === subName);
      return { category: String(catObj.id), subcategory: subObj ? String(subObj.id) : "" };
    }
    return { category: "", subcategory: "" };
  };

  const parsed = parseCategory(product.category || "");
  const [form, setForm] = useState({
    name: product.name, sku: product.sku || "",
    category: parsed.category, subcategory: parsed.subcategory,
    hpp: String(product.hpp), sellingPrice: String(product.sellingPrice),
    stockMinimum: String(product.stockMinimum), unit: product.unit,
    priceType: (product.priceType || "fixed") as "fixed" | "dynamic",
    discountPercent: String(parseFloat(product.discountPercent || "0")),
    productType: (product.productType || "barang") as "barang" | "jasa",
  });
  const [editImageUrl, setEditImageUrl] = useState<string>(product.imageUrl || "");

  return (
    <div className="space-y-3 pt-2">
      <ImageUploader currentUrl={product.imageUrl} onUpload={(url) => setEditImageUrl(url)} />
      <div className="space-y-1.5">
        <Label className="text-xs">Tipe Produk</Label>
        <div className="flex gap-2">
          <Button type="button" variant={form.productType === "barang" ? "default" : "outline"} size="sm" className="flex-1"
            onClick={() => setForm({ ...form, productType: "barang" })}>Barang</Button>
          <Button type="button" variant={form.productType === "jasa" ? "default" : "outline"} size="sm" className="flex-1"
            onClick={() => setForm({ ...form, productType: "jasa", stockMinimum: "0" })}>Jasa</Button>
        </div>
        {form.productType === "jasa" && (
          <p className="text-[11px] text-blue-600 dark:text-blue-400">Produk jasa tidak memiliki stok fisik — stok tidak akan dikurangi saat dijual via POS.</p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Nama Produk</Label>
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">SKU</Label>
        <div className="flex gap-2">
          <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="flex-1" />
          <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={() => setForm({ ...form, sku: generateSKU(form.name || "PRD") })}>
            Generate
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Kategori</Label>
          {topLevelCats.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-1">Belum ada kategori. Buat di <a href="/pengaturan" className="underline text-primary">Pengaturan → Kategori</a></p>
          ) : (
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v, subcategory: "" })}>
              <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
              <SelectContent>
                {topLevelCats.map((c: any) => (<SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>))}
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Sub-kategori</Label>
          <Select value={form.subcategory} onValueChange={(v) => setForm({ ...form, subcategory: v })} disabled={!form.category}>
            <SelectTrigger><SelectValue placeholder={form.category ? "Pilih sub-kategori" : "Pilih kategori dulu"} /></SelectTrigger>
            <SelectContent>
              {getDbSubcategories(parseInt(form.category)).map((s: any) => (<SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Harga Modal (HPP)</Label>
        <Input type="number" value={form.hpp} onChange={(e) => setForm({ ...form, hpp: e.target.value })} />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Tipe Harga Jual</Label>
        <Select value={form.priceType} onValueChange={(v) => setForm({ ...form, priceType: v as "fixed" | "dynamic" })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="fixed">Harga Pasti (dengan diskon %)</SelectItem>
            <SelectItem value="dynamic">Harga Dinamis (input saat transaksi)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {form.priceType === "fixed" ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Harga Jual</Label>
            <Input type="number" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Diskon Default (%)</Label>
            <Input type="number" min="0" max="100" value={form.discountPercent} onChange={(e) => setForm({ ...form, discountPercent: e.target.value })} placeholder="0" />
          </div>
        </div>
      ) : (
        <div className="rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-3 text-xs text-amber-700 dark:text-amber-300">
          Harga akan diinput manual saat transaksi di POS/Kasir.
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        {form.productType === "barang" && (
          <div className="space-y-1.5">
            <Label className="text-xs">Stok Minimum</Label>
            <Input type="number" value={form.stockMinimum} onChange={(e) => setForm({ ...form, stockMinimum: e.target.value })} />
          </div>
        )}
        <div className="space-y-1.5">
          <Label className="text-xs">Satuan</Label>
          <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PRODUCT_UNITS.map((u) => (<SelectItem key={u} value={u}>{u}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button className="w-full" disabled={isPending} onClick={() => {
        const catObj = topLevelCats.find((c: any) => String(c.id) === form.category);
        const subObj = getDbSubcategories(parseInt(form.category)).find((s: any) => String(s.id) === form.subcategory);
        const categoryStr = subObj ? `${catObj?.name} / ${subObj.name}` : (catObj?.name || undefined);
        onSave({
          name: form.name, sku: form.sku || undefined, category: categoryStr,
          hpp: parseInt(form.hpp) || 0, sellingPrice: parseInt(form.sellingPrice) || 0,
          stockMinimum: form.productType === "jasa" ? 0 : (parseInt(form.stockMinimum) || 0), unit: form.unit,
          imageUrl: editImageUrl || undefined,
          priceType: form.priceType,
          discountPercent: parseFloat(form.discountPercent) || 0,
          productType: form.productType,
        });
      }}>
        {isPending ? "Menyimpan..." : "Simpan Perubahan"}
      </Button>
    </div>
  );
}

// ─── Warehouse Distribution mini-component ───
function WarehouseDistribution({ productId }: { productId: number }) {
  const { data: distribution } = trpc.warehouse.productDistribution.useQuery(
    { productId },
    { retry: false, refetchOnWindowFocus: false }
  );

  if (!distribution || distribution.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground border-t pt-2">
      <Warehouse className="h-3 w-3" />
      {distribution.map((d: any) => (
        <Badge key={d.warehouseId} variant="outline" className="text-[10px] h-5 px-1.5 font-normal">
          {d.warehouseName}: {d.quantity}
        </Badge>
      ))}
    </div>
  );
}
