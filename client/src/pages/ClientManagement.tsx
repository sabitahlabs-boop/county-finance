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
  Users, Plus, Search, Pencil, Trash2, Phone, Mail,
  Building2, MapPin, FileText, ChevronRight, Receipt
} from "lucide-react";
import { formatRupiah } from "../../../shared/finance";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function ClientManagement() {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editClient, setEditClient] = useState<any>(null);
  const [selectedClient, setSelectedClient] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", address: "", notes: "" });

  const { data: clients, isLoading } = trpc.clientMgmt.list.useQuery();
  const { data: clientTxs } = trpc.clientMgmt.transactions.useQuery(
    { clientId: selectedClient! },
    { enabled: !!selectedClient }
  );
  const utils = trpc.useUtils();

  const createMut = trpc.clientMgmt.create.useMutation({
    onSuccess: () => { utils.clientMgmt.list.invalidate(); setShowForm(false); resetForm(); toast.success("Client berhasil ditambahkan!"); },
    onError: (e) => toast.error(e.message),
  });
  const updateMut = trpc.clientMgmt.update.useMutation({
    onSuccess: () => { utils.clientMgmt.list.invalidate(); setShowForm(false); setEditClient(null); resetForm(); toast.success("Client berhasil diperbarui!"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMut = trpc.clientMgmt.delete.useMutation({
    onSuccess: () => { utils.clientMgmt.list.invalidate(); toast.success("Client berhasil dihapus!"); },
    onError: (e) => toast.error(e.message),
  });

  function resetForm() {
    setForm({ name: "", email: "", phone: "", company: "", address: "", notes: "" });
  }

  function openEdit(client: any) {
    setEditClient(client);
    setForm({
      name: client.name || "",
      email: client.email || "",
      phone: client.phone || "",
      company: client.company || "",
      address: client.address || "",
      notes: client.notes || "",
    });
    setShowForm(true);
  }

  function handleSubmit() {
    if (!form.name.trim()) { toast.error("Nama client wajib diisi"); return; }
    if (editClient) {
      updateMut.mutate({ id: editClient.id, ...form });
    } else {
      createMut.mutate(form);
    }
  }

  const filtered = (clients || []).filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.company || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const selectedClientData = selectedClient ? clients?.find(c => c.id === selectedClient) : null;

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-[#1E4D9B]" />
            Manajemen Client
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Kelola data client dan riwayat transaksi</p>
        </div>
        <Button onClick={() => { resetForm(); setEditClient(null); setShowForm(true); }} className="bg-gradient-to-r from-[#1E4D9B] to-[#2563EB]">
          <Plus className="h-4 w-4 mr-2" /> Tambah Client
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{clients?.length || 0}</div>
            <div className="text-xs text-muted-foreground">Total Client</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{clients?.filter(c => c.company).length || 0}</div>
            <div className="text-xs text-muted-foreground">Perusahaan</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{clients?.filter(c => c.email).length || 0}</div>
            <div className="text-xs text-muted-foreground">Dengan Email</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{clients?.filter(c => c.phone).length || 0}</div>
            <div className="text-xs text-muted-foreground">Dengan Telepon</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari client berdasarkan nama, perusahaan, atau email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Client List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">{search ? "Tidak ada client yang cocok" : "Belum ada client"}</p>
            {!search && (
              <Button variant="outline" className="mt-4" onClick={() => { resetForm(); setEditClient(null); setShowForm(true); }}>
                <Plus className="h-4 w-4 mr-2" /> Tambah Client Pertama
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          <AnimatePresence>
            {filtered.map((client) => (
              <motion.div
                key={client.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Card className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedClient(client.id)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate">{client.name}</h3>
                          {client.company && <Badge variant="secondary" className="text-xs">{client.company}</Badge>}
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          {client.email && (
                            <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{client.email}</span>
                          )}
                          {client.phone && (
                            <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{client.phone}</span>
                          )}
                          {client.address && (
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{client.address}</span>
                          )}
                        </div>
                        {client.notes && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{client.notes}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 ml-2 shrink-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); openEdit(client); }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Hapus client "${client.name}"?`)) deleteMut.mutate({ id: client.id });
                        }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add/Edit Client Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) { setShowForm(false); setEditClient(null); resetForm(); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editClient ? "Edit Client" : "Tambah Client Baru"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nama *</Label>
              <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nama client" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Email</Label>
                <Input value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@contoh.com" />
              </div>
              <div>
                <Label>Telepon</Label>
                <Input value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="08xxxxxxxxxx" />
              </div>
            </div>
            <div>
              <Label>Perusahaan</Label>
              <Input value={form.company} onChange={(e) => setForm(f => ({ ...f, company: e.target.value }))} placeholder="Nama perusahaan (opsional)" />
            </div>
            <div>
              <Label>Alamat</Label>
              <Input value={form.address} onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Alamat (opsional)" />
            </div>
            <div>
              <Label>Catatan</Label>
              <Textarea value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Catatan tambahan..." rows={2} />
            </div>
            <Button onClick={handleSubmit} className="w-full bg-gradient-to-r from-[#1E4D9B] to-[#2563EB]" disabled={createMut.isPending || updateMut.isPending}>
              {createMut.isPending || updateMut.isPending ? "Menyimpan..." : editClient ? "Simpan Perubahan" : "Tambah Client"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Client Detail Dialog */}
      <Dialog open={!!selectedClient} onOpenChange={(open) => { if (!open) setSelectedClient(null); }}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-[#1E4D9B]" />
              {selectedClientData?.name || "Detail Client"}
            </DialogTitle>
          </DialogHeader>
          {selectedClientData && (
            <div className="space-y-4">
              {/* Client Info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                {selectedClientData.company && (
                  <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-muted-foreground" /><span>{selectedClientData.company}</span></div>
                )}
                {selectedClientData.email && (
                  <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /><span>{selectedClientData.email}</span></div>
                )}
                {selectedClientData.phone && (
                  <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /><span>{selectedClientData.phone}</span></div>
                )}
                {selectedClientData.address && (
                  <div className="flex items-center gap-2 col-span-2"><MapPin className="h-4 w-4 text-muted-foreground" /><span>{selectedClientData.address}</span></div>
                )}
              </div>

              {/* Transaction History */}
              <div>
                <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <Receipt className="h-4 w-4" /> Riwayat Transaksi
                </h3>
                {!clientTxs || clientTxs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Belum ada transaksi dengan client ini</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {clientTxs.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-sm">
                        <div>
                          <div className="font-medium">{tx.description || tx.category}</div>
                          <div className="text-xs text-muted-foreground">{tx.date}</div>
                        </div>
                        <span className={tx.type === "pemasukan" ? "text-green-600 font-semibold" : "text-red-500 font-semibold"}>
                          {tx.type === "pemasukan" ? "+" : "-"}{formatRupiah(tx.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Summary */}
              {clientTxs && clientTxs.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  <Card className="border-0 bg-green-50 dark:bg-green-950/20">
                    <CardContent className="p-3 text-center">
                      <div className="text-lg font-bold text-green-600">
                        {formatRupiah(clientTxs.filter(t => t.type === "pemasukan").reduce((s, t) => s + t.amount, 0))}
                      </div>
                      <div className="text-xs text-muted-foreground">Total Pemasukan</div>
                    </CardContent>
                  </Card>
                  <Card className="border-0 bg-red-50 dark:bg-red-950/20">
                    <CardContent className="p-3 text-center">
                      <div className="text-lg font-bold text-red-500">
                        {formatRupiah(clientTxs.filter(t => t.type === "pengeluaran").reduce((s, t) => s + t.amount, 0))}
                      </div>
                      <div className="text-xs text-muted-foreground">Total Pengeluaran</div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
