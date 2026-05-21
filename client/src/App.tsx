import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import { CountySignIn, CountySignUp } from "./clerk-provider";
import TransaksiPage from "./pages/Transaksi";
import StokProdukPage from "./pages/StokProduk";
import LaporanPage from "./pages/Laporan";
import PajakPage from "./pages/Pajak";
import PengaturanPage from "./pages/Pengaturan";
import SuperAdminPage from "./pages/SuperAdmin";
import UpgradePage from "./pages/Upgrade";
import POSPage from "./pages/POS";
import DashboardLayout from "./components/DashboardLayout";
import { useAuth } from "./_core/hooks/useAuth";
import { trpc } from "./lib/trpc";
import { DashboardLayoutSkeleton } from "./components/DashboardLayoutSkeleton";
import Onboarding from "./pages/Onboarding";
import LandingPage from "./pages/LandingPage";
import ProActivation from "./pages/ProActivation";
import JurnalPribadi from "./pages/JurnalPribadi";
import RiwayatStok from "./pages/RiwayatStok";
import ClientManagement from "./pages/ClientManagement";
import HutangPiutang from "./pages/HutangPiutang";
import Anggaran from "./pages/Anggaran";
import SalesAnalytics from "./pages/SalesAnalytics";
import Panduan from "./pages/Panduan";
import PanduanAkuntansi from "./pages/PanduanAkuntansi";
import LaporanPenjualan from "./pages/LaporanPenjualan";
import LaporanPembelian from "./pages/LaporanPembelian";
import GudangPage from "./pages/Gudang";
import AcceptInvite from "./pages/AcceptInvite";
import { useBusinessContext } from "./contexts/BusinessContext";
import { PATH_PERMISSION_MAP, getDefaultPathForRole } from "../../shared/permissions";
import PurchaseOrderPage from "./pages/PurchaseOrder";
import MarketingPage from "./pages/Marketing";
import StaffManagementPage from "./pages/StaffManagement";
import InvoiceSettingsPage from "./pages/InvoiceSettings";
import BarcodeManagerPage from "./pages/BarcodeManager";
import WarehouseSelectPage from "./pages/WarehouseSelect";
import RekeningKoranPage from "./pages/RekeningKoran";
import MutasiPersediaanPage from "./pages/MutasiPersediaan";
import PenjualanProduk from "./pages/PenjualanProduk";
import RingkasanPembayaran from "./pages/RingkasanPembayaran";
import TopProduk from "./pages/TopProduk";
import LaporanIndex from "./pages/LaporanIndex";
import PenjualanPelanggan from "./pages/PenjualanPelanggan";
import PenjualanJam from "./pages/PenjualanJam";
import PenjualanTanggal from "./pages/PenjualanTanggal";
import PenjualanKredit from "./pages/PenjualanKredit";
import RingkasanDiskon from "./pages/RingkasanDiskon";
import VoidRefundAnalysis from "./pages/VoidRefundAnalysis";
import KomisiStaff from "./pages/KomisiStaff";
import LabaRugiDetail from "./pages/LabaRugiDetail";
import LaporanShift from "./pages/LaporanShift";
import TransaksiTunai from "./pages/TransaksiTunai";
import ManajemenRekening from "./pages/ManajemenRekening";
import LoyaltyManagement from "./pages/LoyaltyManagement";
import ValuasiFIFO from "./pages/ValuasiFIFO";
import StokKedaluwarsa from "./pages/StokKedaluwarsa";
import UsiaStok from "./pages/UsiaStok";
import PeringatanStok from "./pages/PeringatanStok";
import LaporanGL from "./pages/LaporanGL";
import JurnalAdjustment from "./pages/JurnalAdjustment";
import PersonalGoals from "./pages/PersonalGoals";
import { BusinessProvider } from "./contexts/BusinessContext";

function AccessDenied() {
  return (
    <DashboardLayout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="h-16 w-16 mx-auto mb-4 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <span className="text-2xl">🚫</span>
          </div>
          <h1 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">Akses Ditolak</h1>
          <p className="text-muted-foreground mb-6">Anda tidak memiliki izin untuk mengakses halaman ini. Hubungi pemilik bisnis untuk mengubah role Anda.</p>
          <a href="/" className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
            Kembali ke Home
          </a>
        </div>
      </div>
    </DashboardLayout>
  );
}

/**
 * TeamMemberWaiting: shown when a team_member user has no business resolved yet.
 * This happens if they registered but invite hasn't been accepted/processed.
 */
function TeamMemberWaiting() {
  const { refresh } = useAuth();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/30 p-4">
      <div className="text-center max-w-md mx-auto">
        <div className="h-16 w-16 mx-auto mb-4 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <span className="text-2xl">⏳</span>
        </div>
        <h2 className="text-xl font-bold mb-2">Menunggu Akses Tim</h2>
        <p className="text-muted-foreground mb-6">
          Akun Anda terdaftar sebagai anggota tim. Jika Anda baru saja menerima undangan, coba refresh halaman ini.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => { refresh(); window.location.reload(); }}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Refresh
          </button>
          <a href="/accept-invite" className="px-4 py-2 border rounded-lg hover:bg-muted transition-colors">
            Buka Link Undangan
          </a>
        </div>
      </div>
    </div>
  );
}

/**
 * Resolves whether to show Onboarding, TeamMemberWaiting, or the actual component.
 * Key logic:
 * - team_member users NEVER see onboarding
 * - owner users without business → Onboarding
 * - team_member users without resolved business → TeamMemberWaiting
 */
function useBusinessGuard() {
  const { user, loading: authLoading } = useAuth();
  const { data: business, isLoading: bizLoading, refetch } = trpc.business.mine.useQuery(undefined, {
    enabled: !!user,
    retry: false,
  });

  return { user, authLoading, business, bizLoading, refetch };
}

function AuthenticatedRoute({ component: Component, path }: { component: React.ComponentType; path?: string }) {
  const { user, authLoading, business, bizLoading, refetch } = useBusinessGuard();
  const { activePermissions, activeRole, isOwnBusiness } = useBusinessContext();

  if (authLoading || (user && bizLoading)) {
    return <DashboardLayoutSkeleton />;
  }

  if (!user) {
    return (
      <DashboardLayout>
        <Component />
      </DashboardLayout>
    );
  }

  if (!business) {
    // Team members should NEVER see onboarding
    if (user.accountType === "team_member") {
      return <TeamMemberWaiting />;
    }
    return <Onboarding onComplete={() => refetch()} />;
  }

  // Permission check for team members accessing restricted paths
  if (!isOwnBusiness && activePermissions && path) {
    const permKey = PATH_PERMISSION_MAP[path];
    if (permKey && activePermissions[permKey] !== true) {
      return <AccessDenied />;
    }
  }

  return (
    <DashboardLayout>
      <Component />
    </DashboardLayout>
  );
}

function ProtectedRoute({
  component: Component,
  allowedRoles
}: {
  component: React.ComponentType;
  allowedRoles?: string[];
}) {
  const { user, authLoading, business, bizLoading, refetch } = useBusinessGuard();

  if (authLoading || (user && bizLoading)) {
    return <DashboardLayoutSkeleton />;
  }

  if (!user) {
    return (
      <DashboardLayout>
        <Component />
      </DashboardLayout>
    );
  }

  if (!business) {
    if (user.accountType === "team_member") {
      return <TeamMemberWaiting />;
    }
    return <Onboarding onComplete={() => refetch()} />;
  }

  // Check if user's system role matches allowed roles
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <AccessDenied />;
  }

  return (
    <DashboardLayout>
      <Component />
    </DashboardLayout>
  );
}

function ProPlusRoute({ component: Component, path }: { component: React.ComponentType; path?: string }) {
  const { user, authLoading, business, bizLoading, refetch } = useBusinessGuard();
  const { activePermissions, isOwnBusiness } = useBusinessContext();

  if (authLoading || (user && bizLoading)) {
    return <DashboardLayoutSkeleton />;
  }

  if (!user) {
    return (
      <DashboardLayout>
        <Component />
      </DashboardLayout>
    );
  }

  if (!business) {
    if (user.accountType === "team_member") {
      return <TeamMemberWaiting />;
    }
    return <Onboarding onComplete={() => refetch()} />;
  }

  // Redirect non-Pro+ users to upgrade page
  if (business.plan !== "pro_plus") {
    window.location.replace("/upgrade");
    return null;
  }

  // Permission check for team members
  if (!isOwnBusiness && activePermissions && path) {
    const permKey = PATH_PERMISSION_MAP[path];
    if (permKey && activePermissions[permKey] !== true) {
      return <AccessDenied />;
    }
  }

  return (
    <DashboardLayout>
      <Component />
    </DashboardLayout>
  );
}

/**
 * HomeWithRedirect: redirects team members to their role-appropriate default page
 * e.g., kasir → /pos, gudang → /stok, finance → /transaksi
 */
function HomeWithRedirect() {
  const { user } = useAuth();
  const { activeRole, isOwnBusiness, isLoading } = useBusinessContext();

  if (!isLoading && user && !isOwnBusiness && activeRole) {
    const defaultPath = getDefaultPathForRole(activeRole);
    if (defaultPath !== "/") {
      window.location.replace(defaultPath);
      return null;
    }
  }

  return <Home />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomeWithRedirect} />
      <Route path="/sign-in/:rest*" component={CountySignIn} />
      <Route path="/sign-in" component={CountySignIn} />
      <Route path="/sign-up/:rest*" component={CountySignUp} />
      <Route path="/sign-up" component={CountySignUp} />
      <Route path="/dashboard">{() => { window.location.replace("/"); return null; }}</Route>
      <Route path="/transaksi">{() => <AuthenticatedRoute component={TransaksiPage} path="/transaksi" />}</Route>
      <Route path="/stok">{() => <AuthenticatedRoute component={StokProdukPage} path="/stok" />}</Route>
      <Route path="/laporan">{() => <AuthenticatedRoute component={LaporanPage} path="/laporan" />}</Route>
      <Route path="/pajak">{() => <AuthenticatedRoute component={PajakPage} path="/pajak" />}</Route>
      <Route path="/pengaturan">{() => <AuthenticatedRoute component={PengaturanPage} path="/pengaturan" />}</Route>
      <Route path="/admin">{() => <ProtectedRoute component={SuperAdminPage} allowedRoles={["admin"]} />}</Route>
      <Route path="/upgrade">{() => <AuthenticatedRoute component={UpgradePage} />}</Route>
      <Route path="/pos">{() => <AuthenticatedRoute component={POSPage} path="/pos" />}</Route>
      <Route path="/laporan-penjualan">{() => <AuthenticatedRoute component={LaporanPenjualan} path="/laporan-penjualan" />}</Route>
      <Route path="/laporan-pembelian">{() => <AuthenticatedRoute component={LaporanPembelian} path="/laporan-pembelian" />}</Route>
      <Route path="/jurnal">{() => <AuthenticatedRoute component={JurnalPribadi} path="/jurnal" />}</Route>
      <Route path="/riwayat-stok">{() => <AuthenticatedRoute component={RiwayatStok} path="/riwayat-stok" />}</Route>
      <Route path="/client">{() => <AuthenticatedRoute component={ClientManagement} path="/client" />}</Route>
      <Route path="/hutang-piutang">{() => <AuthenticatedRoute component={HutangPiutang} path="/hutang-piutang" />}</Route>
      <Route path="/anggaran">{() => <AuthenticatedRoute component={Anggaran} path="/anggaran" />}</Route>
      <Route path="/analitik">{() => <AuthenticatedRoute component={SalesAnalytics} path="/analitik" />}</Route>
      <Route path="/gudang">{() => <ProPlusRoute component={GudangPage} path="/gudang" />}</Route>
      <Route path="/purchase-order">{() => <AuthenticatedRoute component={PurchaseOrderPage} path="/purchase-order" />}</Route>
      <Route path="/marketing">{() => <ProPlusRoute component={MarketingPage} path="/marketing" />}</Route>
      <Route path="/staff">{() => <ProPlusRoute component={StaffManagementPage} path="/staff" />}</Route>
      <Route path="/invoice-settings">{() => <AuthenticatedRoute component={InvoiceSettingsPage} path="/invoice-settings" />}</Route>
      <Route path="/barcode">{() => <AuthenticatedRoute component={BarcodeManagerPage} path="/barcode" />}</Route>
      <Route path="/select-warehouse" component={WarehouseSelectPage} />
      <Route path="/rekening-koran">{() => <AuthenticatedRoute component={RekeningKoranPage} path="/rekening-koran" />}</Route>
      <Route path="/mutasi-persediaan">{() => <AuthenticatedRoute component={MutasiPersediaanPage} path="/mutasi-persediaan" />}</Route>
      <Route path="/penjualan-produk">{() => <AuthenticatedRoute component={PenjualanProduk} path="/penjualan-produk" />}</Route>
      <Route path="/ringkasan-pembayaran">{() => <AuthenticatedRoute component={RingkasanPembayaran} path="/ringkasan-pembayaran" />}</Route>
      <Route path="/top-produk">{() => <AuthenticatedRoute component={TopProduk} path="/top-produk" />}</Route>
      <Route path="/laporan-index">{() => <AuthenticatedRoute component={LaporanIndex} path="/laporan-index" />}</Route>
      <Route path="/laporan-gl">{() => <AuthenticatedRoute component={LaporanGL} path="/laporan-gl" />}</Route>
      <Route path="/jurnal-adjustment">{() => <AuthenticatedRoute component={JurnalAdjustment} path="/jurnal-adjustment" />}</Route>
      <Route path="/laba-rugi-detail">{() => <AuthenticatedRoute component={LabaRugiDetail} path="/laba-rugi-detail" />}</Route>
      <Route path="/penjualan-pelanggan">{() => <AuthenticatedRoute component={PenjualanPelanggan} path="/penjualan-pelanggan" />}</Route>
      <Route path="/penjualan-jam">{() => <AuthenticatedRoute component={PenjualanJam} path="/penjualan-jam" />}</Route>
      <Route path="/penjualan-tanggal">{() => <AuthenticatedRoute component={PenjualanTanggal} path="/penjualan-tanggal" />}</Route>
      <Route path="/penjualan-kredit">{() => <AuthenticatedRoute component={PenjualanKredit} path="/penjualan-kredit" />}</Route>
      <Route path="/ringkasan-diskon">{() => <AuthenticatedRoute component={RingkasanDiskon} path="/ringkasan-diskon" />}</Route>
      <Route path="/void-refund">{() => <AuthenticatedRoute component={VoidRefundAnalysis} path="/void-refund" />}</Route>
      <Route path="/komisi">{() => <AuthenticatedRoute component={KomisiStaff} path="/komisi" />}</Route>
      <Route path="/laporan-shift">{() => <AuthenticatedRoute component={LaporanShift} path="/laporan-shift" />}</Route>
      <Route path="/transaksi-tunai">{() => <AuthenticatedRoute component={TransaksiTunai} path="/transaksi-tunai" />}</Route>
      <Route path="/manajemen-rekening">{() => <AuthenticatedRoute component={ManajemenRekening} path="/manajemen-rekening" />}</Route>
      <Route path="/loyalty">{() => <AuthenticatedRoute component={LoyaltyManagement} path="/loyalty" />}</Route>
      <Route path="/valuasi-fifo">{() => <AuthenticatedRoute component={ValuasiFIFO} path="/valuasi-fifo" />}</Route>
      <Route path="/stok-kedaluwarsa">{() => <AuthenticatedRoute component={StokKedaluwarsa} path="/stok-kedaluwarsa" />}</Route>
      <Route path="/usia-stok">{() => <AuthenticatedRoute component={UsiaStok} path="/usia-stok" />}</Route>
      <Route path="/peringatan-stok">{() => <AuthenticatedRoute component={PeringatanStok} path="/peringatan-stok" />}</Route>
      <Route path="/pf-goals">{() => <AuthenticatedRoute component={PersonalGoals} />}</Route>
      <Route path="/onboarding" component={Home} />
      <Route path="/landing" component={LandingPage} />
      <Route path="/accept-invite" component={AcceptInvite} />
      <Route path="/panduan" component={Panduan} />
      <Route path="/panduan-akuntansi" component={PanduanAkuntansi} />
      <Route path="/pro/:token" component={ProActivation} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable={true}>
        <BusinessProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </BusinessProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
