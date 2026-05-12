import { Link, useLocation } from "@tanstack/react-router";
import { Home, PlusCircle, FileText, User } from "lucide-react";
import { useAuth } from "@/lib/auth";

export function BottomNav() {
  const { role } = useAuth();
  const { pathname } = useLocation();

  const isWarga = role === "warga";
  const items = isWarga
    ? [
        { to: "/dashboard", label: "Beranda", icon: Home },
        { to: "/lapor", label: "Lapor", icon: PlusCircle },
        { to: "/laporan-saya", label: "Laporan", icon: FileText },
        { to: "/profil", label: "Profil", icon: User },
      ]
    : [
        { to: "/dashboard", label: "Laporan", icon: Home },
        { to: "/profil", label: "Profil", icon: User },
      ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/70 bg-background/95 backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-1.5">
        {items.map(({ to, label, icon: Icon }) => {
          const active = pathname === to || (to !== "/dashboard" && pathname.startsWith(to));
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-xs transition ${
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? "stroke-[2.4]" : ""}`} />
              <span className="text-[11px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
