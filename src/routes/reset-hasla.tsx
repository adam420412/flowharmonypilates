import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Logo } from "@/components/site/Logo";

export const Route = createFileRoute("/reset-hasla")({
  head: () => ({
    meta: [
      { title: "Ustaw nowe hasło — Flow & Harmony" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase automatically processes the recovery hash and creates a session.
    // We just wait for that session to appear.
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setReady(true);
        return;
      }
    };
    check();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setReady(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Hasło musi mieć co najmniej 8 znaków");
      return;
    }
    if (password !== confirm) {
      toast.error("Hasła nie są identyczne");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Hasło zmienione. Możesz się zalogować.");
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-6 py-16">
      <div className="w-full max-w-md">
        <Link to="/" className="flex justify-center">
          <Logo variant="auto" className="h-16" />
        </Link>
        <h1 className="mt-10 text-center font-display text-3xl text-foreground">Nowe hasło</h1>

        {!ready ? (
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Sprawdzam link resetujący… Jeśli ekran nie znika, link mógł wygasnąć —{" "}
            <Link to="/zapomnialem-hasla" className="text-terracotta underline">poproś o nowy</Link>.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs uppercase tracking-widest text-foreground/80">Nowe hasło</label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-foreground/15 bg-background px-4 py-2.5 text-sm text-foreground focus:border-terracotta focus:outline-none"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">Minimum 8 znaków.</p>
            </div>
            <div>
              <label className="mb-1.5 block text-xs uppercase tracking-widest text-foreground/80">Powtórz hasło</label>
              <input
                type="password"
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full rounded-md border border-foreground/15 bg-background px-4 py-2.5 text-sm text-foreground focus:border-terracotta focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-foreground px-6 py-3 text-xs uppercase tracking-widest text-cream transition-all hover:bg-foreground/90 disabled:opacity-60"
            >
              {loading ? "Zapisuję…" : "Ustaw nowe hasło"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
