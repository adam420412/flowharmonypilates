import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Logo } from "@/components/site/Logo";

export const Route = createFileRoute("/zapomnialem-hasla")({
  head: () => ({
    meta: [
      { title: "Zapomniałem hasła — Flow & Harmony" },
      { name: "description", content: "Zresetuj hasło do swojego konta w studio Flow & Harmony." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-hasla`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
    toast.success("Sprawdź skrzynkę e-mail");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-6 py-16">
      <div className="w-full max-w-md">
        <Link to="/" className="flex justify-center">
          <Logo variant="auto" className="h-16" />
        </Link>
        <h1 className="mt-10 text-center font-display text-3xl text-foreground">Reset hasła</h1>

        {sent ? (
          <div className="mt-8 rounded-lg border border-terracotta/30 bg-terracotta/5 p-6 text-center text-sm text-foreground/85">
            <p>
              Jeśli konto o adresie <strong>{email}</strong> istnieje, wysłaliśmy na nie link do
              zresetowania hasła. Link jest ważny przez 60 minut.
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              Nie widzisz wiadomości? Sprawdź folder SPAM lub odczekaj kilka minut.
            </p>
          </div>
        ) : (
          <>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Podaj adres e-mail powiązany z kontem — wyślemy link do ustawienia nowego hasła.
            </p>
            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-widest text-foreground/80">E-mail</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-md border border-foreground/15 bg-background px-4 py-2.5 text-sm text-foreground focus:border-terracotta focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-foreground px-6 py-3 text-xs uppercase tracking-widest text-cream transition-all hover:bg-foreground/90 disabled:opacity-60"
              >
                {loading ? "Wysyłam…" : "Wyślij link resetujący"}
              </button>
            </form>
          </>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link to="/login" className="text-terracotta underline-offset-4 hover:underline">
            ← Wróć do logowania
          </Link>
        </p>
      </div>
    </div>
  );
}
