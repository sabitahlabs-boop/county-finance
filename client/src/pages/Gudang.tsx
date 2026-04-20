import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Warehouse, Plus, Pencil, Trash2, Star, Package, ArrowRightLeft,
  Search, MapPin, Phone, StickyNote, Loader2, AlertTriangle, Box,
  ChevronRight, ArrowRight, History
} from "lucide-react";
import { formatRupiah } from "../../../shared/finance";

export default function GudangPage() {
  const [activeTab, setActiveTab] = useState("warehouses");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<any>(null);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | null>(null);
  const [searchStock, setSearchStock] = useState("");

  const utils = trpc.useUtils();
  const { data: warehouses = [], isLoading } = trpc.warehouse.list.useQuery();
  const { data: products = [] } = trpc.product.list.useQuery();
  const { data: transfers = [] } = trpc.warehouse.transfers.useQuery();

  // Auto-migrate stock to default warehouse on first load
  const migrateStock = trpc.warehouse.migrateStock.useMutation({
    onSuccess: () => {
      utils.warehouse.list.invalidate();
      utils.warehouse.stock.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const ensureDefault = trpc.warehouse.ensureDefault.useMutation({
    onSuccess: (wh) => {
      utils.warehouse.list.invalidate();
      if (wh) {
        setSelectedWarehouseId(wh.id);
        migrateStock.mutate();
      }
    },
    onError: (err) => toast.error(err.message),
  });

  useEffect(() => {
    if (!isLoading && warehouses.length === 0) {
      ensureDefault.mutate();
    } else if (!isLoading && warehouses.length > 0 && !selectedWarehouseId) {
      const def = warehouses.find((w: any) => w.isDefault) || warehouses[0];
      setSelectedWarehouseId(def.id);
    }
  }, [isLoading, warehouses.length]);

  const { data: warehouseStock = [], isLoading: stockLoading } = trpc.warehouse.stock.useQuery(
    { warehouseId: selectedWarehouseId! },
    { enabled: !!selectedWarehouseId }
  );

  const filteredStock = useMemo(() => {
    if (!searchStock) return warehouseStock;
    const q = searchStock.toLowerCase();
    return warehouseStock.filter((s: any) =>
      s.productName?.toLowerCase().includes(q) || s.productSku?.toLowerCase().includes(q)
    );
  }, [warehouseStock, searchStock]);

  const createWarehouse = trpc.warehouse.create.useMutation({
    onSuccess: () => {
      toast.success("Gudang berhasil ditambahkan");
      utils.warehouse.list.invalidate();
      setShowAddDialog(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const updateWarehouse = trpc.warehouse.update.useMutation({
    onSuccess: () => {
      toast.success("Gudang berhasil diperbarui");
      utils.warehouse.list.invalidate();
      setEditingWarehouse(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteWarehouse = trpc.warehouse.delete.useMutation({
    onSuccess: () => {
      toast.success("Gudang berhasil dihapus");
      utils.warehouse.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const setDefault = trpc.warehouse.setDefault.useMutation({
    onSuccess: () => {
      toast.success("Gudang utama berhasil diubah");
      utils.warehouse.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const transferStock = trpc.warehouse.transfer.useMutation({
    onSuccess: (result) => {
      toast.success(`Transfer berhasil! Stok asal: ${result.fromQty}, Stok tujuan: ${result.toQty}`);
      utils.warehouse.stock.invalidate();
      utils.warehouse.transfers.invalidate();
      utils.product.list.invalidate();
      setShowTransferDialog(false);
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Warehouse className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            Manajemen Gudang
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola gudang, distribusi stok, dan transfer antar gudang
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowTransferDialog(true)} disabled={warehouses.length < 2}>
            <ArrowRightLeft className="h-4 w-4 mr-2" />
            Transfer Stok
          </Button>
          <Button onClick={() => setShowAddDialog(true)} className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700">
            <Plus className="h-4 w-4 mr-2" />
            Tambah Gudang
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="warehouses"><Warehouse className="h-4 w-4 mr-1.5" /> Gudang</TabsTrigger>
          <TabsTrigger value="stock"><Package className="h-4 w-4 mr-1.5" /> Stok</TabsTrigger>
          <TabsTrigger value="transfers"><History className="h-4 w-4 mr-1.5" /> Riwayat</TabsTrigger>
        </TabsList>

        {/* Tab: Warehouse List */}
        <TabsContent value="warehouses" className="space-y-4 mt-4">
          {warehouses.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Warehouse className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">Belum ada gudang. Klik "Tambah Gudang" untuk memulai.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {warehouses.map((wh: any) => (
                <Card key={wh.id} className={`relative overflow-hidden transition-all hover:shadow-md ${wh.isDefault ? "ring-2 ring-amber-500/50" : ""}`}>
                  {wh.isDefault && (
                    <div className="absolute top-0 right-0">
                      <Badge className="rounded-none rounded-bl-lg bg-amber-500 text-white border-0">
                        <Star className="h-3 w-3 mr-1" /> Utama
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center text-white">
                        <Warehouse className="h-5 w-5" />
                      </div>
                      {wh.name}
                    </CardTitle>
                    {wh.address && (
                      <CardDescription className="flex items-start gap-1.5 mt-1">
                        <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                        {wh.address}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {wh.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" />
                        {wh.phone}
                      </div>
                    )}
                    {wh.notes && (
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <StickyNote className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                        <span className="line-clamp-2">{wh.notes}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedWarehouseId(wh.id);
                          setActiveTab("stock");
                        }}
                      >
                        <Package className="h-3.5 w-3.5 mr-1" /> Lihat Stok
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setEditingWarehouse(wh)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      {!wh.isDefault && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => setDefault.mutate({ id: wh.id })} title="Jadikan gudang utama">
                            <Star className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => {
                              if (confirm("Hapus gudang ini? Stok di gudang ini harus dipindahkan terlebih dahulu.")) {
                                deleteWarehouse.mutate({ id: wh.id });
                              }
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab: Stock per Warehouse */}
        <TabsContent value="stock" className="space-y-4 mt-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Select
              value={selectedWarehouseId?.toString() ?? ""}
              onValueChange={(v) => setSelectedWarehouseId(Number(v))}
            >
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue placeholder="Pilih Gudang" />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((wh: any) => (
                  <SelectItem key={wh.id} value={wh.id.toString()}>
                    {wh.name} {wh.isDefault ? "(Utama)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari produk..."
                value={searchStock}
                onChange={(e) => setSearchStock(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {stockLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filteredStock.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Box className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">
                  {searchStock ? "Tidak ada produk yang cocok" : "Belum ada stok di gudang ini"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left p-3 font-medium">Produk</th>
                      <th className="text-left p-3 font-medium">SKU</th>
                      <th className="text-right p-3 font-medium">Stok</th>
                      <th className="text-left p-3 font-medium">Satuan</th>
                      <th className="text-right p-3 font-medium">HPP</th>
                      <th className="text-right p-3 font-medium">Harga Jual</th>
                      <th className="text-right p-3 font-medium">Nilai Stok</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStock.map((item: any) => {
                      const isLow = item.productStockMinimum && item.quantity <= item.productStockMinimum;
                      return (
                        <tr key={item.id} className={`border-t hover:bg-muted/30 transition-colors ${isLow ? "bg-red-50 dark:bg-red-950/20" : ""}`}>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              {item.productImageUrl ? (
                                <img src={item.productImageUrl} alt="" className="h-8 w-8 rounded object-cover" />
                              ) : (
                                <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                                  <Package className="h-4 w-4 text-muted-foreground" />
                                </div>
                              )}
                              <span className="font-medium">{item.productName}</span>
                            </div>
                          </td>
                          <td className="p-3 text-muted-foreground">{item.productSku || "-"}</td>
                          <td className="p-3 text-right font-mono">
                            <span className={isLow ? "text-red-600 dark:text-red-400 font-bold" : ""}>
                              {item.quantity}
                            </span>
                            {isLow && <AlertTriangle className="h-3.5 w-3.5 text-red-500 inline ml-1" />}
                          </td>
                          <td className="p-3 text-muted-foreground">{item.productUnit || "pcs"}</td>
                          <td className="p-3 text-right font-mono">{formatRupiah(item.productHpp || 0)}</td>
                          <td className="p-3 text-right font-mono">{formatRupiah(item.productSellingPrice || 0)}</td>
                          <td className="p-3 text-right font-mono font-medium">
                            {formatRupiah((item.productHpp || 0) * item.quantity)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t bg-muted/30 font-medium">
                      <td colSpan={2} className="p-3">Total</td>
                      <td className="p-3 text-right font-mono">
                        {filteredStock.reduce((s: number, i: any) => s + i.quantity, 0)}
                      </td>
                      <td colSpan={3}></td>
                      <td className="p-3 text-right font-mono">
                        {formatRupiah(filteredStock.reduce((s: number, i: any) => s + ((i.productHpp || 0) * i.quantity), 0))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Tab: Transfer History */}
        <TabsContent value="transfers" className="space-y-4 mt-4">
          {transfers.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ArrowRightLeft className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">Belum ada riwayat transfer stok antar gudang</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {transfers.map((t: any) => {
                const fromWh = warehouses.find((w: any) => w.id === t.fromWarehouseId);
                const toWh = warehouses.find((w: any) => w.id === t.toWarehouseId);
                return (
                  <Card key={t.id} className="hover:shadow-sm transition-all">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex items-center gap-2 flex-1">
                          <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <ArrowRightLeft className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <div className="font-medium">{t.productName}</div>
                            <div className="text-xs text-muted-foreground">{t.productSku || ""}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Badge variant="outline" className="font-normal">
                            {fromWh?.name ?? `Gudang #${t.fromWarehouseId}`}
                          </Badge>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          <Badge variant="outline" className="font-normal">
                            {toWh?.name ?? `Gudang #${t.toWarehouseId}`}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-medium">{t.qty} {t.productUnit || "pcs"}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(t.date || t.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                          </div>
                        </div>
                      </div>
                      {t.notes && (
                        <p className="text-xs text-muted-foreground mt-2 pl-12">{t.notes}</p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add/Edit Warehouse Dialog */}
      <WarehouseFormDialog
        open={showAddDialog || !!editingWarehouse}
        onClose={() => { setShowAddDialog(false); setEditingWarehouse(null); }}
        warehouse={editingWarehouse}
        onSubmit={(data) => {
          if (editingWarehouse) {
            updateWarehouse.mutate({ id: editingWarehouse.id, ...data });
          } else {
            createWarehouse.mutate(data);
          }
        }}
        loading={createWarehouse.isPending || updateWarehouse.isPending}
      />

      {/* Transfer Stock Dialog */}
      <TransferStockDialog
        open={showTransferDialog}
        onClose={() => setShowTransferDialog(false)}
        warehouses={warehouses}
        products={products}
        onSubmit={(data) => transferStock.mutate(data)}
        loading={transferStock.isPending}
      />
    </div>
  );
}

// ─── Warehouse Form Dialog ───
function WarehouseFormDialog({
  open, onClose, warehouse, onSubmit, loading,
}: {
  open: boolean;
  onClose: () => void;
  warehouse: any;
  onSubmit: (data: { name: string; address?: string; phone?: string; notes?: string }) => void;
  loading: boolean;
}) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (warehouse) {
      setName(warehouse.name || "");
      setAddress(warehouse.address || "");
      setPhone(warehouse.phone || "");
      setNotes(warehouse.notes || "");
    } else {
      setName(""); setAddress(""); setPhone(""); setNotes("");
    }
  }, [warehouse, open]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{warehouse ? "Edit Gudang" : "Tambah Gudang Baru"}</DialogTitle>
          <DialogDescription>
            {warehouse ? "Perbarui informasi gudang" : "Isi detail gudang baru Anda"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nama Gudang *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Gudang Toko Pusat" />
          </div>
          <div>
            <Label>Alamat</Label>
            <Textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Alamat gudang (opsional)" rows={2} />
          </div>
          <div>
            <Label>Telepon</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08xx-xxxx-xxxx" />
          </div>
          <div>
            <Label>Catatan</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Catatan tambahan (opsional)" rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button
            onClick={() => onSubmit({ name, address: address || undefined, phone: phone || undefined, notes: notes || undefined })}
            disabled={!name.trim() || loading}
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {warehouse ? "Simpan" : "Tambah"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Transfer Stock Dialog ───
function TransferStockDialog({
  open, onClose, warehouses, products, onSubmit, loading,
}: {
  open: boolean;
  onClose: () => void;
  warehouses: any[];
  products: any[];
  onSubmit: (data: { fromWarehouseId: number; toWarehouseId: number; productId: number; qty: number; date: string; notes?: string }) => void;
  loading: boolean;
}) {
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState("");
  const [notes, setNotes] = useState("");
  const today = new Date().toISOString().split("T")[0];

  // Get stock for selected source warehouse + product
  const { data: sourceStock } = trpc.warehouse.stock.useQuery(
    { warehouseId: Number(fromId) },
    { enabled: !!fromId }
  );

  const selectedProductStock = useMemo(() => {
    if (!sourceStock || !productId) return null;
    return sourceStock.find((s: any) => s.productId === Number(productId));
  }, [sourceStock, productId]);

  useEffect(() => {
    if (!open) {
      setFromId(""); setToId(""); setProductId(""); setQty(""); setNotes("");
    }
  }, [open]);

  const activeProducts = products.filter((p: any) => p.isActive);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Transfer Stok Antar Gudang
          </DialogTitle>
          <DialogDescription>
            Pindahkan stok produk dari satu gudang ke gudang lainnya
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Dari Gudang *</Label>
              <Select value={fromId} onValueChange={setFromId}>
                <SelectTrigger>
                  <SelectValue placeholder="Gudang asal" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((wh: any) => (
                    <SelectItem key={wh.id} value={wh.id.toString()} disabled={wh.id.toString() === toId}>
                      {wh.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Ke Gudang *</Label>
              <Select value={toId} onValueChange={setToId}>
                <SelectTrigger>
                  <SelectValue placeholder="Gudang tujuan" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((wh: any) => (
                    <SelectItem key={wh.id} value={wh.id.toString()} disabled={wh.id.toString() === fromId}>
                      {wh.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Produk *</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih produk" />
              </SelectTrigger>
              <SelectContent>
                {activeProducts.map((p: any) => (
                  <SelectItem key={p.id} value={p.id.toString()}>
                    {p.name} {p.sku ? `(${p.sku})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedProductStock && (
              <p className="text-xs text-muted-foreground mt-1">
                Stok tersedia di gudang asal: <span className="font-medium">{selectedProductStock.quantity} {selectedProductStock.productUnit || "pcs"}</span>
              </p>
            )}
          </div>

          <div>
            <Label>Jumlah *</Label>
            <Input
              type="number"
              min={1}
              max={selectedProductStock?.quantity ?? undefined}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder="Jumlah yang ditransfer"
            />
          </div>

          <div>
            <Label>Catatan</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Catatan transfer (opsional)" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button
            onClick={() => {
              if (!fromId || !toId || !productId || !qty) {
                toast.error("Lengkapi semua field yang wajib diisi");
                return;
              }
              onSubmit({
                fromWarehouseId: Number(fromId),
                toWarehouseId: Number(toId),
                productId: Number(productId),
                qty: Number(qty),
                date: today,
                notes: notes || undefined,
              });
            }}
            disabled={!fromId || !toId || !productId || !qty || loading}
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Transfer Stok
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
