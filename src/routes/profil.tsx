import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogOut, User as UserIcon } from "lucide-react";

export const Route = createFileRoute("/profil")({
  head: () => ({ meta: [{ title: "Profil — Sapa RW 4" }] }),
  component: ProfilPage,
});

function ProfilPage() {
  const { user, profile, role, loading, signOut, refresh } = useAuth();
  const navigate = useNavigate();
  const [full_name, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setPhone(profile.phone ?? "");
    }
  }, [profile]);

  if (loading || !user) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Memuat...</div>;

  async function save() {
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ full_name, phone }).eq("id", user!.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    await refresh();
    toast.success("Profil diperbarui");
  }

  const roleLabel =
    role === "admin_rw" ? "Admin RW 04" :
    role === "admin_rt" ? `Admin ${profile?.wilayah?.replace("RT0","RT 0")}` :
    role === "warga" ? `Warga ${profile?.rt_number?.replace("RT0","RT 0") ?? ""}` : "Belum aktif";

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader />
      <main className="mx-auto max-w-2xl px-4 py-5">
        <h1 className="text-xl font-bold sm:text-2xl">Profil Saya</h1>

        <Card className="mt-4 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UserIcon className="h-7 w-7" />
            </div>
            <div className="min-w-0">
              <div className="truncate font-semibold">{profile?.full_name ?? user.email}</div>
              <div className="truncate text-xs text-muted-foreground">{user.email}</div>
              <div className="mt-1 inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">{roleLabel}</div>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="fn">Nama Lengkap</Label>
              <Input id="fn" value={full_name} onChange={e => setFullName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ph">WhatsApp</Label>
              <Input id="ph" type="tel" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <Button onClick={save} disabled={saving} className="w-full">
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </div>
        </Card>

        <Button
          variant="outline"
          className="mt-4 w-full gap-2"
          onClick={async () => { await signOut(); navigate({ to: "/login" }); }}
        >
          <LogOut className="h-4 w-4" /> Keluar
        </Button>
      </main>
      <BottomNav />
    </div>
  );
}
