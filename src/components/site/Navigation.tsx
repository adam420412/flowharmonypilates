import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import logo from "@/assets/logo-flow-harmony.png";

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
        <Link to="/" className="flex items-center" aria-label="Flow & Harmony — Studio Pilates Reformery">
          <img src={logo} alt="Flow & Harmony" className="h-12 w-auto md:h-14" />
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-xs uppercase tracking-widest text-foreground/80 transition-colors hover:text-terracotta"
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
              className="text-xs uppercase tracking-widest text-terracotta hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              Admin
            </Link>
          )}
          {!isAuthenticated && (
            <Link
              to="/rejestracja"
              className="text-xs uppercase tracking-widest text-foreground/80 hover:text-terracotta"
            >
              Załóż konto
            </Link>
          )}
          <Link
            to={isAuthenticated ? "/konto" : "/login"}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-foreground/20 text-foreground transition-all hover:bg-foreground/5"
            aria-label={isAuthenticated ? "Moje konto" : "Zaloguj się"}
          >
            <User className="h-4 w-4" />
          </Link>
          <Link
            to="/grafik"
            className="rounded-full border border-foreground/30 px-6 py-2.5 text-xs uppercase tracking-widest text-foreground transition-all hover:bg-foreground hover:text-cream"
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
