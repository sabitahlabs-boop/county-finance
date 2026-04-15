import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Calculator, Plus, Trash2, Pencil, Package, Loader2, Info, ChevronDown, ChevronUp } from "lucide-react";
import { formatRupiah, PRODUCT_UNITS } from "../../../shared/finance";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type CompositionForm = {
  materialName: string;
  qty: string;
  unit: string;
  costPerUnit: string;
  notes: string;
};

const emptyForm: CompositionForm = {
  materialName: "",
  qty: "",
  unit: "pcs",
  costPerUnit: "",
  notes: "",
};

export function COGSCalculator({
  open,
  onClose,
  productId,
  productName,
  currentHpp,
  sellingPrice,
}: {
  open: boolean;
  onClose: () => void;
  productId: number;
  productName: string;
  currentHpp: number;
  sellingPrice: number;
}) {
  const [form, setForm] = useState<CompositionForm>({ ...emptyForm });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);

  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.composition.list.useQuery(
    { productId },
    { enabled: open }
  );

  const createMutation = trpc.composition.create.useMutation({
    onSuccess: (result) => {
      utils.composition.list.invalidate({ productId });
      utils.product.list.invalidate();
      toast.success(`Bahan "${form.materialName}" ditambahkan. HPP baru: ${formatRupiah(result.totalCogs)}`);
      resetForm();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.composition.update.useMutation({
    onSuccess: (result) => {
      utils.composition.list.invalidate({ productId });
      utils.product.list.invalidate();
      toast.success(`Bahan diperbarui. HPP baru: ${formatRupiah(result.totalCogs)}`);
      resetForm();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.composition.delete.useMutation({
    onSuccess: (result) => {
      utils.composition.list.invalidate({ productId });
      utils.product.list.invalidate();
      toast.success(`Bahan dihapus. HPP baru: ${formatRupiah(result.totalCogs)}`);
    },
    onError: (err) => toast.error(err.message),
  });

  const resetForm = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = () => {
    if (!form.materialName) { toast.error("Nama bahan harus diisi"); return; }
    const qty = parseFloat(form.qty);
    const costPerUnit = parseInt(form.costPerUnit);
    if (!qty || qty <= 0) { toast.error("Jumlah harus lebih dari 0"); return; }
    if (isNaN(costPerUnit) || costPerUnit < 0) { toast.error("Harga per satuan harus valid"); return; }

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        materialName: form.materialName,
        qty,
        unit: form.unit,
        costPerUnit,
        notes: form.notes || undefined,
      });
    } else {
      createMutation.mutate({
        productId,
        materialName: form.materialName,
        qty,
        unit: form.unit,
        costPerUnit,
        notes: form.notes || undefined,
      });
    }
  };

  const handleEdit = (comp: any) => {
    setForm({
      materialName: comp.materialName,
      qty: String(parseFloat(comp.qty)),
      unit: comp.unit,
      costPerUnit: String(comp.costPerUnit),
      notes: comp.notes || "",
    });
    setEditingId(comp.id);
    setShowForm(true);
  };

  const compositions = data?.compositions ?? [];
  const totalCogs = data?.totalCogs ?? 0;
  const margin = sellingPrice > 0 ? sellingPrice - totalCogs : 0;
  const marginPct = totalCogs > 0 ? Math.round((margin / totalCogs) * 100) : 0;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { resetForm(); onClose(); } }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Kalkulator HPP (COGS)
          </DialogTitle>
        </DialogHeader>

        {/* Product info */}
        <div className="rounded-lg bg-muted/50 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">{productName}</p>
              <p className="text-xs text-muted-foreground">Hitung HPP dari komposisi bahan</p>
            </div>
            <Package className="h-8 w-8 text-muted-foreground/30" />
          </div>
          
          {/* HPP Summary */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">HPP (COGS)</p>
              <p className="font-bold text-sm text-orange-600">{formatRupiah(totalCogs)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Harga Jual</p>
              <p className="font-bold text-sm">{formatRupiah(sellingPrice)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Margin</p>
              <p className={`font-bold text-sm ${margin >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                {marginPct}%
              </p>
            </div>
          </div>
        </div>

        {/* Composition list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : compositions.length === 0 ? (
          <div className="text-center py-6">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <Info className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Belum ada komposisi bahan.</p>
            <p className="text-xs text-muted-foreground mt-1">Tambahkan bahan/material untuk menghitung HPP otomatis.</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Komposisi Bahan ({compositions.length} item)</p>
            {compositions.map((comp: any) => {
              const qty = parseFloat(comp.qty);
              const subtotal = qty * comp.costPerUnit;
              const pct = totalCogs > 0 ? Math.round((subtotal / totalCogs) * 100) : 0;
              return (
                <div key={comp.id} className="flex items-center gap-2 px-3 py-2 rounded-lg border hover:bg-muted/30 transition-colors group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{comp.materialName}</span>
                      <Badge variant="secondary" className="text-[10px] shrink-0">{pct}%</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {qty} {comp.unit} × {formatRupiah(comp.costPerUnit)} = <span className="font-medium text-foreground">{formatRupiah(subtotal)}</span>
                    </div>
                    {comp.notes && <p className="text-[10px] text-muted-foreground mt-0.5">{comp.notes}</p>}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(comp)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-500 hover:text-red-600"
                      onClick={() => deleteMutation.mutate({ id: comp.id })}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })}

            {/* Total bar */}
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800">
              <span className="text-sm font-semibold">Total HPP</span>
              <span className="text-sm font-bold text-orange-600">{formatRupiah(totalCogs)}</span>
            </div>
          </div>
        )}

        {/* Add/Edit form */}
        {showForm ? (
          <div className="space-y-3 border rounded-lg p-3">
            <p className="text-xs font-medium">{editingId ? "Edit Bahan" : "Tambah Bahan Baru"}</p>
            <div>
              <Label className="text-xs">Nama Bahan/Material</Label>
              <Input
                value={form.materialName}
                onChange={(e) => setForm(prev => ({ ...prev, materialName: e.target.value }))}
                placeholder="Contoh: Beras, Telur, Minyak Goreng"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">Jumlah</Label>
                <Input
                  type="number"
                  step="0.001"
                  value={form.qty}
                  onChange={(e) => setForm(prev => ({ ...prev, qty: e.target.value }))}
                  placeholder="0.5"
                />
              </div>
              <div>
                <Label className="text-xs">Satuan</Label>
                <Select value={form.unit} onValueChange={(v) => setForm(prev => ({ ...prev, unit: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[...PRODUCT_UNITS, "gram", "ml"].map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Harga/Satuan</Label>
                <Input
                  type="number"
                  value={form.costPerUnit}
                  onChange={(e) => setForm(prev => ({ ...prev, costPerUnit: e.target.value }))}
                  placeholder="5000"
                />
              </div>
            </div>
            {form.qty && form.costPerUnit && (
              <div className="text-xs text-muted-foreground">
                Subtotal: <span className="font-medium text-foreground">{formatRupiah(parseFloat(form.qty || "0") * parseInt(form.costPerUnit || "0"))}</span>
              </div>
            )}
            <div>
              <Label className="text-xs">Catatan (opsional)</Label>
              <Input
                value={form.notes}
                onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Contoh: Beli di pasar induk"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={resetForm}>Batal</Button>
              <Button size="sm" onClick={handleSubmit} disabled={isSaving} className="gap-1">
                {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                {editingId ? "Simpan Perubahan" : "Tambah Bahan"}
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" className="w-full gap-2" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" /> Tambah Bahan
          </Button>
        )}

        {/* Info box */}
        <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-3 text-xs text-blue-700 dark:text-blue-300">
          <p className="font-medium mb-1">Cara Pakai:</p>
          <ul className="space-y-0.5 list-disc list-inside">
            <li>Tambahkan semua bahan yang dibutuhkan untuk membuat 1 unit produk</li>
            <li>HPP akan otomatis dihitung dan diupdate di data produk</li>
            <li>Contoh: 1 Nasi Goreng = 200g Beras (Rp 2.400) + 2 Telur (Rp 6.000) + 50ml Minyak (Rp 1.000)</li>
            <li>HPP = Rp 9.400 → Patokan harga jual minimal</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
