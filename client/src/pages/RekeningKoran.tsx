import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { formatRupiah } from "../../../shared/finance";
import { toast } from "sonner";

export default function RekeningKoranPage() {
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));

  const { data: bankAccounts = [] } = trpc.bankAccount.list.useQuery();
  const { data: reportData = [], isLoading } = trpc.report.rekeningKoran.useQuery(
    {
      bankAccountName: selectedAccount,
      startDate,
      endDate,
    },
    { enabled: !!selectedAccount }
  );

  const selectedBankAccount = useMemo(
    () => bankAccounts.find((acc: any) => acc.accountName === selectedAccount),
    [bankAccounts, selectedAccount]
  );

  const totalDebit = useMemo(
    () => reportData.reduce((sum, entry) => sum + entry.debit, 0),
    [reportData]
  );

  const totalCredit = useMemo(
    () => reportData.reduce((sum, entry) => sum + entry.credit, 0),
    [reportData]
  );

  const endingBalance = reportData.length > 0
    ? reportData[reportData.length - 1].runningBalance
    : selectedBankAccount?.initialBalance ?? 0;

  const startingBalance = selectedBankAccount?.initialBalance ?? 0;

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Rekening Koran</h1>
          <p className="text-muted-foreground mt-1">Laporan Mutasi Perkiraan Bank</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Bank/Akun</label>
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih akun..." />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((acc: any) => (
                    <SelectItem key={acc.id} value={acc.accountName}>
                      <span>{acc.icon}</span>
                      <span className="ml-2">{acc.accountName}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tanggal Mulai</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tanggal Akhir</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      {selectedAccount && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground mb-1">Saldo Awal</p>
              <p className="text-xl font-bold text-primary">{formatRupiah(startingBalance)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground mb-1">Total Debit</p>
              <p className="text-xl font-bold text-danger">{formatRupiah(totalDebit)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground mb-1">Total Kredit</p>
              <p className="text-xl font-bold text-success">{formatRupiah(totalCredit)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground mb-1">Saldo Akhir</p>
              <p className="text-xl font-bold text-primary">{formatRupiah(endingBalance)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Table */}
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {selectedAccount ? `Mutasi ${selectedBankAccount?.accountName}` : "Pilih Akun untuk Melihat Detail"}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden flex flex-col">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
            </div>
          ) : !selectedAccount ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground">
              Silakan pilih rekening untuk melihat detail mutasi
            </div>
          ) : reportData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground">
              Tidak ada transaksi dalam periode ini
            </div>
          ) : (
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b sticky top-0">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-xs">No</th>
                    <th className="text-left px-4 py-3 font-medium text-xs">Tanggal</th>
                    <th className="text-left px-4 py-3 font-medium text-xs">Keterangan</th>
                    <th className="text-right px-4 py-3 font-medium text-xs">Debit (Rp)</th>
                    <th className="text-right px-4 py-3 font-medium text-xs">Kredit (Rp)</th>
                    <th className="text-right px-4 py-3 font-medium text-xs">Saldo (Rp)</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {reportData.map((entry, idx) => (
                    <tr key={idx} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium">{entry.date}</td>
                      <td className="px-4 py-3 text-muted-foreground">{entry.description}</td>
                      <td className="px-4 py-3 text-right text-danger font-medium">
                        {entry.debit > 0 ? formatRupiah(entry.debit) : "-"}
                      </td>
                      <td className="px-4 py-3 text-right text-success font-medium">
                        {entry.credit > 0 ? formatRupiah(entry.credit) : "-"}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-primary">
                        {formatRupiah(entry.runningBalance)}
                      </td>
                    </tr>
                  ))}

                  {/* Summary row */}
                  <tr className="bg-primary/5 border-t-2 border-primary font-bold">
                    <td colSpan={3} className="px-4 py-3">
                      JUMLAH
                    </td>
                    <td className="px-4 py-3 text-right text-danger">
                      {formatRupiah(totalDebit)}
                    </td>
                    <td className="px-4 py-3 text-right text-success">
                      {formatRupiah(totalCredit)}
                    </td>
                    <td className="px-4 py-3 text-right text-primary">
                      {formatRupiah(endingBalance)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
