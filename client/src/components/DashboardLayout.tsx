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
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";
import { trpc } from "@/lib/trpc";
import { formatRupiah } from "../../../shared/finance";
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
  { icon: HandCoins, label: "Hutang & Piutang", path: "/hutang-piutang" },
  { icon: PiggyBank, label: "Tagihan & Anggaran", path: "/anggaran" },
  { icon: FileText, label: "Laporan", path: "/laporan" },
  { icon: Settings, label: "Pengaturan", path: "/pengaturan" },
];

// UMKM menu — collapsible groups (Olsera-style)
const UMKM_SIDEBAR: SidebarItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  {
    icon: ArrowLeftRight,
    label: "Transaksi & Penjualan",
    children: [
      { icon: ArrowLeftRight, label: "Semua Transaksi", path: "/transaksi" },
    ],
  },
  {
    icon: Package,
    label: "Produk & Inventori",
    children: [
      { icon: Package, label: "Stok Produk", path: "/stok" },
      { icon: History, label: "Riwayat Stok", path: "/riwayat-stok" },
      { icon: Warehouse, label: "Gudang", path: "/gudang" },
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
    ],
  },
  {
    icon: FileText,
    label: "Laporan",
    children: [
      { icon: FileText, label: "Laporan Keuangan", path: "/laporan" },
    ],
  },
  { icon: Users, label: "Pelanggan", path: "/client" },
  { icon: UsersRound, label: "Pegawai", path: "/pengaturan?tab=team" },
  { icon: Settings, label: "Pengaturan", path: "/pengaturan" },
  { icon: HelpCircle, label: "Panduan", path: "/panduan" },
];

const POS_CHILDREN: MenuItem[] = [
  { icon: ShoppingBag, label: "Kasir (POS)", path: "/pos" },
  { icon: Receipt, label: "Laporan Penjualan", path: "/laporan-penjualan" },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;

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
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-3">
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310519663380060214/BWbi9ugLsQu4nq5jm7TSFB/county-logo-new_8e4282c5.png"
              alt="County"
              className="h-20 w-20 object-contain mb-2"
            />
            <span className="text-3xl font-bold text-primary">County</span>
            <h1 className="text-lg font-semibold tracking-tight text-center text-foreground">
              Masuk untuk melanjutkan
            </h1>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Kelola keuangan Anda dengan mudah — pencatatan, laporan, dan
              analisis dalam satu platform.
            </p>
          </div>
          <Button
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
            size="lg"
            className="w-full shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
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
  const posEnabled = business?.posEnabled ?? false;
  const debtEnabled = business?.debtEnabled ?? true;
  const isAdmin = user?.role === "admin";

  // Business context for multi-business switching
  const {
    businesses,
    activeBusinessId,
    switchBusiness,
    hasMultipleBusinesses,
    isOwnBusiness,
    activeRole,
    activePermissions,
  } = useBusinessContext();

  // Get team context
  const { data: teamCtx } = trpc.team.myContext.useQuery(undefined, {
    enabled: !!user,
  });
  const isTeamMember = !isOwnBusiness;
  const memberPermissions = isTeamMember ? activePermissions : null;

  // Build sidebar items — flat for Personal, collapsible groups for UMKM
  const { sidebarItems, flatItems } = useMemo(() => {
    if (appMode === "personal") {
      let items = [...PERSONAL_MENU];
      if (!debtEnabled)
        items = items.filter((i) => i.path !== "/hutang-piutang");
      if (isAdmin)
        items.push({ icon: Shield, label: "Super Admin", path: "/admin" });
      if (isTeamMember && memberPermissions) {
        items = items.filter((i) => {
          const p = PATH_PERMISSION_MAP[i.path];
          return !p || memberPermissions[p] === true;
        });
      }
      return { sidebarItems: items as SidebarItem[], flatItems: items };
    }

    // UMKM — build collapsible groups
    let items: SidebarItem[] = UMKM_SIDEBAR.map((item) => {
      if (isGroup(item)) return { ...item, children: [...item.children] };
      return { ...item };
    });

    // Insert POS items into "Transaksi & Penjualan" group
    if (posEnabled) {
      items = items.map((item) => {
        if (isGroup(item) && item.label === "Transaksi & Penjualan") {
          return { ...item, children: [...item.children, ...POS_CHILDREN] };
        }
        return item;
      });
    }

    // Remove Hutang & Piutang if disabled
    if (!debtEnabled) {
      items = items.map((item) => {
        if (isGroup(item)) {
          return { ...item, children: item.children.filter((c) => c.path !== "/hutang-piutang") };
        }
        return item;
      });
    }

    // Add admin item
    if (isAdmin) {
      // Insert before Pengaturan
      const settingsIdx = items.findIndex((i) => !isGroup(i) && (i as MenuItem).path === "/pengaturan");
      if (settingsIdx >= 0) {
        items.splice(settingsIdx, 0, { icon: Shield, label: "Super Admin", path: "/admin" });
      } else {
        items.push({ icon: Shield, label: "Super Admin", path: "/admin" });
      }
    }

    // Filter by permissions for team members
    if (isTeamMember && memberPermissions) {
      items = items.map((item) => {
        if (isGroup(item)) {
          return {
            ...item,
            children: item.children.filter((c) => {
              const p = PATH_PERMISSION_MAP[c.path];
              return !p || memberPermissions[p] === true;
            }),
          };
        }
        const mi = item as MenuItem;
        const p = PATH_PERMISSION_MAP[mi.path];
        if (p && memberPermissions[p] !== true) return null;
        return item;
      }).filter(Boolean) as SidebarItem[];

      // Remove empty groups
      items = items.filter((item) => !isGroup(item) || item.children.length > 0);
    }

    // Build flat items for active menu detection
    const flat: MenuItem[] = [];
    items.forEach((item) => {
      if (isGroup(item)) flat.push(...item.children);
      else flat.push(item as MenuItem);
    });

    return { sidebarItems: items, flatItems: flat };
  }, [appMode, posEnabled, debtEnabled, isAdmin, isTeamMember, memberPermissions]);

  const activeMenuItem = flatItems.find((item) => item.path === location);

  // Tax estimate for sidebar (only for UMKM mode)
  const now = new Date();
  const { data: taxCalc } = trpc.tax.calculate.useQuery(
    { month: now.getMonth() + 1, year: now.getFullYear() },
    {
      retry: false,
      refetchOnWindowFocus: false,
      enabled: appMode === "umkm",
    }
  );
  const totalTax =
    taxCalc?.reduce((s: number, t: any) => s + t.amount, 0) ?? 0;

  // Mode-aware style tokens
  const isPersonal = appMode === "personal";

  useEffect(() => {
    if (isCollapsed) setIsResizing(false);
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const sidebarLeft =
        sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH)
        setSidebarWidth(newWidth);
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
    // Auto-open the group that contains the current path
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
    const itemPath = item.path.split("?")[0]; // strip query params for matching
    const isActive = location === itemPath || (item.path.includes("?") && location === itemPath);
    return (
      <SidebarMenuItem
        key={item.path}
        {...(item.path === "/panduan"
          ? { "data-onboarding": "panduan-link" }
          : {})}
      >
        <SidebarMenuButton
          isActive={isActive}
          onClick={() => setLocation(item.path)}
          tooltip={item.label}
          className={`h-9 transition-all font-normal rounded-lg ${
            isActive
              ? isPersonal
                ? "bg-county-violet/10 text-county-violet font-semibold"
                : "bg-sidebar-primary/10 text-sidebar-primary font-semibold"
              : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
          }`}
        >
          <item.icon
            className={`h-4 w-4 shrink-0 ${
              isActive
                ? isPersonal
                  ? "text-county-violet"
                  : "text-sidebar-primary"
                : ""
            }`}
          />
          <span>{item.label}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  // ─── Render a collapsible group ───
  const renderGroup = (group: CollapsibleMenuGroup) => {
    const isOpen = openGroups[group.label] ?? false;
    const hasActiveChild = group.children.some((c) => location === c.path.split("?")[0]);

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
              className={`h-9 transition-all font-normal rounded-lg ${
                hasActiveChild
                  ? "text-sidebar-foreground font-semibold"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              }`}
            >
              <group.icon className={`h-4 w-4 shrink-0 ${hasActiveChild ? "text-sidebar-primary" : ""}`} />
              <span className="flex-1">{group.label}</span>
              <ChevronRight
                className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 text-sidebar-foreground/40 ${
                  (isOpen || hasActiveChild) ? "rotate-90" : ""
                }`}
              />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              {group.children.map((child) => {
                const isActive = location === child.path.split("?")[0];
                return (
                  <SidebarMenuSubItem key={child.path}>
                    <SidebarMenuSubButton
                      isActive={isActive}
                      onClick={() => setLocation(child.path)}
                      className={`transition-all ${
                        isActive
                          ? "text-sidebar-primary font-semibold"
                          : "text-sidebar-foreground/60 hover:text-sidebar-foreground"
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
          className="border-r-0"
          disableTransition={isResizing}
        >
          {/* ─── Header: Logo + Toggle ─── */}
          <SidebarHeader className="h-16 justify-center">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-sidebar-accent rounded-lg transition-colors focus:outline-none shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-sidebar-foreground/70" />
              </button>
              {!isCollapsed && (
                <div className="flex items-center gap-2 min-w-0">
                  <img
                    src="https://d2xsxph8kpxj0f.cloudfront.net/310519663380060214/BWbi9ugLsQu4nq5jm7TSFB/county-logo-new_8e4282c5.png"
                    alt="County"
                    className="h-7 w-7 object-contain shrink-0"
                  />
                  <span className="font-bold tracking-tight truncate text-sidebar-foreground">
                    County
                  </span>
                  <span
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${
                      isPersonal
                        ? "bg-county-violet/15 text-county-violet"
                        : "bg-sidebar-primary/15 text-sidebar-primary"
                    }`}
                  >
                    {isPersonal ? "Pribadi" : "UMKM"}
                  </span>
                  {isTeamMember && activeRole && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 bg-county-orange/15 text-county-orange">
                      {activeRole.charAt(0).toUpperCase() +
                        activeRole.slice(1)}
                    </span>
                  )}
                </div>
              )}
            </div>
          </SidebarHeader>

          {/* ─── Business Switcher ─── */}
          {businesses.length > 0 && (
            <div
              className={
                isCollapsed
                  ? "px-1 pb-2 flex justify-center"
                  : "px-3 pb-2"
              }
            >
              {hasMultipleBusinesses ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    {isCollapsed ? (
                      <button
                        className="h-9 w-9 flex items-center justify-center rounded-lg border border-sidebar-border/50 bg-sidebar-accent/30 hover:bg-sidebar-accent/60 transition-all focus:outline-none relative"
                        title="Switch Bisnis"
                      >
                        <Building2 className="h-4 w-4 text-sidebar-foreground/70" />
                        <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-sidebar-primary text-[8px] text-sidebar-primary-foreground font-bold flex items-center justify-center">
                          {businesses.length}
                        </span>
                      </button>
                    ) : (
                      <button className="flex items-center gap-2.5 w-full rounded-xl border border-sidebar-border/40 bg-sidebar-accent/30 hover:bg-sidebar-accent/60 px-3 py-2.5 text-left transition-all focus:outline-none">
                        <div className="h-8 w-8 rounded-lg bg-sidebar-primary flex items-center justify-center shrink-0">
                          <Building2 className="h-4 w-4 text-sidebar-primary-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-medium text-sidebar-foreground/50 leading-none uppercase tracking-wider">
                            Bisnis Aktif
                          </p>
                          <p className="text-sm font-semibold text-sidebar-foreground truncate mt-0.5">
                            {businesses.find(
                              (b) => b.id === activeBusinessId
                            )?.name ?? "Pilih Bisnis"}
                          </p>
                          <p className="text-[10px] text-sidebar-foreground/50 mt-0.5 flex items-center gap-1">
                            {(() => {
                              const active = businesses.find(
                                (b) => b.id === activeBusinessId
                              );
                              if (!active) return "";
                              if (active.isOwn) {
                                return (
                                  <>
                                    <Crown className="h-2.5 w-2.5" /> Owner
                                  </>
                                );
                              }
                              return (
                                <>
                                  <Briefcase className="h-2.5 w-2.5" />{" "}
                                  {active.role?.charAt(0).toUpperCase()}
                                  {active.role?.slice(1) ?? "Karyawan"}
                                </>
                              );
                            })()}
                          </p>
                        </div>
                        <div className="flex flex-col items-center gap-0.5 shrink-0">
                          <ChevronDown className="h-3.5 w-3.5 text-sidebar-foreground/40" />
                          <span className="text-[9px] font-medium text-sidebar-foreground/40">
                            {businesses.length}
                          </span>
                        </div>
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
                        onClick={() => {
                          if (b.id !== activeBusinessId) switchBusiness(b.id);
                        }}
                        className={`cursor-pointer rounded-lg px-2 py-2.5 mb-0.5 ${
                          b.id === activeBusinessId
                            ? "bg-primary/5"
                            : ""
                        }`}
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div
                            className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                              b.isOwn
                                ? "bg-primary text-primary-foreground"
                                : "bg-county-orange text-white"
                            }`}
                          >
                            <Building2 className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">
                              {b.name}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              {b.isOwn ? (
                                <>
                                  <Crown className="h-3 w-3" /> Bisnis Saya
                                  (Owner)
                                </>
                              ) : (
                                <>
                                  <Briefcase className="h-3 w-3" /> Sebagai{" "}
                                  {b.role?.charAt(0).toUpperCase()}
                                  {b.role?.slice(1) ?? "Karyawan"}
                                </>
                              )}
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
                /* Single business — compact info */
                !isCollapsed && (
                  <div className="flex items-center gap-2.5 w-full rounded-xl border border-sidebar-border/30 bg-sidebar-accent/20 px-3 py-2 transition-all">
                    <div className="h-7 w-7 rounded-lg bg-sidebar-primary flex items-center justify-center shrink-0">
                      <Building2 className="h-3.5 w-3.5 text-sidebar-primary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-sidebar-foreground truncate">
                        {businesses[0]?.name ?? "Bisnis"}
                      </p>
                      <p className="text-[10px] text-sidebar-foreground/50 flex items-center gap-1">
                        {businesses[0]?.isOwn ? (
                          <>
                            <Crown className="h-2.5 w-2.5" /> Owner
                          </>
                        ) : (
                          <>
                            <Briefcase className="h-2.5 w-2.5" />{" "}
                            {businesses[0]?.role?.charAt(0).toUpperCase()}
                            {businesses[0]?.role?.slice(1) ?? "Karyawan"}
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>
          )}

          {/* ─── Navigation ─── */}
          <SidebarContent className="gap-0">
            <SidebarMenu
              data-onboarding="sidebar-menu"
              className="px-2 py-1"
            >
              {sidebarItems.map((item) =>
                isGroup(item) ? renderGroup(item) : renderMenuItem(item as MenuItem)
              )}
            </SidebarMenu>
          </SidebarContent>

          {/* ─── Tax Alert (UMKM only) ─── */}
          {appMode === "umkm" && !isCollapsed && totalTax > 0 && (
            <div className="px-3 pb-2">
              <div className="rounded-xl bg-warning/8 border border-warning/20 p-3">
                <div className="flex items-center gap-2 text-xs text-sidebar-foreground/70 mb-1">
                  <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                  <span>Estimasi Pajak Bulan Ini</span>
                </div>
                <p className="text-sm font-semibold text-sidebar-foreground">
                  {formatRupiah(totalTax)}
                </p>
              </div>
            </div>
          )}

          {/* ─── Footer: Theme + User ─── */}
          <SidebarFooter className="p-3">
            <ThemeToggleButton isCollapsed={isCollapsed} isPersonal={isPersonal} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-xl px-1 py-1 hover:bg-sidebar-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none">
                  <Avatar className="h-9 w-9 border border-sidebar-border shrink-0">
                    <AvatarFallback
                      className={`text-xs font-medium text-white ${
                        isPersonal ? "bg-county-violet" : "bg-primary"
                      }`}
                    >
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none text-sidebar-foreground">
                      {user?.name || "-"}
                    </p>
                    <p className="text-xs text-sidebar-foreground/60 truncate mt-1.5">
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
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${
            isCollapsed ? "hidden" : ""
          }`}
          onMouseDown={() => {
            if (!isCollapsed) setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {isMobile ? (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-2 backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />
              <span className="tracking-tight text-foreground font-medium">
                {activeMenuItem?.label ?? "Menu"}
              </span>
            </div>
            <NotificationCenter />
          </div>
        ) : (
          <div className="flex h-12 items-center justify-end px-4 border-b border-border/30">
            <NotificationCenter />
          </div>
        )}
        <main className="flex-1 p-4 md:p-6">{children}</main>
        {business?.calculatorEnabled !== false && <MiniCalculator />}
      </SidebarInset>
    </>
  );
}

function ThemeToggleButton({
  isCollapsed,
  isPersonal,
}: {
  isCollapsed: boolean;
  isPersonal: boolean;
}) {
  const { theme, toggleTheme, switchable } = useTheme();
  if (!switchable || !toggleTheme) return null;

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-sidebar-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none mb-1"
      title={
        theme === "dark"
          ? "Beralih ke mode terang"
          : "Beralih ke mode gelap"
      }
    >
      <div
        className={`h-8 w-8 flex items-center justify-center rounded-lg shrink-0 ${
          theme === "dark"
            ? "bg-county-orange"
            : isPersonal
              ? "bg-county-violet"
              : "bg-primary"
        }`}
      >
        {theme === "dark" ? (
          <Sun className="h-4 w-4 text-white" />
        ) : (
          <Moon className="h-4 w-4 text-white" />
        )}
      </div>
      {!isCollapsed && (
        <div className="flex items-center justify-between flex-1 min-w-0">
          <span className="text-sm text-sidebar-foreground/80">
            {theme === "dark" ? "Mode Gelap" : "Mode Terang"}
          </span>
          <div
            className={`relative w-9 h-5 rounded-full transition-colors ${
              theme === "dark" ? "bg-primary" : "bg-sidebar-accent"
            }`}
          >
            <div
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                theme === "dark" ? "translate-x-4" : "translate-x-0.5"
              }`}
            />
          </div>
        </div>
      )}
    </button>
  );
}
