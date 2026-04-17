'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit2, Phone, Mail, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatRupiah } from '../../../shared/finance';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface POItem {
  productName: string;
  qty: number;
  unitPrice: number;
  totalPrice?: number;
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
  const variants: Record<string, { bg: string; text: string }> = {
    unpaid: { bg: 'bg-red-500/20', text: 'text-red-300' },
    partial: { bg: 'bg-yellow-500/20', text: 'text-yellow-300' },
    paid: { bg: 'bg-emerald-500/20', text: 'text-emerald-300' },
  };
  const variant = variants[status] || variants.unpaid;
  return <Badge className={`${variant.bg} ${variant.text} border-0`}>{status}</Badge>;
};

const ReceiptStatusBadge = ({ status }: { status: string }) => {
  const variants: Record<string, { bg: string; text: string }> = {
    pending: { bg: 'bg-gray-500/20', text: 'text-gray-300' },
    partial: { bg: 'bg-yellow-500/20', text: 'text-yellow-300' },
    received: { bg: 'bg-emerald-500/20', text: 'text-emerald-300' },
  };
  const variant = variants[status] || variants.pending;
  return <Badge className={`${variant.bg} ${variant.text} border-0`}>{status}</Badge>;
};

const NewPODialog = () => {
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<POFormData>({
    supplierId: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    items: [{ productName: '', qty: 1, unitPrice: 0 }],
  });

  const { data: suppliers } = trpc.supplier.list.useQuery();
  const createPO = trpc.purchaseOrder.create.useMutation({
    onSuccess: () => { utils.purchaseOrder.list.invalidate(); toast.success("PO berhasil dibuat"); },
    onError: (err) => toast.error(err.message),
  });

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productName: '', qty: 1, unitPrice: 0 }],
    });
  };

  const handleRemoveItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const handleItemChange = (index: number, field: keyof POItem, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
  };

  const handleSubmit = async () => {
    await createPO.mutateAsync({
      supplierId: Number(formData.supplierId),
      date: formData.date,
      description: formData.description,
      items: formData.items.map(item => ({
        productName: item.productName,
        qty: item.qty,
        unitPrice: item.unitPrice,
        totalPrice: item.qty * item.unitPrice,
      })),
      totalAmount: calculateTotal(),
    });
    setOpen(false);
    setFormData({
      supplierId: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
      items: [{ productName: '', qty: 1, unitPrice: 0 }],
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
          <Plus className="w-4 h-4" />
          Tambah PO
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white">Buat Purchase Order Baru</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          <div>
            <label className="block text-sm text-slate-300 mb-2">Supplier</label>
            <Select value={String(formData.supplierId || '')} onValueChange={(val) => setFormData({ ...formData, supplierId: Number(val) })}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
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

          <div>
            <label className="block text-sm text-slate-300 mb-2">Tanggal</label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">Deskripsi</label>
            <Input
              placeholder="Deskripsi PO"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-3">Item</label>
            <div className="space-y-2">
              {formData.items.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-end">
                  <Input
                    placeholder="Nama Produk"
                    value={item.productName}
                    onChange={(e) => handleItemChange(idx, 'productName', e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                  />
                  <Input
                    type="number"
                    placeholder="Qty"
                    value={item.qty}
                    onChange={(e) => handleItemChange(idx, 'qty', parseInt(e.target.value) || 0)}
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 w-20"
                  />
                  <Input
                    type="number"
                    placeholder="Harga"
                    value={item.unitPrice}
                    onChange={(e) => handleItemChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 w-32"
                  />
                  <span className="text-emerald-400 text-sm whitespace-nowrap min-w-fit">
                    {formatRupiah(item.qty * item.unitPrice)}
                  </span>
                  {formData.items.length > 1 && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRemoveItem(idx)}
                      className="bg-red-600/20 hover:bg-red-600/40 text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleAddItem}
              className="mt-2 border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <Plus className="w-4 h-4 mr-1" />
              Tambah Item
            </Button>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Total:</span>
              <span className="text-emerald-400 font-semibold text-lg">{formatRupiah(calculateTotal())}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-end mt-6">
          <Button variant="outline" onClick={() => setOpen(false)} className="border-slate-700">
            Batal
          </Button>
          <Button onClick={handleSubmit} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            Buat PO
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const NewSupplierDialog = () => {
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<SupplierFormData>({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
  });

  const createSupplier = trpc.supplier.create.useMutation({
    onSuccess: () => { utils.supplier.list.invalidate(); toast.success("Supplier berhasil ditambahkan"); },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = async () => {
    await createSupplier.mutateAsync(formData);
    setOpen(false);
    setFormData({ name: '', contactPerson: '', phone: '', email: '', address: '' });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
          <Plus className="w-4 h-4" />
          Tambah Supplier
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white">Tambah Supplier Baru</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-2">Nama Supplier</label>
            <Input
              placeholder="Nama Supplier"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-2">Nama Kontak</label>
            <Input
              placeholder="Nama Kontak"
              value={formData.contactPerson}
              onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-2">No. Telepon</label>
            <Input
              placeholder="+62 8XX-XXXX-XXXX"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-2">Email</label>
            <Input
              type="email"
              placeholder="email@supplier.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-2">Alamat</label>
            <Input
              placeholder="Alamat lengkap"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end mt-6">
          <Button variant="outline" onClick={() => setOpen(false)} className="border-slate-700">
            Batal
          </Button>
          <Button onClick={handleSubmit} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            Tambah Supplier
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const PurchaseOrdersTab = () => {
  const { data: purchaseOrders, isLoading } = trpc.purchaseOrder.list.useQuery();
  const { data: suppliers } = trpc.supplier.list.useQuery();
  const utils = trpc.useUtils();
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
      {!purchaseOrders || purchaseOrders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 text-slate-400"
        >
          <p>Tidak ada Purchase Order</p>
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
                  <p className="text-sm text-slate-400">{suppliers?.find(s => s.id === po.supplierId)?.name || 'Unknown Supplier'}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-blue-400"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deletePO.mutate({ id: po.id })}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                <div>
                  <span className="text-slate-500">Tanggal</span>
                  <p className="text-white">{new Date(po.date).toLocaleDateString('id-ID')}</p>
                </div>
                <div>
                  <span className="text-slate-500">Total</span>
                  <p className="text-emerald-400 font-semibold">{formatRupiah(po.totalAmount)}</p>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                <PaymentStatusBadge status={po.paymentStatus} />
                <ReceiptStatusBadge status={po.receiptStatus} />
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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 text-slate-400"
        >
          <p>Tidak ada Supplier</p>
        </motion.div>
      ) : (
        <div className="grid gap-4">
          {suppliers.map((supplier, idx) => (
            <motion.div
              key={supplier.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700 rounded-xl p-5 hover:border-emerald-500/30 transition-all duration-200 backdrop-blur-sm group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">{supplier.name}</h3>
                  <p className="text-sm text-slate-400">{supplier.contactPerson}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-blue-400"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteSupplier.mutate({ id: supplier.id })}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-300">
                  <Phone className="w-4 h-4 text-emerald-500" />
                  <span>{supplier.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Mail className="w-4 h-4 text-emerald-500" />
                  <span className="break-all">{supplier.email}</span>
                </div>
                <div className="flex items-start gap-2 text-slate-300">
                  <MapPin className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>{supplier.address}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function PurchaseOrderPage() {
  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Purchase Order</h1>
          <p className="text-slate-400">Kelola pembelian dan supplier anda</p>
        </div>

        <Tabs defaultValue="purchase-orders" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-800 border border-slate-700 p-1 mb-6">
            <TabsTrigger
              value="purchase-orders"
              className="text-slate-300 data-[state=active]:text-white data-[state=active]:bg-emerald-600/20 rounded-lg transition-all"
            >
              Purchase Orders
            </TabsTrigger>
            <TabsTrigger
              value="suppliers"
              className="text-slate-300 data-[state=active]:text-white data-[state=active]:bg-emerald-600/20 rounded-lg transition-all"
            >
              Supplier
            </TabsTrigger>
          </TabsList>

          <TabsContent value="purchase-orders" className="mt-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">Daftar Purchase Order</h2>
              <NewPODialog />
            </div>
            <PurchaseOrdersTab />
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
