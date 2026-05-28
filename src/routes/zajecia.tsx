import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Clock, Users, Sparkles } from "lucide-react";
import { Navigation } from "@/components/site/Navigation";
import { Footer } from "@/components/site/Footer";
import classReformer from "@/assets/class-reformer.jpg";
import classVip from "@/assets/class-vip.jpg";
import classIntro from "@/assets/class-intro.jpg";
import classCadillac from "@/assets/class-cadillac.jpg";

export const Route = createFileRoute("/zajecia")({
  head: () => ({
    meta: [
      { title: "Zajęcia — Flow & Harmony | Joanna Konieczna" },
      { name: "description", content: "Reformer Pilates, VIP Training oraz sesje Intro w studio Flow & Harmony prowadzone przez Joannę Konieczną. Wybierz format dla siebie." },
      { property: "og:title", content: "Zajęcia — Flow & Harmony | Joanna Konieczna" },
      { property: "og:description", content: "Wybierz format pilates dopasowany do Ciebie." },
      { property: "og:image", content: classReformer },
    ],
  }),
  component: ZajeciaPage,
});

type Offer = {
  name: string;
  sub: string;
  duration: string;
  img: string;
  desc: string;
  bullets: string[];
  priceTyp: "reformer" | "vip" | "intro";
};

const offers: Offer[] = [
  {
    name: "Reformer Pilates",
    sub: "Grupowe • do 4 osób",
    duration: "50 min",
    img: classReformer,
    desc: "Klasyczna sesja na reformerze w kameralnej grupie. Pełna kontrola, oddech, długie linie ciała. Dla każdego poziomu zaawansowania.",
    bullets: [
      "Wzmocnienie głębokich mięśni i poprawa postawy",
      "Praca nad mobilnością i świadomością ciała",
      "Sesje poranne, w ciągu dnia i wieczorne",
    ],
    priceTyp: "reformer",
  },
  {
    name: "VIP Training",
    sub: "Solo lub w parach",
    duration: "50 min",
    img: classVip,
    desc: "Indywidualna opieka instruktora w prywatnej sali — solo lub w parze. Plan szyty pod Ciebie, dla osób chcących pracować z konkretnym celem.",
    bullets: [
      "Pełna personalizacja i biomechaniczna analiza",
      "Świetne dla rehabilitacji i okresu okołoporodowego",
      "Możliwość treningu z partnerką / partnerem",
    ],
    priceTyp: "vip",
  },
  {
    name: "VIP Cadillac 1:1",
    sub: "Indywidualne • rozbudowane urządzenie",
    duration: "50 min",
    img: classCadillac,
    desc: "Sesja indywidualna na Cadillacu — rozbudowanym urządzeniu z trapezem, sprężynami i drążkami. Pełen wachlarz ćwiczeń mobilizacyjnych, wzmacniających i rehabilitacyjnych w pracy 1:1 z instruktorem. Rozliczana w cenach VIP Training.",
    bullets: [
      "Praca 1:1 na pełnowymiarowym Cadillacu",
      "Idealne przy bólach pleców i ograniczeniach mobilności",
      "Cena jak za VIP Training",
    ],
    priceTyp: "vip",
  },
  {
    name: "Pilates Intro",
    sub: "Dla początkujących",
    duration: "50 min",
    img: classIntro,
    desc: "Pierwsza sesja próbna. Poznajemy reformer, ustawiamy ciało, omawiamy fundamenty metody. Rekomendowana przed dołączeniem do zajęć grupowych.",
    bullets: [
      "Bez doświadczenia — prowadzimy krok po kroku",
      "Omawiamy bezpieczeństwo i sprzęt",
      "Pierwsza wizyta tylko 99 zł",
    ],
    priceTyp: "intro",
  },
];

function ZajeciaPage() {
  return (
    <div className="min-h-screen bg-cream text-foreground">
      <Navigation />

      <section className="px-6 pb-12 pt-32 md:px-10 md:pt-40">
        <div className="mx-auto max-w-6xl">
          <span className="text-xs uppercase tracking-widest text-mocha">Zajęcia</span>
            <h2 className="mt-4 max-w-3xl font-display text-5xl leading-tight md:text-7xl">
              Wybierz format, który <em className="italic text-terracotta">odpowiada Tobie</em>.
            </h2>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-foreground/80">
            Trzy formaty zajęć dopasowane do różnych etapów Twojej drogi z pilatesem reformer.
            Niezależnie od poziomu zaawansowania — znajdziemy sesję dla Ciebie.
          </p>
        </div>
      </section>

      <section className="px-6 py-12 md:px-10 md:py-16">
        <div className="mx-auto max-w-6xl space-y-24">
          {offers.map((o, i) => (
            <article
              key={o.name}
              className={`grid gap-12 md:grid-cols-2 md:items-center ${i % 2 === 1 ? "md:[&>*:first-child]:order-last" : ""}`}
            >
              <div className="overflow-hidden">
                <img src={o.img} alt={o.name} className="aspect-[4/5] w-full object-cover" loading="lazy" />
              </div>
              <div>
                <span className="text-xs uppercase tracking-widest text-terracotta">0{i + 1} · {o.sub}</span>
                <h2 className="mt-3 font-display text-4xl leading-tight md:text-5xl">{o.name}</h2>
                <div className="mt-3 flex items-center gap-2 text-xs uppercase tracking-widest text-mocha">
                  <Clock size={14} /> {o.duration}
                </div>
                <p className="mt-6 text-base leading-relaxed text-foreground/75">{o.desc}</p>
                <ul className="mt-6 space-y-2">
                  {o.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-3 text-sm text-foreground/75">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-terracotta" /> {b}
                    </li>
                  ))}
                </ul>
                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <Link
                    to="/grafik"
                    className="inline-flex items-center gap-3 rounded-full bg-foreground px-7 py-3 text-xs uppercase tracking-widest text-cream hover:bg-terracotta"
                  >
                    Zarezerwuj <ArrowRight size={14} />
                  </Link>
                  <Link
                    to="/cennik"
                    search={{ typ: o.priceTyp }}
                    className="text-xs uppercase tracking-widest text-foreground hover:text-terracotta"
                  >
                    Zobacz cennik →
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-sand px-6 py-24 md:px-10 md:py-32">
        <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-3">
          {[
            { icon: Users, title: "Małe grupy", text: "Maksymalnie 4 osoby — instruktorka widzi każdą z Was." },
            { icon: Sparkles, title: "Premium sprzęt", text: "Profesjonalne reformery i akcesoria najwyższej jakości." },
            { icon: Clock, title: "50 minut", text: "Standardowa długość sesji — pełna rozgrzewka, praca i wyciszenie." },
          ].map((f) => (
            <div key={f.title} className="border-t border-foreground/15 pt-8">
              <f.icon size={26} className="text-terracotta" strokeWidth={1.25} />
              <h3 className="mt-6 font-display text-2xl">{f.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-foreground/80">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
