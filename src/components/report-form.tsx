import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Send, Upload, CheckCircle2 } from "lucide-react";
import { z } from "zod";

const schema = z.object({
  nama_pelapor: z.string().trim().min(2, "Nama minimal 2 karakter").max(100),
  whatsapp: z.string().trim().min(8, "Nomor WhatsApp tidak valid").max(20),
  alamat: z.string().trim().min(3).max(200),
  rt_tujuan: z.enum(["RT01", "RT02", "RT03", "RT04", "RT05"]),
  kategori: z.enum(["Keamanan", "Sampah", "Infrastruktur", "Lainnya"]),
  deskripsi: z.string().trim().min(10, "Deskripsi minimal 10 karakter").max(1000),
});

export function ReportForm() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [form, setForm] = useState({
    nama_pelapor: "",
    whatsapp: "",
    alamat: "",
    rt_tujuan: "" as "" | "RT01" | "RT02" | "RT03" | "RT04" | "RT05",
    kategori: "" as "" | "Keamanan" | "Sampah" | "Infrastruktur" | "Lainnya",
    deskripsi: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    try {
      let foto_url: string | null = null;
      if (photo) {
        if (photo.size > 5 * 1024 * 1024) throw new Error("Foto maksimal 5MB");
        const ext = photo.name.split(".").pop();
        const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage.from("report-photos").upload(path, photo);
        if (upErr) throw upErr;
        foto_url = supabase.storage.from("report-photos").getPublicUrl(path).data.publicUrl;
      }
      const { error } = await supabase.from("reports").insert({ ...parsed.data, foto_url });
      if (error) throw error;
      setDone(true);
      toast.success("Laporan berhasil dikirim!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengirim laporan");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <Card className="p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-semibold">Laporan Terkirim</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Terima kasih. Laporan Anda akan segera ditinjau oleh pengurus {form.rt_tujuan}.
        </p>
        <Button className="mt-6" onClick={() => { setDone(false); setForm({ nama_pelapor: "", whatsapp: "", alamat: "", rt_tujuan: "", kategori: "", deskripsi: "" }); setPhoto(null); }}>
          Kirim Laporan Lain
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-5 sm:p-7" style={{ background: "var(--gradient-card)", boxShadow: "var(--shadow-soft)" }}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="nama">Nama Lengkap</Label>
            <Input id="nama" value={form.nama_pelapor} onChange={e => setForm({ ...form, nama_pelapor: e.target.value })} placeholder="Budi Santoso" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="wa">Nomor WhatsApp</Label>
            <Input id="wa" type="tel" value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} placeholder="08xxxxxxxxxx" required />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="alamat">Alamat</Label>
          <Input id="alamat" value={form.alamat} onChange={e => setForm({ ...form, alamat: e.target.value })} placeholder="Jl. Mawar No. 12" required />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>RT Tujuan</Label>
            <Select value={form.rt_tujuan} onValueChange={(v) => setForm({ ...form, rt_tujuan: v as typeof form.rt_tujuan })}>
              <SelectTrigger><SelectValue placeholder="Pilih RT" /></SelectTrigger>
              <SelectContent>
                {["RT01","RT02","RT03","RT04","RT05"].map(r => <SelectItem key={r} value={r}>{r.replace("RT0","RT 0")}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Kategori</Label>
            <Select value={form.kategori} onValueChange={(v) => setForm({ ...form, kategori: v as typeof form.kategori })}>
              <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
              <SelectContent>
                {["Keamanan","Sampah","Infrastruktur","Lainnya"].map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="desk">Deskripsi Laporan</Label>
          <Textarea id="desk" rows={4} value={form.deskripsi} onChange={e => setForm({ ...form, deskripsi: e.target.value })} placeholder="Jelaskan kejadian secara detail..." required />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="foto">Foto Pendukung (opsional)</Label>
          <label htmlFor="foto" className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-input bg-muted/30 px-4 py-3 text-sm transition hover:bg-muted/50">
            <Upload className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground truncate">{photo ? photo.name : "Pilih foto (maks. 5MB)"}</span>
            <input id="foto" type="file" accept="image/*" className="hidden" onChange={e => setPhoto(e.target.files?.[0] ?? null)} />
          </label>
        </div>

        <Button type="submit" className="w-full gap-2" size="lg" disabled={loading}>
          <Send className="h-4 w-4" />
          {loading ? "Mengirim..." : "Kirim Laporan"}
        </Button>
      </form>
    </Card>
  );
}
