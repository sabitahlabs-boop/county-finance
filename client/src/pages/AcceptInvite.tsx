import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, Users2 } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

export default function AcceptInvite() {
  const [, setLocation] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "accepting" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (t) {
      setToken(t);
      setStatus("ready");
    } else {
      setStatus("error");
      setErrorMsg("Link undangan tidak valid — token tidak ditemukan.");
    }
  }, []);

  const acceptMut = trpc.team.acceptInvite.useMutation({
    onSuccess: () => {
      setStatus("success");
      setTimeout(() => setLocation("/"), 2000);
    },
    onError: (err) => {
      setStatus("error");
      setErrorMsg(err.message || "Gagal menerima undangan");
    },
  });

  const handleAccept = () => {
    setStatus("accepting");
    acceptMut.mutate({ token });
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50 dark:from-blue-950/30 dark:via-sky-950/20 dark:to-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50 dark:from-blue-950/30 dark:via-sky-950/20 dark:to-background p-4">
      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 h-16 w-16 rounded-2xl bg-gradient-to-br from-[#1E4D9B] to-[#2563EB] flex items-center justify-center">
            <Users2 className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-xl">Undangan Tim County</CardTitle>
          <CardDescription>Anda diundang untuk bergabung ke tim bisnis</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!user ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Anda harus login terlebih dahulu untuk menerima undangan ini.
              </p>
              <Button
                className="w-full bg-gradient-to-r from-[#1E4D9B] to-[#2563EB]"
                onClick={() => { window.location.href = getLoginUrl(); }}
              >
                Login untuk Melanjutkan
              </Button>
            </div>
          ) : status === "loading" ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : status === "ready" ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-4 text-center">
                <p className="text-sm">Login sebagai: <strong>{user.name || user.email}</strong></p>
              </div>
              <Button className="w-full" onClick={handleAccept}>
                Terima Undangan & Bergabung
              </Button>
              <Button variant="outline" className="w-full" onClick={() => setLocation("/")}>
                Batal
              </Button>
            </div>
          ) : status === "accepting" ? (
            <div className="flex flex-col items-center py-4 gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Memproses undangan...</p>
            </div>
          ) : status === "success" ? (
            <div className="flex flex-col items-center py-4 gap-2">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <p className="font-medium text-green-700 dark:text-green-400">Berhasil bergabung!</p>
              <p className="text-xs text-muted-foreground">Mengalihkan ke dashboard...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center py-4 gap-2">
              <XCircle className="h-12 w-12 text-red-500" />
              <p className="font-medium text-red-700 dark:text-red-400">Gagal</p>
              <p className="text-sm text-muted-foreground text-center">{errorMsg}</p>
              <Button variant="outline" className="mt-2" onClick={() => setLocation("/")}>
                Kembali ke Dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
