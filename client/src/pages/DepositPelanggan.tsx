import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Wallet, Plus, Search, Pencil, ChevronRight, Download, TrendingUp,
  TrendingDown, RotateCcw
} from "lucide-react";
import { formatRupiah } from "../../../shared/finance";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function DepositPelanggan() {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<"topup" | "usage" | "refund">("topup");
  const [selectedDeposit, setSelectedDeposit] = useState<number | null>(null);
  const [expandedDeposit, setExpandedDeposit] = useState<number | null>(null);
  const [form, setForm] = useState({
    clientId: 0,
    amount: 0,
    paymentMethod: "tunai",
    notes: "",
  });

  const { data: deposits, isLoading } = trpc.deposit.list.useQuery();
  const { data: history } = trpc.deposit.history.useQuery(
    { clientId: selectedDeposit! },
    { enabled: !!selectedDeposit }
  );
  const utils = trpc.useUtils();

  const topUpMut = trpc.deposit.topUp.useMutation({
    onSuccess: () => {
      utils.deposit.list.invalidate();
      utils.deposit.balance.invalidate();
      utils.deposit.history.invalidate();
      setShowForm(false);
      resetForm();
      toast.success("Top up deposit berhasil!");
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const useMut = trpc.deposit.use.useMutation({
    onSuccess: () => {
      utils.deposit.list.invalidate();
      utils.deposit.balance.invalidate();
      utils.deposit.history.invalidate();
      setShowForm(false);
      resetForm();
      toast.success("Penggunaan deposit berhasil!");
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const refundMut = trpc.deposit.refund.useMutation({
    onSuccess: () => {
      utils.deposit.list.invalidate();
      utils.deposit.balance.invalidate();
      utils.deposit.history.invalidate();
      setShowForm(false);
      resetForm();
      toast.success("Refund deposit berhasil!");
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  function resetForm() {
    setForm({ clientId: 0, amount: 0, paymentMethod: "tunai", notes: "" });
  }

  function openForm(type: "topup" | "usage" | "refund", depositId?: number) {
    setFormType(type);
    if (depositId) {
      const deposit = deposits?.find(d => d.id === depositId);
      if (deposit) {
        setForm({ ...form, clientId: deposit.clientId });
      }
    }
    setShowForm(true);
  }

  function handleSubmit() {
    if (form.amount <= 0) {
      toast.error("Nominal harus lebih dari 0");
      return;
    }

    const clientId = form.clientId || selectedDeposit;
    if (!clientId) {
      toast.error("Pilih customer");
      return;
    }

    if (formType === "topup") {
      if (!form.paymentMethod.trim()) {
        toast.error("Metode pembayaran wajib diisi");
        return;
      }
      topUpMut.mutate({
        clientId,
        amount: form.amount,
        notes: form.notes || undefined,
      });
    } else if (formType === "usage") {
      useMut.mutate({
        clientId,
        amount: form.amount,
      });
    } else if (formType === "refund") {
      refundMut.mutate({
        clientId,
        amount: form.amount,
        notes: form.notes || undefined,
      });
    }
  }

  const filtered = (deposits || []).filter(d =>
    (d.clientName || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalOutstanding = (filtered || []).reduce((sum, d) => sum + (d.balance || 0), 0);
  const totalTopup = (filtered || []).reduce((sum, d) => {
    const txs = history?.filter(t => t.type === "topup") || [];
    return sum + txs.reduce((s, t) => s + (t.amount || 0), 0);
  }, 0);

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wallet className="h-6 w-6 text-[#1E4D9B]" />
            Deposit Pelanggan
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Kelola saldo deposit dan transaksi pelanggan</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="bg-gradient-to-r from-[#1E4D9B] to-[#2563EB]">
          <Plus className="h-4 w-4 mr-2" /> Top Up Deposit
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatRupiah(totalOutstanding)}</div>
            <div className="text-xs text-muted-foreground">Total Outstanding</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{deposits?.length || 0}</div>
            <div className="text-xs text-muted-foreground">Customer Aktif</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {deposits?.filter(d => d.balance > 0).length || 0}
            </div>
            <div className="text-xs text-muted-foreground">Dengan Saldo</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari customer berdasarkan nama..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Customer Deposits List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Wallet className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">
              {search ? "Tidak ada customer yang cocok" : "Belum ada customer dengan deposit"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((deposit) => (
            <motion.div
              key={deposit.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold">{deposit.clientName}</h4>
                    <p className="text-2xl font-bold mt-2 text-blue-600 dark:text-blue-400">
                      {formatRupiah(deposit.balance)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Terakhir update: {new Date(deposit.updatedAt).toLocaleDateString("id-ID")}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedDeposit(deposit.clientId);
                        openForm("topup", deposit.id);
                      }}
                    >
                      <TrendingUp className="h-4 w-4 mr-1" />
                      Top Up
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedDeposit(deposit.clientId);
                        openForm("usage", deposit.id);
                      }}
                    >
                      <TrendingDown className="h-4 w-4 mr-1" />
                      Pakai
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setExpandedDeposit(expandedDeposit === deposit.id ? null : deposit.id)}
                    >
                      <ChevronRight className={`h-4 w-4 transition-transform ${expandedDeposit === deposit.id ? "rotate-90" : ""}`} />
                    </Button>
                  </div>
                </div>

                {/* Expanded History */}
                <AnimatePresence>
                  {expandedDeposit === deposit.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t"
                    >
                      <h5 className="font-semibold text-sm mb-3">Riwayat Transaksi</h5>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {history && history.length > 0 ? (
                          history.map((tx) => (
                            <div key={tx.id} className="flex items-center justify-between text-sm p-2 rounded bg-gray-50 dark:bg-gray-800">
                              <div className="flex items-center gap-2">
                                {tx.type === "topup" && <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />}
                                {tx.type === "usage" && <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />}
                                {tx.type === "refund" && <RotateCcw className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                                <div>
                                  <p className="font-medium capitalize">{tx.type}</p>
                                  <p className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString("id-ID")}</p>
                                </div>
                              </div>
                              <p className={`font-semibold ${
                                tx.type === "usage" ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
                              }`}>
                                {tx.type === "usage" ? "-" : "+"}{formatRupiah(tx.amount)}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-muted-foreground">Tidak ada riwayat transaksi</p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {formType === "topup" && "Top Up Deposit"}
              {formType === "usage" && "Penggunaan Deposit"}
              {formType === "refund" && "Refund Deposit"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Nominal</Label>
              <Input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: parseInt(e.target.value) || 0 })}
                placeholder="Masukkan nominal"
                className="mt-1"
              />
            </div>

            {(formType === "topup" || formType === "refund") && (
              <div>
                <Label>Metode Pembayaran</Label>
                <Input
                  value={form.paymentMethod}
                  onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                  placeholder="e.g. Tunai, Transfer, etc"
                  className="mt-1"
                />
              </div>
            )}

            {(formType === "topup" || formType === "refund") && (
              <div>
                <Label>Catatan (Opsional)</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Catatan tambahan..."
                  className="mt-1"
                />
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowForm(false)}>Batal</Button>
              <Button
                onClick={handleSubmit}
                disabled={topUpMut.isPending || useMut.isPending || refundMut.isPending}
                className="bg-gradient-to-r from-[#1E4D9B] to-[#2563EB]"
              >
                {formType === "topup" && "Top Up"}
                {formType === "usage" && "Pakai Deposit"}
                {formType === "refund" && "Refund"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
