import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BookOpen, Plus, Trash2, RotateCcw, Shield, AlertTriangle, Eye } from "lucide-react";
import { toast } from "sonner";
import { HelpTooltip, HelpToggleButton, useHelpToggle } from "@/components/HelpSystem";

function formatRp(amount: number): string {
  if (amount === 0) return "Rp 0";
  const abs = Math.abs(amount);
  const formatted = new Intl.NumberFormat("id-ID").format(abs);
  return amount < 0 ? `(Rp ${formatted})` : `Rp ${formatted}`;
}

type JournalLine = {
  accountId: number;
  debitAmount: number;
  creditAmount: number;
  description: string;
};

export default function JurnalAdjustment() {
  const { showHelp, toggleHelp } = useHelpToggle();
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [description, setDescription] = useState("");
  const [lines, setLines] = useState<JournalLine[]>([
    { accountId: 0, debitAmount: 0, creditAmount: 0, description: "" },
    { accountId: 0, debitAmount: 0, creditAmount: 0, description: "" },
  ]);
  const [viewEntryId, setViewEntryId] = useState<number | null>(null);

  // ─── Data queries ───
  const { data: accounts = [] } = trpc.journal.accounts.useQuery();
  const { data: entries = [], refetch: refetchEntries } = trpc.journal.list.useQuery({ limit: 100, offset: 0 });
  const { data: viewLines = [] } = trpc.journal.lines.useQuery(
    { journalEntryId: viewEntryId! },
    { enabled: viewEntryId !== null }
  );

  const adjustMutation = trpc.journal.adjust.useMutation({
    onSuccess: () => {
      toast.success("Jurnal penyesuaian berhasil dibuat");
      setShowForm(false);
      resetForm();
      refetchEntries();
    },
    onError: (err) => toast.error(err.message),
  });

  const reverseMutation = trpc.journal.reverse.useMutation({
    onSuccess: () => {
      toast.success("Jurnal berhasil di-reverse");
      refetchEntries();
    },
    onError: (err) => toast.error(err.message),
  });

  // Sort accounts for dropdown — detail accounts only (not headers)
  const detailAccounts = useMemo(() => {
    return accounts
      .filter((a: any) => !a.isHeader)
      .sort((a: any, b: any) => a.code.localeCompare(b.code));
  }, [accounts]);

  // Account name lookup
  const accountMap = useMemo(() => {
    const map: Record<number, { code: string; name: string }> = {};
    accounts.forEach((a: any) => {
      map[a.id] = { code: a.code, name: a.name };
    });
    return map;
  }, [accounts]);

  // ─── Line helpers ───
  const addLine = () => {
    setLines([...lines, { accountId: 0, debitAmount: 0, creditAmount: 0, description: "" }]);
  };

  const removeLine = (idx: number) => {
    if (lines.length <= 2) return;
    setLines(lines.filter((_, i) => i !== idx));
  };

  const updateLine = (idx: number, field: keyof JournalLine, value: any) => {
    const updated = [...lines];
    updated[idx] = { ...updated[idx], [field]: value };
    // If user fills debit, clear credit and vice versa
    if (field === "debitAmount" && Number(value) > 0) {
      updated[idx].creditAmount = 0;
    } else if (field === "creditAmount" && Number(value) > 0) {
      updated[idx].debitAmount = 0;
    }
    setLines(updated);
  };

  const resetForm = () => {
    setDate(new Date().toISOString().substring(0, 10));
    setDescription("");
    setLines([
      { accountId: 0, debitAmount: 0, creditAmount: 0, description: "" },
      { accountId: 0, debitAmount: 0, creditAmount: 0, description: "" },
    ]);
  };

  // ─── Balance check ───
  const totalDebit = lines.reduce((s, l) => s + Number(l.debitAmount || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + Number(l.creditAmount || 0), 0);
  const isBalanced = totalDebit === totalCredit && totalDebit > 0;

  // ─── Submit ───
  const handleSubmit = () => {
    if (!description.trim()) return toast.error("Deskripsi wajib diisi");
    if (!isBalanced) return toast.error("Total Debit dan Kredit harus sama (balanced)");
    const validLines = lines.filter((l) => l.accountId > 0 && (l.debitAmount > 0 || l.creditAmount > 0));
    if (validLines.length < 2) return toast.error("Minimal 2 baris jurnal yang valid");

    adjustMutation.mutate({
      date,
      description,
      lines: validLines.map((l) => ({
        accountId: l.accountId,
        debitAmount: Number(l.debitAmount),
        creditAmount: Number(l.creditAmount),
        description: l.description || undefined,
      })),
    });
  };

  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-emerald-600" />
          <div>
            <h1 className="text-xl font-bold">Jurnal Penyesuaian</h1>
            <p className="text-sm text-muted-foreground">
              Buat jurnal adjustment manual dan reverse jurnal yang salah
            </p>
          </div>
          <HelpTooltip
            title="Jurnal Penyesuaian"
            content="Fitur ini untuk mengoreksi jurnal yang salah atau membuat entri penyesuaian manual. Hanya bisa diakses oleh akun master/owner. Setiap adjustment tercatat di audit trail."
            show={showHelp}
          />
        </div>
        <div className="flex items-center gap-2">
          <HelpToggleButton showHelp={showHelp} onToggle={toggleHelp} />
          <Badge variant="outline" className="text-amber-600 border-amber-300">
            <Shield className="w-3 h-3 mr-1" /> Master Only
          </Badge>
          <Button onClick={() => setShowForm(true)} size="sm">
            <Plus className="w-4 h-4 mr-1" /> Buat Adjustment
          </Button>
        </div>
      </div>

      {/* ─── Info banner ─── */}
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-amber-800">Perhatian — Jurnal Penyesuaian</p>
              <p className="text-amber-700 mt-1">
                Semua jurnal penyesuaian tercatat permanen di sistem. Gunakan fitur ini hanya untuk koreksi
                yang diperlukan. Setiap entri harus balance (total debit = total kredit).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Journal Entries List ─── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Riwayat Jurnal</CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Belum ada jurnal tercatat</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">No. Entry</TableHead>
                    <TableHead className="w-[90px]">Tanggal</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead className="w-[110px]">Sumber</TableHead>
                    <TableHead className="w-[100px] text-right">Jumlah</TableHead>
                    <TableHead className="w-[80px]">Status</TableHead>
                    <TableHead className="w-[100px]">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry: any) => (
                    <TableRow key={entry.id} className={entry.status === "reversed" ? "opacity-50" : ""}>
                      <TableCell className="font-mono text-xs">{entry.entryNumber}</TableCell>
                      <TableCell className="text-xs">{entry.date}</TableCell>
                      <TableCell className="text-sm truncate max-w-[250px]" title={entry.description}>
                        {entry.description}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {entry.sourceType?.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm font-mono">
                        {formatRp(entry.totalAmount)}
                      </TableCell>
                      <TableCell>
                        {entry.status === "reversed" ? (
                          <Badge variant="destructive" className="text-xs">Reversed</Badge>
                        ) : (
                          <Badge variant="default" className="text-xs bg-emerald-600">Posted</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => setViewEntryId(entry.id)}
                            title="Lihat detail"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          {entry.status === "posted" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                              onClick={() => {
                                if (confirm(`Reverse jurnal ${entry.entryNumber}? Ini akan membuat jurnal pembalik otomatis.`)) {
                                  reverseMutation.mutate({ journalEntryId: entry.id, reason: `Manual reverse — ${entry.entryNumber}` });
                                }
                              }}
                              title="Reverse jurnal ini"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── View Detail Dialog ─── */}
      <Dialog open={viewEntryId !== null} onOpenChange={(open) => !open && setViewEntryId(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detail Jurnal</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {viewLines.length === 0 ? (
              <p className="text-sm text-muted-foreground">Memuat...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Akun</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Kredit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {viewLines.map((line: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell className="text-sm">
                        {accountMap[line.accountId]
                          ? `${accountMap[line.accountId].code} — ${accountMap[line.accountId].name}`
                          : `Akun #${line.accountId}`}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {line.debitAmount > 0 ? formatRp(line.debitAmount) : "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {line.creditAmount > 0 ? formatRp(line.creditAmount) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Create Adjustment Dialog ─── */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" /> Buat Jurnal Penyesuaian
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Date + Description */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Tanggal</label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-muted-foreground">Deskripsi</label>
                <Input
                  placeholder="Contoh: Koreksi saldo persediaan"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            {/* Journal Lines */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Baris Jurnal</label>
                <Button variant="outline" size="sm" onClick={addLine}>
                  <Plus className="w-3 h-3 mr-1" /> Tambah Baris
                </Button>
              </div>

              <div className="space-y-2">
                {lines.map((line, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    {/* Account Select */}
                    <div className="col-span-5">
                      <Select
                        value={line.accountId > 0 ? String(line.accountId) : ""}
                        onValueChange={(v) => updateLine(idx, "accountId", Number(v))}
                      >
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Pilih akun..." />
                        </SelectTrigger>
                        <SelectContent>
                          {detailAccounts.map((acc: any) => (
                            <SelectItem key={acc.id} value={String(acc.id)} className="text-xs">
                              {acc.code} — {acc.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Debit */}
                    <div className="col-span-3">
                      <Input
                        type="number"
                        placeholder="Debit"
                        className="h-9 text-xs"
                        value={line.debitAmount || ""}
                        onChange={(e) => updateLine(idx, "debitAmount", Number(e.target.value) || 0)}
                      />
                    </div>

                    {/* Credit */}
                    <div className="col-span-3">
                      <Input
                        type="number"
                        placeholder="Kredit"
                        className="h-9 text-xs"
                        value={line.creditAmount || ""}
                        onChange={(e) => updateLine(idx, "creditAmount", Number(e.target.value) || 0)}
                      />
                    </div>

                    {/* Remove */}
                    <div className="col-span-1 flex justify-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-red-500"
                        onClick={() => removeLine(idx)}
                        disabled={lines.length <= 2}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="grid grid-cols-12 gap-2 items-center mt-3 pt-3 border-t">
                <div className="col-span-5 text-right text-sm font-medium">Total:</div>
                <div className="col-span-3">
                  <div className={`text-sm font-mono font-medium px-2 ${isBalanced ? "text-emerald-600" : "text-red-500"}`}>
                    {formatRp(totalDebit)}
                  </div>
                </div>
                <div className="col-span-3">
                  <div className={`text-sm font-mono font-medium px-2 ${isBalanced ? "text-emerald-600" : "text-red-500"}`}>
                    {formatRp(totalCredit)}
                  </div>
                </div>
                <div className="col-span-1" />
              </div>

              {!isBalanced && totalDebit + totalCredit > 0 && (
                <p className="text-xs text-red-500 mt-1">
                  Jurnal tidak balance. Selisih: {formatRp(Math.abs(totalDebit - totalCredit))}
                </p>
              )}
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>
                Batal
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!isBalanced || adjustMutation.isPending}
              >
                {adjustMutation.isPending ? "Menyimpan..." : "Simpan Jurnal Penyesuaian"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
