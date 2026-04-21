import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  HandCoins, Plus, ArrowDownCircle, ArrowUpCircle, Calendar,
  Trash2, CreditCard, AlertTriangle, CheckCircle2, Clock, Banknote
} from "lucide-react";
import { formatRupiah, PAYMENT_METHODS } from "../../../shared/finance";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { HelpTooltip, HelpToggleButton, useHelpToggle, HELP_CONTENT } from "@/components/HelpSystem";

function StatusBadge({ status }: { status: string }) {
  if (status === "lunas") return <Badge className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 dark:bg-green-900/30 dark:text-green-400"><CheckCircle2 className="h-3 w-3 mr-1" />Lunas</Badge>;
  if (status === "terlambat") return <Badge className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 dark:bg-red-900/30 dark:text-red-400"><AlertTriangle className="h-3 w-3 mr-1" />Terlambat</Badge>;
  return <Badge className="bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 dark:bg-amber-900/30 dark:text-amber-400"><Clock className="h-3 w-3 mr-1" />Belum Lunas</Badge>;
}

export default function HutangPiutang() {
  const { showHelp, toggleHelp } = useHelpToggle();
  const [tab, setTab] = useState<"hutang" | "piutang">("piutang");
  const [showForm, setShowForm] = useState(false);
  const [showPayment, setShowPayment] = useState<number | null>(null);
  const [form, setForm] = useState({
    type: "piutang" as "hutang" | "piutang",
    counterpartyName: "",
    description: "",
    totalAmount: "",
    dueDate: "",
    notes: "",
  });
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paymentDate: new Date().toISOString().substring(0, 10),
    paymentMethod: "tunai",
    bankAccountName: "",
    notes: "",
  });

  const { data: allDebts, isLoading } = trpc.debt.list.useQuery();
  const { data: bankAccounts } = trpc.bankAccount.list.useQuery();
  const utils = trpc.useUtils();

  const createMut = trpc.debt.create.useMutation({
    onSuccess: () => { utils.debt.list.invalidate(); setShowForm(false); resetForm(); toast.success("Berhasil ditambahkan!"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMut = trpc.debt.delete.useMutation({
    onSuccess: () => { utils.debt.list.invalidate(); toast.success("Berhasil dihapus!"); },
    onError: (e) => toast.error(e.message),
  });
  const addPaymentMut = trpc.debt.addPayment.useMutation({
    onSuccess: () => { utils.debt.list.invalidate(); setShowPayment(null); resetPaymentForm(); toast.success("Pembayaran dicatat!"); },
    onError: (e) => toast.error(e.message),
  });

  function resetForm() {
    setForm({ type: tab, counterpartyName: "", description: "", totalAmount: "", dueDate: "", notes: "" });
  }
  function resetPaymentForm() {
    setPaymentForm({ amount: "", paymentDate: new Date().toISOString().substring(0, 10), paymentMethod: "tunai", bankAccountName: "", notes: "" });
  }

  function handleSubmit() {
    if (!form.counterpartyName.trim()) { toast.error("Nama pihak wajib diisi"); return; }
    const amount = parseInt(form.totalAmount.replace(/\D/g, ""), 10);
    if (!amount || amount <= 0) { toast.error("Jumlah harus lebih dari 0"); return; }
    createMut.mutate({
      type: form.type,
      counterpartyName: form.counterpartyName,
      description: form.description || undefined,
      totalAmount: amount,
      dueDate: form.dueDate || undefined,
      notes: form.notes || undefined,
    });
  }

  function handlePayment(debtId: number) {
    const amount = parseInt(paymentForm.amount.replace(/\D/g, ""), 10);
    if (!amount || amount <= 0) { toast.error("Jumlah pembayaran harus lebih dari 0"); return; }
    addPaymentMut.mutate({
      debtId,
      amount,
      paymentDate: paymentForm.paymentDate,
      paymentMethod: paymentForm.paymentMethod,
      bankAccountName: paymentForm.bankAccountName || undefined,
      notes: paymentForm.notes || undefined,
    });
  }

  const debts = useMemo(() => (allDebts || []).filter(d => d.type === tab), [allDebts, tab]);

  const totalAmount = debts.reduce((s, d) => s + d.totalAmount, 0);
  const totalPaid = debts.reduce((s, d) => s + d.paidAmount, 0);
  const totalRemaining = totalAmount - totalPaid;
  const overdueCount = debts.filter(d => d.status === "terlambat").length;
  const activeCount = debts.filter(d => d.status === "belum_lunas").length;

  const paymentDebt = showPayment ? debts.find(d => d.id === showPayment) : null;

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <HandCoins className="h-6 w-6 text-[#1E4D9B]" />
              Hutang & Piutang
            </h1>
            <HelpTooltip
              title={HELP_CONTENT.hutang_vs_piutang.title}
              content={HELP_CONTENT.hutang_vs_piutang.content}
              show={showHelp}
            />
          </div>
          <p className="text-sm text-muted-foreground mt-1">Kelola hutang dan piutang bisnis Anda</p>
        </div>
        <HelpToggleButton showHelp={showHelp} onToggle={toggleHelp} />
        <Button onClick={() => { setForm(f => ({ ...f, type: tab })); resetForm(); setShowForm(true); }} className="bg-gradient-to-r from-[#1E4D9B] to-[#2563EB]">
          <Plus className="h-4 w-4 mr-2" /> Tambah {tab === "hutang" ? "Hutang" : "Piutang"}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as "hutang" | "piutang")}>
        <TabsList className="grid w-full grid-cols-2 max-w-sm">
          <TabsTrigger value="piutang" className="flex items-center gap-2">
            <ArrowDownCircle className="h-4 w-4" /> Piutang
          </TabsTrigger>
          <TabsTrigger value="hutang" className="flex items-center gap-2">
            <ArrowUpCircle className="h-4 w-4" /> Hutang
          </TabsTrigger>
        </TabsList>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="text-lg font-bold">{formatRupiah(totalAmount)}</div>
              <div className="text-xs text-muted-foreground">Total {tab === "hutang" ? "Hutang" : "Piutang"}</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="text-lg font-bold text-green-600 dark:text-green-400">{formatRupiah(totalPaid)}</div>
              <div className="text-xs text-muted-foreground">Sudah Dibayar</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="text-lg font-bold text-amber-600 dark:text-amber-400">{formatRupiah(totalRemaining)}</div>
              <div className="text-xs text-muted-foreground">Sisa</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold">{activeCount}</span>
                {overdueCount > 0 && <Badge variant="destructive" className="text-xs">{overdueCount} terlambat</Badge>}
              </div>
              <div className="text-xs text-muted-foreground">Aktif</div>
            </CardContent>
          </Card>
        </div>

        {/* List */}
        <TabsContent value={tab} className="mt-4">
          {isLoading ? (
            <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full rounded-lg" />)}</div>
          ) : debts.length === 0 ? (
            <Card className="border-0 shadow-md">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <HandCoins className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">Belum ada {tab === "hutang" ? "hutang" : "piutang"}</p>
                <Button variant="outline" className="mt-4" onClick={() => { setForm(f => ({ ...f, type: tab })); resetForm(); setShowForm(true); }}>
                  <Plus className="h-4 w-4 mr-2" /> Tambah {tab === "hutang" ? "Hutang" : "Piutang"} Pertama
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {debts.map((debt) => {
                  const progress = debt.totalAmount > 0 ? Math.round((debt.paidAmount / debt.totalAmount) * 100) : 0;
                  const remaining = debt.totalAmount - debt.paidAmount;
                  return (
                    <motion.div key={debt.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                      <Card className="border-0 shadow-md">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold">{debt.counterpartyName}</h3>
                                <StatusBadge status={debt.status} />
                              </div>
                              {debt.description && <p className="text-sm text-muted-foreground">{debt.description}</p>}
                              {debt.dueDate && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                  <Calendar className="h-3 w-3" /> Jatuh tempo: {debt.dueDate}
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold">{formatRupiah(debt.totalAmount)}</div>
                              {remaining > 0 && <div className="text-xs text-muted-foreground">Sisa: {formatRupiah(remaining)}</div>}
                            </div>
                          </div>
                          <div className="mb-3">
                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                              <span>Progres Pembayaran</span>
                              <span>{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="text-xs text-muted-foreground">
                              Dibayar: {formatRupiah(debt.paidAmount)}
                            </div>
                            <div className="flex items-center gap-2">
                              {debt.status !== "lunas" && (
                                <Button size="sm" variant="outline" onClick={() => { resetPaymentForm(); setShowPayment(debt.id); }}>
                                  <Banknote className="h-3.5 w-3.5 mr-1" /> Bayar
                                </Button>
                              )}
                              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => {
                                if (confirm(`Hapus ${tab} dari "${debt.counterpartyName}"?`)) deleteMut.mutate({ id: debt.id });
                              }}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Debt/Receivable Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) setShowForm(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah {form.type === "hutang" ? "Hutang" : "Piutang"} Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tipe</Label>
              <Select value={form.type} onValueChange={(v) => setForm(f => ({ ...f, type: v as "hutang" | "piutang" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="piutang">Piutang (Orang berhutang ke kita)</SelectItem>
                  <SelectItem value="hutang">Hutang (Kita berhutang ke orang)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nama Pihak *</Label>
              <Input value={form.counterpartyName} onChange={(e) => setForm(f => ({ ...f, counterpartyName: e.target.value }))} placeholder="Nama orang/perusahaan" />
            </div>
            <div>
              <Label>Jumlah *</Label>
              <Input value={form.totalAmount} onChange={(e) => setForm(f => ({ ...f, totalAmount: e.target.value.replace(/\D/g, "") }))} placeholder="Contoh: 5000000" />
              {form.totalAmount && <p className="text-xs text-muted-foreground mt-1">{formatRupiah(parseInt(form.totalAmount) || 0)}</p>}
            </div>
            <div>
              <Label>Jatuh Tempo</Label>
              <Input type="date" value={form.dueDate} onChange={(e) => setForm(f => ({ ...f, dueDate: e.target.value }))} />
            </div>
            <div>
              <Label>Deskripsi</Label>
              <Input value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Keterangan (opsional)" />
            </div>
            <div>
              <Label>Catatan</Label>
              <Textarea value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Catatan tambahan..." rows={2} />
            </div>
            <Button onClick={handleSubmit} className="w-full bg-gradient-to-r from-[#1E4D9B] to-[#2563EB]" disabled={createMut.isPending}>
              {createMut.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={!!showPayment} onOpenChange={(open) => { if (!open) setShowPayment(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Catat Pembayaran</DialogTitle>
          </DialogHeader>
          {paymentDebt && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="text-sm font-medium">{paymentDebt.counterpartyName}</div>
                <div className="text-xs text-muted-foreground">
                  Sisa: {formatRupiah(paymentDebt.totalAmount - paymentDebt.paidAmount)}
                </div>
              </div>
              <div>
                <Label>Jumlah Pembayaran *</Label>
                <Input value={paymentForm.amount} onChange={(e) => setPaymentForm(f => ({ ...f, amount: e.target.value.replace(/\D/g, "") }))} placeholder="Contoh: 1000000" />
                {paymentForm.amount && <p className="text-xs text-muted-foreground mt-1">{formatRupiah(parseInt(paymentForm.amount) || 0)}</p>}
              </div>
              <div>
                <Label>Tanggal Pembayaran</Label>
                <Input type="date" value={paymentForm.paymentDate} onChange={(e) => setPaymentForm(f => ({ ...f, paymentDate: e.target.value }))} />
              </div>
              <div>
                <Label>Metode Pembayaran</Label>
                <Select value={paymentForm.paymentMethod} onValueChange={(v) => setPaymentForm(f => ({ ...f, paymentMethod: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map(m => <SelectItem key={m} value={m.toLowerCase()}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {bankAccounts && bankAccounts.length > 0 && (
                <div>
                  <Label>{paymentDebt?.type === "hutang" ? "Bayar dari Rekening" : "Terima ke Rekening"}</Label>
                  <Select value={paymentForm.bankAccountName} onValueChange={(v) => setPaymentForm(f => ({ ...f, bankAccountName: v }))}>
                    <SelectTrigger><SelectValue placeholder="Pilih rekening..." /></SelectTrigger>
                    <SelectContent>
                      {bankAccounts.map((acc: any) => (
                        <SelectItem key={acc.id} value={acc.accountName}>
                          {acc.icon} {acc.accountName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {paymentDebt?.type === "hutang"
                      ? "Saldo rekening akan berkurang & tercatat di jurnal sebagai pengeluaran"
                      : "Saldo rekening akan bertambah & tercatat di jurnal sebagai pemasukan"}
                  </p>
                </div>
              )}
              <div>
                <Label>Catatan</Label>
                <Input value={paymentForm.notes} onChange={(e) => setPaymentForm(f => ({ ...f, notes: e.target.value }))} placeholder="Catatan (opsional)" />
              </div>
              <Button onClick={() => handlePayment(showPayment!)} className="w-full bg-gradient-to-r from-[#1E4D9B] to-[#2563EB]" disabled={addPaymentMut.isPending}>
                {addPaymentMut.isPending ? "Menyimpan..." : "Catat Pembayaran"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
