import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Store, Plus, Edit2, Trash2, AlertCircle } from "lucide-react";
import { formatRupiah } from "../../../shared/finance";

interface FormData {
  name: string;
  address?: string;
  phone?: string;
  warehouseId?: number;
}

interface Outlet {
  id: number;
  businessId: number;
  name: string;
  code: string | null;
  address: string | null;
  phone: string | null;
  waCode: string | null;
  isDefault: boolean;
  isActive: boolean;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface Warehouse {
  id: number;
  name: string;
}

export default function OutletManagement() {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    address: "",
    phone: "",
  });

  const utils = trpc.useUtils();
  const { data: outlets, refetch: refetchOutlets } = trpc.outlet.list.useQuery(undefined, { retry: false });
  const { data: warehouses } = trpc.warehouse.list.useQuery(undefined, { retry: false });

  const createMutation = trpc.outlet.create.useMutation({
    onSuccess: () => {
      setFormData({ name: "", address: "", phone: "" });
      setOpen(false);
      utils.outlet.list.invalidate();
    },
  });

  const updateMutation = trpc.outlet.update.useMutation({
    onSuccess: () => {
      setFormData({ name: "", address: "", phone: "" });
      setEditingId(null);
      setOpen(false);
      utils.outlet.list.invalidate();
    },
  });

  const deleteMutation = trpc.outlet.delete.useMutation({
    onSuccess: () => {
      utils.outlet.list.invalidate();
    },
  });

  const handleSubmit = () => {
    if (!formData.name.trim()) return;

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (outlet: Outlet) => {
    setEditingId(outlet.id);
    setFormData({
      name: outlet.name,
      address: outlet.address || "",
      phone: outlet.phone || "",
      // warehouseId removed - outlets don't have warehouseId
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingId(null);
    setFormData({ name: "", address: "", phone: "" });
  };

  const getWarehouseName = (id?: number) => {
    if (!id) return "-";
    return warehouses?.find((w: Warehouse) => w.id === id)?.name || `-`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Store className="w-8 h-8 text-green-600 dark:text-green-400" />
            <h1 className="text-3xl font-bold text-slate-900">
              Manajemen Outlet
            </h1>
          </div>
          <p className="text-slate-600">
            Kelola semua lokasi toko/outlet bisnis Anda
          </p>
        </div>

        {/* Action Button */}
        <div className="mb-6">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700 gap-2">
                <Plus className="w-4 h-4" />
                {editingId ? "Ubah Outlet" : "Tambah Outlet"}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {editingId ? "Ubah Outlet" : "Tambah Outlet Baru"}
                </DialogTitle>
                <DialogDescription>
                  Masukkan informasi outlet Anda
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nama Outlet *</Label>
                  <Input
                    id="name"
                    placeholder="Toko Utama, Toko Cabang 1, dll"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="address">Alamat</Label>
                  <Textarea
                    id="address"
                    placeholder="Jalan, No., Kota, Provinsi"
                    rows={3}
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Nomor Telepon</Label>
                  <Input
                    id="phone"
                    placeholder="08xxxxxxxxxx atau +62xxx"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="warehouse">Gudang Terkait (Opsional)</Label>
                  <Select
                    value={formData.warehouseId?.toString() || ""}
                    onValueChange={(val) =>
                      setFormData({
                        ...formData,
                        warehouseId: val ? parseInt(val) : undefined,
                      })
                    }
                  >
                    <SelectTrigger id="warehouse">
                      <SelectValue placeholder="Pilih gudang..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tidak Ada</SelectItem>
                      {warehouses?.map((w: Warehouse) => (
                        <SelectItem key={w.id} value={w.id.toString()}>
                          {w.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    className="flex-1"
                  >
                    Batal
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={
                      !formData.name ||
                      createMutation.isPending ||
                      updateMutation.isPending
                    }
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {editingId ? "Simpan Perubahan" : "Buat Outlet"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Outlets Grid */}
        {!outlets || outlets.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="w-12 h-12 text-slate-300 mb-4" />
              <p className="text-slate-500">
                Belum ada outlet. Buat outlet pertama Anda untuk memulai!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {outlets.map((outlet: Outlet) => (
              <Card key={outlet.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                        <Store className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">
                          {outlet.name}
                        </CardTitle>
                        {outlet.isDefault && (
                          <span className="text-xs text-green-600 dark:text-green-400 font-semibold">
                            Outlet Utama
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {outlet.address && (
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide">
                        Alamat
                      </p>
                      <p className="text-sm text-slate-700">{outlet.address}</p>
                    </div>
                  )}
                  {outlet.phone && (
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide">
                        Telepon
                      </p>
                      <p className="text-sm text-slate-700">{outlet.phone}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">
                      Kode
                    </p>
                    <p className="text-sm text-slate-700">
                      {outlet.code || '-'}
                    </p>
                  </div>
                  <div className="flex gap-2 pt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={() => handleEdit(outlet)}
                    >
                      <Edit2 className="w-4 h-4" />
                      Ubah
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:text-red-300"
                      onClick={() => deleteMutation.mutate({ id: outlet.id })}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                      Hapus
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
