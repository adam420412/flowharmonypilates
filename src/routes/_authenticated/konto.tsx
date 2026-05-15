import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Navigation } from "@/components/site/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/konto")({
  component: AccountPage,
});

function AccountPage() {
  const { user, roles, signOut } = useAuth();
  const [phone, setPhone] = useState("");
  const [smsOptIn, setSmsOptIn] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("phone,sms_opt_in").eq("id", user.id).maybeSingle()
      .then(({ data }) => {
        setPhone(data?.phone ?? "");
        setSmsOptIn(!!data?.sms_opt_in);
        setLoaded(true);
      });
  }, [user]);

  async function saveContact() {
    if (!user) return;
    setSaving(true);
    let normalized = phone.trim().replace(/\s|-/g, "");
    if (smsOptIn && normalized) {
      if (!/^\+?\d{9,15}$/.test(normalized)) {
        toast.error("Podaj poprawny numer telefonu");
        setSaving(false);
        return;
      }
      if (!normalized.startsWith("+")) normalized = `+48${normalized}`;
    }
    const { error } = await supabase.from("profiles").update({
      phone: normalized || null,
      sms_opt_in: smsOptIn,
      sms_opt_in_at: smsOptIn ? new Date().toISOString() : null,
    }).eq("id", user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Zapisano ustawienia powiadomień");
  }

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

        {/* Powiadomienia */}
        <div className="mt-6 space-y-5 rounded-2xl border border-foreground/10 bg-background p-8">
          <div>
            <h2 className="font-display text-2xl text-foreground">Powiadomienia</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Potwierdzenia i przypomnienia 24h przed zajęciami wysyłamy zawsze e-mailem. SMS-y o 2h przed wymagają zgody.
            </p>
          </div>

          <div>
            <label className="text-xs uppercase tracking-widest text-mocha">Telefon</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+48 600 000 000"
              disabled={!loaded}
              className="mt-1 w-full rounded-md border border-foreground/15 bg-background px-3 py-2 text-sm focus:border-terracotta focus:outline-none"
            />
          </div>

          <label className="flex items-start gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={smsOptIn}
              onChange={(e) => setSmsOptIn(e.target.checked)}
              disabled={!loaded}
              className="mt-1"
            />
            <span>
              Chcę otrzymywać <strong>SMS-y przypominające 2h przed zajęciami</strong>. Zgodę mogę wycofać w każdej chwili.
            </span>
          </label>

          <button
            onClick={saveContact}
            disabled={saving || !loaded}
            className="rounded-full bg-foreground px-6 py-3 text-xs uppercase tracking-widest text-cream disabled:opacity-50"
          >
            {saving ? "Zapisywanie…" : "Zapisz"}
          </button>
        </div>
      </main>
    </div>
  );
}
