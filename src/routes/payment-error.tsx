import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import { Navigation } from "@/components/site/Navigation";
import { Footer } from "@/components/site/Footer";

export const Route = createFileRoute("/payment-error")({
  validateSearch: z.object({ sessionId: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Płatność nieudana — Flow & Harmony" },
      { name: "description", content: "Płatność w Przelewy24 nie została zakończona." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ErrorPage,
});

function ErrorPage() {
  const { sessionId } = useSearch({ from: "/payment-error" });
  return (
    <div className="min-h-screen bg-cream text-foreground">
      <Navigation />
      <section className="px-6 pb-24 pt-32 md:pt-40">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs uppercase tracking-widest text-terracotta">Płatność</span>
          <h1 className="mt-4 font-display text-4xl md:text-5xl">Płatność nieudana</h1>
          <p className="mt-6 text-foreground/80">
            Niestety nie udało się dokończyć płatności. Środki nie zostały pobrane.
            Możesz spróbować ponownie lub skontaktować się z nami.
          </p>
          {sessionId && (
            <p className="mt-3 text-xs text-foreground/50">
              Nr sesji: <code>{sessionId}</code>
            </p>
          )}
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link to="/cennik" className="rounded-full bg-foreground px-6 py-3 text-xs uppercase tracking-widest text-cream hover:bg-terracotta">
              Spróbuj ponownie
            </Link>
            <Link to="/kontakt" className="text-xs uppercase tracking-widest hover:text-terracotta">
              Skontaktuj się z nami
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
