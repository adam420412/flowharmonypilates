import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Logo } from "@/components/site/Logo";

const links = [
  { to: "/", label: "Strona główna" },
  { to: "/studio", label: "Studio" },
  { to: "/zajecia", label: "Zajęcia" },
  { to: "/grafik", label: "Grafik" },
  { to: "/cennik", label: "Cennik" },
  { to: "/kontakt", label: "Kontakt" },
];

export function Navigation() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated, hasRole } = useAuth();
  const isAdmin = hasRole("admin");

  return (
    <header className="absolute top-0 left-0 right-0 z-50">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 md:px-10 md:py-8">
        <Link to="/" className="flex items-center gap-3">
          <Logo variant="auto" className="h-16 md:h-20 lg:h-24" />
          <h1 className="hidden font-display text-2xl text-ink md:block lg:text-4xl">
            Flow <em className="italic text-terracotta">&</em> Harmony
          </h1>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-xs font-semibold uppercase tracking-widest text-ink transition-colors hover:text-terracotta"
              activeProps={{ className: "text-terracotta" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {isAdmin && (
            <Link
              to="/admin"
              className="text-xs font-semibold uppercase tracking-widest text-terracotta hover:text-ink"
              activeProps={{ className: "text-ink" }}
            >
              Admin
            </Link>
          )}
          {!isAuthenticated && (
            <Link
              to="/rejestracja"
              className="text-xs font-semibold uppercase tracking-widest text-ink hover:text-terracotta"
            >
              Załóż konto
            </Link>
          )}
          <Link
            to={isAuthenticated ? "/konto" : "/login"}
            className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-ink/40 text-ink transition-all hover:border-ink hover:bg-ink hover:text-cream"
            aria-label={isAuthenticated ? "Moje konto" : "Zaloguj się"}
          >
            <User className="h-4 w-4" />
          </Link>
          <Link
            to="/grafik"
            className="rounded-full bg-ink px-6 py-2.5 text-xs font-semibold uppercase tracking-widest text-cream shadow-md shadow-ink/20 transition-all hover:bg-terracotta hover:shadow-terracotta/40"
          >
            Rezerwuj
          </Link>
        </div>

        <button
          className="lg:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-full bg-cream/98 backdrop-blur-md lg:hidden">
          <nav className="flex flex-col gap-1 px-6 py-6">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="border-b border-border py-3 text-sm uppercase tracking-widest text-foreground"
              >
                {l.label}
              </Link>
            ))}
            <Link
              to="/grafik"
              onClick={() => setOpen(false)}
              className="mt-4 rounded-full bg-foreground px-6 py-3 text-center text-xs uppercase tracking-widest text-cream"
            >
              Rezerwuj zajęcia
            </Link>
            {!isAuthenticated && (
              <Link
                to="/rejestracja"
                onClick={() => setOpen(false)}
                className="mt-3 rounded-full border border-foreground/30 px-6 py-3 text-center text-xs uppercase tracking-widest text-foreground"
              >
                Załóż konto
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
