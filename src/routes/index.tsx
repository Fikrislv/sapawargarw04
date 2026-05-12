import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { ReportForm } from "@/components/report-form";
import { Shield, Trash2, Construction, MoreHorizontal } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sapa RW 4 — Lapor Warga" },
      { name: "description", content: "Sampaikan keluhan dan laporan warga RW 04 dengan cepat. Ditangani oleh pengurus RT/RW masing-masing." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, white 0%, transparent 40%)" }} />
        <div className="relative mx-auto max-w-5xl px-4 py-12 sm:py-16 text-primary-foreground">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
              Sistem Pelaporan Warga
            </span>
            <h1 className="mt-4 text-3xl sm:text-5xl font-bold tracking-tight">
              Sapa RW 4
            </h1>
            <p className="mt-3 text-base sm:text-lg opacity-90">
              Suara Anda penting. Laporkan masalah keamanan, sampah, atau infrastruktur — langsung ditangani oleh pengurus RT setempat.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
            {[
              { icon: Shield, label: "Keamanan" },
              { icon: Trash2, label: "Sampah" },
              { icon: Construction, label: "Infrastruktur" },
              { icon: MoreHorizontal, label: "Lainnya" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-1.5 rounded-xl bg-white/10 p-3 backdrop-blur-sm">
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-2xl px-4 py-10">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Form Laporan Warga</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Isi dengan jujur. Laporan Anda akan diteruskan ke pengurus RT yang dipilih.
          </p>
        </div>
        <ReportForm />

        <p className="mt-8 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Sapa RW 04 · Untuk warga, oleh warga.
        </p>
      </main>
    </div>
  );
}
