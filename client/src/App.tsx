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
import { BusinessProvider } from "./contexts/BusinessContext";

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
      <Route path="/pengaturan">{() => <AuthenticatedRoute component={PengaturanPage} />}</Route>
      <Route path="/admin">{() => <AuthenticatedRoute component={SuperAdminPage} />}</Route>
      <Route path="/upgrade">{() => <AuthenticatedRoute component={UpgradePage} />}</Route>
      <Route path="/pos">{() => <AuthenticatedRoute component={POSPage} />}</Route>
      <Route path="/laporan-penjualan">{() => <AuthenticatedRoute component={LaporanPenjualan} />}</Route>
      <Route path="/jurnal">{() => <AuthenticatedRoute component={JurnalPribadi} />}</Route>
      <Route path="/riwayat-stok">{() => <AuthenticatedRoute component={RiwayatStok} />}</Route>
      <Route path="/client">{() => <AuthenticatedRoute component={ClientManagement} />}</Route>
      <Route path="/hutang-piutang">{() => <AuthenticatedRoute component={HutangPiutang} />}</Route>
      <Route path="/anggaran">{() => <AuthenticatedRoute component={Anggaran} />}</Route>
      <Route path="/analitik">{() => <AuthenticatedRoute component={SalesAnalytics} />}</Route>
      <Route path="/gudang">{() => <AuthenticatedRoute component={GudangPage} />}</Route>
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
