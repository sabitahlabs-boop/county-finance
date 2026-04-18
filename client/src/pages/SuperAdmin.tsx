import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useBusinessContext } from "@/contexts/BusinessContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Shield, Building2, Users, Crown, Trash2, AlertTriangle, Link2, Plus, Copy, CheckCircle, Clock, ExternalLink, Loader2, Megaphone, ToggleLeft, ToggleRight, BarChart3, Database, RefreshCw, Sparkles, LogIn } from "lucide-react";
import { toast } from "sonner";

export default function SuperAdmin() {
  const { user } = useAuth();
  const { switchBusiness } = useBusinessContext();
  const utils = trpc.useUtils();
  const { data: businesses, isLoading: bizLoading } = trpc.admin.businesses.useQuery(undefined, { retry: false });
  const { data: users, isLoading: usersLoading } = trpc.admin.users.useQuery(undefined, { retry: false });
  const { data: proLinks, isLoading: linksLoading } = trpc.admin.listProLinks.useQuery(undefined, { retry: false, refetchInterval: 15000 });

  const [deleteConfirm, setDeleteConfirm] = useState<{ userId: number; userName: string } | null>(null);
  const [showGenerate, setShowGenerate] = useState(false);
  const [newLink, setNewLink] = useState({ email: "", buyerName: "", notes: "" });
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  // Affiliate state
  const { data: affiliateList, isLoading: affLoading } = trpc.affiliate.list.useQuery(undefined, { retry: false });
  const [showAddAffiliate, setShowAddAffiliate] = useState(false);
  const [newAffiliate, setNewAffiliate] = useState({ refCode: "", name: "", scalevUrl: "", whatsapp: "" });

  const createAff = trpc.affiliate.create.useMutation({
    onSuccess: () => {
      utils.affiliate.list.invalidate();
      setShowAddAffiliate(false);
      setNewAffiliate({ refCode: "", name: "", scalevUrl: "", whatsapp: "" });
      toast.success("Affiliate berhasil ditambahkan!");
    },
    onError: (err) => toast.error(err.message),
  });

  const toggleAff = trpc.affiliate.update.useMutation({
    onSuccess: () => {
      utils.affiliate.list.invalidate();
      toast.success("Status affiliate diperbarui");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteAff = trpc.affiliate.delete.useMutation({
    onSuccess: () => {
      utils.affiliate.list.invalidate();
      toast.success("Affiliate dihapus");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateBiz = trpc.admin.updateBusiness.useMutation({
    onSuccess: () => {
      utils.admin.businesses.invalidate();
      toast.success("Bisnis diperbarui");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteUser = trpc.admin.deleteUser.useMutation({
    onSuccess: (result) => {
      utils.admin.users.invalidate();
      utils.admin.businesses.invalidate();
      setDeleteConfirm(null);
      toast.success(
        result.deletedBusiness
          ? `Pengguna dan bisnis "${result.deletedBusiness}" berhasil dihapus`
          : "Pengguna berhasil dihapus"
      );
    },
    onError: (err) => toast.error("Gagal menghapus: " + err.message),
  });

  const generateLink = trpc.admin.createProLink.useMutation({
    onSuccess: (data) => {
      utils.admin.listProLinks.invalidate();
      const fullUrl = `${window.location.origin}/pro/${data.token}`;
      setGeneratedLink(fullUrl);
      toast.success("Link Pro berhasil dibuat!");
    },
    onError: (err) => {
      // tRPC wraps Zod errors as JSON array string — parse to show clean message
      try {
        const parsed = JSON.parse(err.message);
        if (Array.isArray(parsed)) {
          const messages = parsed.map((e: any) => e.message).filter(Boolean);
          toast.error(messages.join(", ") || "Validasi gagal");
          return;
        }
      } catch {}
      toast.error(err.message);
    },
  });

  const deleteLinkMut = trpc.admin.deleteProLink.useMutation({
    onSuccess: () => {
      utils.admin.listProLinks.invalidate();
      toast.success("Link dihapus");
    },
    onError: (err) => toast.error(err.message),
  });

  // Dummy data management
  const [selectedBizForDummy, setSelectedBizForDummy] = useState<number | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const seedDummy = trpc.admin.seedDummyData.useMutation({
    onSuccess: (result) => {
      toast.success("Dummy data Sabitah berhasil dibuat! 🎉");
      utils.admin.businesses.invalidate();
    },
    onError: (err) => toast.error("Gagal seed: " + err.message),
  });

  const clearData = trpc.admin.clearBusinessData.useMutation({
    onSuccess: () => {
      toast.success("Semua data bisnis berhasil dihapus");
      setShowClearConfirm(false);
      utils.admin.businesses.invalidate();
    },
    onError: (err) => toast.error("Gagal hapus: " + err.message),
  });

  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center py-20">
        <Card className="max-w-md w-full">
          <CardContent className="py-8 text-center">
            <Shield className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
            <h2 className="font-semibold text-lg">Akses Ditolak</h2>
            <p className="text-sm text-muted-foreground mt-1">Halaman ini hanya untuk Super Admin</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const availableLinks = proLinks?.filter((l: any) => !l.isUsed) ?? [];
  const usedLinks = proLinks?.filter((l: any) => l.isUsed) ?? [];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Link disalin ke clipboard!");
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Super Admin</h1>
        </div>
        <p className="text-sm text-muted-foreground">Kelola tenant, pengguna, dan link aktivasi Pro</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md shadow-black/5">
          <CardContent className="p-4 flex items-center gap-3">
            <Building2 className="h-8 w-8 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Total Bisnis</p>
              <p className="text-2xl font-bold">{businesses?.length ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md shadow-black/5">
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-xs text-muted-foreground">Total Pengguna</p>
              <p className="text-2xl font-bold">{users?.length ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md shadow-black/5">
          <CardContent className="p-4 flex items-center gap-3">
            <Crown className="h-8 w-8 text-amber-500" />
            <div>
              <p className="text-xs text-muted-foreground">Pro / Pro+</p>
              <p className="text-2xl font-bold">
                {businesses?.filter((b: any) => b.plan === "pro").length ?? 0}
                <span className="text-base text-muted-foreground mx-1">/</span>
                {businesses?.filter((b: any) => b.plan === "pro_plus").length ?? 0}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md shadow-black/5">
          <CardContent className="p-4 flex items-center gap-3">
            <Link2 className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-xs text-muted-foreground">Link Tersedia</p>
              <p className="text-2xl font-bold">{availableLinks.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="prolinks">
        <TabsList>
          <TabsTrigger value="prolinks"><Link2 className="h-4 w-4 mr-1.5" /> Link Pro</TabsTrigger>
          <TabsTrigger value="businesses"><Building2 className="h-4 w-4 mr-1.5" /> Bisnis</TabsTrigger>
          <TabsTrigger value="users"><Users className="h-4 w-4 mr-1.5" /> Pengguna</TabsTrigger>
          <TabsTrigger value="affiliates"><Megaphone className="h-4 w-4 mr-1.5" /> Affiliate</TabsTrigger>
          <TabsTrigger value="dummy"><Database className="h-4 w-4 mr-1.5" /> Dummy Data</TabsTrigger>
        </TabsList>

        {/* Pro Links Tab */}
        <TabsContent value="prolinks" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Link Aktivasi Pro</h3>
              <p className="text-xs text-muted-foreground">
                Generate link unik sekali pakai. Kirim ke pembeli via WhatsApp setelah verifikasi pembayaran.
              </p>
            </div>
            <Button
              size="sm"
              className="bg-[#1E4D9B] hover:bg-[#163d7a]"
              onClick={() => {
                setShowGenerate(true);
                setGeneratedLink(null);
                setNewLink({ email: "", buyerName: "", notes: "" });
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Generate Link
            </Button>
          </div>

          {/* How it works */}
          <Card className="border-0 shadow-md shadow-black/5 bg-blue-50 dark:bg-blue-950/30">
            <CardContent className="p-4">
              <p className="text-sm font-semibold text-[#1E4D9B] mb-2">Cara Kerja:</p>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs text-muted-foreground">
                <div className="flex items-start gap-2">
                  <span className="bg-[#1E4D9B] text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shrink-0">1</span>
                  <span>Pembeli bayar di Scalev & kirim bukti via WA</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="bg-[#1E4D9B] text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shrink-0">2</span>
                  <span>Admin verifikasi & klik "Generate Link"</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="bg-[#1E4D9B] text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shrink-0">3</span>
                  <span>Copy link & kirim ke pembeli via WA</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="bg-[#1E4D9B] text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shrink-0">4</span>
                  <span>Pembeli klik link → login → otomatis Pro!</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md shadow-black/5">
            <CardContent className="p-0">
              {linksLoading ? (
                <div className="p-6 space-y-3">
                  {[1, 2, 3].map((i) => (<Skeleton key={i} className="h-12" />))}
                </div>
              ) : !proLinks || proLinks.length === 0 ? (
                <div className="py-12 text-center">
                  <Link2 className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Belum ada link Pro</p>
                  <p className="text-xs text-muted-foreground mt-1">Klik "Generate Link" untuk membuat link aktivasi baru</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="text-left p-3 font-medium">Email Pembeli</th>
                        <th className="text-left p-3 font-medium">Nama</th>
                        <th className="text-left p-3 font-medium">Status</th>
                        <th className="text-left p-3 font-medium">Tanggal</th>
                        <th className="text-left p-3 font-medium">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {proLinks.map((link: any) => (
                        <tr key={link.id} className="border-b last:border-0 hover:bg-muted/20">
                          <td className="p-3">
                            <p className="font-medium text-xs">{link.email}</p>
                            {link.notes && <p className="text-[10px] text-muted-foreground">{link.notes}</p>}
                          </td>
                          <td className="p-3 text-xs">{link.buyerName || "-"}</td>
                          <td className="p-3">
                            {link.isUsed ? (
                              <Badge className="bg-green-100 text-green-700 text-xs">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Terpakai
                              </Badge>
                            ) : (
                              <Badge className="bg-blue-100 text-blue-700 text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                Menunggu
                              </Badge>
                            )}
                          </td>
                          <td className="p-3 text-xs text-muted-foreground">
                            {new Date(link.createdAt).toLocaleDateString("id-ID")}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1">
                              {!link.isUsed && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-[#1E4D9B]"
                                  onClick={() => copyToClipboard(`${window.location.origin}/pro/${link.token}`)}
                                >
                                  <Copy className="h-3.5 w-3.5 mr-1" />
                                  Copy
                                </Button>
                              )}
                              {!link.isUsed && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => deleteLinkMut.mutate({ id: link.id })}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              {link.isUsed && (
                                <span className="text-xs text-muted-foreground">User #{link.usedByUserId}</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="businesses" className="mt-4">
          <Card className="border-0 shadow-md shadow-black/5">
            <CardContent className="p-0">
              {bizLoading ? (
                <div className="p-6 space-y-3">
                  {[1, 2, 3].map((i) => (<Skeleton key={i} className="h-12" />))}
                </div>
              ) : !businesses || businesses.length === 0 ? (
                <div className="py-12 text-center">
                  <Building2 className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Belum ada bisnis terdaftar</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="text-left p-3 font-medium">ID</th>
                        <th className="text-left p-3 font-medium">Nama Bisnis</th>
                        <th className="text-left p-3 font-medium">Slug</th>
                        <th className="text-left p-3 font-medium">Tipe</th>
                        <th className="text-left p-3 font-medium">Paket</th>
                        <th className="text-left p-3 font-medium">PKP</th>
                        <th className="text-left p-3 font-medium">Terdaftar</th>
                        <th className="text-left p-3 font-medium">Owner</th>
                        <th className="text-left p-3 font-medium">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {businesses.map((biz: any) => (
                        <tr key={biz.id} className="border-b last:border-0 hover:bg-muted/20">
                          <td className="p-3 text-muted-foreground">{biz.id}</td>
                          <td className="p-3 font-medium">{biz.businessName}</td>
                          <td className="p-3 font-mono text-xs text-muted-foreground">{biz.slug}</td>
                          <td className="p-3">{biz.businessType}</td>
                          <td className="p-3">
                            <Select
                              value={biz.plan}
                              onValueChange={(v) => updateBiz.mutate({ id: biz.id, plan: v as any })}
                            >
                              <SelectTrigger className="w-24 h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="free">Free</SelectItem>
                                <SelectItem value="pro">Pro</SelectItem>
                                <SelectItem value="pro_plus">Pro+</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="p-3">
                            <Badge variant={biz.isPkp ? "default" : "secondary"} className="text-xs">
                              {biz.isPkp ? "Ya" : "Tidak"}
                            </Badge>
                          </td>
                          <td className="p-3 text-muted-foreground text-xs">
                            {new Date(biz.createdAt).toLocaleDateString("id-ID")}
                          </td>
                          <td className="p-3">
                            <Badge variant="outline" className="text-xs">
                              #{biz.ownerId}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-[#1E4D9B] border-[#1E4D9B]/30 hover:bg-[#1E4D9B]/10"
                              onClick={() => {
                                switchBusiness(biz.id);
                                toast.success(`Masuk ke bisnis "${biz.businessName}"`);
                              }}
                            >
                              <LogIn className="h-3.5 w-3.5 mr-1" />
                              Masuk
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="mt-4">
          <Card className="border-0 shadow-md shadow-black/5">
            <CardContent className="p-0">
              {usersLoading ? (
                <div className="p-6 space-y-3">
                  {[1, 2, 3].map((i) => (<Skeleton key={i} className="h-12" />))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="text-left p-3 font-medium">ID</th>
                        <th className="text-left p-3 font-medium">Nama</th>
                        <th className="text-left p-3 font-medium">Email</th>
                        <th className="text-left p-3 font-medium">Role</th>
                        <th className="text-left p-3 font-medium">Login Terakhir</th>
                        <th className="text-left p-3 font-medium">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users?.map((u: any) => (
                        <tr key={u.id} className="border-b last:border-0 hover:bg-muted/20">
                          <td className="p-3 text-muted-foreground">{u.id}</td>
                          <td className="p-3 font-medium">{u.name || "-"}</td>
                          <td className="p-3 text-muted-foreground">{u.email || "-"}</td>
                          <td className="p-3">
                            <Badge variant={u.role === "admin" ? "default" : "secondary"} className="text-xs">
                              {u.role}
                            </Badge>
                          </td>
                          <td className="p-3 text-muted-foreground text-xs">
                            {new Date(u.lastSignedIn).toLocaleDateString("id-ID")}
                          </td>
                          <td className="p-3">
                            {u.role !== "admin" ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => setDeleteConfirm({ userId: u.id, userName: u.name || u.email || `User #${u.id}` })}
                              >
                                <Trash2 className="h-3.5 w-3.5 mr-1" />
                                Hapus
                              </Button>
                            ) : (
                              <Badge variant="outline" className="text-xs text-muted-foreground">Admin</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Affiliates Tab */}
        <TabsContent value="affiliates" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">Affiliate Program</h3>
              <p className="text-sm text-muted-foreground">Kelola affiliate yang bisa share landing page County</p>
            </div>
            <Button onClick={() => setShowAddAffiliate(true)} size="sm">
              <Plus className="h-4 w-4 mr-1" /> Tambah Affiliate
            </Button>
          </div>

          {affLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>
          ) : !affiliateList?.length ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">
              <Megaphone className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Belum ada affiliate. Klik "Tambah Affiliate" untuk mulai.</p>
            </CardContent></Card>
          ) : (
            <div className="space-y-3">
              {affiliateList.map((aff) => {
                const affLink = `${window.location.origin}/landing?ref=${aff.refCode}`;
                return (
                  <Card key={aff.id} className={!aff.isActive ? "opacity-60" : ""}>
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">{aff.name}</span>
                            <Badge variant={aff.isActive ? "default" : "secondary"}>
                              {aff.isActive ? "Aktif" : "Nonaktif"}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-0.5">
                            <p>Kode: <span className="font-mono font-medium text-foreground">{aff.refCode}</span></p>
                            <p className="truncate">Scalev: <a href={aff.scalevUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{aff.scalevUrl}</a></p>
                            {aff.whatsapp && <p>WA: {aff.whatsapp}</p>}
                            <div className="flex items-center gap-4 mt-1">
                              <span className="flex items-center gap-1"><BarChart3 className="h-3.5 w-3.5" /> {aff.clickCount} klik</span>
                            </div>
                          </div>
                          <div className="mt-2 p-2 bg-muted rounded text-xs font-mono break-all">
                            {affLink}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <Button size="sm" variant="outline" onClick={() => {
                            navigator.clipboard.writeText(affLink);
                            toast.success("Link affiliate disalin!");
                          }}>
                            <Copy className="h-3.5 w-3.5 mr-1" /> Copy
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => toggleAff.mutate({ id: aff.id, isActive: !aff.isActive })}>
                            {aff.isActive ? <><ToggleRight className="h-3.5 w-3.5 mr-1" /> Off</> : <><ToggleLeft className="h-3.5 w-3.5 mr-1" /> On</>}
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => deleteAff.mutate({ id: aff.id })}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Dummy Data Tab */}
        </TabsContent>

        <TabsContent value="dummy" className="mt-4 space-y-4">
          <div>
            <h3 className="font-semibold text-lg">Dummy Data Management</h3>
            <p className="text-sm text-muted-foreground">Seed data Sabitah untuk konten/demo, atau reset data bisnis</p>
          </div>

          <Card className="border-0 shadow-md shadow-black/5 bg-green-50 dark:bg-green-950/30">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-green-700 dark:text-green-400">Seed Dummy Data Sabitah</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Mengisi bisnis dengan data lengkap brand Sabitah (skincare): 15 produk, 8 customer, 3 bulan transaksi, hutang/piutang, tagihan bulanan, anggaran, dan kode diskon.
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <Select
                      value={selectedBizForDummy?.toString() ?? ""}
                      onValueChange={(v) => setSelectedBizForDummy(Number(v))}
                    >
                      <SelectTrigger className="w-64 h-9">
                        <SelectValue placeholder="Pilih bisnis..." />
                      </SelectTrigger>
                      <SelectContent>
                        {businesses?.map((biz: any) => (
                          <SelectItem key={biz.id} value={biz.id.toString()}>
                            {biz.businessName} (#{biz.id})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      disabled={!selectedBizForDummy || seedDummy.isPending}
                      onClick={() => selectedBizForDummy && seedDummy.mutate({ businessId: selectedBizForDummy })}
                    >
                      {seedDummy.isPending ? (
                        <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Seeding...</>
                      ) : (
                        <><Sparkles className="h-4 w-4 mr-1" /> Seed Data Sabitah</>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md shadow-black/5 bg-red-50 dark:bg-red-950/30">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <RefreshCw className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-700 dark:text-red-400">Reset Data Bisnis</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Hapus SEMUA data bisnis (transaksi, produk, stok, klien, hutang, tagihan, anggaran, dll). Bisnis itu sendiri tidak dihapus.
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <Select
                      value={selectedBizForDummy?.toString() ?? ""}
                      onValueChange={(v) => setSelectedBizForDummy(Number(v))}
                    >
                      <SelectTrigger className="w-64 h-9">
                        <SelectValue placeholder="Pilih bisnis..." />
                      </SelectTrigger>
                      <SelectContent>
                        {businesses?.map((biz: any) => (
                          <SelectItem key={biz.id} value={biz.id.toString()}>
                            {biz.businessName} (#{biz.id})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={!selectedBizForDummy || clearData.isPending}
                      onClick={() => selectedBizForDummy && setShowClearConfirm(true)}
                    >
                      {clearData.isPending ? (
                        <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Menghapus...</>
                      ) : (
                        <><Trash2 className="h-4 w-4 mr-1" /> Reset Data</>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Clear Data Confirmation Dialog */}
      <Dialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Reset Semua Data
            </DialogTitle>
            <DialogDescription className="pt-2">
              Anda akan menghapus <strong>semua data</strong> dari bisnis #{selectedBizForDummy}:
              <br /><br />
              <span className="text-destructive font-medium">Yang akan dihapus:</span>
              <ul className="mt-1 text-sm list-disc list-inside space-y-0.5 text-muted-foreground">
                <li>Semua transaksi & POS receipts</li>
                <li>Semua produk, stok & gudang</li>
                <li>Semua klien & hutang/piutang</li>
                <li>Semua tagihan, anggaran & tabungan</li>
                <li>Semua kode diskon & shift POS</li>
              </ul>
              <br />
              <strong className="text-destructive">Bisnis itu sendiri TIDAK dihapus.</strong>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowClearConfirm(false)}>Batal</Button>
            <Button
              variant="destructive"
              disabled={clearData.isPending}
              onClick={() => selectedBizForDummy && clearData.mutate({ businessId: selectedBizForDummy })}
            >
              {clearData.isPending ? "Menghapus..." : "Ya, Reset Semua Data"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Affiliate Dialog */}
      <Dialog open={showAddAffiliate} onOpenChange={setShowAddAffiliate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Affiliate Baru</DialogTitle>
            <DialogDescription>Affiliate akan mendapat link landing page khusus yang mengarahkan tombol beli ke Scalev mereka.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Nama Affiliate *</label>
              <Input placeholder="Jessica" value={newAffiliate.name} onChange={(e) => setNewAffiliate(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium">Kode Referral * <span className="text-muted-foreground font-normal">(huruf kecil, tanpa spasi)</span></label>
              <Input placeholder="jessica123" value={newAffiliate.refCode} onChange={(e) => setNewAffiliate(p => ({ ...p, refCode: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') }))} />
            </div>
            <div>
              <label className="text-sm font-medium">Link Scalev Affiliate *</label>
              <Input placeholder="https://county.myscalev.com/p/county?aff=xxx" value={newAffiliate.scalevUrl} onChange={(e) => setNewAffiliate(p => ({ ...p, scalevUrl: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium">No. WhatsApp <span className="text-muted-foreground font-normal">(opsional)</span></label>
              <Input placeholder="08123456789" value={newAffiliate.whatsapp} onChange={(e) => setNewAffiliate(p => ({ ...p, whatsapp: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddAffiliate(false)}>Batal</Button>
            <Button
              disabled={!newAffiliate.name || !newAffiliate.refCode || !newAffiliate.scalevUrl || createAff.isPending}
              onClick={() => createAff.mutate({
                refCode: newAffiliate.refCode,
                name: newAffiliate.name,
                scalevUrl: newAffiliate.scalevUrl,
                whatsapp: newAffiliate.whatsapp || undefined,
              })}
            >
              {createAff.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
              Tambah
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Hapus Pengguna
            </DialogTitle>
            <DialogDescription className="pt-2">
              Anda akan menghapus <strong>{deleteConfirm?.userName}</strong> beserta semua data bisnisnya secara permanen.
              <br /><br />
              <span className="text-destructive font-medium">Data yang akan dihapus:</span>
              <ul className="mt-1 text-sm list-disc list-inside space-y-0.5 text-muted-foreground">
                <li>Akun pengguna</li>
                <li>Data bisnis & pengaturan</li>
                <li>Semua transaksi</li>
                <li>Semua produk & stok</li>
                <li>Riwayat pajak</li>
                <li>Komposisi produk (HPP)</li>
              </ul>
              <br />
              <strong className="text-destructive">Tindakan ini tidak dapat dibatalkan!</strong>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              disabled={deleteUser.isPending}
              onClick={() => deleteConfirm && deleteUser.mutate({ userId: deleteConfirm.userId })}
            >
              {deleteUser.isPending ? "Menghapus..." : "Ya, Hapus Permanen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate Pro Link Dialog */}
      <Dialog open={showGenerate} onOpenChange={(open) => { if (!open) { setShowGenerate(false); setGeneratedLink(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-[#1E4D9B]" />
              Generate Link Pro
            </DialogTitle>
            <DialogDescription>
              Buat link aktivasi Pro sekali pakai untuk pembeli. Setelah digunakan, link otomatis hangus.
            </DialogDescription>
          </DialogHeader>

          {generatedLink ? (
            <div className="space-y-4 py-2">
              <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="font-semibold text-green-700 dark:text-green-400">Link berhasil dibuat!</p>
                <p className="text-xs text-muted-foreground mt-1">Kirim link ini ke pembeli via WhatsApp</p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Link Aktivasi:</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-background rounded px-2 py-1 flex-1 break-all">{generatedLink}</code>
                  <Button
                    size="sm"
                    className="shrink-0 bg-[#1E4D9B] hover:bg-[#163d7a]"
                    onClick={() => copyToClipboard(generatedLink)}
                  >
                    <Copy className="h-3.5 w-3.5 mr-1" />
                    Copy
                  </Button>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full border-green-500 text-green-600"
                onClick={() => {
                  const waMessage = `Halo! Terima kasih sudah membeli County Pro. Silakan klik link berikut untuk mengaktifkan akun Pro Anda:\n\n${generatedLink}\n\nLink ini hanya bisa digunakan 1x. Setelah klik, login dengan email Anda dan akun akan otomatis menjadi Pro.`;
                  window.open(`https://wa.me/?text=${encodeURIComponent(waMessage)}`, "_blank");
                }}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Kirim via WhatsApp
              </Button>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email Pembeli *</label>
                <Input
                  type="email"
                  placeholder="pembeli@email.com"
                  value={newLink.email}
                  onChange={(e) => setNewLink({ ...newLink, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Nama Pembeli (opsional)</label>
                <Input
                  placeholder="Nama pembeli"
                  value={newLink.buyerName}
                  onChange={(e) => setNewLink({ ...newLink, buyerName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Catatan (opsional)</label>
                <Input
                  placeholder="Contoh: Bayar via BCA, 19 Mar 2026"
                  value={newLink.notes}
                  onChange={(e) => setNewLink({ ...newLink, notes: e.target.value })}
                />
              </div>
            </div>
          )}

          {!generatedLink && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowGenerate(false)}>
                Batal
              </Button>
              <Button
                className="bg-[#1E4D9B] hover:bg-[#163d7a]"
                disabled={generateLink.isPending || !newLink.email.trim()}
                onClick={() => {
                  generateLink.mutate({
                    email: newLink.email.trim(),
                    buyerName: newLink.buyerName.trim() || undefined,
                    notes: newLink.notes.trim() || undefined,
                  });
                }}
              >
                {generateLink.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Generating...</>
                ) : (
                  <><Link2 className="h-4 w-4 mr-1" /> Generate Link</>
                )}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
