import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquareText } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Masuk — Sapa RW 4" }] }),
  component: LoginPage,
});

const signupSchema = z.object({
  full_name: z.string().trim().min(2, "Nama minimal 2 karakter").max(100),
  phone: z.string().trim().min(8, "Nomor WhatsApp tidak valid").max(20),
  rt_number: z.enum(["RT01", "RT02", "RT03", "RT04", "RT05"]),
  email: z.string().trim().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

function LoginPage() {
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user && role) navigate({ to: "/dashboard" });
  }, [user, role, authLoading, navigate]);

  // login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // signup (warga)
  const [s, setS] = useState({
    full_name: "",
    phone: "",
    rt_number: "" as "" | "RT01" | "RT02" | "RT03" | "RT04" | "RT05",
    email: "",
    password: "",
  });

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Masuk berhasil");
    navigate({ to: "/dashboard" });
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    const parsed = signupSchema.safeParse(s);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          full_name: parsed.data.full_name,
          phone: parsed.data.phone,
          rt_number: parsed.data.rt_number,
        },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Pendaftaran berhasil! Silakan periksa email untuk verifikasi, lalu login.");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-background">
      <div className="mx-auto max-w-md px-4 py-8 sm:py-14">
        <div className="mb-6 text-center">
          <Link to="/" className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <MessageSquareText className="h-7 w-7" />
          </Link>
          <h1 className="mt-3 text-2xl font-bold">Sapa RW 4</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sistem pelaporan warga RW 04</p>
        </div>

        <Card className="p-5">
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Masuk</TabsTrigger>
              <TabsTrigger value="signup">Daftar Warga</TabsTrigger>
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
              <form onSubmit={handleSignup} className="space-y-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="fn">Nama Lengkap</Label>
                  <Input id="fn" value={s.full_name} onChange={e => setS({ ...s, full_name: e.target.value })} placeholder="Budi Santoso" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ph">Nomor WhatsApp</Label>
                  <Input id="ph" type="tel" value={s.phone} onChange={e => setS({ ...s, phone: e.target.value })} placeholder="08xxxxxxxxxx" required />
                </div>
                <div className="space-y-1.5">
                  <Label>Wilayah RT</Label>
                  <Select value={s.rt_number} onValueChange={v => setS({ ...s, rt_number: v as typeof s.rt_number })}>
                    <SelectTrigger><SelectValue placeholder="Pilih RT Anda" /></SelectTrigger>
                    <SelectContent>
                      {["RT01","RT02","RT03","RT04","RT05"].map(r => (
                        <SelectItem key={r} value={r}>{r.replace("RT0","RT 0")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="se">Email</Label>
                  <Input id="se" type="email" value={s.email} onChange={e => setS({ ...s, email: e.target.value })} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sp">Password</Label>
                  <Input id="sp" type="password" minLength={6} value={s.password} onChange={e => setS({ ...s, password: e.target.value })} required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Memproses..." : "Daftar Akun"}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Akun pengurus RT/RW dibuat oleh admin RW 04.
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
