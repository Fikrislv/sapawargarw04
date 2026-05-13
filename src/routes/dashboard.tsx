import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  PlusCircle, Calendar, Inbox, MessageSquare, Phone, MapPin, User,
  Image as ImageIcon, ArrowRight,
} from "lucide-react";
import { useReportPhotoUrl } from "@/components/report-photo";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Sapa RW 4" }] }),
  component: DashboardRouter,
});

type Status = "Menunggu" | "Diproses" | "Selesai";
type RT = "RT01" | "RT02" | "RT03" | "RT04" | "RT05";

interface Report {
  id: string;
  created_at: string;
  user_id: string | null;
  title: string | null;
  alamat: string | null;
  rt_tujuan: RT;
  kategori: string;
  deskripsi: string;
  foto_url: string | null;
  status: Status;
  tanggapan_admin: string | null;
  reporter_name?: string | null;
  reporter_phone?: string | null;
}

const statusColor: Record<Status, string> = {
  Menunggu: "bg-warning/15 text-warning border-warning/30",
  Diproses: "bg-primary/10 text-primary border-primary/30",
  Selesai: "bg-success/15 text-success border-success/30",
};

function DashboardRouter() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Memuat...</div>;
  }

  if (!role) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="max-w-sm p-6 text-center">
          <h2 className="text-lg font-bold">Akun belum aktif</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Akun Anda belum memiliki role. Hubungi pengurus RW 04 untuk aktivasi.
          </p>
        </Card>
      </div>
    );
  }

  return role === "warga" ? <WargaDashboard /> : <AdminDashboard />;
}

/* ============== WARGA ============== */
function WargaDashboard() {
  const { profile } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => { void load(); }, []);
  async function load() {
    setFetching(true);
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });
    setFetching(false);
    if (error) return toast.error(error.message);
    setReports((data ?? []) as Report[]);
  }

  const counts = useMemo(() => ({
    total: reports.length,
    Menunggu: reports.filter(r => r.status === "Menunggu").length,
    Diproses: reports.filter(r => r.status === "Diproses").length,
    Selesai: reports.filter(r => r.status === "Selesai").length,
  }), [reports]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader />
      <main className="mx-auto max-w-2xl px-4 py-5">
        <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-5 text-primary-foreground">
          <p className="text-xs opacity-80">Selamat datang,</p>
          <h1 className="text-xl font-bold">{profile?.full_name ?? "Warga"}</h1>
          <p className="mt-0.5 text-xs opacity-90">
            {profile?.rt_number?.replace("RT0","RT 0")} · RW 04
          </p>
          <Link to="/lapor">
            <Button className="mt-4 gap-2 bg-white text-primary hover:bg-white/90" size="lg">
              <PlusCircle className="h-5 w-5" /> Buat Laporan Baru
            </Button>
          </Link>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <MiniStat label="Menunggu" value={counts.Menunggu} accent="warning" />
          <MiniStat label="Diproses" value={counts.Diproses} accent="primary" />
          <MiniStat label="Selesai" value={counts.Selesai} accent="success" />
        </div>

        <div className="mt-6 mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Riwayat Laporan</h2>
          <span className="text-xs text-muted-foreground">{reports.length} total</span>
        </div>

        {fetching ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Memuat...</p>
        ) : reports.length === 0 ? (
          <EmptyState text="Anda belum membuat laporan." />
        ) : (
          <div className="space-y-2.5">
            {reports.map(r => (
              <Link key={r.id} to="/laporan/$id" params={{ id: r.id }}>
                <Card className="p-4 transition hover:border-primary/40 hover:shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant="secondary" className="text-[10px]">{r.kategori}</Badge>
                        <Badge variant="outline" className={`text-[10px] ${statusColor[r.status]}`}>{r.status}</Badge>
                      </div>
                      <h3 className="mt-1.5 truncate font-medium">{r.title ?? r.deskripsi.slice(0, 60)}</h3>
                      <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{r.deskripsi}</p>
                      <p className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(r.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: number; accent: "warning" | "primary" | "success" }) {
  const cls: Record<string, string> = { warning: "text-warning", primary: "text-primary", success: "text-success" };
  return (
    <Card className="p-3 text-center">
      <div className={`text-2xl font-bold ${cls[accent]}`}>{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </Card>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <Card className="flex flex-col items-center gap-2 p-10 text-center">
      <Inbox className="h-9 w-9 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </Card>
  );
}

/* ============== ADMIN (RT/RW) ============== */
function AdminDashboard() {
  const { role, profile } = useAuth();
  const isRW = role === "admin_rw";
  const [reports, setReports] = useState<Report[]>([]);
  const [fetching, setFetching] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | Status>("all");
  const [rtFilter, setRtFilter] = useState<"all" | RT>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => { void load(); }, []);
  async function load() {
    setFetching(true);
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) { setFetching(false); return toast.error(error.message); }
    const rows = (data ?? []) as Report[];
    // Reporter contact info: only fetched for owner / admin_rw via profiles RLS
    const userIds = Array.from(new Set(rows.map(r => r.user_id).filter(Boolean) as string[]));
    let nameMap = new Map<string, { full_name: string | null; phone: string | null }>();
    if (userIds.length) {
      const { data: profs } = await supabase
        .from("profiles").select("id, full_name, phone").in("id", userIds);
      nameMap = new Map((profs ?? []).map(p => [p.id, { full_name: p.full_name, phone: p.phone }]));
    }
    setReports(rows.map(r => ({
      ...r,
      reporter_name: r.user_id ? nameMap.get(r.user_id)?.full_name ?? null : null,
      reporter_phone: r.user_id ? nameMap.get(r.user_id)?.phone ?? null : null,
    })));
    setFetching(false);
  }

  const filtered = useMemo(() => reports.filter(r => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (isRW && rtFilter !== "all" && r.rt_tujuan !== rtFilter) return false;
    if (dateFrom && new Date(r.created_at) < new Date(dateFrom)) return false;
    if (dateTo && new Date(r.created_at) > new Date(dateTo + "T23:59:59")) return false;
    return true;
  }), [reports, statusFilter, rtFilter, dateFrom, dateTo, isRW]);

  const counts = useMemo(() => ({
    total: reports.length,
    Menunggu: reports.filter(r => r.status === "Menunggu").length,
    Diproses: reports.filter(r => r.status === "Diproses").length,
    Selesai: reports.filter(r => r.status === "Selesai").length,
  }), [reports]);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-6">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-5">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">Dashboard {isRW ? "RW 04" : profile?.wilayah?.replace("RT0","RT 0")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isRW ? "Memantau seluruh laporan dari RT 01 — RT 05." : `Mengelola laporan wilayah ${profile?.wilayah}.`}
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <StatBox label="Total" value={counts.total} />
          <StatBox label="Menunggu" value={counts.Menunggu} accent="warning" />
          <StatBox label="Diproses" value={counts.Diproses} accent="primary" />
          <StatBox label="Selesai" value={counts.Selesai} accent="success" />
        </div>

        <Card className="mt-4 p-4">
          <div className="grid gap-2.5 sm:grid-cols-4">
            <Select value={statusFilter} onValueChange={v => setStatusFilter(v as typeof statusFilter)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="Menunggu">Menunggu</SelectItem>
                <SelectItem value="Diproses">Diproses</SelectItem>
                <SelectItem value="Selesai">Selesai</SelectItem>
              </SelectContent>
            </Select>
            {isRW && (
              <Select value={rtFilter} onValueChange={v => setRtFilter(v as typeof rtFilter)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua RT</SelectItem>
                  {(["RT01","RT02","RT03","RT04","RT05"] as RT[]).map(rt => (
                    <SelectItem key={rt} value={rt}>{rt.replace("RT0","RT 0")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} placeholder="Dari" />
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} placeholder="Sampai" />
          </div>
          <div className="mt-2 text-right text-xs text-muted-foreground">{filtered.length} laporan</div>
        </Card>

        {fetching ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Memuat...</p>
        ) : filtered.length === 0 ? (
          <div className="mt-4"><EmptyState text="Tidak ada laporan sesuai filter." /></div>
        ) : (
          <div className="mt-4 space-y-3">
            {filtered.map(r => <AdminReportCard key={r.id} report={r} onUpdated={load} />)}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}

function StatBox({ label, value, accent }: { label: string; value: number; accent?: "warning" | "primary" | "success" }) {
  const cls: Record<string, string> = { warning: "text-warning", primary: "text-primary", success: "text-success" };
  return (
    <Card className="p-4">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${accent ? cls[accent] : ""}`}>{value}</div>
    </Card>
  );
}

function AdminReportCard({ report, onUpdated }: { report: Report; onUpdated: () => void }) {
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
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="outline" className="font-mono">{report.rt_tujuan.replace("RT0","RT 0")}</Badge>
          <Badge variant="secondary">{report.kategori}</Badge>
          <Badge className={statusColor[report.status]} variant="outline">{report.status}</Badge>
        </div>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          {new Date(report.created_at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
        </span>
      </div>

      {report.title && <h3 className="mt-2.5 font-semibold">{report.title}</h3>}
      <p className="mt-1 text-sm leading-relaxed">{report.deskripsi}</p>

      <div className="mt-3 grid gap-1.5 text-xs text-muted-foreground sm:grid-cols-3">
        {report.nama_pelapor && <span className="flex items-center gap-1.5"><User className="h-3 w-3" />{report.nama_pelapor}</span>}
        {report.whatsapp && <span className="flex items-center gap-1.5"><Phone className="h-3 w-3" />{report.whatsapp}</span>}
        {report.alamat && <span className="flex items-center gap-1.5"><MapPin className="h-3 w-3" />{report.alamat}</span>}
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
            <Button variant="outline" size="sm" className="gap-1.5"><ImageIcon className="h-3.5 w-3.5" /> Foto</Button>
          </a>
        )}
        {report.whatsapp && (
          <a href={`https://wa.me/${report.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">
            <Button variant="outline" size="sm" className="gap-1.5"><Phone className="h-3.5 w-3.5" /> WA</Button>
          </a>
        )}
        <Link to="/laporan/$id" params={{ id: report.id }}>
          <Button variant="outline" size="sm" className="gap-1.5"><MessageSquare className="h-3.5 w-3.5" /> Diskusi</Button>
        </Link>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">Tanggapi</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Tanggapan Resmi</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Status</label>
                <Select value={status} onValueChange={v => setStatus(v as Status)}>
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
                <Textarea rows={5} value={tanggapan} onChange={e => setTanggapan(e.target.value)} placeholder="Tulis tanggapan resmi untuk warga..." />
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
