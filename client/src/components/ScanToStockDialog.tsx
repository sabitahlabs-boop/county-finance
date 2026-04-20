import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, ChevronRight, Check, SkipForward, AlertCircle, Loader2, Plus, Link2 } from "lucide-react";
import { formatRupiah, PRODUCT_UNITS } from "../../../shared/finance";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type ScannedItem = {
  name: string;
  qty: number;
  price: number;
  total: number;
};

type ItemToAdd = {
  name: string;
  qty: number;
  hpp: number; // cost per unit = price from receipt
  sellingPrice: number;
  unit: string;
  sku: string;
  stockMinimum: number;
  matchedProductId: number | null; // if matched to existing product
  matchedProductName: string | null;
};

export function ScanToStockDialog({
  open,
  onClose,
  items,
  vendorName,
}: {
  open: boolean;
  onClose: () => void;
  items: ScannedItem[];
  vendorName?: string;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [addedCount, setAddedCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state for current item
  const currentItem = items[currentIndex];
  const [form, setForm] = useState<ItemToAdd>(() => getDefaultForm(items[0]));

  const utils = trpc.useUtils();
  const createProduct = trpc.product.create.useMutation({
    onSuccess: () => {
      utils.product.list.invalidate();
    },
  });
  const adjustStock = trpc.product.adjustStock.useMutation({
    onSuccess: () => {
      utils.product.list.invalidate();
    },
  });

  function getDefaultForm(item: ScannedItem | undefined): ItemToAdd {
    if (!item) return { name: "", qty: 1, hpp: 0, sellingPrice: 0, unit: "pcs", sku: "", stockMinimum: 5, matchedProductId: null, matchedProductName: null };
    // Auto-fill from scan: name, qty, hpp — all editable
    const qty = item.qty > 0 ? item.qty : 1;
    const hpp = item.price > 0 ? item.price : 0;
    const suggestedSell = hpp > 0 ? Math.round(hpp * 1.3) : 0;
    return {
      name: item.name || "",
      qty,
      hpp,
      sellingPrice: suggestedSell,
      unit: "pcs",
      sku: "",
      stockMinimum: 5,
      matchedProductId: null,
      matchedProductName: null,
    };
  }

  // Search for existing products matching the item name
  const { data: matchedProducts } = trpc.searchProducts.useQuery(
    { name: currentItem?.name || "" },
    { enabled: !!currentItem?.name && currentItem.name.length > 1 }
  );

  const handleSaveAsNew = async () => {
    if (!form.name) { toast.error("Nama produk harus diisi"); return; }
    if (form.hpp <= 0) { toast.error("Harga beli (HPP) harus lebih dari 0"); return; }
    setSaving(true);
    try {
      await createProduct.mutateAsync({
        name: form.name,
        sku: form.sku || undefined,
        hpp: form.hpp,
        sellingPrice: form.sellingPrice,
        stockCurrent: form.qty,
        stockMinimum: form.stockMinimum,
        unit: form.unit,
      });
      toast.success(`"${form.name}" ditambahkan ke stok (${form.qty} ${form.unit})`);
      setAddedCount(prev => prev + 1);
      goNext();
    } catch (err: any) {
      toast.error(err.message || "Gagal menambahkan produk");
    } finally {
      setSaving(false);
    }
  };

  const handleAddToExisting = async () => {
    if (!form.matchedProductId) { toast.error("Pilih produk yang sudah ada"); return; }
    setSaving(true);
    try {
      await adjustStock.mutateAsync({
        productId: form.matchedProductId,
        qty: form.qty,
        type: "in",
        notes: vendorName ? `Dari struk: ${vendorName}` : "Dari scan struk",
      });
      toast.success(`Stok "${form.matchedProductName}" ditambah ${form.qty} ${form.unit}`);
      setAddedCount(prev => prev + 1);
      goNext();
    } catch (err: any) {
      toast.error(err.message || "Gagal menambah stok");
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    setSkippedCount(prev => prev + 1);
    goNext();
  };

  const goNext = () => {
    if (currentIndex + 1 >= items.length) {
      setIsFinished(true);
    } else {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setForm(getDefaultForm(items[nextIdx]));
    }
  };

  const handleClose = () => {
    setCurrentIndex(0);
    setAddedCount(0);
    setSkippedCount(0);
    setIsFinished(false);
    setForm(getDefaultForm(items[0]));
    onClose();
  };

  const selectExistingProduct = (product: any) => {
    setForm(prev => ({
      ...prev,
      matchedProductId: product.id,
      matchedProductName: product.name,
      unit: product.unit || prev.unit,
    }));
  };

  if (!items.length) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Tambah ke Stok Produk
          </DialogTitle>
        </DialogHeader>

        {/* Progress bar */}
        {!isFinished && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Item {currentIndex + 1} dari {items.length}</span>
              <span>{addedCount} ditambahkan, {skippedCount} dilewati</span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5">
              <div
                className="bg-primary h-1.5 rounded-full transition-all"
                style={{ width: `${((currentIndex) / items.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Finished state */}
        {isFinished && (
          <div className="text-center py-6 space-y-4">
            <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
              <Check className="h-8 w-8 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Selesai!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {addedCount > 0 && <><strong>{addedCount}</strong> item ditambahkan ke stok. </>}
                {skippedCount > 0 && <><strong>{skippedCount}</strong> item dilewati.</>}
                {addedCount === 0 && skippedCount === 0 && "Tidak ada item yang diproses."}
              </p>
            </div>
            <Button onClick={handleClose} className="w-full">Tutup</Button>
          </div>
        )}

        {/* Item review form */}
        {!isFinished && currentItem && (
          <div className="space-y-4">
            {/* Original scan data */}
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <p className="text-xs font-medium text-muted-foreground mb-1">Data dari struk:</p>
              <div className="flex items-center justify-between">
                <span className="font-medium">{currentItem.name}</span>
                <span className="text-muted-foreground">{currentItem.qty}x @ {formatRupiah(currentItem.price)}</span>
              </div>
              <div className="text-right text-xs text-muted-foreground mt-0.5">
                Total: {formatRupiah(currentItem.total)}
              </div>
            </div>

            {/* Matched existing products */}
            {matchedProducts && matchedProducts.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Link2 className="h-3 w-3" /> Produk serupa ditemukan:
                </p>
                <div className="space-y-1">
                  {matchedProducts.map((p: any) => (
                    <button
                      key={p.id}
                      onClick={() => selectExistingProduct(p)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all border ${
                        form.matchedProductId === p.id
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border hover:border-primary/30 hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{p.name}</span>
                        <Badge variant="secondary" className="text-xs">Stok: {p.stockCurrent} {p.unit}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        HPP: {formatRupiah(p.hpp)} | Jual: {formatRupiah(p.sellingPrice)}
                      </div>
                    </button>
                  ))}
                </div>
                {form.matchedProductId && (
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label className="text-xs">Qty masuk</Label>
                      <Input
                        type="number"
                        value={form.qty}
                        onChange={(e) => setForm(prev => ({ ...prev, qty: parseInt(e.target.value) || 0 }))}
                        min={1}
                      />
                    </div>
                    <div className="flex-1 flex items-end">
                      <Button onClick={handleAddToExisting} disabled={saving} className="w-full gap-1">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        Tambah Stok
                      </Button>
                    </div>
                  </div>
                )}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">atau buat produk baru</span>
                  </div>
                </div>
              </div>
            )}

            {/* New product form */}
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-xs">Nama Produk</Label>
                  {currentItem?.name && <span className="text-xs text-primary font-medium bg-primary/10 px-1.5 py-0.5 rounded">Dari scan</span>}
                </div>
                <Input
                  value={form.name}
                  onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nama produk"
                  className={form.name ? "border-primary/40 bg-primary/5" : ""}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-xs">Qty (Stok Awal)</Label>
                    {currentItem?.qty > 0 && <span className="text-xs text-primary font-medium bg-primary/10 px-1.5 py-0.5 rounded">Dari scan</span>}
                  </div>
                  <Input
                    type="number"
                    value={form.qty}
                    onChange={(e) => setForm(prev => ({ ...prev, qty: parseInt(e.target.value) || 1 }))}
                    min={1}
                    className={currentItem?.qty > 0 ? "border-primary/40 bg-primary/5" : ""}
                  />
                </div>
                <div>
                  <Label className="text-xs">Satuan</Label>
                  <Select value={form.unit} onValueChange={(v) => setForm(prev => ({ ...prev, unit: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PRODUCT_UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-xs">Harga Beli (HPP)</Label>
                    {currentItem?.price > 0 && <span className="text-xs text-primary font-medium bg-primary/10 px-1.5 py-0.5 rounded">Dari scan</span>}
                  </div>
                  <Input
                    type="number"
                    value={form.hpp}
                    onChange={(e) => setForm(prev => ({ ...prev, hpp: parseInt(e.target.value) || 0 }))}
                    min={0}
                    className={currentItem?.price > 0 ? "border-primary/40 bg-primary/5" : ""}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-xs">Harga Jual</Label>
                    {currentItem?.price > 0 && <span className="text-xs text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-950 px-1.5 py-0.5 rounded">+30% saran</span>}
                  </div>
                  <Input
                    type="number"
                    value={form.sellingPrice}
                    onChange={(e) => setForm(prev => ({ ...prev, sellingPrice: parseInt(e.target.value) || 0 }))}
                    min={0}
                  />
                </div>
              </div>
              {form.sellingPrice > 0 && form.hpp > 0 && (
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Margin: {formatRupiah(form.sellingPrice - form.hpp)} ({Math.round(((form.sellingPrice - form.hpp) / form.hpp) * 100)}%)
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">SKU (opsional)</Label>
                  <Input
                    value={form.sku}
                    onChange={(e) => setForm(prev => ({ ...prev, sku: e.target.value }))}
                    placeholder="Kode produk"
                  />
                </div>
                <div>
                  <Label className="text-xs">Stok Minimum</Label>
                  <Input
                    type="number"
                    value={form.stockMinimum}
                    onChange={(e) => setForm(prev => ({ ...prev, stockMinimum: parseInt(e.target.value) || 0 }))}
                    min={0}
                  />
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={handleSkip} className="gap-1 text-muted-foreground">
                <SkipForward className="h-3.5 w-3.5" /> Lewati
              </Button>
              <div className="flex-1" />
              <Button onClick={handleSaveAsNew} disabled={saving || !form.name} className="gap-1">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Simpan Produk Baru
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
