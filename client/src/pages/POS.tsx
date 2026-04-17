import { useState, useMemo, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ShoppingCart, Search, Plus, Minus, Trash2, CreditCard, Banknote,
  QrCode, Receipt, CheckCircle2, Package, X, Loader2, Printer, Warehouse,
  SplitSquareHorizontal, Tag, Percent, Wallet, CalendarDays,
} from "lucide-react";
import { formatRupiah } from "../../../shared/finance";
import { toast } from "sonner";

type CartItem = {
  productId: number;
  name: string;
  price: number;
  basePrice: number;
  hpp: number;
  qty: number;
  unit: string;
  imageUrl?: string | null;
  maxStock: number;
  priceType: "fixed" | "dynamic";
  discountPercent: number;
};

type SplitPayment = {
  method: string;
  amount: number;
  customLabel?: string; // for "Lainnya" — e.g. "Kredivo", "ShopeePay"
};

const PAYMENT_METHODS = [
  { value: "Tunai", icon: Banknote, label: "Tunai" },
  { value: "Transfer/QRIS", icon: CreditCard, label: "Transfer/QRIS" },
  { value: "Lainnya", icon: Wallet, label: "Lainnya" },
];

export default function POS() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [saleDate, setSaleDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | null>(null);

  // Split payment state
  const [splitMode, setSplitMode] = useState(false);
  const [payments, setPayments] = useState<SplitPayment[]>([{ method: "Tunai", amount: 0 }]);
  const [customerPaid, setCustomerPaid] = useState("");

  // Discount code state
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<{
    id: number; code: string; name: string; type: string; value: number; amount: number;
  } | null>(null);

  // Success receipt state
  const [lastReceiptCode, setLastReceiptCode] = useState("");
  const [lastCart, setLastCart] = useState<CartItem[]>([]);
  const [lastTotal, setLastTotal] = useState(0);
  const [lastPayments, setLastPayments] = useState<SplitPayment[]>([]);
  const [lastPaid, setLastPaid] = useState(0);
  const [lastDiscount, setLastDiscount] = useState(0);

  const utils = trpc.useUtils();
  const { data: products, isLoading } = trpc.product.list.useQuery(undefined, { retry: false });
  const { data: warehouses = [] } = trpc.warehouse.list.useQuery();

  // Auto-select default warehouse
  useEffect(() => {
    if (warehouses.length > 0 && !selectedWarehouseId) {
      const def = warehouses.find((w: any) => w.isDefault) || warehouses[0];
      setSelectedWarehouseId(def.id);
    }
  }, [warehouses]);

  const { data: warehouseStock = [] } = trpc.warehouse.stock.useQuery(
    { warehouseId: selectedWarehouseId! },
    { enabled: !!selectedWarehouseId }
  );

  // POS Receipt mutation (new — supports split payment + discount)
  const createReceipt = trpc.posReceipt.create.useMutation({
    onSuccess: (data) => {
      utils.transaction.list.invalidate();
      utils.report.dashboard.invalidate();
      utils.product.list.invalidate();
      utils.warehouse.stock.invalidate();
      setLastReceiptCode(data.receiptCode);
      setLastCart([...cart]);
      setLastTotal(grandTotal);
      setLastPayments(splitMode ? [...payments] : [{ method: payments[0]?.method ?? "Tunai", amount: grandTotal }]);
      setLastPaid(splitMode ? payments.reduce((s, p) => s + p.amount, 0) : (parseInt(customerPaid) || grandTotal));
      setLastDiscount(appliedDiscount?.amount ?? 0);
      setCheckoutOpen(false);
      setSuccessOpen(true);
      resetCheckout();
    },
    onError: (err) => toast.error(err.message),
  });

  // Legacy single-item mutation (fallback)
  const createTx = trpc.transaction.create.useMutation({
    onSuccess: (data) => {
      utils.transaction.list.invalidate();
      utils.report.dashboard.invalidate();
      utils.product.list.invalidate();
      setLastReceiptCode(data.txCode);
      setLastCart([...cart]);
      setLastTotal(subtotal);
      setLastPayments([{ method: payments[0]?.method ?? "Tunai", amount: subtotal }]);
      setLastPaid(parseInt(customerPaid) || 0);
      setLastDiscount(0);
      setCheckoutOpen(false);
      setSuccessOpen(true);
      resetCheckout();
    },
    onError: (err) => toast.error(err.message),
  });

  const resetCheckout = () => {
    setCart([]);
    setCustomerPaid("");
    setNotes("");
    setSplitMode(false);
    setPayments([{ method: "Tunai", amount: 0 }]);
    setAppliedDiscount(null);
    setDiscountCode("");
  };

  // ─── Product filtering ───
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter((p: any) =>
      p.isActive !== false && p.stockCurrent > 0 &&
      (!searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku?.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [products, searchQuery]);

  const outOfStockProducts = useMemo(() => {
    if (!products) return [];
    return products.filter((p: any) => p.isActive !== false && p.stockCurrent <= 0);
  }, [products]);

  // ─── Cart helpers ───
  const [dynamicPriceDialog, setDynamicPriceDialog] = useState<{ product: any; tempPrice: string } | null>(null);

  const addToCart = (product: any) => {
    const priceType = product.priceType || "fixed";
    if (priceType === "dynamic") {
      const existing = cart.find(c => c.productId === product.id);
      if (existing) {
        if (existing.qty >= product.stockCurrent) { toast.error(`Stok ${product.name} hanya ${product.stockCurrent}`); return; }
        setCart(prev => prev.map(c => c.productId === product.id ? { ...c, qty: c.qty + 1 } : c));
        return;
      }
      setDynamicPriceDialog({ product, tempPrice: "" });
      return;
    }
    const discPct = parseFloat(product.discountPercent || "0") || 0;
    const basePrice = product.sellingPrice;
    const finalPrice = discPct > 0 ? Math.round(basePrice * (1 - discPct / 100)) : basePrice;
    setCart(prev => {
      const existing = prev.find(c => c.productId === product.id);
      if (existing) {
        if (existing.qty >= product.stockCurrent) { toast.error(`Stok ${product.name} hanya ${product.stockCurrent}`); return prev; }
        return prev.map(c => c.productId === product.id ? { ...c, qty: c.qty + 1 } : c);
      }
      return [...prev, {
        productId: product.id, name: product.name,
        price: finalPrice, basePrice, hpp: product.hpp,
        qty: 1, unit: product.unit, imageUrl: product.imageUrl,
        maxStock: product.stockCurrent, priceType: "fixed", discountPercent: discPct,
      }];
    });
  };

  const confirmDynamicPrice = () => {
    if (!dynamicPriceDialog) return;
    const { product, tempPrice } = dynamicPriceDialog;
    const price = parseInt(tempPrice) || 0;
    if (price <= 0) { toast.error("Masukkan harga yang valid"); return; }
    setCart(prev => {
      const existing = prev.find(c => c.productId === product.id);
      if (existing) return prev.map(c => c.productId === product.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, {
        productId: product.id, name: product.name,
        price, basePrice: price, hpp: product.hpp,
        qty: 1, unit: product.unit, imageUrl: product.imageUrl,
        maxStock: product.stockCurrent, priceType: "dynamic", discountPercent: 0,
      }];
    });
    setDynamicPriceDialog(null);
  };

  const updateQty = (productId: number, delta: number) => {
    setCart(prev => prev.map(c => {
      if (c.productId !== productId) return c;
      const newQty = c.qty + delta;
      if (newQty <= 0) return c;
      if (newQty > c.maxStock) { toast.error(`Stok maksimal: ${c.maxStock}`); return c; }
      return { ...c, qty: newQty };
    }));
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(c => c.productId !== productId));
  };

  // ─── Calculations ───
  const subtotal = cart.reduce((sum, c) => sum + c.price * c.qty, 0);
  const discountAmount = appliedDiscount?.amount ?? 0;
  const grandTotal = Math.max(0, subtotal - discountAmount);
  const totalItems = cart.reduce((sum, c) => sum + c.qty, 0);

  // Split payment calculations
  const totalPaid = splitMode
    ? payments.reduce((s, p) => s + p.amount, 0)
    : (parseInt(customerPaid) || 0);
  const remaining = grandTotal - totalPaid;
  const change = totalPaid > grandTotal ? totalPaid - grandTotal : 0;

  // ─── Split payment helpers ───
  const addPaymentMethod = () => {
    setPayments(prev => [...prev, { method: "Tunai", amount: 0 }]);
  };

  const updatePayment = (index: number, field: "method" | "amount" | "customLabel", value: string | number) => {
    setPayments(prev => prev.map((p, i) => {
      if (i !== index) return p;
      if (field === "method") return { ...p, method: value as string, customLabel: value === "Lainnya" ? (p.customLabel || "") : undefined };
      if (field === "customLabel") return { ...p, customLabel: value as string };
      return { ...p, amount: typeof value === "number" ? value : (parseInt(value as string) || 0) };
    }));
  };

  const removePayment = (index: number) => {
    if (payments.length <= 1) return;
    setPayments(prev => prev.filter((_, i) => i !== index));
  };

  // Auto-fill remaining amount for last payment
  const autoFillLast = () => {
    if (payments.length === 0) return;
    const otherTotal = payments.slice(0, -1).reduce((s, p) => s + p.amount, 0);
    const lastAmount = Math.max(0, grandTotal - otherTotal);
    setPayments(prev => prev.map((p, i) => i === prev.length - 1 ? { ...p, amount: lastAmount } : p));
  };

  // ─── Discount validation ───
  const handleApplyDiscount = useCallback(async () => {
    if (!discountCode.trim()) return;
    try {
      const result = await utils.discount.validate.fetch({
        code: discountCode.trim(),
        subtotal,
      });
      if (result.valid) {
        setAppliedDiscount(result.discount);
        toast.success(`Diskon "${result.discount.name}" diterapkan!`);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Kode diskon tidak valid");
    }
  }, [discountCode, subtotal]);

  // ─── Checkout ───
  const handleCheckout = () => {
    if (cart.length === 0) { toast.error("Keranjang kosong"); return; }

    const finalPayments = (splitMode
      ? payments.filter(p => p.amount > 0)
      : [{ method: payments[0]?.method ?? "Tunai", amount: grandTotal, customLabel: payments[0]?.customLabel }]
    ).map(p => ({
      method: p.method === "Lainnya" && p.customLabel ? p.customLabel : p.method,
      amount: p.amount,
    }));

    // Validate split payments cover the total
    if (splitMode) {
      const paidTotal = finalPayments.reduce((s, p) => s + p.amount, 0);
      if (paidTotal < grandTotal) {
        toast.error(`Pembayaran kurang ${formatRupiah(grandTotal - paidTotal)}`);
        return;
      }
    } else if (payments[0]?.method === "Tunai") {
      const paid = parseInt(customerPaid) || 0;
      if (paid < grandTotal) {
        toast.error("Uang diterima kurang dari total");
        return;
      }
    }

    // Use posReceipt.create for proper receipt with split payment
    createReceipt.mutate({
      subtotal,
      discountAmount,
      discountCodeId: appliedDiscount?.id,
      grandTotal,
      payments: finalPayments,
      customerPaid: splitMode ? finalPayments.reduce((s, p) => s + p.amount, 0) : (parseInt(customerPaid) || grandTotal),
      changeAmount: change,
      notes: notes || undefined,
      date: saleDate,
      items: cart.map(item => ({
        productId: item.productId,
        productQty: item.qty,
        amount: item.price * item.qty,
        hppSnapshot: item.hpp,
        warehouseId: selectedWarehouseId ?? undefined,
      })),
    });
  };

  const isPending = createReceipt.isPending || createTx.isPending;

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-6rem)]">
      {/* ─── Left: Product Grid ─── */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Cari produk..." className="pl-9 h-11" />
          </div>
          <div className="flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              type="date"
              value={saleDate}
              onChange={(e) => setSaleDate(e.target.value)}
              className="w-40 h-11 text-sm"
            />
          </div>
          {warehouses.length > 1 && (
            <Select value={selectedWarehouseId?.toString() ?? ""} onValueChange={(v) => setSelectedWarehouseId(Number(v))}>
              <SelectTrigger className="w-48 h-11">
                <Warehouse className="h-4 w-4 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="Gudang" />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((wh: any) => (
                  <SelectItem key={wh.id} value={wh.id.toString()}>
                    {wh.name} {wh.isDefault ? "(Utama)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Badge variant="secondary" className="h-11 px-4 text-sm shrink-0">
            <Package className="h-4 w-4 mr-1.5" /> {filteredProducts.length} produk
          </Badge>
        </div>

        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Package className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">
                {searchQuery ? "Produk tidak ditemukan" : "Belum ada produk dengan stok tersedia"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredProducts.map((p: any) => {
                const inCart = cart.find(c => c.productId === p.id);
                return (
                  <Card
                    key={p.id}
                    className={`border shadow-sm hover:shadow-md cursor-pointer transition-all overflow-hidden group ${inCart ? "ring-2 ring-primary shadow-primary/10" : ""}`}
                    onClick={() => addToCart(p)}
                  >
                    <div className="relative h-24 bg-muted/20 overflow-hidden">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-8 w-8 text-muted-foreground/15" />
                        </div>
                      )}
                      {inCart && (
                        <div className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shadow">
                          {inCart.qty}
                        </div>
                      )}
                      <Badge variant="secondary" className="absolute bottom-1.5 right-1.5 text-[10px] px-1.5 py-0">
                        Stok: {p.stockCurrent}
                      </Badge>
                    </div>
                    <CardContent className="p-2.5">
                      <p className="font-medium text-xs truncate">{p.name}</p>
                      <p className="text-sm font-bold text-primary mt-0.5">{formatRupiah(p.sellingPrice)}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {outOfStockProducts.length > 0 && (
            <div className="mt-6">
              <p className="text-xs font-medium text-muted-foreground mb-2">Stok Habis</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 opacity-50">
                {outOfStockProducts.slice(0, 4).map((p: any) => (
                  <Card key={p.id} className="border shadow-sm overflow-hidden">
                    <div className="relative h-20 bg-muted/20">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover grayscale" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-6 w-6 text-muted-foreground/15" />
                        </div>
                      )}
                      <Badge variant="destructive" className="absolute top-1 right-1 text-[10px] px-1.5 py-0">Habis</Badge>
                    </div>
                    <CardContent className="p-2">
                      <p className="font-medium text-xs truncate text-muted-foreground">{p.name}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* ─── Right: Cart Panel ─── */}
      <div className="w-full lg:w-96 flex flex-col bg-card rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Keranjang</h2>
            </div>
            <Badge variant="secondary" className="text-xs">{totalItems} item</Badge>
          </div>
        </div>

        <ScrollArea className="flex-1 min-h-0">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <div className="h-14 w-14 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                <ShoppingCart className="h-6 w-6 text-muted-foreground/40" />
              </div>
              <p className="text-sm text-muted-foreground">Keranjang kosong</p>
              <p className="text-xs text-muted-foreground mt-1">Klik produk untuk menambahkan</p>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {cart.map((item) => (
                <div key={item.productId} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="h-12 w-12 rounded-lg overflow-hidden bg-muted/50 shrink-0">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-5 w-5 text-muted-foreground/20" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{item.name}</p>
                    <div className="flex items-center gap-1 flex-wrap">
                      <p className="text-xs text-primary font-semibold">{formatRupiah(item.price)}</p>
                      {item.priceType === "dynamic" && <Badge variant="outline" className="text-[9px] px-1 py-0">Dinamis</Badge>}
                      {item.priceType === "fixed" && item.discountPercent > 0 && <Badge variant="outline" className="text-[9px] px-1 py-0 text-success">-{item.discountPercent}%</Badge>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-7 w-7 rounded-full" onClick={() => updateQty(item.productId, -1)}><Minus className="h-3 w-3" /></Button>
                    <span className="text-sm font-bold w-6 text-center">{item.qty}</span>
                    <Button variant="outline" size="icon" className="h-7 w-7 rounded-full" onClick={() => updateQty(item.productId, 1)}><Plus className="h-3 w-3" /></Button>
                  </div>
                  <div className="text-right min-w-[70px]">
                    <p className="text-xs font-bold">{formatRupiah(item.price * item.qty)}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive shrink-0" onClick={() => removeFromCart(item.productId)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="border-t p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Subtotal ({totalItems} item)</span>
            <span className="text-lg font-bold text-primary">{formatRupiah(subtotal)}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" disabled={cart.length === 0} onClick={() => { setCart([]); toast.info("Keranjang dikosongkan"); }}>
              <Trash2 className="h-4 w-4 mr-1.5" /> Hapus
            </Button>
            <Button className="flex-1" disabled={cart.length === 0} onClick={() => setCheckoutOpen(true)}>
              <CreditCard className="h-4 w-4 mr-1.5" /> Bayar
            </Button>
          </div>
        </div>
      </div>

      {/* ─── Checkout Dialog (with Split Payment + Discount) ─── */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              Pembayaran
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Order Summary */}
            <div className="rounded-lg bg-muted/30 p-4 space-y-2">
              {cart.map(item => (
                <div key={item.productId} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.name} x{item.qty}</span>
                  <span className="font-medium">{formatRupiah(item.price * item.qty)}</span>
                </div>
              ))}
              <div className="pt-2 border-t space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span className="font-medium">{formatRupiah(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-success">
                    <span>Diskon ({appliedDiscount?.name})</span>
                    <span>-{formatRupiah(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base pt-1">
                  <span>Total</span>
                  <span className="text-primary">{formatRupiah(grandTotal)}</span>
                </div>
              </div>
            </div>

            {/* Discount Code */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Tag className="h-3 w-3" /> Kode Diskon (opsional)
              </label>
              <div className="flex gap-2">
                <Input
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                  placeholder="Masukkan kode..."
                  className="flex-1"
                  disabled={!!appliedDiscount}
                />
                {appliedDiscount ? (
                  <Button variant="outline" size="sm" onClick={() => { setAppliedDiscount(null); setDiscountCode(""); }}>
                    <X className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={handleApplyDiscount} disabled={!discountCode.trim()}>
                    Terapkan
                  </Button>
                )}
              </div>
              {appliedDiscount && (
                <p className="text-xs text-success flex items-center gap-1">
                  <Percent className="h-3 w-3" />
                  {appliedDiscount.type === "percentage" ? `${appliedDiscount.value}%` : formatRupiah(appliedDiscount.value)} off — hemat {formatRupiah(appliedDiscount.amount)}
                </p>
              )}
            </div>

            {/* Payment Mode Toggle */}
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground">Metode Pembayaran</label>
              <Button
                variant={splitMode ? "default" : "outline"}
                size="sm"
                className="text-xs gap-1.5 h-7"
                onClick={() => {
                  setSplitMode(!splitMode);
                  if (!splitMode) {
                    // Enter split mode: start with current method + empty second
                    setPayments([
                      { method: payments[0]?.method ?? "Tunai", amount: 0 },
                      { method: "Transfer/QRIS", amount: 0 },
                    ]);
                  } else {
                    // Exit split mode: keep first method only
                    setPayments([{ method: payments[0]?.method ?? "Tunai", amount: 0 }]);
                  }
                }}
              >
                <SplitSquareHorizontal className="h-3 w-3" />
                Split Bill
              </Button>
            </div>

            {!splitMode ? (
              /* ─── Single Payment Mode ─── */
              <>
                <div className="grid grid-cols-3 gap-2">
                  {PAYMENT_METHODS.map(m => (
                    <Button
                      key={m.value}
                      variant={payments[0]?.method === m.value ? "default" : "outline"}
                      className="flex flex-col gap-1 h-auto py-3"
                      onClick={() => setPayments([{ method: m.value, amount: 0 }])}
                    >
                      <m.icon className="h-5 w-5" />
                      <span className="text-xs">{m.label}</span>
                    </Button>
                  ))}
                </div>

                {payments[0]?.method === "Lainnya" && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Nama Metode Pembayaran</label>
                    <Input
                      value={payments[0]?.customLabel || ""}
                      onChange={(e) => updatePayment(0, "customLabel", e.target.value)}
                      placeholder="Kredivo, ShopeePay, GoPay, OVO..."
                      className="h-10"
                    />
                  </div>
                )}

                {payments[0]?.method === "Tunai" && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Uang Diterima</label>
                    <Input type="number" value={customerPaid} onChange={(e) => setCustomerPaid(e.target.value)} placeholder="0" className="text-lg font-bold h-12" />
                    {parseInt(customerPaid) >= grandTotal && parseInt(customerPaid) > 0 && (
                      <div className="flex justify-between items-center rounded-lg bg-success/10 p-2.5">
                        <span className="text-sm text-success">Kembalian</span>
                        <span className="text-lg font-bold text-success">{formatRupiah(parseInt(customerPaid) - grandTotal)}</span>
                      </div>
                    )}
                    <div className="flex gap-2 flex-wrap">
                      {[grandTotal, Math.ceil(grandTotal / 10000) * 10000, Math.ceil(grandTotal / 50000) * 50000, 100000, 200000]
                        .filter((v, i, a) => v >= grandTotal && a.indexOf(v) === i).slice(0, 4).map(amount => (
                          <Button key={amount} variant="outline" size="sm" className="text-xs" onClick={() => setCustomerPaid(String(amount))}>
                            {formatRupiah(amount)}
                          </Button>
                        ))}
                    </div>
                  </div>
                )}

                {payments[0]?.method === "Transfer/QRIS" && <QRISDisplay />}
              </>
            ) : (
              /* ─── Split Payment Mode ─── */
              <div className="space-y-3">
                {payments.map((payment, idx) => (
                  <div key={idx} className="rounded-lg border p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">Pembayaran {idx + 1}</span>
                      {payments.length > 1 && (
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={() => removePayment(idx)}>
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {PAYMENT_METHODS.map(m => (
                        <Button
                          key={m.value}
                          variant={payment.method === m.value ? "default" : "outline"}
                          size="sm"
                          className="text-xs h-8 gap-1"
                          onClick={() => updatePayment(idx, "method", m.value)}
                        >
                          <m.icon className="h-3 w-3" />
                          {m.label}
                        </Button>
                      ))}
                    </div>
                    {payment.method === "Lainnya" && (
                      <Input
                        value={payment.customLabel || ""}
                        onChange={(e) => updatePayment(idx, "customLabel", e.target.value)}
                        placeholder="Nama metode (Kredivo, ShopeePay, GoPay...)"
                        className="h-9 text-xs"
                      />
                    )}
                    <Input
                      type="number"
                      value={payment.amount || ""}
                      onChange={(e) => updatePayment(idx, "amount", e.target.value)}
                      placeholder="Jumlah..."
                      className="h-10 font-semibold"
                    />
                  </div>
                ))}

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="text-xs flex-1 gap-1" onClick={addPaymentMethod}>
                    <Plus className="h-3 w-3" /> Tambah Metode
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs flex-1 gap-1" onClick={autoFillLast}>
                    Isi Sisa Otomatis
                  </Button>
                </div>

                {/* Split summary */}
                <div className="rounded-lg bg-muted/30 p-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total bayar</span>
                    <span className="font-semibold">{formatRupiah(totalPaid)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Harus dibayar</span>
                    <span className="font-semibold">{formatRupiah(grandTotal)}</span>
                  </div>
                  {remaining > 0 && (
                    <div className="flex justify-between text-danger">
                      <span>Kurang</span>
                      <span className="font-bold">{formatRupiah(remaining)}</span>
                    </div>
                  )}
                  {change > 0 && (
                    <div className="flex justify-between text-success">
                      <span>Kembalian</span>
                      <span className="font-bold">{formatRupiah(change)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Catatan (opsional)</label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Nama pelanggan, catatan..." />
            </div>

            <Button
              className="w-full h-12 text-base"
              disabled={isPending || (splitMode ? totalPaid < grandTotal : (payments[0]?.method === "Tunai" && (parseInt(customerPaid) || 0) < grandTotal))}
              onClick={handleCheckout}
            >
              {isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Memproses...</>
              ) : (
                <><CheckCircle2 className="h-4 w-4 mr-2" /> Bayar {formatRupiah(grandTotal)}</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dynamic Price Input Dialog */}
      <Dialog open={!!dynamicPriceDialog} onOpenChange={(open) => { if (!open) setDynamicPriceDialog(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Masukkan Harga Jual</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Produk <strong>{dynamicPriceDialog?.product?.name}</strong> menggunakan harga dinamis.
            </p>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Harga Jual (Rp)</label>
              <Input
                type="number" autoFocus
                value={dynamicPriceDialog?.tempPrice || ""}
                onChange={(e) => setDynamicPriceDialog(prev => prev ? { ...prev, tempPrice: e.target.value } : null)}
                onKeyDown={(e) => { if (e.key === "Enter") confirmDynamicPrice(); }}
                placeholder="Masukkan harga..." className="text-lg font-bold h-12"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setDynamicPriceDialog(null)}>Batal</Button>
              <Button className="flex-1" onClick={confirmDynamicPrice}>Tambah ke Keranjang</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent className="max-w-sm">
          <div id="pos-receipt" className="py-4 space-y-4">
            <div className="text-center">
              <div className="h-14 w-14 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="h-7 w-7 text-success" />
              </div>
              <h3 className="text-xl font-bold">Pembayaran Berhasil!</h3>
              {lastReceiptCode && <p className="text-xs font-mono text-muted-foreground mt-1">{lastReceiptCode}</p>}
            </div>

            {lastCart.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted/50 px-3 py-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Detail Transaksi</p>
                </div>
                <div className="divide-y">
                  {lastCart.map((item) => (
                    <div key={item.productId} className="flex items-center justify-between px-3 py-2 text-sm">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.qty} x {formatRupiah(item.price)}</p>
                      </div>
                      <p className="font-semibold">{formatRupiah(item.price * item.qty)}</p>
                    </div>
                  ))}
                </div>
                <div className="border-t bg-muted/30 px-3 py-2 space-y-1">
                  {lastDiscount > 0 && (
                    <div className="flex justify-between text-xs text-success">
                      <span>Diskon</span>
                      <span>-{formatRupiah(lastDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold">
                    <span>Total</span>
                    <span>{formatRupiah(lastTotal)}</span>
                  </div>
                  {/* Show split payment details */}
                  {lastPayments.length > 1 && (
                    <div className="pt-1 border-t space-y-0.5">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Split Payment</p>
                      {lastPayments.map((p, i) => (
                        <div key={i} className="flex justify-between text-xs text-muted-foreground">
                          <span>{p.method}</span>
                          <span>{formatRupiah(p.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {lastPayments.length === 1 && (
                    <>
                      {lastPayments[0].method === "Tunai" && lastPaid > lastTotal && (
                        <>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Bayar</span>
                            <span>{formatRupiah(lastPaid)}</span>
                          </div>
                          <div className="flex justify-between text-xs text-success font-semibold">
                            <span>Kembalian</span>
                            <span>{formatRupiah(lastPaid - lastTotal)}</span>
                          </div>
                        </>
                      )}
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Metode</span>
                        <span>{lastPayments[0].method}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => {
                const el = document.getElementById("pos-receipt");
                if (!el) return;
                const w = window.open("", "_blank");
                if (!w) return;
                w.document.write(`<html><head><title>Struk</title><style>body{font-family:monospace;padding:16px;max-width:300px;margin:auto}hr{border:1px dashed #ccc}table{width:100%}td{padding:2px 0}.total{font-weight:bold;font-size:1.1em}</style></head><body>${el.innerHTML}<script>window.onload=()=>{window.print();window.close()}<\/script></body></html>`);
                w.document.close();
              }}>
                <Printer className="h-4 w-4 mr-1.5" /> Cetak Struk
              </Button>
              <Button className="flex-1" onClick={() => setSuccessOpen(false)}>
                Transaksi Baru
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function QRISDisplay() {
  const { data: business } = trpc.business.mine.useQuery(undefined, { retry: false });
  const qrisUrl = business?.qrisImageUrl;

  if (!qrisUrl) {
    return (
      <div className="rounded-lg border-2 border-dashed border-muted-foreground/20 p-6 text-center">
        <QrCode className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground font-medium">QRIS belum diatur</p>
        <p className="text-xs text-muted-foreground mt-1">Upload QRIS di menu Pengaturan</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="rounded-lg border bg-white p-3 mx-auto w-fit">
        <img src={qrisUrl} alt="QRIS" className="max-w-[200px] max-h-[200px] rounded-lg mx-auto" />
      </div>
      <p className="text-xs text-center text-muted-foreground">Tunjukkan QR code ke pelanggan untuk scan</p>
    </div>
  );
}
