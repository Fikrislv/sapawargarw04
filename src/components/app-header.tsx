import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import logoRw04 from "@/assets/logo-rw04.jpg";

export function AppHeader({ title, subtitle }: { title?: string; subtitle?: string }) {
  const { signOut, role } = useAuth();
  const navigate = useNavigate();

  const roleLabel =
    role === "admin_rw" ? "Admin RW 04" :
    role === "admin_rt" ? "Admin RT" :
    role === "warga" ? "Warga" : "";

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link to="/dashboard" className="flex items-center gap-2">
          <img
            src={logoRw04}
            alt="Logo RW 04 Bogor"
            className="h-9 w-9 rounded-full object-cover ring-2 ring-accent/60"
          />
          <div className="leading-tight">
            <div className="text-sm font-bold">{title ?? "Sapa RW 04"}</div>
            <div className="text-[11px] text-muted-foreground">{subtitle ?? roleLabel}</div>
          </div>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5"
          onClick={async () => { await signOut(); navigate({ to: "/login" }); }}
        >
          <LogOut className="h-4 w-4" /> Keluar
        </Button>
      </div>
    </header>
  );
}
