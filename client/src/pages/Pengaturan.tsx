import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Building2, Palette, Receipt, CreditCard, Crown, Check, QrCode, Upload, Trash2, Loader2, Tag, Plus, Pencil, ChevronRight, X, Settings2, BookOpen, Store, ShoppingBag, FileSignature, Calculator, Users2, Mail, Shield, Eye, Warehouse, ShoppingCart, Copy, UserPlus, UserMinus, Clock, CheckCircle2 } from "lucide-react";
import { BUSINESS_TYPES, PLAN_LIMITS, PRO_PRICE, formatRupiah } from "../../../shared/finance";
import { toast } from "sonner";
import { useLocation } from "wouter";

interface FormState {
  businessName: string;
  businessType: string;
  address: string;
  phone: string;
  npwp: string;
  isPkp: boolean;
  hasEmployees: boolean;
  employeeCount: number;
  annualOmzetEstimate: number;
  brandColor: string;
  waNumber: string;
  bankName: string;
  bankAccount: string;
  bankHolder: string;
  qrisImageUrl: string;
  logoUrl: string;
}

const defaultForm: FormState = {
  businessName: "",
  businessType: "retail",
  address: "",
  phone: "",
  npwp: "",
  isPkp: false,
  hasEmployees: false,
  employeeCount: 0,
  annualOmzetEstimate: 0,
  brandColor: "#6366f1",
  waNumber: "",
  bankName: "",
  bankAccount: "",
  bankHolder: "",
  qrisImageUrl: "",
  logoUrl: "",
};

export default function Pengaturan() {
  const utils = trpc.useUtils();
  const { data: business, isLoading } = trpc.business.mine.useQuery(undefined, { retry: false });
  const updateBiz = trpc.business.update.useMutation({
    onSuccess: () => {
      utils.business.mine.invalidate();
      toast.success("Pengaturan berhasil disimpan");
    },
    onError: (err: any) => toast.error(err.message || "Gagal menyimpan"),
  });
  const setModeMut = trpc.business.setMode.useMutation({
    onSuccess: () => {
      utils.business.mine.invalidate();
      toast.success("Mode aplikasi berhasil diubah");
    },
    onError: (err: any) => toast.error(err.message || "Gagal mengubah mode"),
  });
  const toggleDebtMut = trpc.business.toggleDebt.useMutation({
    onSuccess: () => { utils.business.mine.invalidate(); toast.success("Pengaturan hutang piutang diperbarui!"); },
    onError: (e: any) => toast.error(e.message),
  });
  const togglePosMut = trpc.business.togglePos.useMutation({
    onSuccess: () => {
      utils.business.mine.invalidate();
      toast.success("Pengaturan POS berhasil diubah");
    },
    onError: (err: any) => toast.error(err.message || "Gagal mengubah POS"),
  });
  const [, setLocation] = useLocation();

  const [form, setForm] = useState<FormState>(defaultForm);
  const [logoUploading, setLogoUploading] = useState(false);
  const [qrisUploading, setQrisUploading] = useState(false);

  useEffect(() => {
    if (business) {
      setForm({
        businessName: business.businessName || "",
        businessType: business.businessType || "retail",
        address: business.address || "",
        phone: business.phone || "",
        npwp: business.npwp || "",
        isPkp: business.isPkp ?? false,
        hasEmployees: business.hasEmployees ?? false,
        employeeCount: business.employeeCount ?? 0,
        annualOmzetEstimate: business.annualOmzetEstimate ?? 0,
        brandColor: business.brandColor || "#6366f1",
        waNumber: business.waNumber || "",
        bankName: business.bankName || "",
        bankAccount: business.bankAccount || "",
        bankHolder: business.bankHolder || "",
        qrisImageUrl: (business as any).qrisImageUrl || "",
        logoUrl: (business as any).logoUrl || "",
      });
    }
  }, [business]);

  const handleUploadImage = useCallback(async (
    file: File,
    fieldName: "logoUrl" | "qrisImageUrl",
    setUploading: (v: boolean) => void
  ) => {
    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar (JPG, PNG, dll)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 5MB");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch("/api/upload-image", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload gagal");
      setForm(prev => ({ ...prev, [fieldName]: data.url }));
      updateBiz.mutate({ [fieldName]: data.url });
      toast.success(fieldName === "logoUrl" ? "Logo berhasil diupload" : "QRIS berhasil diupload");
    } catch (err: any) {
      toast.error(err.message || "Gagal upload");
    } finally {
      setUploading(false);
    }
  }, [updateBiz]);

  const handleSave = useCallback((fields: Record<string, any>) => {
    updateBiz.mutate(fields);
  }, [updateBiz]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const isPro = business?.plan === "pro";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan</h1>
        <p className="text-sm text-muted-foreground">Kelola profil bisnis, branding, dan konfigurasi pajak</p>
      </div>

      <Tabs defaultValue={(() => {
        const params = new URLSearchParams(window.location.search);
        return params.get("tab") || "mode";
      })()} className="w-full">
        <TabsList className="w-full sm:w-auto flex-wrap">
          <TabsTrigger value="mode" className="gap-1.5"><Settings2 className="h-3.5 w-3.5" /> Mode</TabsTrigger>
          <TabsTrigger value="profil" className="gap-1.5"><Building2 className="h-3.5 w-3.5" /> Profil</TabsTrigger>
          <TabsTrigger value="pajak" className="gap-1.5"><Receipt className="h-3.5 w-3.5" /> Pajak</TabsTrigger>
          <TabsTrigger value="branding" className="gap-1.5"><Palette className="h-3.5 w-3.5" /> Branding</TabsTrigger>
          <TabsTrigger value="bank" className="gap-1.5"><CreditCard className="h-3.5 w-3.5" /> Bank</TabsTrigger>
          <TabsTrigger value="qris" className="gap-1.5"><QrCode className="h-3.5 w-3.5" /> QRIS</TabsTrigger>
          <TabsTrigger value="paket" className="gap-1.5"><Crown className="h-3.5 w-3.5" /> Paket</TabsTrigger>
          <TabsTrigger value="kategori" className="gap-1.5"><Tag className="h-3.5 w-3.5" /> Kategori</TabsTrigger>
          <TabsTrigger value="invoice" className="gap-1.5"><FileSignature className="h-3.5 w-3.5" /> Invoice</TabsTrigger>
          <TabsTrigger value="team" className="gap-1.5"><Users2 className="h-3.5 w-3.5" /> Pegawai</TabsTrigger>
        </TabsList>

        {/* ─── Mode ─── */}
        <TabsContent value="mode" className="mt-4 space-y-4">
          <Card className="border-0 shadow-md shadow-black/5">
            <CardHeader>
              <CardTitle className="text-base">Mode Aplikasi</CardTitle>
              <CardDescription>Pilih mode yang sesuai dengan kebutuhan Anda. Sidebar dan fitur akan menyesuaikan otomatis.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                <button
                  onClick={() => setModeMut.mutate({ appMode: "personal" })}
                  className={`text-left rounded-xl border-2 p-4 transition-all ${
                    business?.appMode === "personal"
                      ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10"
                      : "border-transparent bg-muted/50 hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                      business?.appMode === "personal" ? "bg-gradient-to-br from-emerald-400 to-teal-500" : "bg-muted"
                    }`}>
                      <BookOpen className={`h-5 w-5 ${business?.appMode === "personal" ? "text-white" : "text-muted-foreground"}`} />
                    </div>
                    <div>
                      <p className="font-bold text-sm">Jurnal Keuangan Pribadi</p>
                      <p className="text-xs text-muted-foreground">Tampilan sederhana untuk catatan keuangan pribadi</p>
                    </div>
                    {business?.appMode === "personal" && <Check className="h-5 w-5 text-emerald-500 ml-auto" />}
                  </div>
                </button>
                <button
                  onClick={() => setModeMut.mutate({ appMode: "umkm" })}
                  className={`text-left rounded-xl border-2 p-4 transition-all ${
                    business?.appMode === "umkm" || !business?.appMode
                      ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/10"
                      : "border-transparent bg-muted/50 hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                      business?.appMode === "umkm" || !business?.appMode ? "bg-gradient-to-br from-[#1E4D9B] to-[#2563EB]" : "bg-muted"
                    }`}>
                      <Store className={`h-5 w-5 ${business?.appMode === "umkm" || !business?.appMode ? "text-white" : "text-muted-foreground"}`} />
                    </div>
                    <div>
                      <p className="font-bold text-sm">UMKM / Bisnis</p>
                      <p className="text-xs text-muted-foreground">Fitur lengkap: stok, transaksi, pajak, laporan, POS</p>
                    </div>
                    {(business?.appMode === "umkm" || !business?.appMode) && <Check className="h-5 w-5 text-blue-500 ml-auto" />}
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* POS Toggle — only for UMKM */}
          {(business?.appMode === "umkm" || !business?.appMode) && (
            <Card className="border-0 shadow-md shadow-black/5">
              <CardHeader>
                <CardTitle className="text-base">Sistem POS (Kasir)</CardTitle>
                <CardDescription>Aktifkan untuk menampilkan fitur kasir POS di sidebar dan dashboard</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between rounded-xl bg-muted/50 p-4">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                      business?.posEnabled ? "bg-gradient-to-br from-amber-400 to-orange-500" : "bg-muted"
                    }`}>
                      <ShoppingBag className={`h-5 w-5 ${business?.posEnabled ? "text-white" : "text-muted-foreground"}`} />
                    </div>
                    <div>
                      <p className="font-medium text-sm">POS Kasir</p>
                      <p className="text-xs text-muted-foreground">{business?.posEnabled ? "Aktif — menu kasir tersedia" : "Nonaktif — menu kasir tersembunyi"}</p>
                    </div>
                  </div>
                  <Switch
                    checked={business?.posEnabled ?? false}
                    onCheckedChange={(v) => togglePosMut.mutate({ posEnabled: v })}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Hutang Piutang Toggle - Personal Mode Only */}
          {business?.appMode === "personal" && (
            <Card className="border-0 shadow-md shadow-black/5">
              <CardHeader>
                <CardTitle className="text-base">Hutang & Piutang</CardTitle>
                <CardDescription>Aktifkan untuk menampilkan fitur pencatatan hutang dan piutang di sidebar</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between rounded-xl bg-muted/50 p-4">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                      business?.debtEnabled ? "bg-gradient-to-br from-red-400 to-rose-500" : "bg-muted"
                    }`}>
                      <Receipt className={`h-5 w-5 ${business?.debtEnabled ? "text-white" : "text-muted-foreground"}`} />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Hutang & Piutang</p>
                      <p className="text-xs text-muted-foreground">{business?.debtEnabled ? "Aktif — menu hutang piutang tersedia" : "Nonaktif — menu hutang piutang tersembunyi"}</p>
                    </div>
                  </div>
                  <Switch
                    checked={business?.debtEnabled ?? false}
                    onCheckedChange={(v) => toggleDebtMut.mutate({ debtEnabled: v })}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ─── Profil ─── */}
        <TabsContent value="profil" className="mt-4">
          <Card className="border-0 shadow-md shadow-black/5">
            <CardHeader>
              <CardTitle className="text-base">Profil Bisnis</CardTitle>
              <CardDescription>Informasi dasar bisnis Anda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Nama Bisnis</Label>
                  <Input
                    value={form.businessName}
                    onChange={(e) => setForm(prev => ({ ...prev, businessName: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Tipe Bisnis</Label>
                  <Select
                    value={form.businessType}
                    onValueChange={(v) => setForm(prev => ({ ...prev, businessType: v }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {BUSINESS_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Alamat</Label>
                <Input
                  value={form.address}
                  onChange={(e) => setForm(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Nomor Telepon</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <Button
                onClick={() => handleSave({
                  businessName: form.businessName,
                  businessType: form.businessType,
                  address: form.address,
                  phone: form.phone,
                })}
                disabled={updateBiz.isPending}
              >
                {updateBiz.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Menyimpan...</> : "Simpan"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Pajak ─── */}
        <TabsContent value="pajak" className="mt-4">
          <Card className="border-0 shadow-md shadow-black/5">
            <CardHeader>
              <CardTitle className="text-base">Konfigurasi Pajak</CardTitle>
              <CardDescription>Sesuaikan profil pajak bisnis Anda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>NPWP</Label>
                <Input
                  value={form.npwp}
                  onChange={(e) => setForm(prev => ({ ...prev, npwp: e.target.value }))}
                  placeholder="00.000.000.0-000.000"
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium text-sm">Status PKP</p>
                  <p className="text-xs text-muted-foreground">Pengusaha Kena Pajak (wajib PPN)</p>
                </div>
                <Switch
                  checked={form.isPkp}
                  onCheckedChange={(v) => setForm(prev => ({ ...prev, isPkp: v }))}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium text-sm">Memiliki Karyawan</p>
                  <p className="text-xs text-muted-foreground">Untuk perhitungan PPh 21</p>
                </div>
                <Switch
                  checked={form.hasEmployees}
                  onCheckedChange={(v) => setForm(prev => ({ ...prev, hasEmployees: v }))}
                />
              </div>
              {form.hasEmployees && (
                <div className="space-y-1.5">
                  <Label>Jumlah Karyawan</Label>
                  <Input
                    type="number"
                    value={form.employeeCount}
                    onChange={(e) => setForm(prev => ({ ...prev, employeeCount: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <Label>Estimasi Omzet Tahunan (Rp)</Label>
                <Input
                  type="number"
                  value={form.annualOmzetEstimate}
                  onChange={(e) => setForm(prev => ({ ...prev, annualOmzetEstimate: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <Button
                onClick={() => handleSave({
                  npwp: form.npwp,
                  isPkp: form.isPkp,
                  hasEmployees: form.hasEmployees,
                  employeeCount: form.employeeCount,
                  annualOmzetEstimate: form.annualOmzetEstimate,
                })}
                disabled={updateBiz.isPending}
              >
                {updateBiz.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Menyimpan...</> : "Simpan"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Branding ─── */}
        <TabsContent value="branding" className="mt-4">
          <Card className="border-0 shadow-md shadow-black/5">
            <CardHeader>
              <CardTitle className="text-base">Branding</CardTitle>
              <CardDescription>Sesuaikan tampilan aplikasi dan logo bisnis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Logo Upload */}
              <div className="space-y-2">
                <Label>Logo Bisnis</Label>
                <p className="text-xs text-muted-foreground">Logo akan ditampilkan di invoice dan laporan</p>
                {form.logoUrl ? (
                  <div className="space-y-3">
                    <div className="relative mx-auto w-fit">
                      <div className="rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 p-4">
                        <img src={form.logoUrl} alt="Logo" className="h-20 w-auto" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <label className="flex-1 cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUploadImage(file, "logoUrl", setLogoUploading);
                            e.target.value = "";
                          }}
                        />
                        <Button variant="outline" size="sm" className="w-full gap-2" asChild disabled={logoUploading}>
                          <span>
                            {logoUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                            Ganti Logo
                          </span>
                        </Button>
                      </label>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 text-destructive hover:text-destructive"
                        onClick={() => {
                          setForm(prev => ({ ...prev, logoUrl: "" }));
                          updateBiz.mutate({ logoUrl: "" });
                          toast.success("Logo berhasil dihapus");
                        }}
                      >
                        <Trash2 className="h-4 w-4" /> Hapus
                      </Button>
                    </div>
                  </div>
                ) : (
                  <label className="cursor-pointer block">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadImage(file, "logoUrl", setLogoUploading);
                        e.target.value = "";
                      }}
                    />
                    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 hover:border-primary/50 transition-colors">
                      {logoUploading ? (
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
                      ) : (
                        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      )}
                      <p className="text-sm font-medium">Klik untuk upload logo</p>
                      <p className="text-xs text-muted-foreground mt-1">JPG, PNG, maks 5MB</p>
                    </div>
                  </label>
                )}
              </div>

              {/* Brand Color */}
              <div className="space-y-1.5">
                <Label>Warna Utama</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.brandColor}
                    onChange={(e) => setForm(prev => ({ ...prev, brandColor: e.target.value }))}
                    className="h-10 w-14 rounded-lg border cursor-pointer"
                  />
                  <Input
                    value={form.brandColor}
                    onChange={(e) => setForm(prev => ({ ...prev, brandColor: e.target.value }))}
                    className="w-32"
                  />
                </div>
              </div>

              {/* Preview */}
              <div className="rounded-xl border p-4">
                <p className="text-xs text-muted-foreground mb-2">Preview</p>
                <div className="flex items-center gap-3">
                  {form.logoUrl ? (
                    <img src={form.logoUrl} alt="Logo" className="h-10 w-10 rounded-lg object-contain" />
                  ) : (
                    <div className="h-10 w-10 rounded-lg" style={{ backgroundColor: form.brandColor }} />
                  )}
                  <div>
                    <p className="font-semibold text-sm" style={{ color: form.brandColor }}>
                      {form.businessName || "Nama Bisnis"}
                    </p>
                    <p className="text-xs text-muted-foreground">Powered by County</p>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => handleSave({ brandColor: form.brandColor, logoUrl: form.logoUrl })}
                disabled={updateBiz.isPending}
              >
                {updateBiz.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Menyimpan...</> : "Simpan"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Bank ─── */}
        <TabsContent value="bank" className="mt-4">
          <Card className="border-0 shadow-md shadow-black/5">
            <CardHeader>
              <CardTitle className="text-base">Informasi Bank & Notifikasi</CardTitle>
              <CardDescription>Untuk laporan dan notifikasi pajak</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Nama Bank</Label>
                  <Input
                    value={form.bankName}
                    onChange={(e) => setForm(prev => ({ ...prev, bankName: e.target.value }))}
                    placeholder="BCA, Mandiri, BRI..."
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Nomor Rekening</Label>
                  <Input
                    value={form.bankAccount}
                    onChange={(e) => setForm(prev => ({ ...prev, bankAccount: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Nama Pemilik Rekening</Label>
                <Input
                  value={form.bankHolder}
                  onChange={(e) => setForm(prev => ({ ...prev, bankHolder: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Nomor WhatsApp Notifikasi</Label>
                <Input
                  value={form.waNumber}
                  onChange={(e) => setForm(prev => ({ ...prev, waNumber: e.target.value }))}
                  placeholder="628xxxxxxxxxx"
                />
              </div>
              <Button
                onClick={() => handleSave({
                  bankName: form.bankName,
                  bankAccount: form.bankAccount,
                  bankHolder: form.bankHolder,
                  waNumber: form.waNumber,
                })}
                disabled={updateBiz.isPending}
              >
                {updateBiz.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Menyimpan...</> : "Simpan"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── QRIS ─── */}
        <TabsContent value="qris" className="mt-4">
          <Card className="border-0 shadow-md shadow-black/5">
            <CardHeader>
              <CardTitle className="text-base">QRIS Pembayaran</CardTitle>
              <CardDescription>Upload QR code QRIS untuk menerima pembayaran dari pelanggan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {form.qrisImageUrl ? (
                <div className="space-y-4">
                  <div className="relative mx-auto w-fit">
                    <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-4">
                      <img
                        src={form.qrisImageUrl}
                        alt="QRIS QR Code"
                        className="max-w-[280px] max-h-[280px] rounded-lg mx-auto"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadImage(file, "qrisImageUrl", setQrisUploading);
                          e.target.value = "";
                        }}
                      />
                      <Button variant="outline" size="sm" className="gap-2" asChild disabled={qrisUploading}>
                        <span>
                          {qrisUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                          Ganti QRIS
                        </span>
                      </Button>
                    </label>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 text-destructive hover:text-destructive"
                      onClick={() => {
                        setForm(prev => ({ ...prev, qrisImageUrl: "" }));
                        updateBiz.mutate({ qrisImageUrl: "" });
                        toast.success("QRIS berhasil dihapus");
                      }}
                    >
                      <Trash2 className="h-4 w-4" /> Hapus
                    </Button>
                  </div>
                  <div className="rounded-xl bg-muted/50 p-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      QRIS ini akan ditampilkan di halaman Kasir (POS) saat pelanggan memilih pembayaran QRIS.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <QrCode className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium mb-1">Belum ada QRIS</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload gambar QR code QRIS Anda untuk menerima pembayaran digital
                  </p>
                  <label className="cursor-pointer inline-block">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadImage(file, "qrisImageUrl", setQrisUploading);
                        e.target.value = "";
                      }}
                    />
                    <Button className="gap-2" asChild disabled={qrisUploading}>
                      <span>
                        {qrisUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        Upload QRIS
                      </span>
                    </Button>
                  </label>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Paket ─── */}
        <TabsContent value="paket" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Free */}
            <Card className={`border-0 shadow-md shadow-black/5 ${!isPro ? "ring-2 ring-primary/30" : ""}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Free</CardTitle>
                  {!isPro && <Badge>Aktif</Badge>}
                </div>
                <CardDescription>Untuk memulai</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>{PLAN_LIMITS.free.maxTransactions} transaksi</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>{PLAN_LIMITS.free.maxProducts} produk</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>AI Scan Struk & Insights</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Export laporan tidak tersedia</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pro */}
            <Card className={`border-0 shadow-md shadow-black/5 ${isPro ? "ring-2 ring-amber-400" : ""}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Crown className="h-5 w-5 text-amber-500" /> Pro
                  </CardTitle>
                  {isPro && <Badge className="bg-amber-500 text-white">Aktif</Badge>}
                </div>
                <CardDescription>{formatRupiah(PRO_PRICE)} sekali beli</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-amber-500" />
                    <span className="font-medium">Unlimited transaksi</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-amber-500" />
                    <span className="font-medium">Unlimited produk</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-amber-500" />
                    <span>Semua fitur AI</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-amber-500" />
                    <span>Export laporan</span>
                  </div>
                </div>
                {!isPro && (
                  <Button
                    className="w-full gap-2 shadow-lg shadow-primary/20"
                    onClick={() => setLocation("/upgrade")}
                  >
                    <Crown className="h-4 w-4" /> Upgrade ke Pro
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        {/* ─── Kategori Produk ─── */}
        <TabsContent value="kategori" className="mt-4">
          <KategoriProdukTab />
        </TabsContent>

        {/* ─── Invoice Settings ─── */}
        <TabsContent value="invoice" className="mt-4">
          <InvoiceSettingsTab business={business} updateBiz={updateBiz} />
        </TabsContent>

        {/* ─── Pegawai (Team Management) ─── */}
        <TabsContent value="team" className="mt-4">
          <TeamManagementTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function KategoriProdukTab() {
  const utils = trpc.useUtils();
  const { data: categories = [], isLoading } = trpc.category.list.useQuery();
  const createCat = trpc.category.create.useMutation({
    onSuccess: () => { utils.category.list.invalidate(); toast.success("Kategori berhasil ditambahkan"); setAddForm({ name: "", parentId: null }); setAddOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const updateCat = trpc.category.update.useMutation({
    onSuccess: () => { utils.category.list.invalidate(); toast.success("Kategori berhasil diperbarui"); setEditItem(null); },
    onError: (e) => toast.error(e.message),
  });
  const deleteCat = trpc.category.delete.useMutation({
    onSuccess: () => { utils.category.list.invalidate(); toast.success("Kategori berhasil dihapus"); },
    onError: (e) => toast.error(e.message),
  });

  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState<{ name: string; parentId: number | null }>({ name: "", parentId: null });
  const [editItem, setEditItem] = useState<{ id: number; name: string; parentId: number | null } | null>(null);

  // Separate top-level categories and subcategories
  const topLevel = categories.filter((c: any) => !c.parentId);
  const subOf = (parentId: number) => categories.filter((c: any) => c.parentId === parentId);

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-md shadow-black/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Kategori Produk</CardTitle>
              <CardDescription className="text-xs mt-0.5">Buat kategori & sub-kategori untuk mengelompokkan produk Anda</CardDescription>
            </div>
            <Button size="sm" onClick={() => { setAddForm({ name: "", parentId: null }); setAddOpen(true); }}>
              <Plus className="h-4 w-4 mr-1.5" /> Tambah Kategori
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-10 rounded-lg" />)}</div>
          ) : topLevel.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Tag className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">Belum ada kategori</p>
              <p className="text-xs mt-1">Tambahkan kategori untuk mengelompokkan produk Anda</p>
            </div>
          ) : (
            <div className="space-y-2">
              {topLevel.map((cat: any) => (
                <div key={cat.id} className="border rounded-lg overflow-hidden">
                  {/* Top-level category row */}
                  <div className="flex items-center justify-between px-3 py-2.5 bg-muted/30">
                    <div className="flex items-center gap-2">
                      <Tag className="h-3.5 w-3.5 text-primary" />
                      {editItem?.id === cat.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editItem!.name}
                            onChange={(e) => setEditItem(prev => prev ? { ...prev, name: e.target.value } : null)}
                            className="h-7 text-sm w-40"
                            autoFocus
                          />
                          <Button size="sm" className="h-7 px-2" onClick={() => updateCat.mutate({ id: editItem!.id, name: editItem!.name })} disabled={updateCat.isPending}>
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setEditItem(null)}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <span className="font-medium text-sm">{cat.name}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => { setAddForm({ name: "", parentId: cat.id }); setAddOpen(true); }}>
                        <Plus className="h-3 w-3 mr-1" /> Sub
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setEditItem({ id: cat.id, name: cat.name, parentId: null })}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive hover:text-destructive" onClick={() => {
                        if (confirm(`Hapus kategori "${cat.name}" dan semua sub-kategorinya?`)) deleteCat.mutate({ id: cat.id });
                      }}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  {/* Subcategories */}
                  {subOf(cat.id).map((sub: any) => (
                    <div key={sub.id} className="flex items-center justify-between px-3 py-2 border-t bg-white dark:bg-card">
                      <div className="flex items-center gap-2 pl-4">
                        <ChevronRight className="h-3 w-3 text-muted-foreground" />
                        {editItem?.id === sub.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={editItem!.name}
                              onChange={(e) => setEditItem(prev => prev ? { ...prev, name: e.target.value } : null)}
                              className="h-7 text-sm w-36"
                              autoFocus
                            />
                            <Button size="sm" className="h-7 px-2" onClick={() => updateCat.mutate({ id: editItem!.id, name: editItem!.name })} disabled={updateCat.isPending}>
                              <Check className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setEditItem(null)}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">{sub.name}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setEditItem({ id: sub.id, name: sub.name, parentId: cat.id })}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive hover:text-destructive" onClick={() => {
                          if (confirm(`Hapus sub-kategori "${sub.name}"?`)) deleteCat.mutate({ id: sub.id });
                        }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Category / Subcategory Dialog */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setAddOpen(false)}>
          <div className="bg-background rounded-xl shadow-xl p-6 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-base mb-4">
              {addForm.parentId ? `Tambah Sub-kategori` : "Tambah Kategori"}
              {addForm.parentId && (
                <span className="text-muted-foreground font-normal text-sm ml-1">
                  — {categories.find((c: any) => c.id === addForm.parentId)?.name}
                </span>
              )}
            </h3>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{addForm.parentId ? "Nama Sub-kategori" : "Nama Kategori"} *</Label>
                <Input
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  placeholder={addForm.parentId ? "Contoh: Baju Batik" : "Contoh: Pakaian"}
                  autoFocus
                  onKeyDown={(e) => { if (e.key === "Enter" && addForm.name) createCat.mutate(addForm); }}
                />
              </div>
              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1" onClick={() => setAddOpen(false)}>Batal</Button>
                <Button className="flex-1" disabled={!addForm.name || createCat.isPending} onClick={() => createCat.mutate(addForm)}>
                  {createCat.isPending ? "Menyimpan..." : "Simpan"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InvoiceSettingsTab({ business, updateBiz }: { business: any; updateBiz: any }) {
  const [invoiceFooter, setInvoiceFooter] = useState(business?.invoiceFooter || "");
  const [signatureUrl, setSignatureUrl] = useState(business?.signatureUrl || "");
  const [calculatorEnabled, setCalculatorEnabled] = useState(business?.calculatorEnabled ?? true);
  const [sigUploading, setSigUploading] = useState(false);

  useEffect(() => {
    if (business) {
      setInvoiceFooter(business.invoiceFooter || "");
      setSignatureUrl(business.signatureUrl || "");
      setCalculatorEnabled(business.calculatorEnabled ?? true);
    }
  }, [business]);

  const handleUploadSignature = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 5MB");
      return;
    }
    setSigUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch("/api/upload-image", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload gagal");
      setSignatureUrl(data.url);
      updateBiz.mutate({ signatureUrl: data.url });
      toast.success("Tanda tangan berhasil diupload");
    } catch (err: any) {
      toast.error(err.message || "Gagal upload");
    } finally {
      setSigUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Invoice Footer */}
      <Card className="border-0 shadow-md shadow-black/5">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileSignature className="h-4 w-4" /> Footer Invoice
          </CardTitle>
          <CardDescription>Teks yang ditampilkan di bagian bawah invoice/struk</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Teks Footer</Label>
            <textarea
              value={invoiceFooter}
              onChange={(e) => setInvoiceFooter(e.target.value)}
              placeholder="Contoh: Terima kasih atas kepercayaan Anda. Barang yang sudah dibeli tidak dapat dikembalikan."
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <Button
            onClick={() => updateBiz.mutate({ invoiceFooter })}
            disabled={updateBiz.isPending}
          >
            {updateBiz.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Menyimpan...</> : "Simpan Footer"}
          </Button>
        </CardContent>
      </Card>

      {/* Signature Upload */}
      <Card className="border-0 shadow-md shadow-black/5">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileSignature className="h-4 w-4" /> Tanda Tangan Digital
          </CardTitle>
          <CardDescription>Upload tanda tangan untuk ditampilkan di invoice</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {signatureUrl ? (
            <div className="space-y-3">
              <div className="rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 p-4 text-center">
                <img src={signatureUrl} alt="Tanda Tangan" className="h-16 mx-auto" />
              </div>
              <div className="flex gap-2">
                <label className="flex-1 cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUploadSignature(file);
                      e.target.value = "";
                    }}
                  />
                  <Button variant="outline" size="sm" className="w-full gap-2" asChild disabled={sigUploading}>
                    <span>
                      {sigUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      Ganti Tanda Tangan
                    </span>
                  </Button>
                </label>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 text-destructive hover:text-destructive"
                  onClick={() => {
                    setSignatureUrl("");
                    updateBiz.mutate({ signatureUrl: "" });
                    toast.success("Tanda tangan berhasil dihapus");
                  }}
                >
                  <Trash2 className="h-4 w-4" /> Hapus
                </Button>
              </div>
            </div>
          ) : (
            <label className="cursor-pointer block">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUploadSignature(file);
                  e.target.value = "";
                }}
              />
              <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 hover:border-primary/50 transition-colors">
                {sigUploading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
                ) : (
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                )}
                <p className="text-sm font-medium">Klik untuk upload tanda tangan</p>
                <p className="text-xs text-muted-foreground mt-1">PNG transparan direkomendasikan</p>
              </div>
            </label>
          )}
        </CardContent>
      </Card>

      {/* Calculator Toggle */}
      <Card className="border-0 shadow-md shadow-black/5">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calculator className="h-4 w-4" /> Kalkulator Cepat
          </CardTitle>
          <CardDescription>Tampilkan widget kalkulator floating di semua halaman</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Aktifkan Kalkulator</p>
              <p className="text-xs text-muted-foreground">Widget kalkulator akan muncul di pojok kanan bawah</p>
            </div>
            <Switch
              checked={calculatorEnabled}
              onCheckedChange={(checked) => {
                setCalculatorEnabled(checked);
                updateBiz.mutate({ calculatorEnabled: checked });
              }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Role labels & icons ───
const ROLE_DISPLAY: Record<string, { label: string; color: string; icon: any }> = {
  owner: { label: "Owner", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300", icon: Crown },
  manager: { label: "Manager", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300", icon: Shield },
  kasir: { label: "Kasir", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300", icon: ShoppingCart },
  gudang: { label: "Gudang", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300", icon: Warehouse },
  viewer: { label: "Viewer", color: "bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300", icon: Eye },
};

function TeamManagementTab() {
  const utils = trpc.useUtils();
  const { data: members = [], isLoading: membersLoading } = trpc.team.list.useQuery();
  const { data: invites = [], isLoading: invitesLoading } = trpc.team.invites.useQuery();
  const { data: roleData } = trpc.team.rolePermissions.useQuery();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"manager" | "kasir" | "gudang" | "viewer">("kasir");
  const [customPerms, setCustomPerms] = useState<Record<string, boolean>>({});
  const [useCustomPerms, setUseCustomPerms] = useState(false);
  const [editMember, setEditMember] = useState<any>(null);
  const [editRole, setEditRole] = useState<string>("");
  const [editPerms, setEditPerms] = useState<Record<string, boolean>>({});

  const inviteMut = trpc.team.invite.useMutation({
    onSuccess: (data) => {
      utils.team.invites.invalidate();
      const inviteUrl = `${window.location.origin}/accept-invite?token=${data.token}`;
      navigator.clipboard.writeText(inviteUrl).then(() => {
        toast.success("Undangan berhasil dibuat! Link sudah dicopy ke clipboard.");
      }).catch(() => {
        toast.success("Undangan berhasil dibuat!");
      });
      setInviteOpen(false);
      setInviteEmail("");
      setInviteRole("kasir");
      setUseCustomPerms(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const cancelInviteMut = trpc.team.cancelInvite.useMutation({
    onSuccess: () => { utils.team.invites.invalidate(); toast.success("Undangan dibatalkan"); },
    onError: (err) => toast.error(err.message),
  });

  const updateMemberMut = trpc.team.updateMember.useMutation({
    onSuccess: () => { utils.team.list.invalidate(); toast.success("Anggota tim berhasil diupdate"); setEditMember(null); },
    onError: (err) => toast.error(err.message),
  });

  const removeMemberMut = trpc.team.removeMember.useMutation({
    onSuccess: () => { utils.team.list.invalidate(); toast.success("Anggota berhasil dihapus dari tim"); },
    onError: (err) => toast.error(err.message),
  });

  // When invite role changes, update default permissions
  useEffect(() => {
    if (roleData && !useCustomPerms) {
      setCustomPerms(roleData.roles[inviteRole] ?? {});
    }
  }, [inviteRole, roleData, useCustomPerms]);

  // When editing a member, populate form
  useEffect(() => {
    if (editMember) {
      setEditRole(editMember.role);
      setEditPerms(editMember.permissions ?? {});
    }
  }, [editMember]);

  const permLabels = roleData?.labels ?? {};
  const rolePerms = roleData?.roles ?? {};

  const pendingInvites = invites.filter((i: any) => i.status === "pending");
  const acceptedInvites = invites.filter((i: any) => i.status === "accepted");

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-0 shadow-md shadow-black/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Users2 className="h-4 w-4" /> Manajemen Tim
              </CardTitle>
              <CardDescription>Tambah karyawan dan atur akses fitur mereka</CardDescription>
            </div>
            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5">
                  <UserPlus className="h-4 w-4" /> Undang Karyawan
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Undang Karyawan Baru</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Email Karyawan *</Label>
                    <Input
                      type="email"
                      placeholder="karyawan@email.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                    <p className="text-[10px] text-muted-foreground">Karyawan harus login dengan email ini untuk menerima undangan</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Role / Jabatan</Label>
                    <Select value={inviteRole} onValueChange={(v) => { setInviteRole(v as any); setUseCustomPerms(false); }}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manager">Manager — Akses hampir semua fitur</SelectItem>
                        <SelectItem value="kasir">Kasir — Hanya POS & Transaksi</SelectItem>
                        <SelectItem value="gudang">Gudang — Hanya Stok & Gudang</SelectItem>
                        <SelectItem value="viewer">Viewer — Hanya lihat Dashboard & Laporan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Default permissions for selected role */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Hak Akses</Label>
                      <button
                        className="text-[10px] text-primary hover:underline"
                        onClick={() => {
                          setUseCustomPerms(!useCustomPerms);
                          if (!useCustomPerms) setCustomPerms(rolePerms[inviteRole] ?? {});
                        }}
                      >
                        {useCustomPerms ? "Reset ke default role" : "Kustomisasi"}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(permLabels).map(([key, label]) => {
                        if (key === "team") return null; // team management only for owner
                        const checked = useCustomPerms ? (customPerms[key] ?? false) : (rolePerms[inviteRole]?.[key] ?? false);
                        return (
                          <label key={key} className={`flex items-center gap-2 rounded-lg border p-2 text-xs cursor-pointer transition-colors ${checked ? "bg-primary/5 border-primary/30" : "bg-muted/30"}`}>
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={!useCustomPerms}
                              onChange={(e) => {
                                if (useCustomPerms) setCustomPerms(prev => ({ ...prev, [key]: e.target.checked }));
                              }}
                              className="rounded"
                            />
                            <span>{label as string}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    disabled={inviteMut.isPending || !inviteEmail}
                    onClick={() => {
                      inviteMut.mutate({
                        email: inviteEmail,
                        role: inviteRole,
                        permissions: useCustomPerms ? customPerms : undefined,
                      });
                    }}
                  >
                    {inviteMut.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Mengirim...</> : <><Mail className="h-4 w-4 mr-2" /> Buat Undangan</>}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Active Members */}
      <Card className="border-0 shadow-md shadow-black/5">
        <CardHeader>
          <CardTitle className="text-sm">Anggota Tim Aktif</CardTitle>
        </CardHeader>
        <CardContent>
          {membersLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users2 className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Belum ada anggota tim</p>
              <p className="text-xs mt-1">Klik "Undang Karyawan" untuk menambah anggota</p>
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((m: any) => {
                const rd = ROLE_DISPLAY[m.role] || ROLE_DISPLAY.viewer;
                const RoleIcon = rd.icon;
                return (
                  <div key={m.id} className="flex items-center justify-between rounded-xl border p-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                        {(m.userName || "?")[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{m.userName}</p>
                        <p className="text-xs text-muted-foreground">{m.userEmail}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-[10px] ${rd.color}`}>
                        <RoleIcon className="h-3 w-3 mr-1" />
                        {rd.label}
                      </Badge>
                      {m.status === "suspended" && (
                        <Badge variant="destructive" className="text-[10px]">Suspended</Badge>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditMember(m)}>
                            <Settings2 className="h-4 w-4 mr-2" /> Edit Role & Akses
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              updateMemberMut.mutate({
                                memberId: m.id,
                                status: m.status === "active" ? "suspended" : "active",
                              });
                            }}
                          >
                            {m.status === "active" ? (
                              <><X className="h-4 w-4 mr-2" /> Suspend</>
                            ) : (
                              <><Check className="h-4 w-4 mr-2" /> Aktifkan</>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              if (confirm(`Hapus ${m.userName} dari tim?`)) {
                                removeMemberMut.mutate({ memberId: m.id });
                              }
                            }}
                          >
                            <UserMinus className="h-4 w-4 mr-2" /> Hapus dari Tim
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Member Dialog */}
      <Dialog open={!!editMember} onOpenChange={(open) => { if (!open) setEditMember(null); }}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Anggota: {editMember?.userName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Role</Label>
              <Select value={editRole} onValueChange={(v) => { setEditRole(v); setEditPerms(rolePerms[v] ?? {}); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="kasir">Kasir</SelectItem>
                  <SelectItem value="gudang">Gudang</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Hak Akses</Label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(permLabels).map(([key, label]) => {
                  if (key === "team") return null;
                  const checked = editPerms[key] ?? false;
                  return (
                    <label key={key} className={`flex items-center gap-2 rounded-lg border p-2 text-xs cursor-pointer transition-colors ${checked ? "bg-primary/5 border-primary/30" : "bg-muted/30"}`}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => setEditPerms(prev => ({ ...prev, [key]: e.target.checked }))}
                        className="rounded"
                      />
                      <span>{label as string}</span>
                    </label>
                  );
                })}
              </div>
            </div>
            <Button
              className="w-full"
              disabled={updateMemberMut.isPending}
              onClick={() => {
                if (editMember) {
                  updateMemberMut.mutate({
                    memberId: editMember.id,
                    role: editRole as any,
                    permissions: editPerms,
                  });
                }
              }}
            >
              {updateMemberMut.isPending ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pending Invites */}
      {(pendingInvites.length > 0 || invitesLoading) && (
        <Card className="border-0 shadow-md shadow-black/5">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" /> Undangan Menunggu
            </CardTitle>
          </CardHeader>
          <CardContent>
            {invitesLoading ? (
              <Skeleton className="h-12" />
            ) : (
              <div className="space-y-2">
                {pendingInvites.map((inv: any) => {
                  const rd = ROLE_DISPLAY[inv.role] || ROLE_DISPLAY.viewer;
                  return (
                    <div key={inv.id} className="flex items-center justify-between rounded-lg border border-dashed p-3">
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{inv.email}</p>
                          <p className="text-[10px] text-muted-foreground">
                            Expires: {new Date(inv.expiresAt).toLocaleDateString("id-ID")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`text-[10px] ${rd.color}`}>{rd.label}</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => {
                            const inviteUrl = `${window.location.origin}/accept-invite?token=${inv.token}`;
                            navigator.clipboard.writeText(inviteUrl);
                            toast.success("Link undangan dicopy!");
                          }}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          onClick={() => cancelInviteMut.mutate({ id: inv.id })}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* How it works info */}
      <Card className="border-0 shadow-md shadow-black/5 bg-blue-50/50 dark:bg-blue-950/20">
        <CardContent className="p-4">
          <h4 className="font-medium text-sm mb-2">Cara Kerja Multi-Akun</h4>
          <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
            <li>Klik <strong>"Undang Karyawan"</strong> dan masukkan email karyawan</li>
            <li>Pilih <strong>role</strong> (Manager, Kasir, Gudang, atau Viewer)</li>
            <li><strong>Link undangan</strong> otomatis dicopy — kirim ke karyawan via WhatsApp/Email</li>
            <li>Karyawan buka link, <strong>login dengan email yang sama</strong>, dan otomatis bergabung</li>
            <li>Karyawan hanya bisa akses <strong>fitur sesuai izin</strong> yang Anda berikan</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
