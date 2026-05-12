import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MapPin, Phone, User, Calendar, Image as ImageIcon, MessageSquare, Inbox } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard Admin — Sapa RW 4" }] }),
  component: Dashboard,
});

type Status = "Menunggu" | "Diproses" | "Selesai";
type RT = "RT01" | "RT02" | "RT03" | "RT04" | "RT05";

interface Report {
  id: string;
  created_at: string;
  nama_pelapor: string;
  whatsapp: string;
  alamat: string;
  rt_tujuan: RT;
  kategori: string;
  deskripsi: string;
  foto_url: string | null;
  status: Status;
  tanggapan_admin: string | null;
}

const statusColor: Record<Status, string> = {
  Menunggu: "bg-warning/15 text-warning-foreground border-warning/30",
  Diproses: "bg-primary/10 text-primary border-primary/30",
  Selesai: "bg-success/15 text-success border-success/30",
};

function Dashboard() {
  const { user, profile, role, loading } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | Status>("all");
  const [rtFilter, setRtFilter] = useState<"all" | RT>("all");
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    void fetchReports();
  }, [user]);

  async function fetchReports() {
    setFetching(true);
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });
    setFetching(false);
    if (error) {
      toast.error("Gagal memuat data: " + error.message);
      return;
    }
    setReports((data ?? []) as Report[]);
  }

  const filtered = useMemo(() => {
    return reports.filter(r =>
      (statusFilter === "all" || r.status === statusFilter) &&
      (rtFilter === "all" || r.rt_tujuan === rtFilter)
    );
  }, [reports, statusFilter, rtFilter]);

  const counts = useMemo(() => ({
    total: reports.length,
    Menunggu: reports.filter(r => r.status === "Menunggu").length,
    Diproses: reports.filter(r => r.status === "Diproses").length,
    Selesai: reports.filter(r => r.status === "Selesai").length,
  }), [reports]);

  if (loading || !user) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Memuat...</div>;
  }

  const isRW = role === "admin_rw";
  const noRole = !role;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Dashboard {isRW ? "RW 04" : profile?.wilayah}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isRW
              ? "Memantau seluruh laporan warga dari RT 01 — RT 05."
              : `Laporan untuk wilayah ${profile?.wilayah}.`}
          </p>
        </div>

        {noRole && (
          <Card className="mb-4 border-warning/40 bg-warning/10 p-4 text-sm">
            Akun Anda belum diberi role admin. Hubungi pengurus RW untuk aktivasi.
          </Card>
        )}

        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total" value={counts.total} />
          <StatCard label="Menunggu" value={counts.Menunggu} accent="warning" />
          <StatCard label="Diproses" value={counts.Diproses} accent="primary" />
          <StatCard label="Selesai" value={counts.Selesai} accent="success" />
        </div>

        <Card className="mb-4 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="Menunggu">Menunggu</SelectItem>
                <SelectItem value="Diproses">Diproses</SelectItem>
                <SelectItem value="Selesai">Selesai</SelectItem>
              </SelectContent>
            </Select>
            {isRW && (
              <Select value={rtFilter} onValueChange={(v) => setRtFilter(v as typeof rtFilter)}>
                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua RT</SelectItem>
                  {(["RT01","RT02","RT03","RT04","RT05"] as RT[]).map(rt => (
                    <SelectItem key={rt} value={rt}>{rt.replace("RT0","RT 0")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="text-sm text-muted-foreground">{filtered.length} laporan</div>
        </Card>

        {fetching ? (
          <p className="py-12 text-center text-muted-foreground">Memuat laporan...</p>
        ) : filtered.length === 0 ? (
          <Card className="flex flex-col items-center gap-2 p-12 text-center">
            <Inbox className="h-10 w-10 text-muted-foreground" />
            <p className="font-medium">Belum ada laporan</p>
            <p className="text-sm text-muted-foreground">Laporan baru akan muncul di sini.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map(r => <ReportCard key={r.id} report={r} onUpdated={fetchReports} />)}
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: "warning" | "primary" | "success" }) {
  const colors: Record<string, string> = {
    warning: "text-warning",
    primary: "text-primary",
    success: "text-success",
  };
  return (
    <Card className="p-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${accent ? colors[accent] : ""}`}>{value}</div>
    </Card>
  );
}

function ReportCard({ report, onUpdated }: { report: Report; onUpdated: () => void }) {
  const [open, setOpen] = useState(false);
  const [tanggapan, setTanggapan] = useState(report.tanggapan_admin ?? "");
  const [status, setStatus] = useState<Status>(report.status);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!tanggapan.trim()) return toast.error("Isi tanggapan terlebih dahulu");
    setSaving(true);
    const { error } = await supabase.from("reports").update({
      tanggapan_admin: tanggapan,
      status,
      tanggapan_at: new Date().toISOString(),
    }).eq("id", report.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Tanggapan tersimpan");
    setOpen(false);
    onUpdated();
  }

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="font-mono">{report.rt_tujuan.replace("RT0","RT 0")}</Badge>
          <Badge variant="secondary">{report.kategori}</Badge>
          <Badge className={statusColor[report.status]} variant="outline">{report.status}</Badge>
        </div>
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {new Date(report.created_at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
        </span>
      </div>

      <p className="mt-3 text-sm leading-relaxed">{report.deskripsi}</p>

      <div className="mt-3 grid gap-1.5 text-xs text-muted-foreground sm:grid-cols-3">
        <span className="flex items-center gap-1.5"><User className="h-3 w-3" />{report.nama_pelapor}</span>
        <span className="flex items-center gap-1.5"><Phone className="h-3 w-3" />{report.whatsapp}</span>
        <span className="flex items-center gap-1.5"><MapPin className="h-3 w-3" />{report.alamat}</span>
      </div>

      {report.tanggapan_admin && (
        <div className="mt-3 rounded-lg border-l-2 border-primary bg-primary/5 p-3 text-sm">
          <div className="mb-1 text-xs font-semibold text-primary">Tanggapan Admin</div>
          {report.tanggapan_admin}
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {report.foto_url && (
          <a href={report.foto_url} target="_blank" rel="noreferrer">
            <Button variant="outline" size="sm" className="gap-1.5"><ImageIcon className="h-3.5 w-3.5" /> Lihat Foto</Button>
          </a>
        )}
        <a href={`https://wa.me/${report.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">
          <Button variant="outline" size="sm" className="gap-1.5"><Phone className="h-3.5 w-3.5" /> WhatsApp</Button>
        </a>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5"><MessageSquare className="h-3.5 w-3.5" /> Tanggapi</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tanggapan untuk {report.nama_pelapor}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Status</label>
                <Select value={status} onValueChange={(v) => setStatus(v as Status)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Menunggu">Menunggu</SelectItem>
                    <SelectItem value="Diproses">Diproses</SelectItem>
                    <SelectItem value="Selesai">Selesai</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Tanggapan</label>
                <Textarea rows={5} value={tanggapan} onChange={e => setTanggapan(e.target.value)} placeholder="Tulis jawaban untuk warga..." />
              </div>
              <Button className="w-full" onClick={save} disabled={saving}>
                {saving ? "Menyimpan..." : "Simpan Tanggapan"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Card>
  );
}
