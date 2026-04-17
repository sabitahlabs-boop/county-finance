'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Users,
  TrendingUp,
  Gift,
  Percent,
  AlertCircle,
  Plus,
  Zap,
  Calendar,
  DollarSign,
  Trash2,
  Edit2,
  BarChart3,
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { formatRupiah } from '../../../shared/finance';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  businessId: string;
  type: string;
  depositAmount: number;
  lastTransactionDate?: string;
  activeDate?: string;
  expiryDate?: string;
}

interface DiscountCode {
  id: string;
  businessId: string;
  code: string;
  name: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minPurchase: number;
  maxDiscount: number | null;
  maxUses: number;
  currentUses: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

// ============================================================================
// CRM TAB
// ============================================================================
const CRMTab = () => {
  const { data: clients = [] } = trpc.clientMgmt.list.useQuery();

  const totalClients = clients.length;
  const newClientsThisMonth = clients.filter((c) => {
    const createdDate = new Date(c.createdAt || '');
    const now = new Date();
    return (
      createdDate.getMonth() === now.getMonth() &&
      createdDate.getFullYear() === now.getFullYear()
    );
  }).length;

  const activeClients = clients.filter((c) => c.isActive !== false).length;

  interface StatCard {
    label: string;
    value: number;
    icon: React.ElementType;
    color: string;
    textColor: string;
  }

  const stats: StatCard[] = [
    {
      label: 'Total Pelanggan',
      value: totalClients,
      icon: Users,
      color: 'from-emerald-500/20 to-emerald-600/5',
      textColor: 'text-emerald-400',
    },
    {
      label: 'Pelanggan Baru',
      value: newClientsThisMonth,
      icon: TrendingUp,
      color: 'from-blue-500/20 to-blue-600/5',
      textColor: 'text-blue-400',
    },
    {
      label: 'Pelanggan Aktif',
      value: activeClients,
      icon: Zap,
      color: 'from-amber-500/20 to-amber-600/5',
      textColor: 'text-amber-400',
    },
    {
      label: 'Total Transaksi',
      value: clients.length,
      icon: BarChart3,
      color: 'from-purple-500/20 to-purple-600/5',
      textColor: 'text-purple-400',
    },
  ];

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={idx}
              variants={itemVariants}
              className={`relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br ${stat.color} backdrop-blur-sm p-6 group hover:border-border/80 transition-all duration-300`}
            >
              {/* Animated background glow */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-emerald-500/5 to-transparent" />

              <div className="relative flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground/70 mb-2">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-bold tracking-tight text-foreground">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`rounded-lg p-3 ${stat.color} backdrop-blur-sm border border-border/50`}
                >
                  <Icon className={`w-5 h-5 ${stat.textColor}`} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants} className="flex gap-3">
        <Button
          onClick={() => window.location.href = '/client'}
          className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white border-0 shadow-lg hover:shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Pelanggan
        </Button>
      </motion.div>

      {/* Client List Preview */}
      <motion.div
        variants={itemVariants}
        className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-6"
      >
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Daftar Pelanggan Terbaru
        </h3>
        {clients.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-foreground/20 mx-auto mb-3" />
            <p className="text-foreground/60">Belum ada pelanggan</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {clients.slice(0, 5).map((client, idx) => (
              <motion.div
                key={client.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center justify-between p-3 rounded-lg bg-foreground/5 hover:bg-foreground/10 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium text-foreground">{client.name}</p>
                  <p className="text-xs text-foreground/60">{client.email}</p>
                </div>
                <div
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    client.isActive
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-foreground/10 text-foreground/60'
                  }`}
                >
                  {client.isActive ? 'Aktif' : 'Tidak Aktif'}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

// ============================================================================
// VOUCHER & DISKON TAB
// ============================================================================
interface DiscountFormData {
  code: string;
  name: string;
  discountType: 'percentage' | 'fixed';
  discountValue: string;
  minPurchase: string;
  maxDiscount: string;
  maxUses: string;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
}

const VoucherDiscountTab = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<DiscountFormData>({
    code: '',
    name: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: '',
    minPurchase: '',
    maxDiscount: '',
    maxUses: '',
    validFrom: '',
    validUntil: '',
    isActive: true,
  });

  const { data: discountCodes = [] } = trpc.discount.list.useQuery();
  const createMutation = trpc.discount.create.useMutation();
  const updateMutation = trpc.discount.update.useMutation();
  const deleteMutation = trpc.discount.delete.useMutation();

  const handleReset = () => {
    setFormData({
      code: '',
      name: '',
      discountType: 'percentage',
      discountValue: '',
      minPurchase: '',
      maxDiscount: '',
      maxUses: '',
      validFrom: '',
      validUntil: '',
      isActive: true,
    });
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const payload = {
          code: formData.code,
          name: formData.name,
          discountType: formData.discountType as "percentage" | "fixed",
          discountValue: Number(formData.discountValue),
          minPurchase: Number(formData.minPurchase || '0'),
          maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : undefined,
          maxUses: formData.maxUses ? Number(formData.maxUses) : undefined,
          validFrom: formData.validFrom || undefined,
          validUntil: formData.validUntil || undefined,
          isActive: formData.isActive,
        };
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, ...payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      setIsDialogOpen(false);
      handleReset();
    } catch (error) {
      console.error('Error saving discount:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Yakin ingin menghapus voucher ini?')) {
      try {
        await deleteMutation.mutateAsync({ id });
      } catch (error) {
        console.error('Error deleting discount:', error);
      }
    }
  };

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Dialog for Create/Edit */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <motion.div variants={itemVariants}>
            <Button className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white border-0 shadow-lg hover:shadow-emerald-500/20">
              <Plus className="w-4 h-4 mr-2" />
              Tambah Voucher
            </Button>
          </motion.div>
        </DialogTrigger>
        <DialogContent className="bg-card border border-border/50 max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Voucher' : 'Buat Voucher Baru'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="code">Kode Voucher</Label>
              <Input
                id="code"
                placeholder="SUMMER20"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value.toUpperCase() })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="name">Nama Voucher</Label>
              <Input
                id="name"
                placeholder="Diskon Musim Panas"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Tipe Diskon</Label>
                <Select
                  value={formData.discountType}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      discountType: value as 'percentage' | 'fixed',
                    })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Persentase %</SelectItem>
                    <SelectItem value="fixed">Fixed Rp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="value">Nilai Diskon</Label>
                <Input
                  id="value"
                  type="number"
                  placeholder="20"
                  value={formData.discountValue}
                  onChange={(e) =>
                    setFormData({ ...formData, discountValue: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minPurchase">Min. Pembelian (Rp)</Label>
                <Input
                  id="minPurchase"
                  type="number"
                  placeholder="50000"
                  value={formData.minPurchase}
                  onChange={(e) =>
                    setFormData({ ...formData, minPurchase: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="maxDiscount">Max Diskon (Rp)</Label>
                <Input
                  id="maxDiscount"
                  type="number"
                  placeholder="100000"
                  value={formData.maxDiscount}
                  onChange={(e) =>
                    setFormData({ ...formData, maxDiscount: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="maxUses">Max Penggunaan</Label>
              <Input
                id="maxUses"
                type="number"
                placeholder="100"
                value={formData.maxUses}
                onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="validFrom">Berlaku Dari</Label>
                <Input
                  id="validFrom"
                  type="date"
                  value={formData.validFrom}
                  onChange={(e) =>
                    setFormData({ ...formData, validFrom: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="validUntil">Berlaku Sampai</Label>
                <Input
                  id="validUntil"
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) =>
                    setFormData({ ...formData, validUntil: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: checked })
                }
              />
              <Label className="cursor-pointer">Aktifkan Voucher</Label>
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600"
              >
                {editingId ? 'Update' : 'Buat'} Voucher
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  handleReset();
                }}
              >
                Batal
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Vouchers List */}
      <AnimatePresence>
        {discountCodes.length === 0 ? (
          <motion.div
            variants={itemVariants}
            className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-12 text-center"
          >
            <Gift className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
            <p className="text-foreground/60 mb-4">Belum ada voucher</p>
            <p className="text-sm text-foreground/40">
              Buat voucher pertama Anda untuk menarik lebih banyak pelanggan
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {discountCodes.map((discount, idx) => (
              <motion.div
                key={discount.id}
                variants={itemVariants}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: idx * 0.05 }}
                className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-5 hover:border-emerald-500/50 transition-all duration-300 group"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">
                        {discount.code}
                      </h3>
                      <div
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          discount.isActive
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-foreground/10 text-foreground/60'
                        }`}
                      >
                        {discount.isActive ? 'Aktif' : 'Nonaktif'}
                      </div>
                    </div>
                    <p className="text-sm text-foreground/60 mt-1">
                      {discount.name}
                    </p>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setEditingId(discount.id);
                        setFormData({
                          code: discount.code,
                          name: discount.name,
                          discountType: discount.discountType,
                          discountValue: String(discount.discountValue),
                          minPurchase: String(discount.minPurchase),
                          maxDiscount: discount.maxDiscount ? String(discount.maxDiscount) : '',
                          maxUses: discount.maxUses ? String(discount.maxUses) : '',
                          validFrom: discount.validFrom ?? '',
                          validUntil: discount.validUntil ?? '',
                          isActive: discount.isActive,
                        });
                        setIsDialogOpen(true);
                      }}
                      className="p-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(discount.id)}
                      className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Discount Value */}
                <div className="mb-4 p-3 rounded-lg bg-gradient-to-r from-emerald-500/10 to-transparent border border-emerald-500/20">
                  <div className="flex items-baseline gap-2">
                    {discount.discountType === 'percentage' ? (
                      <>
                        <Percent className="w-5 h-5 text-emerald-400" />
                        <span className="text-2xl font-bold text-emerald-400">
                          {discount.discountValue}%
                        </span>
                      </>
                    ) : (
                      <>
                        <DollarSign className="w-5 h-5 text-emerald-400" />
                        <span className="text-2xl font-bold text-emerald-400">
                          {formatRupiah(discount.discountValue)}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between text-foreground/70">
                    <span>Penggunaan:</span>
                    <span className="font-medium text-foreground">
                      {discount.currentUses}/{discount.maxUses}
                    </span>
                  </div>
                  {discount.minPurchase > 0 && (
                    <div className="flex justify-between text-foreground/70">
                      <span>Min. Pembelian:</span>
                      <span className="font-medium text-foreground">
                        {formatRupiah(discount.minPurchase)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-foreground/70">
                    <span>Berlaku:</span>
                    <span className="font-medium text-foreground text-xs">
                      {discount.validFrom ? new Date(discount.validFrom).toLocaleDateString('id-ID') : '-'} -{' '}
                      {discount.validUntil ? new Date(discount.validUntil).toLocaleDateString('id-ID') : '-'}
                    </span>
                  </div>
                </div>

                {/* Usage Bar */}
                <div className="w-full bg-foreground/10 rounded-full h-1.5">
                  <motion.div
                    className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${discount.maxUses ? (discount.currentUses / discount.maxUses) * 100 : 0}%`,
                    }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ============================================================================
// LOYALTY POINT TAB
// ============================================================================
interface LoyaltyData {
  clientId: number;
  points: number;
}

const LoyaltyPointTab = () => {
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  // Note: selectedClientId is a string for Select component compatibility
  const [pointsToAdd, setPointsToAdd] = useState<string>('');

  const { data: loyaltyData = [] } = trpc.loyalty.allPoints.useQuery();
  const { data: clients = [] } = trpc.clientMgmt.list.useQuery();
  const addPointsMutation = trpc.loyalty.addPoints.useMutation();

  const totalPointsCirculating = loyaltyData.reduce(
    (sum, item) => sum + item.points,
    0
  );
  const clientsWithPoints = loyaltyData.filter((item) => item.points > 0).length;

  const handleAddPoints = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedClientId || !pointsToAdd) return;

    try {
      await addPointsMutation.mutateAsync({
        clientId: Number(selectedClientId),
        points: Number(pointsToAdd),
      });
      setIsDialogOpen(false);
      setSelectedClientId('');
      setPointsToAdd('');
    } catch (error) {
      console.error('Error adding points:', error);
    }
  };

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          variants={itemVariants}
          className="rounded-xl border border-border/50 bg-gradient-to-br from-purple-500/20 to-purple-600/5 backdrop-blur-sm p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground/70 mb-2">
                Total Poin Beredar
              </p>
              <p className="text-3xl font-bold tracking-tight text-foreground">
                {totalPointsCirculating.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="rounded-lg p-3 bg-purple-500/20 backdrop-blur-sm border border-border/50">
              <Zap className="w-5 h-5 text-purple-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="rounded-xl border border-border/50 bg-gradient-to-br from-blue-500/20 to-blue-600/5 backdrop-blur-sm p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground/70 mb-2">
                Pelanggan dengan Poin
              </p>
              <p className="text-3xl font-bold tracking-tight text-foreground">
                {clientsWithPoints}
              </p>
            </div>
            <div className="rounded-lg p-3 bg-blue-500/20 backdrop-blur-sm border border-border/50">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Add Points Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <motion.div variants={itemVariants}>
            <Button className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white border-0 shadow-lg hover:shadow-emerald-500/20">
              <Plus className="w-4 h-4 mr-2" />
              Tambah Poin
            </Button>
          </motion.div>
        </DialogTrigger>
        <DialogContent className="bg-card border border-border/50 max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Poin Loyalitas</DialogTitle>
            <DialogDescription>
              Berikan poin bonus kepada pelanggan Anda
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddPoints} className="space-y-4">
            <div>
              <Label htmlFor="client">Pilih Pelanggan</Label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Pilih pelanggan..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client: any) => (
                    <SelectItem key={client.id} value={String(client.id)}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="points">Jumlah Poin</Label>
              <Input
                id="points"
                type="number"
                placeholder="500"
                value={pointsToAdd}
                onChange={(e) => setPointsToAdd(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600"
              >
                Tambah Poin
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setSelectedClientId('');
                  setPointsToAdd('');
                }}
              >
                Batal
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Loyalty Points List */}
      <motion.div
        variants={itemVariants}
        className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-6"
      >
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Poin Pelanggan
        </h3>
        {loyaltyData.length === 0 ? (
          <div className="text-center py-12">
            <Gift className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
            <p className="text-foreground/60 mb-2">Belum ada data poin</p>
            <p className="text-sm text-foreground/40">
              Mulai berikan poin kepada pelanggan Anda
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {loyaltyData
              .sort((a, b) => b.points - a.points)
              .map((loyalty, idx) => {
                const client = clients.find((c) => c.id === loyalty.clientId);
                return (
                  <motion.div
                    key={loyalty.clientId}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center justify-between p-4 rounded-lg bg-foreground/5 hover:bg-foreground/10 transition-colors border border-border/30"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-foreground">
                        {client?.name || 'Unknown'}
                      </p>
                      <p className="text-xs text-foreground/60">
                        {client?.email}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-baseline gap-1">
                        <Zap className="w-4 h-4 text-amber-400" />
                        <p className="text-2xl font-bold text-foreground">
                          {loyalty.points.toLocaleString('id-ID')}
                        </p>
                      </div>
                      <p className="text-xs text-foreground/60 mt-1">
                        poin
                      </p>
                    </div>
                  </motion.div>
                );
              })}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-6">
      <motion.div
        className="max-w-7xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-600/5 border border-emerald-500/20">
              <Gift className="w-6 h-6 text-emerald-400" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Panel Pemasaran
            </h1>
          </div>
          <p className="text-foreground/60 ml-11">
            Kelola kampanye, voucher, dan loyalitas pelanggan Anda
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="crm" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-card/50 border border-border/50 backdrop-blur-sm p-1">
            <TabsTrigger value="crm" className="data-[state=active]:bg-emerald-600/20">
              <Users className="w-4 h-4 mr-2" />
              CRM
            </TabsTrigger>
            <TabsTrigger value="voucher" className="data-[state=active]:bg-emerald-600/20">
              <Percent className="w-4 h-4 mr-2" />
              Voucher & Diskon
            </TabsTrigger>
            <TabsTrigger value="loyalty" className="data-[state=active]:bg-emerald-600/20">
              <Zap className="w-4 h-4 mr-2" />
              Loyalitas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="crm" className="mt-6">
            <CRMTab />
          </TabsContent>

          <TabsContent value="voucher" className="mt-6">
            <VoucherDiscountTab />
          </TabsContent>

          <TabsContent value="loyalty" className="mt-6">
            <LoyaltyPointTab />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
