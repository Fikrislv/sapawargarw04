import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, MessageSquareText } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login Admin — Sapa RW 4" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // signup
  const [sEmail, setSEmail] = useState("");
  const [sPass, setSPass] = useState("");
  const [sWilayah, setSWilayah] = useState<string>("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Login berhasil");
    navigate({ to: "/dashboard" });
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!sWilayah) return toast.error("Pilih wilayah");
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: sEmail,
      password: sPass,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { wilayah: sWilayah },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Pendaftaran berhasil. Silakan login. (Akun perlu di-set role oleh admin.)");
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex h-14 max-w-5xl items-center px-4">
        <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </Link>
      </div>

      <div className="mx-auto max-w-md px-4 py-6 sm:py-12">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <MessageSquareText className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold">Portal Admin</h1>
          <p className="mt-1 text-sm text-muted-foreground">Login untuk pengurus RT 01–05 dan RW 04</p>
        </div>

        <Card className="p-5">
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Daftar</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-5">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pw">Password</Label>
                  <Input id="pw" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Memproses..." : "Masuk"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-5">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="se">Email</Label>
                  <Input id="se" type="email" value={sEmail} onChange={e => setSEmail(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sp">Password</Label>
                  <Input id="sp" type="password" minLength={6} value={sPass} onChange={e => setSPass(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Wilayah</Label>
                  <Select value={sWilayah} onValueChange={setSWilayah}>
                    <SelectTrigger><SelectValue placeholder="Pilih wilayah" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RW04">RW 04 (Pusat)</SelectItem>
                      <SelectItem value="RT01">RT 01</SelectItem>
                      <SelectItem value="RT02">RT 02</SelectItem>
                      <SelectItem value="RT03">RT 03</SelectItem>
                      <SelectItem value="RT04">RT 04</SelectItem>
                      <SelectItem value="RT05">RT 05</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Memproses..." : "Daftar Akun"}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Setelah daftar, hubungi admin RW untuk aktivasi role akun Anda.
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
