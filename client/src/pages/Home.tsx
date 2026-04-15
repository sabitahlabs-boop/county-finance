import { useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import Dashboard from "./Dashboard";
import Onboarding from "./Onboarding";
import LandingPage from "./LandingPage";
import { DashboardLayoutSkeleton } from "@/components/DashboardLayoutSkeleton";

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const { data: business, isLoading: bizLoading, refetch } = trpc.business.mine.useQuery(undefined, {
    enabled: !!user,
    retry: false,
  });
  const [, navigate] = useLocation();

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

  // Logged in with business — show dashboard
  return (
    <DashboardLayout>
      <Dashboard />
    </DashboardLayout>
  );
}
