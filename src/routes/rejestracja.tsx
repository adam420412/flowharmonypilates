import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import { Logo } from "@/components/site/Logo";

export const Route = createFileRoute("/rejestracja")({
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: name },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Konto utworzone! Witaj w Flow & Harmony.");
    navigate({ to: "/" });
  }

  async function handleGoogle() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) toast.error("Nie udało się zalogować przez Google");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-6 py-16">
      <div className="w-full max-w-md">
        <Link to="/" className="flex justify-center section-light">
          <Logo variant="auto" className="h-16" />
        </Link>
        <h1 className="mt-10 text-center font-display text-3xl text-foreground">Załóż konto</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Dołącz do społeczności Flow & Harmony
        </p>

        <button
          onClick={handleGoogle}
          className="mt-8 flex w-full items-center justify-center gap-3 rounded-full border border-foreground/20 bg-background px-6 py-3 text-sm font-medium text-foreground transition-all hover:bg-foreground/5"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Kontynuuj z Google
        </button>

        <div className="my-6 flex items-center gap-4">
          <div className="h-px flex-1 bg-foreground/10" />
          <span className="text-xs uppercase tracking-widest text-muted-foreground">lub</span>
          <div className="h-px flex-1 bg-foreground/10" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-widest text-foreground/80">Imię i nazwisko</label>
            <input
              type="text" required value={name} onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-foreground/15 bg-background px-4 py-2.5 text-sm focus:border-terracotta focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-widest text-foreground/80">E-mail</label>
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-foreground/15 bg-background px-4 py-2.5 text-sm focus:border-terracotta focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-widest text-foreground/80">Hasło</label>
            <input
              type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-foreground/15 bg-background px-4 py-2.5 text-sm focus:border-terracotta focus:outline-none"
            />
            <p className="mt-1 text-xs text-muted-foreground">Min. 8 znaków</p>
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full rounded-full bg-foreground px-6 py-3 text-xs uppercase tracking-widest text-cream transition-all hover:bg-foreground/90 disabled:opacity-60"
          >
            {loading ? "Tworzenie konta…" : "Załóż konto"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Masz już konto?{" "}
          <Link to="/login" className="text-terracotta underline-offset-4 hover:underline">
            Zaloguj się
          </Link>
        </p>
      </div>
    </div>
  );
}
