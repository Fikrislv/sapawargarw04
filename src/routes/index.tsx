import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import logoRw04 from "@/assets/logo-rw04.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sapa RW 04 — Sistem Pelaporan Warga" },
      { name: "description", content: "Aplikasi resmi pelaporan warga RW 04 Bogor. Login untuk melaporkan dan memantau penanganan." },
    ],
  }),
  component: Index,
});

function Index() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/login" });
    else if (role) navigate({ to: "/dashboard" });
  }, [user, role, loading, navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <img src={logoRw04} alt="Logo RW 04 Bogor" className="h-20 w-20 rounded-full object-cover ring-4 ring-accent/40 shadow-lg" />
      <h1 className="mt-4 text-2xl font-bold">Sapa RW 04</h1>
      <p className="mt-2 text-sm text-muted-foreground">Memuat aplikasi...</p>
    </div>
  );
}
