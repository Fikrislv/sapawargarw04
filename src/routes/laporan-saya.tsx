import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, ArrowRight, Inbox } from "lucide-react";

export const Route = createFileRoute("/laporan-saya")({
  head: () => ({ meta: [{ title: "Laporan Saya — Sapa RW 4" }] }),
  component: MyReports,
});

const statusColor: Record<string, string> = {
  Menunggu: "bg-warning/15 text-warning border-warning/30",
  Diproses: "bg-primary/10 text-primary border-primary/30",
  Selesai: "bg-success/15 text-success border-success/30",
};

function MyReports() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<any[]>([]);
  const [tab, setTab] = useState<"all" | "Menunggu" | "Diproses" | "Selesai">("all");
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setFetching(true);
      const { data, error } = await supabase.from("reports").select("*").order("created_at", { ascending: false });
      setFetching(false);
      if (error) return toast.error(error.message);
      setReports(data ?? []);
    })();
  }, [user]);

  const filtered = useMemo(
    () => reports.filter(r => tab === "all" || r.status === tab),
    [reports, tab]
  );

  if (loading || !user) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Memuat...</div>;

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader />
      <main className="mx-auto max-w-2xl px-4 py-5">
        <h1 className="text-xl font-bold sm:text-2xl">Laporan Saya</h1>
        <p className="mt-1 text-sm text-muted-foreground">Riwayat seluruh laporan Anda.</p>

        <div className="mt-4 flex gap-1.5 overflow-x-auto pb-1">
          {(["all","Menunggu","Diproses","Selesai"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                tab === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
              }`}
            >
              {t === "all" ? "Semua" : t}
            </button>
          ))}
        </div>

        {fetching ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Memuat...</p>
        ) : filtered.length === 0 ? (
          <Card className="mt-4 flex flex-col items-center gap-2 p-10 text-center">
            <Inbox className="h-9 w-9 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Belum ada laporan.</p>
          </Card>
        ) : (
          <div className="mt-4 space-y-2.5">
            {filtered.map(r => (
              <Link key={r.id} to="/laporan/$id" params={{ id: r.id }}>
                <Card className="p-4 transition hover:border-primary/40">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant="secondary" className="text-[10px]">{r.kategori}</Badge>
                        <Badge variant="outline" className={`text-[10px] ${statusColor[r.status]}`}>{r.status}</Badge>
                      </div>
                      <h3 className="mt-1.5 truncate font-medium">{r.title ?? r.deskripsi.slice(0, 60)}</h3>
                      <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
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
