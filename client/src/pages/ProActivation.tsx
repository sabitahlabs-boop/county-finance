import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Loader2, CheckCircle, XCircle, ArrowRight, Shield } from "lucide-react";
import { toast } from "sonner";

export default function ProActivation() {
  const [, params] = useRoute("/pro/:token");
  const token = params?.token ?? "";
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [activated, setActivated] = useState(false);
  const [activationAttempted, setActivationAttempted] = useState(false);

  // Validate the token first (public, no auth needed)
  const { data: validation, isLoading: validating } = trpc.proLink.validate.useQuery(
    { token },
    { enabled: !!token, retry: false }
  );

  // Activation mutation (requires auth)
  const activate = trpc.proLink.activate.useMutation({
    onSuccess: () => {
      setActivated(true);
      sessionStorage.removeItem("pro_activation_token");
    },
    onError: (err) => toast.error(err.message),
  });

  // Store token in sessionStorage so we can use it after OAuth redirect
  useEffect(() => {
    if (token) {
      sessionStorage.setItem("pro_activation_token", token);
    }
  }, [token]);

  // After OAuth login, auto-activate if token is valid and user is logged in
  useEffect(() => {
    if (user && validation?.valid && !activated && !activationAttempted && !activate.isPending) {
      setActivationAttempted(true);
      activate.mutate({ token });
    }
  }, [user, validation?.valid, activated, activationAttempted, activate.isPending, token]);

  // Loading state
  if (authLoading || validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a1628] to-[#1a2d4e]">
        <Card className="max-w-md w-full mx-4 border-0 shadow-2xl">
          <CardContent className="py-12 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-[#1E4D9B] mx-auto mb-4" />
            <p className="text-muted-foreground">Memverifikasi link...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Invalid token
  if (!validation?.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a1628] to-[#1a2d4e]">
        <Card className="max-w-md w-full mx-4 border-0 shadow-2xl">
          <CardContent className="py-12 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Link Tidak Valid</h2>
            <p className="text-muted-foreground text-sm mb-6">
              {validation?.error || "Link aktivasi ini sudah digunakan atau tidak valid."}
            </p>
            <Button variant="outline" onClick={() => navigate("/")}>
              Kembali ke Beranda
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Activated successfully!
  if (activated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a1628] to-[#1a2d4e]">
        <Card className="max-w-md w-full mx-4 border-0 shadow-2xl">
          <CardContent className="py-12 text-center">
            <div className="relative mx-auto w-16 h-16 mb-4">
              <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" />
              <div className="relative flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full">
                <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2">Selamat! Akun Pro Aktif!</h2>
            <p className="text-muted-foreground text-sm mb-2">
              Halo <strong>{validation.buyerName || validation.email}</strong>,
            </p>
            <p className="text-muted-foreground text-sm mb-6">
              Akun County Pro Anda berhasil diaktifkan. Nikmati semua fitur premium tanpa batas!
            </p>
            <div className="flex flex-col gap-2">
              <Button
                className="w-full bg-[#1E4D9B] hover:bg-[#163d7a]"
                onClick={() => navigate("/dashboard")}
              >
                <Crown className="h-4 w-4 mr-2" />
                Masuk ke Dashboard Pro
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Activation error — need to complete onboarding first
  if (activate.isError) {
    const isPrecondition = activate.error?.message?.includes("setup bisnis") || activate.error?.data?.code === "PRECONDITION_FAILED";
    
    if (isPrecondition) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a1628] to-[#1a2d4e]">
          <Card className="max-w-md w-full mx-4 border-0 shadow-2xl">
            <CardContent className="py-12 text-center">
              <Shield className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Satu Langkah Lagi</h2>
              <p className="text-muted-foreground text-sm mb-6">
                Silakan selesaikan setup bisnis terlebih dahulu. Setelah selesai, klik tombol di bawah untuk mengaktifkan Pro.
              </p>
              <div className="flex flex-col gap-2">
                <Button
                  className="w-full bg-[#1E4D9B] hover:bg-[#163d7a]"
                  onClick={() => {
                    // Navigate to home which will show onboarding if no business
                    // Store token so we can come back
                    sessionStorage.setItem("pro_activation_token", token);
                    navigate("/");
                  }}
                >
                  Setup Bisnis Dulu
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    // Retry activation (maybe they completed onboarding in another tab)
                    setActivationAttempted(false);
                    activate.reset();
                  }}
                >
                  Coba Aktifkan Lagi
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Other errors
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a1628] to-[#1a2d4e]">
        <Card className="max-w-md w-full mx-4 border-0 shadow-2xl">
          <CardContent className="py-12 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Gagal Mengaktifkan</h2>
            <p className="text-muted-foreground text-sm mb-6">
              {activate.error?.message || "Terjadi kesalahan saat mengaktifkan akun Pro."}
            </p>
            <div className="flex flex-col gap-2">
              <Button
                className="w-full bg-[#1E4D9B] hover:bg-[#163d7a]"
                onClick={() => {
                  setActivationAttempted(false);
                  activate.reset();
                }}
              >
                Coba Lagi
              </Button>
              <Button variant="outline" onClick={() => navigate("/")}>
                Kembali ke Beranda
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Valid token, but user not logged in — show login prompt
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a1628] to-[#1a2d4e]">
        <Card className="max-w-md w-full mx-4 border-0 shadow-2xl">
          <CardContent className="py-12 text-center">
            <div className="bg-gradient-to-br from-[#1E4D9B] to-[#F47920] p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Crown className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Aktivasi County Pro</h2>
            <p className="text-muted-foreground text-sm mb-1">
              Link ini disiapkan untuk:
            </p>
            <p className="font-semibold text-[#1E4D9B] mb-4">
              {validation.buyerName ? `${validation.buyerName} (${validation.email})` : validation.email}
            </p>
            <p className="text-muted-foreground text-sm mb-6">
              Silakan login atau daftar untuk mengaktifkan akun Pro Anda.
            </p>
            <Button
              className="w-full bg-[#1E4D9B] hover:bg-[#163d7a] text-white"
              onClick={() => {
                // Store current URL so after OAuth we come back here
                sessionStorage.setItem("pro_return_url", window.location.pathname);
                window.location.href = getLoginUrl();
              }}
            >
              Login & Aktifkan Pro
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <p className="text-xs text-muted-foreground mt-4">
              Gunakan email yang sama dengan yang didaftarkan saat pembelian.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Activating...
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a1628] to-[#1a2d4e]">
      <Card className="max-w-md w-full mx-4 border-0 shadow-2xl">
        <CardContent className="py-12 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#1E4D9B] mx-auto mb-4" />
          <p className="text-muted-foreground">Mengaktifkan akun Pro Anda...</p>
        </CardContent>
      </Card>
    </div>
  );
}
