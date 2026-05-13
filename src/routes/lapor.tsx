import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Send, Upload } from "lucide-react";

export const Route = createFileRoute("/lapor")({
  head: () => ({ meta: [{ title: "Buat Laporan — Sapa RW 4" }] }),
  component: LaporPage,
});

const schema = z.object({
  title: z.string().trim().min(4, "Judul minimal 4 karakter").max(120),
  kategori: z.enum(["Keamanan", "Sampah", "Infrastruktur", "Lainnya"]),
  alamat: z.string().trim().min(3, "Alamat detail wajib diisi").max(200),
  deskripsi: z.string().trim().min(10, "Deskripsi minimal 10 karakter").max(1000),
});

function LaporPage() {
  const { user, profile, role, loading } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [form, setForm] = useState({
    title: "",
    kategori: "" as "" | "Keamanan" | "Sampah" | "Infrastruktur" | "Lainnya",
    alamat: "",
    deskripsi: "",
  });

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !profile?.rt_number) {
      return toast.error("Profil belum lengkap. Lengkapi RT di halaman profil.");
    }
    const parsed = schema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    setSubmitting(true);
    try {
      let foto_url: string | null = null;
      if (photo) {
        if (photo.size > 5 * 1024 * 1024) throw new Error("Foto maksimal 5MB");
        const ext = photo.name.split(".").pop();
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage.from("report-photos").upload(path, photo);
        if (upErr) throw upErr;
        foto_url = path;
      }
      const { data, error } = await supabase.from("reports").insert({
        ...parsed.data,
        foto_url,
        rt_tujuan: profile.rt_number,
        user_id: user.id,
      }).select("id").single();
      if (error) throw error;
      toast.success("Laporan berhasil dikirim!");
      navigate({ to: "/laporan/$id", params: { id: data.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengirim laporan");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !user || role !== "warga") {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Memuat...</div>;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader />
      <main className="mx-auto max-w-2xl px-4 py-5">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </Link>
        <h1 className="mt-3 text-xl font-bold sm:text-2xl">Buat Laporan Baru</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Laporan akan diteruskan ke pengurus {profile?.rt_number?.replace("RT0","RT 0")}.
        </p>

        <Card className="mt-4 p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Judul Laporan</Label>
              <Input id="title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Contoh: Lampu jalan padam" required />
            </div>

            <div className="space-y-1.5">
              <Label>Kategori</Label>
              <Select value={form.kategori} onValueChange={v => setForm({ ...form, kategori: v as typeof form.kategori })}>
                <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                <SelectContent>
                  {["Keamanan","Sampah","Infrastruktur","Lainnya"].map(k =>
                    <SelectItem key={k} value={k}>{k}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="alamat">Lokasi Detail</Label>
              <Input id="alamat" value={form.alamat} onChange={e => setForm({ ...form, alamat: e.target.value })} placeholder="Jl. Mawar No. 12, depan masjid" required />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="desk">Deskripsi</Label>
              <Textarea id="desk" rows={5} value={form.deskripsi} onChange={e => setForm({ ...form, deskripsi: e.target.value })} placeholder="Jelaskan kejadian secara detail..." required />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="foto">Foto Pendukung (opsional)</Label>
              <label htmlFor="foto" className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-input bg-muted/30 px-4 py-3 text-sm transition hover:bg-muted/50">
                <Upload className="h-4 w-4 text-muted-foreground" />
                <span className="truncate text-muted-foreground">{photo ? photo.name : "Pilih foto (maks. 5MB)"}</span>
                <input id="foto" type="file" accept="image/*" className="hidden" onChange={e => setPhoto(e.target.files?.[0] ?? null)} />
              </label>
            </div>

            <Button type="submit" size="lg" className="w-full gap-2" disabled={submitting}>
              <Send className="h-4 w-4" />
              {submitting ? "Mengirim..." : "Kirim Laporan"}
            </Button>
          </form>
        </Card>
      </main>
      <BottomNav />
    </div>
  );
}
