import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { Navigation } from "@/components/site/Navigation";

export const Route = createFileRoute("/_authenticated/konto")({
  component: AccountPage,
});

function AccountPage() {
  const { user, roles, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-cream">
      <Navigation />
      <main className="mx-auto max-w-3xl px-6 pb-24 pt-32 md:px-10">
        <h1 className="font-display text-5xl text-foreground">Moje konto</h1>
        <p className="mt-2 text-sm text-muted-foreground">{user?.email}</p>

        <div className="mt-10 space-y-6 rounded-2xl border border-foreground/10 bg-background p-8">
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Twoje role</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {roles.length === 0 && <span className="text-sm text-muted-foreground">Brak przypisanych ról</span>}
              {roles.map((r) => (
                <span key={r} className="rounded-full border border-terracotta/30 bg-terracotta/5 px-3 py-1 text-xs uppercase tracking-widest text-terracotta">
                  {r === "admin" ? "Administrator" : r === "instructor" ? "Instruktor" : "Klient"}
                </span>
              ))}
            </div>
          </div>

          <Link to="/moje-rezerwacje" className="block rounded-md border border-foreground/15 px-4 py-2.5 text-center text-xs uppercase tracking-widest text-foreground transition-all hover:bg-foreground/5">
            Moje rezerwacje
          </Link>

          {roles.includes("admin") && (
            <Link to="/admin" className="block rounded-md bg-foreground px-4 py-2.5 text-center text-xs uppercase tracking-widest text-cream">
              Panel administratora
            </Link>
          )}

          <button onClick={signOut} className="w-full rounded-full border border-foreground/20 px-6 py-3 text-xs uppercase tracking-widest text-foreground transition-all hover:bg-foreground/5">
            Wyloguj się
          </button>
        </div>
      </main>
    </div>
  );
}
