import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getLoginUrl } from "@/const";
import { getProxiedImageUrl } from "@/lib/utils";
import { useIsMobile } from "@/hooks/useMobile";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Package,
  FileText,
  Calculator,
  Settings,
  Shield,
  LogOut,
  ShoppingBag,
  PanelLeft,
  AlertTriangle,
  Sun,
  Moon,
  BookOpen,
  History,
  Users,
  UsersRound,
  HandCoins,
  PiggyBank,
  BarChart3,
  Warehouse,
  Building2,
  ChevronDown,
  ChevronRight,
  Check,
  HelpCircle,
  Crown,
  Briefcase,
  Receipt,
  Megaphone,
  Truck,
  ScanBarcode,
  FileUp,
  FileCheck,
  Store,
  ArrowRightLeft,
  CreditCard,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Search,
  Clock,
  Calendar,
  CalendarDays,
  Banknote,
  Tag,
  RotateCcw,
  Wallet,
  Star,
  Coins,
  Target,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";
import { trpc } from "@/lib/trpc";
import { formatRupiah, PRO_PLUS_PATHS } from "../../../shared/finance";
import { PATH_PERMISSION_MAP } from "../../../shared/permissions";
import NotificationCenter from "./NotificationCenter";
import MiniCalculator from "./MiniCalculator";
import { useBusinessContext } from "@/contexts/BusinessContext";

// ─── Menu definitions ───

type MenuItem = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
};

type CollapsibleMenuGroup = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: MenuItem[];
};

type SidebarItem = MenuItem | CollapsibleMenuGroup;

function isGroup(item: SidebarItem): item is CollapsibleMenuGroup {
  return "children" in item;
}

const PERSONAL_MENU: MenuItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: BookOpen, label: "Jurnal Keuangan", path: "/jurnal" },
  { icon: ArrowLeftRight, label: "Transaksi", path: "/transaksi" },
  { icon: Target, label: "Target Keuangan", path: "/pf-goals" },
  { icon: HandCoins, label: "Hutang & Piutang", path: "/hutang-piutang" },
  { icon: PiggyBank, label: "Tagihan & Anggaran", path: "/anggaran" },
  { icon: FileText, label: "Laporan", path: "/laporan" },
  { icon: Settings, label: "Pengaturan", path: "/pengaturan" },
];

// UMKM menu — collapsible groups
const UMKM_SIDEBAR: SidebarItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  {
    icon: ArrowLeftRight,
    label: "Transaksi & Penjualan",
    children: [
      { icon: ArrowLeftRight, label: "Semua Transaksi", path: "/transaksi" },
      { icon: Truck, label: "Purchase Order", path: "/purchase-order" },
    ],
  },
  {
    icon: Package,
    label: "Produk & Inventori",
    children: [
      { icon: Package, label: "Stok Produk", path: "/stok" },
      { icon: ScanBarcode, label: "Barcode", path: "/barcode" },
      { icon: History, label: "Riwayat Stok", path: "/riwayat-stok" },
      { icon: Warehouse, label: "Gudang", path: "/gudang" },
      { icon: TrendingDown, label: "Valuasi FIFO", path: "/valuasi-fifo" },
      { icon: AlertTriangle, label: "Stok Kedaluwarsa", path: "/stok-kedaluwarsa" },
      { icon: Calendar, label: "Usia Stok", path: "/usia-stok" },
      { icon: AlertCircle, label: "Peringatan Stok", path: "/peringatan-stok" },
    ],
  },
  {
    icon: HandCoins,
    label: "Keuangan",
    children: [
      { icon: HandCoins, label: "Hutang & Piutang", path: "/hutang-piutang" },
      { icon: PiggyBank, label: "Tagihan & Anggaran", path: "/anggaran" },
      { icon: BarChart3, label: "Analitik", path: "/analitik" },
      { icon: Calculator, label: "Pajak", path: "/pajak" },
      { icon: Wallet, label: "Manajemen Rekening", path: "/manajemen-rekening" },
      { icon: BookOpen, label: "Jurnal Penyesuaian", path: "/jurnal-adjustment" },
    ],
  },
  {
    icon: FileText,
    label: "Laporan",
    children: [
      { icon: Search, label: "Daftar Laporan", path: "/laporan-index" },
      { icon: FileText, label: "Laporan Keuangan", path: "/laporan" },
      { icon: BookOpen, label: "Laporan GL (Jurnal Umum)", path: "/laporan-gl" },
      { icon: FileText, label: "Rekening Koran", path: "/rekening-koran" },
      { icon: Package, label: "Mutasi Persediaan", path: "/mutasi-persediaan" },
      { icon: Package, label: "Penjualan per Produk", path: "/penjualan-produk" },
      { icon: CreditCard, label: "Ringkasan Pembayaran", path: "/ringkasan-pembayaran" },
      { icon: TrendingUp, label: "Top Produk & Kategori", path: "/top-produk" },
      { icon: Users, label: "Penjualan per Pelanggan", path: "/penjualan-pelanggan" },
      { icon: Clock, label: "Penjualan per Jam", path: "/penjualan-jam" },
      { icon: CalendarDays, label: "Penjualan per Tanggal", path: "/penjualan-tanggal" },
      { icon: Banknote, label: "Penjualan Kredit", path: "/penjualan-kredit" },
      { icon: Tag, label: "Ringkasan Diskon", path: "/ringkasan-diskon" },
      { icon: RotateCcw, label: "Void & Refund", path: "/void-refund" },
      { icon: Clock, label: "Laporan Shift", path: "/laporan-shift" },
      { icon: Wallet, label: "Transaksi Tunai", path: "/transaksi-tunai" },
      { icon: Coins, label: "Komisi Staff", path: "/komisi" },
    ],
  },
  { icon: Users, label: "Pelanggan", path: "/client" },
  { icon: Star, label: "Program Loyalitas", path: "/loyalty" },
  { icon: Megaphone, label: "Marketing", path: "/marketing" },
  { icon: UsersRound, label: "Pegawai", path: "/staff" },
  { icon: FileCheck, label: "Invoice", path: "/invoice-settings" },
  { icon: Settings, label: "Pengaturan", path: "/pengaturan" },
  { icon: HelpCircle, label: "Panduan", path: "/panduan" },
  { icon: BookOpen, label: "Panduan Akuntansi", path: "/panduan-akuntansi" },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 248;
const MIN_WIDTH = 200;
const MAX_WIDTH = 360;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-8 p-8 max-w-sm w-full">
          <div className="flex flex-col items-center gap-4">
            <img
              src="/county-icon.png"
              alt="County"
              className="h-16 w-16 object-contain"
            />
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Masuk ke County
            </h1>
            <p className="text-sm text-muted-foreground text-center">
              Kelola keuangan Anda dengan mudah — pencatatan, laporan, dan analisis dalam satu platform.
            </p>
          </div>
          <Button
            onClick={() => { window.location.href = getLoginUrl(); }}
            className="w-full h-10 font-semibold"
          >
            Masuk
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
}) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Get business data for mode
  const { data: business } = trpc.business.mine.useQuery();
  const appMode = business?.appMode ?? "umkm";
  const businessLogoUrl = useMemo(() => getProxiedImageUrl(business?.logoUrl), [business?.logoUrl]);
  const posEnabled = business?.posEnabled ?? false;
  const debtEnabled = business?.debtEnabled ?? true;
  const isAdmin = user?.role === "admin";

  // Mode switcher mutation
  const setModeMut = trpc.business.setMode.useMutation({
    onSuccess: (data) => {
      if (data.businessId) {
        localStorage.setItem("county-active-business-id", String(data.businessId));
        localStorage.setItem("county-mode-transition", data.appMode ?? "umkm");
        window.location.reload();
      }
    },
  });
  const handleModeSwitch = () => {
    const targetMode = appMode === "umkm" ? "personal" : "umkm";
    setModeMut.mutate({ appMode: targetMode });
  };

  // Transition animation on mode switch
  const [showTransition, setShowTransition] = useState<string | null>(null);
  useEffect(() => {
    const transMode = localStorage.getItem("county-mode-transition");
    if (transMode) {
      localStorage.removeItem("county-mode-transition");
      setShowTransition(transMode);
      const timer = setTimeout(() => setShowTransition(null), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  // Business context for multi-business switching
  const {
    businesses,
    activeBusinessId,
    activeBusinessName,
    switchBusiness,
    hasMultipleBusinesses,
    isOwnBusiness,
    activeRole,
    activePermissions,
    isAdminImpersonating,
    stopImpersonating,
  } = useBusinessContext();

  // Get team context
  const { data: teamCtx } = trpc.team.myContext.useQuery(undefined, {
    enabled: !!user,
  });
  const isTeamMember = !isOwnBusiness;
  const memberPermissions = isTeamMember ? activePermissions : null;

  // Build sidebar items
  const { sidebarItems, flatItems } = useMemo(() => {
    if (appMode === "personal") {
      let items = [...PERSONAL_MENU];
      if (!debtEnabled) items = items.filter((i) => i.path !== "/hutang-piutang");
      if (isAdmin) items.push({ icon: Shield, label: "Super Admin", path: "/admin" });
      if (isTeamMember && memberPermissions) {
        items = items.filter((i) => {
          const p = PATH_PERMISSION_MAP[i.path];
          return !p || memberPermissions[p] === true;
        });
      }
      return { sidebarItems: items as SidebarItem[], flatItems: items };
    }

    let items: SidebarItem[] = UMKM_SIDEBAR.map((item) => {
      if (isGroup(item)) return { ...item, children: [...item.children] };
      return { ...item };
    });

    if (posEnabled) {
      const dashIdx = items.findIndex((item) => !isGroup(item) && item.path === "/");
      const posItem: SidebarItem = { icon: ShoppingBag, label: "Kasir (POS)", path: "/pos" };
      const salesReportItem: SidebarItem = { icon: Receipt, label: "Laporan Penjualan", path: "/laporan-penjualan" };
      items.splice(dashIdx + 1, 0, posItem, salesReportItem);
    }

    if (!debtEnabled) {
      items = items.map((item) => {
        if (isGroup(item)) return { ...item, children: item.children.filter((c) => c.path !== "/hutang-piutang") };
        return item;
      });
    }

    if (isAdmin) {
      const settingsIdx = items.findIndex((i) => !isGroup(i) && (i as MenuItem).path === "/pengaturan");
      if (settingsIdx >= 0) items.splice(settingsIdx, 0, { icon: Shield, label: "Super Admin", path: "/admin" }, { icon: FileUp, label: "Setup Klien", path: "/setup-klien" });
      else items.push({ icon: Shield, label: "Super Admin", path: "/admin" }, { icon: FileUp, label: "Setup Klien", path: "/setup-klien" });
    }

    if (isTeamMember && memberPermissions) {
      items = items.map((item) => {
        if (isGroup(item)) {
          return { ...item, children: item.children.filter((c) => { const p = PATH_PERMISSION_MAP[c.path]; return !p || memberPermissions[p] === true; }) };
        }
        const mi = item as MenuItem;
        const p = PATH_PERMISSION_MAP[mi.path];
        if (p && memberPermissions[p] !== true) return null;
        return item;
      }).filter(Boolean) as SidebarItem[];
      items = items.filter((item) => !isGroup(item) || item.children.length > 0);
    }

    // Plan-based feature gating: hide Pro+ only items for non-Pro+ users
    const plan = business?.plan ?? "free";
    if (plan !== "pro_plus") {
      items = items.map((item) => {
        if (isGroup(item)) {
          return { ...item, children: item.children.filter((c) => !PRO_PLUS_PATHS.includes(c.path)) };
        }
        const mi = item as MenuItem;
        if (PRO_PLUS_PATHS.includes(mi.path)) return null;
        return item;
      }).filter(Boolean) as SidebarItem[];
      items = items.filter((item) => !isGroup(item) || item.children.length > 0);
    }

    const flat: MenuItem[] = [];
    items.forEach((item) => {
      if (isGroup(item)) flat.push(...item.children);
      else flat.push(item as MenuItem);
    });

    return { sidebarItems: items, flatItems: flat };
  }, [appMode, posEnabled, debtEnabled, isAdmin, isTeamMember, memberPermissions, business?.plan]);

  const locationPath = location.split("?")[0];
  const activeMenuItem = flatItems.find((item) => item.path.split("?")[0] === locationPath);

  // Tax estimate for sidebar (only UMKM)
  const now = new Date();
  const { data: taxCalc } = trpc.tax.calculate.useQuery(
    { month: now.getMonth() + 1, year: now.getFullYear() },
    { retry: false, refetchOnWindowFocus: false, enabled: appMode === "umkm" }
  );
  const totalTax = taxCalc?.reduce((s: number, t: any) => s + t.amount, 0) ?? 0;

  const isPersonal = appMode === "personal";

  useEffect(() => {
    if (isCollapsed) setIsResizing(false);
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  // Track which collapsible groups are open
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    UMKM_SIDEBAR.forEach((item) => {
      if (isGroup(item) && item.children.some((c) => c.path === location)) {
        initial[item.label] = true;
      }
    });
    return initial;
  });

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  // ─── Render a single flat menu item ───
  const renderMenuItem = (item: MenuItem) => {
    const itemPath = item.path.split("?")[0];
    const isActive = locationPath === itemPath;
    return (
      <SidebarMenuItem
        key={item.path}
        {...(item.path === "/panduan" ? { "data-onboarding": "panduan-link" } : {})}
      >
        <SidebarMenuButton
          isActive={isActive}
          onClick={() => setLocation(item.path)}
          tooltip={item.label}
          className={`h-8 transition-all rounded-md text-[13px] font-medium ${
            isActive
              ? "bg-accent text-foreground font-semibold"
              : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
          }`}
        >
          <item.icon className={`h-4 w-4 shrink-0 ${isActive ? "text-primary opacity-100" : "opacity-60"}`} />
          <span>{item.label}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  // ─── Render a collapsible group ───
  const renderGroup = (group: CollapsibleMenuGroup) => {
    const isOpen = openGroups[group.label] ?? false;
    const hasActiveChild = group.children.some((c) => locationPath === c.path.split("?")[0]);

    return (
      <Collapsible
        key={group.label}
        open={isOpen || hasActiveChild}
        onOpenChange={() => toggleGroup(group.label)}
      >
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton
              tooltip={group.label}
              className={`h-8 transition-all rounded-md text-[13px] font-medium ${
                hasActiveChild
                  ? "text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              }`}
            >
              <group.icon className={`h-4 w-4 shrink-0 ${hasActiveChild ? "text-primary opacity-100" : "opacity-60"}`} />
              <span className="flex-1">{group.label}</span>
              <ChevronRight
                className={`h-3 w-3 shrink-0 transition-transform duration-200 opacity-40 ${
                  (isOpen || hasActiveChild) ? "rotate-90" : ""
                }`}
              />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              {group.children.map((child) => {
                const isActive = locationPath === child.path.split("?")[0];
                return (
                  <SidebarMenuSubItem key={child.path}>
                    <SidebarMenuSubButton
                      isActive={isActive}
                      onClick={() => setLocation(child.path)}
                      className={`text-[13px] transition-all ${
                        isActive
                          ? "text-primary font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span>{child.label}</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                );
              })}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    );
  };

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r border-border"
          disableTransition={isResizing}
        >
          {/* ─── Header: Logo + Brand ─── */}
          <SidebarHeader className="h-14 justify-center border-b border-border/50">
            <div className="flex items-center gap-2.5 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-7 w-7 flex items-center justify-center hover:bg-accent rounded-md transition-colors focus:outline-none shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              {!isCollapsed && (
                <div className="flex items-center gap-2 min-w-0">
                  {businessLogoUrl ? (
                    <img
                      src={businessLogoUrl}
                      alt={business?.businessName || "Logo"}
                      className="h-6 w-6 object-contain shrink-0 rounded"
                    />
                  ) : (
                    <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center shrink-0">
                      <span className="text-[11px] font-bold text-primary-foreground">C</span>
                    </div>
                  )}
                  <span className="font-semibold text-sm tracking-tight truncate text-foreground">
                    {business?.businessName || "County"}
                  </span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${
                    isPersonal
                      ? "bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 dark:bg-purple-950 dark:text-purple-400"
                      : "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 dark:bg-blue-950 dark:text-blue-400"
                  }`}>
                    {isPersonal ? "Pribadi" : "UMKM"}
                  </span>
                  {isTeamMember && activeRole && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 dark:bg-amber-950 dark:text-amber-400">
                      {activeRole.charAt(0).toUpperCase() + activeRole.slice(1)}
                    </span>
                  )}
                </div>
              )}
            </div>
          </SidebarHeader>

          {/* ─── Business Switcher ─── */}
          {businesses.length > 0 && (
            <div className={isCollapsed ? "px-1 py-2 flex justify-center" : "px-3 py-2"}>
              {hasMultipleBusinesses ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    {isCollapsed ? (
                      <button
                        className="h-8 w-8 flex items-center justify-center rounded-md border border-border bg-secondary/50 hover:bg-accent transition-all focus:outline-none relative"
                        title="Switch Bisnis"
                      >
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-primary text-[8px] text-primary-foreground font-bold flex items-center justify-center">
                          {businesses.length}
                        </span>
                      </button>
                    ) : (
                      <button className="flex items-center gap-2.5 w-full rounded-lg border border-border bg-secondary/30 hover:bg-accent/50 px-3 py-2 text-left transition-all focus:outline-none">
                        <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center shrink-0">
                          <Building2 className="h-3.5 w-3.5 text-primary-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-semibold text-muted-foreground leading-none uppercase tracking-wider">
                            Bisnis Aktif
                          </p>
                          <p className="text-sm font-semibold text-foreground truncate mt-0.5">
                            {businesses.find((b) => b.id === activeBusinessId)?.name ?? "Pilih Bisnis"}
                          </p>
                        </div>
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      </button>
                    )}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-72 p-1.5">
                    <div className="px-2 py-1.5 mb-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Switch Bisnis
                      </p>
                    </div>
                    {businesses.map((b) => (
                      <DropdownMenuItem
                        key={b.id}
                        onClick={() => { if (b.id !== activeBusinessId) switchBusiness(b.id); }}
                        className={`cursor-pointer rounded-lg px-2 py-2.5 mb-0.5 ${b.id === activeBusinessId ? "bg-accent" : ""}`}
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div className={`h-8 w-8 rounded-md flex items-center justify-center shrink-0 ${b.isOwn ? "bg-primary text-primary-foreground" : "bg-amber-500 text-white"}`}>
                            <Building2 className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{b.name}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              {b.isOwn ? (<><Crown className="h-3 w-3" /> Bisnis Saya (Owner)</>) : (<><Briefcase className="h-3 w-3" /> Sebagai {b.role?.charAt(0).toUpperCase()}{b.role?.slice(1) ?? "Karyawan"}</>)}
                            </p>
                          </div>
                          {b.id === activeBusinessId && (
                            <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                              <Check className="h-3 w-3 text-primary-foreground" />
                            </div>
                          )}
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                !isCollapsed && (
                  <div className="flex items-center gap-2.5 w-full rounded-lg border border-border/50 bg-secondary/30 px-3 py-2 transition-all">
                    <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center shrink-0">
                      <Building2 className="h-3 w-3 text-primary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {businesses[0]?.name ?? "Bisnis"}
                      </p>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        {businesses[0]?.isOwn ? (<><Crown className="h-2.5 w-2.5" /> Owner</>) : (<><Briefcase className="h-2.5 w-2.5" /> {businesses[0]?.role?.charAt(0).toUpperCase()}{businesses[0]?.role?.slice(1) ?? "Karyawan"}</>)}
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>
          )}

          {/* ─── Mode Switcher ─── */}
          {!isCollapsed && (
            <div className="px-3 pb-2">
              <button
                onClick={handleModeSwitch}
                disabled={setModeMut.isPending}
                className={`flex items-center gap-2 w-full rounded-lg border px-3 py-1.5 text-left transition-all text-xs font-medium ${
                  isPersonal
                    ? "border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 dark:border-purple-800 dark:bg-purple-950/30 dark:text-purple-400"
                    : "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-400"
                } ${setModeMut.isPending ? "opacity-60 cursor-wait" : "cursor-pointer"}`}
              >
                <ArrowRightLeft className="h-3.5 w-3.5 shrink-0" />
                <span className="flex-1">
                  {setModeMut.isPending
                    ? "Beralih..."
                    : appMode === "umkm"
                      ? "Beralih ke Jurnal Pribadi"
                      : "Beralih ke Mode UMKM"}
                </span>
                {appMode === "umkm" ? <BookOpen className="h-3.5 w-3.5 shrink-0" /> : <Store className="h-3.5 w-3.5 shrink-0" />}
              </button>
            </div>
          )}
          {isCollapsed && (
            <div className="px-1 pb-2 flex justify-center">
              <button
                onClick={handleModeSwitch}
                disabled={setModeMut.isPending}
                className={`h-8 w-8 flex items-center justify-center rounded-md border transition-all ${
                  isPersonal
                    ? "border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 dark:border-purple-800 dark:bg-purple-950/30 dark:text-purple-400"
                    : "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-400"
                } ${setModeMut.isPending ? "opacity-60 cursor-wait" : "cursor-pointer"}`}
                title={appMode === "umkm" ? "Beralih ke Jurnal Pribadi" : "Beralih ke Mode UMKM"}
              >
                <ArrowRightLeft className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* ─── Navigation ─── */}
          <SidebarContent className="gap-0">
            <SidebarMenu data-onboarding="sidebar-menu" className="px-2 py-1">
              {sidebarItems.map((item) =>
                isGroup(item) ? renderGroup(item) : renderMenuItem(item as MenuItem)
              )}
            </SidebarMenu>
          </SidebarContent>

          {/* ─── Tax Alert (UMKM only) ─── */}
          {appMode === "umkm" && !isCollapsed && totalTax > 0 && (
            <div className="px-3 pb-2">
              <div className="rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800/50 p-3 dark:bg-amber-950/20 dark:border-amber-800/30">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                  <span>Estimasi Pajak Bulan Ini</span>
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {formatRupiah(totalTax)}
                </p>
              </div>
            </div>
          )}

          {/* ─── Footer: Theme + User ─── */}
          <SidebarFooter className="p-3 border-t border-border/50">
            <ThemeToggleButton isCollapsed={isCollapsed} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2.5 rounded-lg px-1 py-1 hover:bg-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none">
                  <Avatar className="h-8 w-8 border border-border shrink-0">
                    {businessLogoUrl ? (
                      <img src={businessLogoUrl} alt={business?.businessName || "Logo"} className="h-full w-full object-cover rounded-full" />
                    ) : (
                      <AvatarFallback className="text-xs font-semibold bg-secondary text-foreground">
                        {user?.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-[13px] font-medium truncate leading-none text-foreground">
                      {user?.name || "-"}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate mt-1">
                      {user?.email || "-"}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Keluar</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => { if (!isCollapsed) setIsResizing(true); }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {/* Mode switch transition overlay */}
        <AnimatePresence>
          {showTransition && (
            <motion.div
              key="mode-transition"
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
              style={{
                background: showTransition === "personal"
                  ? "linear-gradient(135deg, rgba(124,58,237,0.1), rgba(37,99,235,0.05))"
                  : "linear-gradient(135deg, rgba(37,99,235,0.1), rgba(22,163,74,0.05))",
              }}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.1, opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="flex flex-col items-center gap-3"
              >
                <div className={`h-14 w-14 rounded-xl flex items-center justify-center ${
                  showTransition === "personal"
                    ? "bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400"
                    : "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400"
                }`}>
                  {showTransition === "personal" ? <BookOpen className="h-7 w-7" /> : <Store className="h-7 w-7" />}
                </div>
                <p className={`text-sm font-semibold ${
                  showTransition === "personal" ? "text-purple-600 dark:text-purple-400" : "text-blue-600 dark:text-blue-400"
                }`}>
                  {showTransition === "personal" ? "Jurnal Pribadi" : "Mode UMKM"}
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top bar */}
        {isMobile ? (
          <div className="flex border-b border-border h-12 items-center justify-between bg-background px-3 sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-8 w-8 rounded-md" />
              <span className="text-sm font-medium text-foreground">
                {activeMenuItem?.label ?? "Menu"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="/panduan-akuntansi"
                className="h-8 w-8 rounded-md flex items-center justify-center hover:bg-accent transition-colors"
                title="Panduan Akuntansi"
              >
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </a>
              <NotificationCenter />
            </div>
          </div>
        ) : (
          <div className="flex h-12 items-center justify-between px-6 border-b border-border/50">
            <div className="text-sm font-medium text-muted-foreground">
              {activeMenuItem?.label && activeMenuItem.path !== "/" ? activeMenuItem.label : ""}
            </div>
            <div className="flex items-center gap-3">
              <a
                href="/panduan-akuntansi"
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1.5 rounded-md hover:bg-accent"
                title="Panduan Akuntansi"
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span>Panduan Akuntansi</span>
              </a>
              <NotificationCenter />
            </div>
          </div>
        )}

        {isAdminImpersonating && (
          <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-between text-sm font-medium">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>Admin Mode — Anda sedang melihat bisnis: <strong>{activeBusinessName}</strong></span>
            </div>
            <button
              onClick={stopImpersonating}
              className="bg-white dark:bg-gray-900/20 hover:bg-white dark:bg-gray-900/30 rounded px-3 py-1 text-xs font-semibold transition-colors"
            >
              Kembali ke Akun Saya
            </button>
          </div>
        )}

        <main className="flex-1 p-4 md:p-6">{children}</main>
        {business?.calculatorEnabled !== false && <MiniCalculator />}
      </SidebarInset>
    </>
  );
}

function ThemeToggleButton({ isCollapsed }: { isCollapsed: boolean }) {
  const { theme, toggleTheme, switchable } = useTheme();
  if (!switchable || !toggleTheme) return null;

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none mb-1"
      title={theme === "dark" ? "Beralih ke mode terang" : "Beralih ke mode gelap"}
    >
      <div className="h-7 w-7 flex items-center justify-center rounded-md shrink-0 bg-secondary">
        {theme === "dark" ? (
          <Sun className="h-3.5 w-3.5 text-amber-500" />
        ) : (
          <Moon className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </div>
      {!isCollapsed && (
        <div className="flex items-center justify-between flex-1 min-w-0">
          <span className="text-[13px] text-muted-foreground">
            {theme === "dark" ? "Mode Gelap" : "Mode Terang"}
          </span>
          <div className={`relative w-8 h-[18px] rounded-full transition-colors ${theme === "dark" ? "bg-primary" : "bg-border"}`}>
            <div className={`absolute top-[2px] h-[14px] w-[14px] rounded-full bg-white dark:bg-gray-900 shadow-sm transition-transform ${theme === "dark" ? "translate-x-[14px]" : "translate-x-[2px]"}`} />
          </div>
        </div>
      )}
    </button>
  );
}
