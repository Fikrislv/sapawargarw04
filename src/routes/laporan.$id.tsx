import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send, Calendar, MapPin, Image as ImageIcon } from "lucide-react";
import { useReportPhotoUrl } from "@/components/report-photo";

export const Route = createFileRoute("/laporan/$id")({
  head: () => ({ meta: [{ title: "Detail Laporan — Sapa RW 4" }] }),
  component: ReportDetail,
});

interface Report {
  id: string;
  user_id: string | null;
  created_at: string;
  title: string | null;
  alamat: string | null;
  rt_tujuan: string;
  kategori: string;
  deskripsi: string;
  foto_url: string | null;
  status: "Menunggu" | "Diproses" | "Selesai";
  tanggapan_admin: string | null;
}

interface Comment {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
  author_name?: string;
  author_role?: string;
}

const statusColor: Record<string, string> = {
  Menunggu: "bg-warning/15 text-warning border-warning/30",
  Diproses: "bg-primary/10 text-primary border-primary/30",
  Selesai: "bg-success/15 text-success border-success/30",
};

function ReportDetail() {
  const { id } = Route.useParams();
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const [report, setReport] = useState<Report | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [fetching, setFetching] = useState(true);
  const photoUrl = useReportPhotoUrl(report?.foto_url ?? null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    void load();

    const channel = supabase
      .channel(`comments-${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "report_comments", filter: `report_id=eq.${id}` },
        () => loadComments())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, id]);

  async function load() {
    setFetching(true);
    const { data, error } = await supabase.from("reports").select("*").eq("id", id).maybeSingle();
    if (error || !data) {
      toast.error("Laporan tidak ditemukan");
      setFetching(false);
      return;
    }
    setReport(data as Report);
    await loadComments();
    setFetching(false);
  }

  async function loadComments() {
    const { data } = await supabase
      .from("report_comments")
      .select("id, user_id, message, created_at")
      .eq("report_id", id)
      .order("created_at", { ascending: true });
    if (!data) return setComments([]);

    // fetch authors
    const userIds = Array.from(new Set(data.map(c => c.user_id)));
    const [{ data: profs }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("id, full_name").in("id", userIds),
      supabase.from("user_roles").select("user_id, role").in("user_id", userIds),
    ]);
    const nameMap = new Map((profs ?? []).map(p => [p.id, p.full_name]));
    const roleMap = new Map((roles ?? []).map(r => [r.user_id, r.role]));

    setComments(data.map(c => ({
      ...c,
      author_name: nameMap.get(c.user_id) ?? "Pengguna",
      author_role: roleMap.get(c.user_id) ?? "",
    })));
  }

  async function send() {
    if (!msg.trim() || !user) return;
    setSending(true);
    const { error } = await supabase.from("report_comments").insert({
      report_id: id, user_id: user.id, message: msg.trim(),
    });
    setSending(false);
    if (error) return toast.error(error.message);
    setMsg("");
  }

  if (loading || !user || fetching) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Memuat...</div>;
  }
  if (!report) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="max-w-sm p-6 text-center">
          <p className="font-medium">Laporan tidak ditemukan</p>
          <Link to="/dashboard"><Button className="mt-4">Kembali</Button></Link>
        </Card>
      </div>
    );
  }

  const roleLabel = (r?: string) =>
    r === "admin_rw" ? "Admin RW" : r === "admin_rt" ? "Admin RT" : "Warga";

  return (
    <div className="min-h-screen bg-background pb-32">
      <AppHeader />
      <main className="mx-auto max-w-2xl px-4 py-5">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </Link>

        <Card className="mt-3 p-5">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className="font-mono">{report.rt_tujuan.replace("RT0","RT 0")}</Badge>
            <Badge variant="secondary">{report.kategori}</Badge>
            <Badge variant="outline" className={statusColor[report.status]}>{report.status}</Badge>
          </div>
          {report.title && <h1 className="mt-3 text-xl font-bold">{report.title}</h1>}
          <p className="mt-2 text-sm leading-relaxed">{report.deskripsi}</p>

          <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />
              {new Date(report.created_at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}</span>
            {report.alamat && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{report.alamat}</span>}
          </div>

          {report.foto_url && photoUrl && (
            <a href={photoUrl} target="_blank" rel="noreferrer" className="mt-3 block overflow-hidden rounded-lg border">
              <img src={photoUrl} alt="Lampiran" className="max-h-72 w-full object-cover" />
            </a>
          )}

          {report.tanggapan_admin && (
            <div className="mt-4 rounded-lg border-l-2 border-primary bg-primary/5 p-3">
              <div className="mb-1 text-xs font-semibold text-primary">Tanggapan Resmi</div>
              <p className="text-sm">{report.tanggapan_admin}</p>
            </div>
          )}
        </Card>

        <Card className="mt-4 p-4">
          <h2 className="mb-3 font-semibold">Diskusi</h2>
          {comments.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Belum ada diskusi.</p>
          ) : (
            <div className="space-y-3">
              {comments.map(c => {
                const mine = c.user_id === user.id;
                return (
                  <div key={c.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                      mine ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-muted"
                    }`}>
                      {!mine && (
                        <div className="mb-0.5 text-[11px] font-semibold opacity-80">
                          {c.author_name} · {roleLabel(c.author_role)}
                        </div>
                      )}
                      <p className="whitespace-pre-wrap leading-relaxed">{c.message}</p>
                      <div className={`mt-1 text-[10px] ${mine ? "opacity-80" : "text-muted-foreground"}`}>
                        {new Date(c.created_at).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <div className="fixed bottom-14 left-0 right-0 border-t bg-background p-3 md:bottom-0">
          <div className="mx-auto flex max-w-2xl gap-2">
            <Textarea
              rows={1}
              value={msg}
              onChange={e => setMsg(e.target.value)}
              placeholder="Tulis pesan..."
              className="min-h-10 flex-1 resize-none"
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); }
              }}
            />
            <Button onClick={send} disabled={sending || !msg.trim()} size="icon" className="h-10 w-10 shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
