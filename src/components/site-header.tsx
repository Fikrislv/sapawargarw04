import { Link } from "@tanstack/react-router";
import { MessageSquareText, LogIn } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const { user, signOut } = useAuth();
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-bold">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <MessageSquareText className="h-4 w-4" />
          </div>
          <span className="text-base">Sapa RW 4</span>
        </Link>
        <nav className="flex items-center gap-2">
          {user ? (
            <>
              <Link to="/dashboard">
                <Button variant="ghost" size="sm">Dashboard</Button>
              </Link>
              <Button variant="outline" size="sm" onClick={() => signOut()}>
                Keluar
              </Button>
            </>
          ) : (
            <Link to="/login">
              <Button size="sm" variant="outline" className="gap-1.5">
                <LogIn className="h-4 w-4" /> Login Admin
              </Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
