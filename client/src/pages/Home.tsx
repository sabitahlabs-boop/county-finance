import { useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import Dashboard from "./Dashboard";
import PersonalDashboard from "./PersonalDashboard";
import PersonalSetupWizard from "./PersonalSetupWizard";
import Onboarding from "./Onboarding";
import BusinessProfileWizard from "@/components/BusinessProfileWizard";
import LandingPage from "./LandingPage";
import { DashboardLayoutSkeleton } from "@/components/DashboardLayoutSkeleton";

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const { data: business, isLoading: bizLoading, refetch } = trpc.business.mine.useQuery(undefined, {
    enabled: !!user,
    retry: false,
  });
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  // After OAuth login, check if there's a pending pro activation token
  // If so, redirect back to the pro activation page
  useEffect(() => {
    if (user && !authLoading) {
      const pendingToken = sessionStorage.getItem("pro_activation_token");
      const returnUrl = sessionStorage.getItem("pro_return_url");
      if (pendingToken && returnUrl) {
        // Clear the return URL (keep the token for the activation page)
        sessionStorage.removeItem("pro_return_url");
        navigate(returnUrl);
      }
    }
  }, [user, authLoading, navigate]);

  if (authLoading || (user && bizLoading)) {
    return <DashboardLayoutSkeleton />;
  }

  // Not logged in — show marketing landing page
  if (!user) {
    return <LandingPage />;
  }

  // Logged in but no business — show onboarding
  // After onboarding completes, check for pending pro activation
  if (!business) {
    return (
      <Onboarding
        onComplete={() => {
          refetch().then(() => {
            // After onboarding, check if there's a pending pro activation
            const pendingToken = sessionStorage.getItem("pro_activation_token");
            if (pendingToken) {
              navigate(`/pro/${pendingToken}`);
            }
          });
        }}
      />
    );
  }

  // Logged in with business — determine mode
  const isPersonal = business.appMode === "personal";
  const pfSetupDone = business.personalSetupDone;

  // Personal mode but setup belum selesai → wajib setup wizard dulu
  // Berlaku untuk SEMUA pengguna (baru maupun existing) yang switch ke personal mode
  if (isPersonal && !pfSetupDone) {
    return (
      <PersonalSetupWizard
        onComplete={() => {
          utils.business.mine.invalidate();
          refetch().then(() => {
            const pendingToken = sessionStorage.getItem("pro_activation_token");
            if (pendingToken) {
              navigate(`/pro/${pendingToken}`);
            }
          });
        }}
      />
    );
  }

  // Personal mode with setup done → PINA-style dashboard
  if (isPersonal && pfSetupDone) {
    return (
      <DashboardLayout>
        <PersonalDashboard />
      </DashboardLayout>
    );
  }

  // UMKM mode — check if progressive onboarding is needed
  // Only show wizard for users who explicitly haven't completed onboarding yet
  // Existing users (onboardingCompleted=true) skip wizard even if enabledFeatures is empty
  const enabledFeatures = (business.enabledFeatures ?? []) as string[];
  const needsProgressiveSetup = enabledFeatures.length === 0 && !business.onboardingCompleted;

  if (needsProgressiveSetup) {
    return (
      <BusinessProfileWizard
        currentBusinessType={business.businessType}
        onComplete={() => {
          utils.business.mine.invalidate();
          refetch();
        }}
      />
    );
  }

  // UMKM mode → standard dashboard
  return (
    <DashboardLayout>
      <Dashboard />
    </DashboardLayout>
  );
}
