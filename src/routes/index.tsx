import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { MessageSquareText } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sapa RW 4 — Sistem Pelaporan Warga" },
      { name: "description", content: "Aplikasi resmi pelaporan warga RW 04. Login untuk melaporkan dan memantau penanganan." },
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
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
        <MessageSquareText className="h-7 w-7" />
      </div>
      <h1 className="mt-4 text-2xl font-bold">Sapa RW 4</h1>
      <p className="mt-2 text-sm text-muted-foreground">Memuat aplikasi...</p>
    </div>
  );
}
