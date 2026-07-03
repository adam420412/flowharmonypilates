import { createFileRoute, Link, useSearch, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { Navigation } from "@/components/site/Navigation";
import { Footer } from "@/components/site/Footer";
import { getPaymentStatus } from "@/lib/payments.functions";

export const Route = createFileRoute("/payment-success")({
  validateSearch: z.object({ sessionId: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Płatność zakończona — Flow & Harmony" },
      { name: "description", content: "Potwierdzenie płatności w studio Flow & Harmony" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SuccessPage,
});

function SuccessPage() {
  const { sessionId } = useSearch({ from: "/payment-success" });
  const navigate = useNavigate();
  const fetchStatus = useServerFn(getPaymentStatus);
  const [state, setState] = useState<{ status: string; package_name: string; amount_grosz: number; booking_id?: string | null } | null>(null);
  const [tries, setTries] = useState(0);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    let stopped = false;

    const poll = async () => {
      try {
        const r = await fetchStatus({ data: { sessionId } });
        if (cancelled || !r) return;
        setState(r as any);
        if (r.status === "failed" || r.status === "cancelled") {
          stopped = true;
          navigate({ to: "/payment-error", search: { sessionId } });
        }
        if (r.status === "paid") stopped = true;
      } catch { /* noop */ }
    };
    poll();
    const t = setInterval(() => {
      if (stopped) { clearInterval(t); return; }
      setTries((x) => x + 1);
      if (tries > 30) { clearInterval(t); return; }
      poll();
    }, 3000);
    return () => { cancelled = true; clearInterval(t); };
  }, [sessionId, fetchStatus, navigate, tries]);

  const paid = state?.status === "paid";

  return (
    <div className="min-h-screen bg-cream text-foreground">
      <Navigation />
      <section className="px-6 pb-24 pt-32 md:pt-40">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs uppercase tracking-widest text-mocha">Płatność</span>
          <h1 className="mt-4 font-display text-4xl md:text-5xl">
            {paid ? "Dziękujemy za płatność!" : "Przetwarzamy płatność…"}
          </h1>
          {state && (
            <p className="mt-6 text-foreground/80">
              {state.package_name} — {(state.amount_grosz / 100).toFixed(2)} zł
            </p>
          )}
          {!paid && (
            <p className="mt-4 text-sm text-foreground/60">
              Czekamy na potwierdzenie od Przelewy24… {tries > 0 && `(${tries})`}
            </p>
          )}
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            {paid && state?.booking_id ? (
              <Link to="/moje-rezerwacje" className="rounded-full bg-foreground px-6 py-3 text-xs uppercase tracking-widest text-cream hover:bg-terracotta">
                Moje rezerwacje
              </Link>
            ) : (
              <Link to="/grafik" className="rounded-full bg-foreground px-6 py-3 text-xs uppercase tracking-widest text-cream hover:bg-terracotta">
                Przejdź do grafiku
              </Link>
            )}
            <Link to="/cennik" className="text-xs uppercase tracking-widest hover:text-terracotta">
              ← Wróć do cennika
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
