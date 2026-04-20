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
import LaporanPenjualan from "./pages/LaporanPenjualan";
import GudangPage from "./pages/Gudang";
import AcceptInvite from "./pages/AcceptInvite";
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
import LaporanShift from "./pages/LaporanShift";
import TransaksiTunai from "./pages/TransaksiTunai";
import ManajemenRekening from "./pages/ManajemenRekening";
import LoyaltyManagement from "./pages/LoyaltyManagement";
import ValuasiFIFO from "./pages/ValuasiFIFO";
import StokKedaluwarsa from "./pages/StokKedaluwarsa";
import UsiaStok from "./pages/UsiaStok";
import PeringatanStok from "./pages/PeringatanStok";
import { BusinessProvider } from "./contexts/BusinessContext";

function AccessDenied() {
  return (
    <DashboardLayout>
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Akses Ditolak</h1>
          <p className="text-gray-600 mb-6">Anda tidak memiliki izin untuk halaman ini</p>
          <a href="/" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Kembali ke Home
          </a>
        </div>
      </div>
    </DashboardLayout>
  );
}

function AuthenticatedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, loading: authLoading } = useAuth();
  const { data: business, isLoading: bizLoading, refetch } = trpc.business.mine.useQuery(undefined, {
    enabled: !!user,
    retry: false,
  });

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
    return <Onboarding onComplete={() => refetch()} />;
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
  const { user, loading: authLoading } = useAuth();
  const { data: business, isLoading: bizLoading, refetch } = trpc.business.mine.useQuery(undefined, {
    enabled: !!user,
    retry: false,
  });

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

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/sign-in/:rest*" component={CountySignIn} />
      <Route path="/sign-in" component={CountySignIn} />
      <Route path="/sign-up/:rest*" component={CountySignUp} />
      <Route path="/sign-up" component={CountySignUp} />
      <Route path="/dashboard">{() => { window.location.replace("/"); return null; }}</Route>
      <Route path="/transaksi">{() => <AuthenticatedRoute component={TransaksiPage} />}</Route>
      <Route path="/stok">{() => <AuthenticatedRoute component={StokProdukPage} />}</Route>
      <Route path="/laporan">{() => <AuthenticatedRoute component={LaporanPage} />}</Route>
      <Route path="/pajak">{() => <AuthenticatedRoute component={PajakPage} />}</Route>
      <Route path="/pengaturan">{() => <ProtectedRoute component={PengaturanPage} allowedRoles={["admin", "owner"]} />}</Route>
      <Route path="/admin">{() => <ProtectedRoute component={SuperAdminPage} allowedRoles={["admin"]} />}</Route>
      <Route path="/upgrade">{() => <AuthenticatedRoute component={UpgradePage} />}</Route>
      <Route path="/pos">{() => <AuthenticatedRoute component={POSPage} />}</Route>
      <Route path="/laporan-penjualan">{() => <AuthenticatedRoute component={LaporanPenjualan} />}</Route>
      <Route path="/jurnal">{() => <AuthenticatedRoute component={JurnalPribadi} />}</Route>
      <Route path="/riwayat-stok">{() => <AuthenticatedRoute component={RiwayatStok} />}</Route>
      <Route path="/client">{() => <AuthenticatedRoute component={ClientManagement} />}</Route>
      <Route path="/hutang-piutang">{() => <AuthenticatedRoute component={HutangPiutang} />}</Route>
      <Route path="/anggaran">{() => <ProtectedRoute component={Anggaran} allowedRoles={["admin", "owner"]} />}</Route>
      <Route path="/analitik">{() => <AuthenticatedRoute component={SalesAnalytics} />}</Route>
      <Route path="/gudang">{() => <AuthenticatedRoute component={GudangPage} />}</Route>
      <Route path="/purchase-order">{() => <AuthenticatedRoute component={PurchaseOrderPage} />}</Route>
      <Route path="/marketing">{() => <ProtectedRoute component={MarketingPage} allowedRoles={["admin", "owner"]} />}</Route>
      <Route path="/staff">{() => <ProtectedRoute component={StaffManagementPage} allowedRoles={["admin", "owner"]} />}</Route>
      <Route path="/invoice-settings">{() => <ProtectedRoute component={InvoiceSettingsPage} allowedRoles={["admin", "owner"]} />}</Route>
      <Route path="/barcode">{() => <AuthenticatedRoute component={BarcodeManagerPage} />}</Route>
      <Route path="/select-warehouse" component={WarehouseSelectPage} />
      <Route path="/rekening-koran">{() => <AuthenticatedRoute component={RekeningKoranPage} />}</Route>
      <Route path="/mutasi-persediaan">{() => <AuthenticatedRoute component={MutasiPersediaanPage} />}</Route>
      <Route path="/penjualan-produk">{() => <AuthenticatedRoute component={PenjualanProduk} />}</Route>
      <Route path="/ringkasan-pembayaran">{() => <AuthenticatedRoute component={RingkasanPembayaran} />}</Route>
      <Route path="/top-produk">{() => <AuthenticatedRoute component={TopProduk} />}</Route>
      <Route path="/laporan-index">{() => <AuthenticatedRoute component={LaporanIndex} />}</Route>
      <Route path="/penjualan-pelanggan">{() => <AuthenticatedRoute component={PenjualanPelanggan} />}</Route>
      <Route path="/penjualan-jam">{() => <AuthenticatedRoute component={PenjualanJam} />}</Route>
      <Route path="/penjualan-tanggal">{() => <AuthenticatedRoute component={PenjualanTanggal} />}</Route>
      <Route path="/penjualan-kredit">{() => <AuthenticatedRoute component={PenjualanKredit} />}</Route>
      <Route path="/ringkasan-diskon">{() => <AuthenticatedRoute component={RingkasanDiskon} />}</Route>
      <Route path="/void-refund">{() => <AuthenticatedRoute component={VoidRefundAnalysis} />}</Route>
      <Route path="/komisi">{() => <AuthenticatedRoute component={KomisiStaff} />}</Route>
      <Route path="/laporan-shift">{() => <AuthenticatedRoute component={LaporanShift} />}</Route>
      <Route path="/transaksi-tunai">{() => <AuthenticatedRoute component={TransaksiTunai} />}</Route>
      <Route path="/manajemen-rekening">{() => <AuthenticatedRoute component={ManajemenRekening} />}</Route>
      <Route path="/loyalty">{() => <AuthenticatedRoute component={LoyaltyManagement} />}</Route>
      <Route path="/valuasi-fifo">{() => <AuthenticatedRoute component={ValuasiFIFO} />}</Route>
      <Route path="/stok-kedaluwarsa">{() => <AuthenticatedRoute component={StokKedaluwarsa} />}</Route>
      <Route path="/usia-stok">{() => <AuthenticatedRoute component={UsiaStok} />}</Route>
      <Route path="/peringatan-stok">{() => <AuthenticatedRoute component={PeringatanStok} />}</Route>
      <Route path="/onboarding" component={Home} />
      <Route path="/landing" component={LandingPage} />
      <Route path="/accept-invite" component={AcceptInvite} />
      <Route path="/panduan" component={Panduan} />
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
