import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Landmark, Plus, Pencil, Trash2, ChevronRight, AlertTriangle } from "lucide-react";
import { formatRupiah } from "../../../shared/finance";
import { toast } from "sonner";

// ─── Account Type Mapping ───
const ACCOUNT_TYPE_LABELS: Record<"bank" | "ewallet" | "cash", string> = {
  bank: "Bank",
  ewallet: "E-Wallet",
  cash: "Kas",
};

const ACCOUNT_TYPE_COLORS: Record<"bank" | "ewallet" | "cash", string> = {
  bank: "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300",
  ewallet: "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300",
  cash: "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300",
};

// Common emojis for bank accounts
const EMOJI_OPTIONS = ["🏦", "💳", "💰", "🪙", "📱", "💵", "🏧", "🔒", "💎", "⭐"];

// Preset color palette
const COLOR_OPTIONS = [
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#f59e0b", // amber
  "#10b981", // emerald
  "#06b6d4", // cyan
  "#6366f1", // indigo
  "#ef4444", // red
];

// ─── Add/Edit Account Dialog ───
function AccountDialog({
  open,
  onClose,
  account,
  onSave,
  isLoading,
}: {
  open: boolean;
  onClose: () => void;
  account?: any;
  onSave: (data: any) => Promise<void>;
  isLoading: boolean;
}) {
  const [name, setName] = useState(account?.accountName || "");
  const [type, setType] = useState<"bank" | "ewallet" | "cash">(account?.accountType || "bank");
  const [icon, setIcon] = useState(account?.icon || "🏦");
  const [color, setColor] = useState(account?.color || "#3b82f6");
  const [description, setDescription] = useState(account?.description || "");
  const [initialBalance, setInitialBalance] = useState(account?.initialBalance || 0);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Nama rekening harus diisi");
      return;
    }

    await onSave({
      ...(account && { id: account.id }),
      accountName: name,
      accountType: type,
      icon,
      color,
      description: description || undefined,
      initialBalance: parseInt(initialBalance.toString()) || 0,
    });

    // Reset form
    setName("");
    setType("bank");
    setIcon("🏦");
    setColor("#3b82f6");
    setDescription("");
    setInitialBalance(0);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {account ? "Edit Rekening" : "Tambah Rekening Baru"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Nama Rekening */}
          <div className="space-y-1.5">
            <Label htmlFor="account-name" className="text-sm font-medium">
              Nama Rekening
            </Label>
            <Input
              id="account-name"
              placeholder="BCA Utama, Dana Cas, E-Wallet Gopay, dll"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">Contoh: BCA Utama, Dana Cas, E-Wallet Gopay</p>
          </div>

          {/* Tipe Rekening */}
          <div className="space-y-1.5">
            <Label htmlFor="account-type" className="text-sm font-medium">
              Tipe Rekening
            </Label>
            <Select value={type} onValueChange={(v) => setType(v as any)} disabled={isLoading}>
              <SelectTrigger id="account-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank">Bank</SelectItem>
                <SelectItem value="ewallet">E-Wallet</SelectItem>
                <SelectItem value="cash">Kas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Icon Picker */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Icon</Label>
            <div className="grid grid-cols-5 gap-2">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setIcon(emoji)}
                  className={`h-10 rounded-lg border-2 flex items-center justify-center text-xl transition-all ${
                    icon === emoji ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                  }`}
                  disabled={isLoading}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Color Picker */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Warna</Label>
            <div className="grid grid-cols-8 gap-2">
              {COLOR_OPTIONS.map((col) => (
                <button
                  key={col}
                  onClick={() => setColor(col)}
                  className={`h-8 rounded-lg border-2 transition-all ${
                    color === col ? "border-foreground" : "border-border"
                  }`}
                  style={{ backgroundColor: col }}
                  disabled={isLoading}
                />
              ))}
            </div>
          </div>

          {/* Fungsi/Keterangan */}
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-sm font-medium">
              Fungsi/Keterangan (Opsional)
            </Label>
            <Textarea
              id="description"
              placeholder="Contoh: Bank utama untuk pembelian supplier, Kas untuk kebutuhan operasional harian"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
              rows={3}
            />
          </div>

          {/* Saldo Awal */}
          <div className="space-y-1.5">
            <Label htmlFor="initial-balance" className="text-sm font-medium">
              Saldo Awal (Rp)
            </Label>
            <Input
              id="initial-balance"
              type="number"
              placeholder="0"
              value={initialBalance}
              onChange={(e) => setInitialBalance(parseInt(e.target.value) || 0)}
              disabled={isLoading}
            />
          </div>

          {/* Info Box */}
          <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-xs text-blue-900">
              Rekening yang ditambahkan di sini otomatis tersedia sebagai metode pembayaran di POS, Transaksi, dan Laporan Rekening Koran.
            </p>
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Batal
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Delete Confirmation Dialog ───
function DeleteConfirmDialog({
  open,
  onClose,
  onConfirm,
  isLoading,
  accountName,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isLoading: boolean;
  accountName: string;
}) {
  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus Rekening?</AlertDialogTitle>
          <AlertDialogDescription>
            Apakah Anda yakin ingin menghapus rekening "{accountName}"? Tindakan ini tidak dapat dibatalkan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex gap-2 justify-end">
          <AlertDialogCancel disabled={isLoading}>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? "Menghapus..." : "Hapus"}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── Account Card ───
function AccountCard({
  account,
  onEdit,
  onDelete,
}: {
  account: any;
  onEdit: (account: any) => void;
  onDelete: (account: any) => void;
}) {
  const currentBalance = account.currentBalance || account.initialBalance || 0;
  const isPositive = currentBalance >= 0;

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-4 space-y-3">
        {/* Header with icon and name */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
              style={{ backgroundColor: account.color + "20", color: account.color }}
            >
              {account.icon}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm">{account.accountName}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={`text-xs ${ACCOUNT_TYPE_COLORS[account.accountType as keyof typeof ACCOUNT_TYPE_COLORS] || ""}`} variant="secondary">
                  {ACCOUNT_TYPE_LABELS[account.accountType as keyof typeof ACCOUNT_TYPE_LABELS] || account.accountType}
                </Badge>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-1">
            <button
              onClick={() => onEdit(account)}
              className="p-1.5 hover:bg-primary/10 rounded-lg transition-colors"
              title="Edit"
            >
              <Pencil className="h-4 w-4 text-primary" />
            </button>
            <button
              onClick={() => onDelete(account)}
              className="p-1.5 hover:bg-destructive/10 rounded-lg transition-colors"
              title="Hapus"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </button>
          </div>
        </div>

        {/* Description */}
        {account.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{account.description}</p>
        )}

        {/* Negative balance warning */}
        {!isPositive && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
            <p className="text-xs text-red-500">Saldo negatif — periksa saldo awal atau transaksi yang tercatat</p>
          </div>
        )}

        {/* Balance section */}
        <div className="space-y-2 border-t pt-3">
          <div className="flex justify-between items-baseline">
            <span className="text-xs text-muted-foreground">Saldo Sekarang</span>
            <span className={`text-lg font-bold ${isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
              {formatRupiah(currentBalance)}
            </span>
          </div>

          {/* Balance comparison */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="space-y-1">
              <p className="text-muted-foreground">Saldo Awal</p>
              <p className="font-medium">{formatRupiah(account.initialBalance || 0)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Perubahan</p>
              <p className="font-medium">
                {account.totalIncome !== undefined && account.totalExpense !== undefined
                  ? formatRupiah((account.totalIncome || 0) - (account.totalExpense || 0))
                  : "-"}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ───
export default function ManajemenRekening() {
  const utils = trpc.useUtils();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  // Queries
  const { data: accounts, isLoading } = trpc.bankAccount.balances.useQuery();

  // Mutations
  const createMutation = trpc.bankAccount.create.useMutation({
    onSuccess: () => {
      utils.bankAccount.list.invalidate();
      utils.bankAccount.balances.invalidate();
      toast.success("Rekening berhasil ditambahkan");
    },
    onError: (err) => {
      toast.error(err.message || "Gagal menambahkan rekening");
    },
  });

  const updateMutation = trpc.bankAccount.update.useMutation({
    onSuccess: () => {
      utils.bankAccount.list.invalidate();
      utils.bankAccount.balances.invalidate();
      toast.success("Rekening berhasil diperbarui");
    },
    onError: (err) => {
      toast.error(err.message || "Gagal memperbarui rekening");
    },
  });

  const deleteMutation = trpc.bankAccount.delete.useMutation({
    onSuccess: () => {
      utils.bankAccount.list.invalidate();
      utils.bankAccount.balances.invalidate();
      toast.success("Rekening berhasil dihapus");
      setDeleteOpen(false);
      setDeleteTarget(null);
    },
    onError: (err) => {
      toast.error(err.message || "Gagal menghapus rekening");
    },
  });

  // Total balance calculation
  const totalBalance = useMemo(() => {
    if (!accounts || accounts.length === 0) return 0;
    return accounts.reduce((sum, acc) => sum + (acc.currentBalance || 0), 0);
  }, [accounts]);

  const handleOpenDialog = (account?: any) => {
    setSelectedAccount(account || null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedAccount(null);
  };

  const handleSaveAccount = async (data: any) => {
    const isLoading = true;
    if (selectedAccount) {
      await updateMutation.mutateAsync(data);
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const handleDeleteAccount = (account: any) => {
    setDeleteTarget(account);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteTarget) {
      await deleteMutation.mutateAsync({ id: deleteTarget.id });
    }
  };

  const isAnyLoading = isLoading || createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Landmark className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Manajemen Rekening & Kas</h1>
              <p className="text-muted-foreground text-sm mt-1">Kelola semua tempat uang Anda</p>
            </div>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2" onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4" />
                Tambah Rekening
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>

        {/* Summary Card */}
        <Card className={`bg-gradient-to-br ${totalBalance < 0 ? "from-red-500/5 to-red-500/10 border-red-500/20" : "from-primary/5 to-primary/10 border-primary/20"}`}>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-2">Total Saldo Semua Rekening</p>
            {isLoading ? (
              <Skeleton className="h-10 w-40" />
            ) : (
              <>
                <h2 className={`text-4xl font-bold ${totalBalance < 0 ? "text-red-500" : "text-primary"}`}>{formatRupiah(totalBalance)}</h2>
                {totalBalance < 0 && (
                  <div className="flex items-center gap-2 mt-3 text-red-500">
                    <AlertTriangle className="h-4 w-4" />
                    <p className="text-sm">Ada rekening dengan saldo negatif — periksa saldo awal atau koreksi transaksi</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Accounts Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="pt-6 space-y-4">
                  <Skeleton className="h-10 w-3/4" />
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : accounts && accounts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {accounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                onEdit={handleOpenDialog}
                onDelete={handleDeleteAccount}
              />
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Landmark className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold mb-1">Belum Ada Rekening</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Mulai dengan menambahkan rekening bank, e-wallet, atau kas Anda
              </p>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Rekening Pertama
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Info Box */}
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <ChevronRight className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-900">
                <strong>Tips:</strong> Rekening yang ditambahkan di sini otomatis tersedia sebagai metode pembayaran di POS, Transaksi, dan Laporan Rekening Koran.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <AccountDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        account={selectedAccount}
        onSave={handleSaveAccount}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <DeleteConfirmDialog
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleConfirmDelete}
        isLoading={deleteMutation.isPending}
        accountName={deleteTarget?.accountName || ""}
      />
    </div>
  );
}
