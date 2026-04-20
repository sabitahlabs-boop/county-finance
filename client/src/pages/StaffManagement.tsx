import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Crown, Shield, ShoppingBag, Warehouse, Eye, Plus, Trash2, Pencil,
  Mail, Check, X, ToggleRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

type Role = "owner" | "manager" | "kasir" | "gudang" | "viewer";

interface RoleConfig {
  label: string;
  icon: React.ReactNode;
  color: string;
  accentColor: string;
  bgColor: string;
  badgeColor: string;
}

const roleConfigs: Record<Role, RoleConfig> = {
  owner: {
    label: "Pemilik",
    icon: <Crown className="h-5 w-5" />,
    color: "text-amber-600 dark:text-amber-400",
    accentColor: "from-amber-500 to-yellow-500",
    bgColor: "bg-amber-50 dark:bg-amber-950/20",
    badgeColor: "bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200",
  },
  manager: {
    label: "Supervisor",
    icon: <Shield className="h-5 w-5" />,
    color: "text-blue-600 dark:text-blue-400",
    accentColor: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    badgeColor: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
  },
  kasir: {
    label: "Staff Kasir",
    icon: <ShoppingBag className="h-5 w-5" />,
    color: "text-green-600 dark:text-green-400",
    accentColor: "from-green-500 to-emerald-500",
    bgColor: "bg-green-50 dark:bg-green-950/20",
    badgeColor: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
  },
  gudang: {
    label: "Gudang",
    icon: <Warehouse className="h-5 w-5" />,
    color: "text-purple-600 dark:text-purple-400",
    accentColor: "from-purple-500 to-pink-500",
    bgColor: "bg-purple-50 dark:bg-purple-950/20",
    badgeColor: "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200",
  },
  viewer: {
    label: "Viewer",
    icon: <Eye className="h-5 w-5" />,
    color: "text-gray-600 dark:text-gray-400",
    accentColor: "from-gray-400 to-slate-500",
    bgColor: "bg-gray-50 dark:bg-gray-800 dark:bg-gray-950/20",
    badgeColor: "bg-gray-100 dark:bg-gray-800 dark:bg-gray-900 text-gray-800 dark:text-gray-200",
  },
};

const roleOrder: Role[] = ["owner", "manager", "kasir", "gudang", "viewer"];

interface StaffMember {
  id: string;
  userId: string;
  role: Role;
  permissions: Record<string, boolean>;
  status: "active" | "suspended";
  user?: {
    name: string;
    email: string;
  };
}

interface InviteForm {
  email: string;
  role: Role;
  permissions: Record<string, boolean>;
}

const defaultPermissions: Record<string, boolean> = {
  posAccess: false,
  inventoryAccess: false,
  reportAccess: false,
  paymentAccess: false,
  settingsAccess: false,
};

const permissionLabels: Record<string, string> = {
  posAccess: "Akses POS",
  inventoryAccess: "Kelola Inventori",
  reportAccess: "Lihat Laporan",
  paymentAccess: "Proses Pembayaran",
  settingsAccess: "Akses Pengaturan",
};

export default function StaffManagement() {
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteForm, setInviteForm] = useState<InviteForm>({
    email: "",
    role: "kasir",
    permissions: defaultPermissions,
  });
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<StaffMember> | null>(null);

  const { data: members, isLoading } = trpc.team.list.useQuery();
  const utils = trpc.useUtils();

  const inviteMut = trpc.team.invite.useMutation({
    onSuccess: () => {
      utils.team.list.invalidate();
      setShowInviteDialog(false);
      setInviteForm({ email: "", role: "kasir", permissions: defaultPermissions });
      toast.success("Undangan berhasil dikirim!");
    },
    onError: (e) => toast.error(e.message || "Gagal mengirim undangan"),
  });

  const updateMut = trpc.team.updateMember.useMutation({
    onSuccess: () => {
      utils.team.list.invalidate();
      setEditingMember(null);
      setEditForm(null);
      toast.success("Anggota tim berhasil diperbarui!");
    },
    onError: (e) => toast.error(e.message || "Gagal memperbarui anggota"),
  });

  const removeMut = trpc.team.removeMember.useMutation({
    onSuccess: () => {
      utils.team.list.invalidate();
      toast.success("Anggota tim berhasil dihapus!");
    },
    onError: (e) => toast.error(e.message || "Gagal menghapus anggota"),
  });

  const handleInvite = () => {
    if (!inviteForm.email.trim()) {
      toast.error("Email wajib diisi");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteForm.email)) {
      toast.error("Format email tidak valid");
      return;
    }
    inviteMut.mutate({
      email: inviteForm.email,
      role: inviteForm.role as "manager" | "kasir" | "gudang" | "viewer",
      permissions: inviteForm.permissions,
    });
  };

  const handleSaveEdit = (memberId: string) => {
    if (!editForm) return;
    updateMut.mutate({
      memberId: Number(memberId),
      role: editForm.role as "manager" | "kasir" | "gudang" | "viewer",
      permissions: editForm.permissions || {},
      status: editForm.status as "active" | "suspended",
    });
  };

  const startEdit = (member: StaffMember) => {
    setEditingMember(member.id);
    setEditForm({ ...member });
  };

  const cancelEdit = () => {
    setEditingMember(null);
    setEditForm(null);
  };

  // Group members by role
  const membersByRole: Record<Role, StaffMember[]> = {
    owner: [],
    manager: [],
    kasir: [],
    gudang: [],
    viewer: [],
  };

  (members || []).forEach((member: any) => {
    membersByRole[member.role as Role].push({
      id: member.id,
      userId: member.userId,
      role: member.role as Role,
      permissions: member.permissions || {},
      status: member.status,
      user: {
        name: member.userName,
        email: member.userEmail,
      },
    } as StaffMember);
  });

  // Sort within each role
  Object.keys(membersByRole).forEach((role) => {
    membersByRole[role as Role].sort((a, b) => {
      const nameA = a.user?.name || "";
      const nameB = b.user?.name || "";
      return nameA.localeCompare(nameB);
    });
  });

  const roleCounts = {
    owner: membersByRole.owner.length,
    manager: membersByRole.manager.length,
    kasir: membersByRole.kasir.length,
    gudang: membersByRole.gudang.length,
    viewer: membersByRole.viewer.length,
  };

  const totalMembers = members?.length || 0;

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6 max-w-5xl mx-auto">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-7 w-7 text-blue-600 dark:text-blue-400" />
            Manajemen Anggota Tim
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola peran, izin akses, dan status anggota tim Anda
          </p>
        </div>
        <Button
          onClick={() => {
            setInviteForm({ email: "", role: "kasir", permissions: defaultPermissions });
            setShowInviteDialog(true);
          }}
          className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
        >
          <Plus className="h-4 w-4 mr-2" /> Undang Anggota
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="border-0 shadow-md dark:bg-slate-900/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-white">{totalMembers}</div>
            <div className="text-xs text-muted-foreground">Total Anggota</div>
          </CardContent>
        </Card>

        {roleOrder.map((role) => {
          const config = roleConfigs[role];
          return (
            <Card
              key={role}
              className="border-0 shadow-md dark:bg-slate-900/50 backdrop-blur-sm"
            >
              <CardContent className="p-4">
                <div className={`text-2xl font-bold ${config.color}`}>
                  {roleCounts[role]}
                </div>
                <div className="text-xs text-muted-foreground">{config.label}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Staff by Role Sections */}
      <div className="space-y-6">
        <AnimatePresence>
          {roleOrder.map((role) => {
            const staffInRole = membersByRole[role];
            if (staffInRole.length === 0) return null;

            const config = roleConfigs[role];
            return (
              <motion.div
                key={role}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Card className="border-0 shadow-md dark:bg-slate-900/50 backdrop-blur-sm overflow-hidden">
                  {/* Role Header */}
                  <div
                    className={`px-6 py-4 bg-gradient-to-r ${config.accentColor} border-b border-white/10`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={config.color}>{config.icon}</div>
                      <div>
                        <h2 className="text-lg font-semibold text-white">
                          {config.label}
                        </h2>
                        <p className="text-sm text-white/70">
                          {staffInRole.length} {staffInRole.length === 1 ? "anggota" : "anggota"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Staff List */}
                  <div className="divide-y divide-white/5">
                    {staffInRole.map((member) => {
                      const isEditing = editingMember === member.id;
                      return (
                        <motion.div
                          key={member.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className={`p-4 sm:p-5 transition-colors hover:bg-white dark:bg-gray-900/2.5 dark:hover:bg-white dark:bg-gray-900/5 ${
                            isEditing ? config.bgColor : ""
                          }`}
                        >
                          {isEditing && editForm ? (
                            // Edit Mode
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-xs font-semibold">
                                    Nama
                                  </Label>
                                  <div className="mt-1 text-sm font-medium">
                                    {member.user?.name || "Unknown"}
                                  </div>
                                </div>
                                <div>
                                  <Label className="text-xs font-semibold">
                                    Email
                                  </Label>
                                  <div className="mt-1 text-sm">
                                    {member.user?.email}
                                  </div>
                                </div>

                                <div>
                                  <Label htmlFor={`role-${member.id}`} className="text-xs font-semibold">
                                    Peran
                                  </Label>
                                  <Select
                                    value={editForm.role || role}
                                    onValueChange={(value) =>
                                      setEditForm({ ...editForm, role: value as Role })
                                    }
                                  >
                                    <SelectTrigger
                                      id={`role-${member.id}`}
                                      className="mt-1 h-8 text-sm"
                                    >
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {roleOrder.map((r) => (
                                        <SelectItem key={r} value={r}>
                                          {roleConfigs[r].label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div>
                                  <Label htmlFor={`status-${member.id}`} className="text-xs font-semibold">
                                    Status
                                  </Label>
                                  <Select
                                    value={editForm.status || member.status}
                                    onValueChange={(value) =>
                                      setEditForm({
                                        ...editForm,
                                        status: value as "active" | "suspended",
                                      })
                                    }
                                  >
                                    <SelectTrigger
                                      id={`status-${member.id}`}
                                      className="mt-1 h-8 text-sm"
                                    >
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="active">Aktif</SelectItem>
                                      <SelectItem value="suspended">
                                        Ditangguhkan
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              {/* Permissions in Edit Mode */}
                              <div>
                                <Label className="text-xs font-semibold block mb-3">
                                  Izin Akses
                                </Label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {Object.keys(defaultPermissions).map((perm) => (
                                    <div
                                      key={perm}
                                      className="flex items-center space-x-2 p-2 rounded-lg hover:bg-white dark:bg-gray-900/5"
                                    >
                                      <Checkbox
                                        id={`perm-${member.id}-${perm}`}
                                        checked={editForm.permissions?.[perm] || false}
                                        onCheckedChange={(checked) =>
                                          setEditForm({
                                            ...editForm,
                                            permissions: {
                                              ...editForm.permissions,
                                              [perm]: !!checked,
                                            },
                                          })
                                        }
                                      />
                                      <Label
                                        htmlFor={`perm-${member.id}-${perm}`}
                                        className="text-sm cursor-pointer"
                                      >
                                        {permissionLabels[perm]}
                                      </Label>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Edit Actions */}
                              <div className="flex gap-2 justify-end pt-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={cancelEdit}
                                  className="h-8"
                                >
                                  Batal
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveEdit(member.id)}
                                  disabled={updateMut.isPending}
                                  className={`h-8 bg-gradient-to-r ${config.accentColor}`}
                                >
                                  {updateMut.isPending ? "Menyimpan..." : "Simpan"}
                                </Button>
                              </div>
                            </div>
                          ) : (
                            // View Mode
                            <div className="space-y-3">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-semibold text-sm sm:text-base truncate">
                                      {member.user?.name || "Unknown"}
                                    </h3>
                                    <Badge
                                      className={`text-xs ${config.badgeColor} shrink-0`}
                                    >
                                      {config.label}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Mail className="h-3 w-3" />
                                    {member.user?.email}
                                  </div>
                                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                                    <span
                                      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                                        member.status === "active"
                                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                                          : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                                      }`}
                                    >
                                      {member.status === "active" ? (
                                        <>
                                          <Check className="h-2.5 w-2.5" /> Aktif
                                        </>
                                      ) : (
                                        <>
                                          <X className="h-2.5 w-2.5" /> Ditangguhkan
                                        </>
                                      )}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex gap-1 shrink-0">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => startEdit(member)}
                                    className="h-8 w-8 hover:bg-white dark:bg-gray-900/10"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      if (confirm(`Hapus anggota "${member.user?.name}"?`)) {
                                        removeMut.mutate({ memberId: Number(member.id) });
                                      }
                                    }}
                                    className="h-8 w-8 hover:bg-red-500/20 hover:text-red-600 dark:text-red-400 dark:hover:text-red-400"
                                    disabled={removeMut.isPending}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>

                              {/* Permissions Display */}
                              {Object.entries(member.permissions || {}).some(
                                ([, val]) => val
                              ) && (
                                <div className="flex flex-wrap gap-1.5">
                                  {Object.entries(member.permissions || {}).map(
                                    ([perm, hasAccess]) =>
                                      hasAccess && (
                                        <span
                                          key={perm}
                                          className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-white dark:bg-gray-900/5 border border-white/10 text-white/80"
                                        >
                                          <ToggleRight className="h-3 w-3" />
                                          {permissionLabels[perm]}
                                        </span>
                                      )
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {totalMembers === 0 && (
        <Card className="border-0 shadow-md dark:bg-slate-900/50 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Shield className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground mb-4">Belum ada anggota tim</p>
            <Button
              onClick={() => {
                setInviteForm({ email: "", role: "kasir", permissions: defaultPermissions });
                setShowInviteDialog(true);
              }}
              className="bg-gradient-to-r from-blue-600 to-cyan-600"
            >
              <Plus className="h-4 w-4 mr-2" /> Undang Anggota Pertama
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Undang Anggota Tim</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="invite-email" className="text-sm font-semibold">
                Email *
              </Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="anggota@contoh.com"
                value={inviteForm.email}
                onChange={(e) =>
                  setInviteForm({ ...inviteForm, email: e.target.value })
                }
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="invite-role" className="text-sm font-semibold">
                Peran *
              </Label>
              <Select
                value={inviteForm.role}
                onValueChange={(value) =>
                  setInviteForm({ ...inviteForm, role: value as Role })
                }
              >
                <SelectTrigger id="invite-role" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roleOrder.map((r) => (
                    <SelectItem key={r} value={r}>
                      {roleConfigs[r].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Pilih peran yang sesuai dengan tanggung jawab anggota
              </p>
            </div>

            <div>
              <Label className="text-sm font-semibold block mb-3">Izin Akses</Label>
              <div className="space-y-2">
                {Object.keys(defaultPermissions).map((perm) => (
                  <div key={perm} className="flex items-center space-x-2">
                    <Checkbox
                      id={`invite-perm-${perm}`}
                      checked={inviteForm.permissions[perm] || false}
                      onCheckedChange={(checked) =>
                        setInviteForm({
                          ...inviteForm,
                          permissions: {
                            ...inviteForm.permissions,
                            [perm]: !!checked,
                          },
                        })
                      }
                    />
                    <Label
                      htmlFor={`invite-perm-${perm}`}
                      className="text-sm cursor-pointer"
                    >
                      {permissionLabels[perm]}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button
                variant="outline"
                onClick={() => setShowInviteDialog(false)}
              >
                Batal
              </Button>
              <Button
                onClick={handleInvite}
                disabled={inviteMut.isPending}
                className="bg-gradient-to-r from-blue-600 to-cyan-600"
              >
                {inviteMut.isPending ? "Mengirim..." : "Kirim Undangan"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
