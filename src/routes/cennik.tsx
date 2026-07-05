import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import { z } from "zod";
import { Navigation } from "@/components/site/Navigation";
import { Footer } from "@/components/site/Footer";
import { BuyPackageButton } from "@/components/payments/BuyPackageButton";

const searchSchema = z.object({
  typ: z.enum(["reformer", "vip", "intro"]).optional(),
});

export const Route = createFileRoute("/cennik")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Cennik karnetów — Flow & Harmony | Joanna Konieczna" },
      { name: "description", content: "Karnety na zajęcia reformer pilates prowadzone przez Joannę Konieczną. Pakiety 4, 8 wejść, sesje VIP oraz pierwsza sesja Intro za 99 zł." },
      { property: "og:title", content: "Cennik — Flow & Harmony | Joanna Konieczna" },
      { property: "og:description", content: "Wybierz pakiet, który odpowiada Twojemu rytmowi." },
    ],
  }),
  component: CennikPage,
});

type Membership = {
  code: string;
  name: string;
  price: string;
  note: string;
  desc: string;
  perks: string[];
  highlight?: boolean;
};

const introOffers: Membership[] = [
  {
    code: "intro",
    name: "Wejście Intro",
    price: "99",
    note: "Pierwsza wizyta",
    desc: "Sesja próbna dla nowych klientek — poznaj reformer i naszą metodę.",
    perks: ["Sesja 50 min", "Grupa max 4 osoby", "Indywidualne wprowadzenie"],
  },
];

const reformerOffers: Membership[] = [
  {
    code: "pack-4",
    name: "4 wejścia",
    price: "390",
    note: "97,50 zł / sesja",
    desc: "Komfortowy wybór dla osób zaczynających regularną praktykę.",
    perks: ["4 sesje grupowe (max 4 osoby)", "Ważność 30 dni", "Rezerwacja online"],
  },
  {
    code: "pack-8",
    name: "8 wejść",
    price: "670",
    note: "83,75 zł / sesja",
    highlight: true,
    desc: "Najpopularniejszy pakiet — dwie sesje w tygodniu przez miesiąc. Oszczędzasz 10 zł na każdych zajęciach.",
    perks: ["8 sesji grupowych (max 4 osoby)", "Ważność 30 dni", "Pierwszeństwo rezerwacji"],
  },
];

const vipOffers = [
  { code: "vip-solo-1", name: "VIP Solo · 1 sesja", price: "260", note: "Trening 1:1 (reformer lub cadillac)" },
  { code: "vip-solo-5", name: "VIP Solo · pakiet 5", price: "1 200", note: "240 zł / sesja" },
  { code: "vip-duo-1", name: "VIP Duo · 1 sesja", price: "320", note: "Trening 1:2 (160 zł / os.)" },
  { code: "vip-duo-5", name: "VIP Duo · pakiet 5", price: "1 450", note: "145 zł / os. / sesja" },
];

function CennikPage() {
  const { typ } = Route.useSearch();
  const showIntro = !typ || typ === "intro";
  const showReformer = !typ || typ === "reformer";
  const showVip = !typ || typ === "vip";

  const headline =
    typ === "intro"
      ? "Pierwsza wizyta Intro"
      : typ === "reformer"
        ? "Karnety na reformer pilates"
        : typ === "vip"
          ? "Sesje VIP — 1:1 i Cadillac"
          : null;

  return (
    <div className="min-h-screen bg-cream text-foreground">
      <Navigation />

      <section className="px-6 pb-12 pt-32 md:px-10 md:pt-40">
        <div className="mx-auto max-w-6xl">
          <span className="text-xs uppercase tracking-widest text-mocha">Cennik</span>
          {headline ? (
            <>
              <h2 className="mt-4 max-w-3xl font-display text-5xl leading-tight md:text-7xl">
                {headline}
              </h2>
              <Link
                to="/cennik"
                className="mt-6 inline-block text-xs uppercase tracking-widest text-foreground/70 hover:text-terracotta"
              >
                ← Zobacz cały cennik
              </Link>
            </>
          ) : (
            <h2 className="mt-4 max-w-3xl font-display text-5xl leading-tight md:text-7xl">
              Wybierz <em className="italic text-terracotta">swój</em> rytm.
            </h2>
          )}
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-foreground/80">
            Karnety i sesje VIP — wszystkie ceny zawierają podatek. Karnety są imienne i ważne
            zgodnie z opisem od daty zakupu.
          </p>
          <div className="mt-8 inline-flex max-w-2xl items-start gap-3 rounded-2xl border border-terracotta/30 bg-terracotta/10 px-5 py-4">
            <span className="mt-0.5 inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-terracotta px-2 text-[11px] font-semibold uppercase tracking-widest text-cream">
              max 4
            </span>
            <p className="text-sm leading-relaxed text-foreground/85">
              Wszystkie zajęcia grupowe prowadzimy w <strong>kameralnych grupach maksymalnie 4 osób</strong> —
              dzięki temu każda klientka dostaje uważne, niemal indywidualne podejście trenera.
            </p>
          </div>
        </div>
      </section>

      {(showIntro || showReformer) && (
        <section id="karnety" className="px-6 pb-16 md:px-10 md:pb-24">
          <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...(showIntro ? introOffers : []), ...(showReformer ? reformerOffers : [])].map((m) => (
              <article
                key={m.name}
                className={`flex flex-col border p-8 ${m.highlight ? "border-terracotta bg-background" : "border-foreground/10 bg-background"}`}
              >
                {m.highlight && (
                  <span className="mb-4 inline-block self-start rounded-full bg-terracotta/10 px-3 py-1 text-[10px] uppercase tracking-widest text-terracotta">
                    Najczęściej wybierany
                  </span>
                )}
                <h3 className="font-display text-2xl">{m.name}</h3>
                <div className="mt-6 flex items-baseline gap-1.5">
                  <span className="font-display text-5xl text-foreground">{m.price}</span>
                  <span className="text-sm text-foreground/80">zł</span>
                </div>
                <p className="mt-2 text-xs uppercase tracking-widest text-mocha">{m.note}</p>
                <p className="mt-4 text-sm leading-relaxed text-foreground/80">{m.desc}</p>
                <ul className="mt-6 space-y-2 border-t border-foreground/10 pt-6 text-sm text-foreground/75">
                  {m.perks.map((p) => (
                    <li key={p} className="flex items-start gap-2">
                      <Check size={16} className="mt-0.5 shrink-0 text-terracotta" /> {p}
                    </li>
                  ))}
                </ul>
                <div className="mt-8 flex flex-col gap-2">
                  <Link
                    to="/grafik"
                    className="inline-flex items-center justify-center rounded-full bg-terracotta px-6 py-3 text-xs uppercase tracking-widest text-cream hover:bg-foreground"
                  >
                    Zarezerwuj termin
                  </Link>
                  <p className="text-center text-[11px] uppercase tracking-widest text-foreground/60">
                    Wybierz termin w grafiku i zapłać online
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {showVip && (
        <section id="vip" className="bg-ink px-6 py-20 text-cream md:px-10 md:py-28">
          <div className="mx-auto max-w-6xl">
            <span className="text-xs uppercase tracking-widest text-nude">Sesje VIP</span>
            <h2 className="mt-4 max-w-2xl font-display text-4xl leading-tight md:text-5xl">
              Trening 1:1, w parze lub na Cadillacu.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-cream/80">
              Wszystkie sesje indywidualne — reformer 1:1, reformer w parze oraz Cadillac 1:1 — rozliczamy w cenach VIP poniżej.
            </p>
            <div className="mt-12 grid gap-px bg-cream/10 md:grid-cols-2 lg:grid-cols-4">
              {vipOffers.map((v) => (
                <div key={v.name} className="flex flex-col bg-ink p-8">
                  <h3 className="font-display text-lg text-cream">{v.name}</h3>
                  <div className="mt-5 flex items-baseline gap-1">
                    <span className="font-display text-4xl text-nude">{v.price}</span>
                    <span className="text-sm text-cream/90">zł</span>
                  </div>
                  <p className="mt-2 text-xs uppercase tracking-widest text-cream/75">{v.note}</p>
                  <div className="mt-6">
                    <BuyPackageButton packageCode={v.code} label="Kup online" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="px-6 py-24 md:px-10 md:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-display text-4xl leading-tight md:text-6xl">
            Gotowa, by zacząć?
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-foreground/80">
            Załóż konto online — w 2 minuty wybierzesz termin pierwszej sesji Intro.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/rejestracja"
              className="inline-flex items-center gap-3 rounded-full bg-foreground px-8 py-4 text-xs uppercase tracking-widest text-cream hover:bg-terracotta"
            >
              Załóż konto <ArrowRight size={16} />
            </Link>
            <Link
              to="/grafik"
              className="text-xs uppercase tracking-widest text-foreground hover:text-terracotta"
            >
              Zobacz grafik →
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
