import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { Navigation } from "@/components/site/Navigation";
import { Footer } from "@/components/site/Footer";
import { getPaymentStatus } from "@/lib/payments.functions";

export const Route = createFileRoute("/platnosc/status")({
  validateSearch: z.object({ sessionId: z.string().optional() }),
  head: () => ({ meta: [{ title: "Status płatności — Flow & Harmony" }] }),
  component: StatusPage,
});

function StatusPage() {
  const { sessionId } = useSearch({ from: "/platnosc/status" });
  const fetchStatus = useServerFn(getPaymentStatus);
  const [state, setState] = useState<{ status: string; package_name: string; amount_grosz: number; booking_id?: string | null; class_id?: string | null } | null>(null);
  const [tries, setTries] = useState(0);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const r = await fetchStatus({ data: { sessionId } });
        if (!cancelled && r) setState(r as any);
      } catch {/* noop */}
    };
    poll();
    const t = setInterval(() => {
      setTries((x) => x + 1);
      poll();
    }, 3000);
    return () => { cancelled = true; clearInterval(t); };
  }, [sessionId, fetchStatus]);

  const paid = state?.status === "paid";
  const failed = state?.status === "failed" || state?.status === "cancelled";

  return (
    <div className="min-h-screen bg-cream text-foreground">
      <Navigation />
      <section className="px-6 pb-24 pt-32 md:pt-40">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs uppercase tracking-widest text-mocha">Płatność</span>
          <h1 className="mt-4 font-display text-4xl md:text-5xl">
            {paid ? "Dziękujemy!" : failed ? "Płatność nieudana" : "Przetwarzamy płatność…"}
          </h1>
          {state && (
            <p className="mt-6 text-foreground/80">
              {state.package_name} — {(state.amount_grosz / 100).toFixed(2)} zł
            </p>
          )}
          {!paid && !failed && (
            <p className="mt-4 text-sm text-foreground/60">
              Sprawdzamy status u operatora… {tries > 0 && `(${tries})`}
            </p>
          )}
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link to="/grafik" className="rounded-full bg-foreground px-6 py-3 text-xs uppercase tracking-widest text-cream hover:bg-terracotta">
              Przejdź do grafiku
            </Link>
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
