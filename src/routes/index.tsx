import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Calendar, Clock, MapPin, Sparkles, Users } from "lucide-react";
import { Navigation } from "@/components/site/Navigation";
import { Footer } from "@/components/site/Footer";
import { Stamp } from "@/components/site/Stamp";
import heroImg from "@/assets/hero-studio.jpg";
import aboutImg from "@/assets/about-pilates.jpg";
import classReformer from "@/assets/class-reformer.jpg";
import classVip from "@/assets/class-vip.jpg";
import classIntro from "@/assets/class-intro.jpg";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Flow & Harmony — Studio Pilates Reformery" },
      {
        name: "description",
        content:
          "Butikowe studio pilates na reformerach. Zajęcia grupowe i VIP — Flow & Harmony. Zarezerwuj online.",
      },
      { property: "og:title", content: "Flow & Harmony — Studio Pilates Reformery" },
      { property: "og:description", content: "Twoja przestrzeń ruchu i wytchnienia." },
    ],
  }),
  component: HomePage,
});

const classes = [
  {
    name: "Reformer Pilates",
    sub: "Grupowe • do 10 osób",
    desc: "Klasyczna sesja na reformerze w kameralnej grupie. Dla każdego poziomu.",
    img: classReformer,
  },
  {
    name: "VIP Training",
    sub: "Solo lub Duo",
    desc: "Indywidualna opieka instruktora w prywatnej sali — solo lub w parze.",
    img: classVip,
  },
  {
    name: "Pilates Intro",
    sub: "Dla początkujących",
    desc: "Pierwsza sesja próbna. Poznajemy reformer i fundamenty metody.",
    img: classIntro,
  },
];

const memberships = [
  { name: "1 Wejście Intro", price: "79", note: "Pierwsza wizyta, 7 dni" },
  { name: "4 Wejścia", price: "350", note: "Miesięcznie • 87,50 zł / sesja" },
  { name: "8 Wejść", price: "590", note: "Miesięcznie • 73,75 zł / sesja" },
  { name: "No Limit", price: "990", note: "Bez limitu sesji w miesiącu" },
];

function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />

      {/* HERO */}
      <section className="relative h-screen min-h-[700px] w-full overflow-hidden">
        <img
          src={heroImg}
          alt="Studio Flow & Harmony — pilates reformery"
          width={1920}
          height={1080}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-cream/40 via-cream/15 to-cream/80" />

        <div className="section-gradient relative z-10 flex h-full flex-col justify-center px-6 md:px-16">
          <div className="max-w-5xl animate-fade-up">
            <span className="text-xs uppercase tracking-widest text-mocha">
              Studio Pilates · Reformery
            </span>
            <h1 className="mt-8 font-display text-6xl leading-[0.95] text-ink md:text-8xl lg:text-9xl">
              Flow <em className="italic text-terracotta">&</em> Harmony
            </h1>
            <p className="mt-8 max-w-xl font-display text-2xl italic leading-snug text-ink md:text-3xl">
              Twoja przestrzeń <span className="text-terracotta">ruchu</span> i wytchnienia.
            </p>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-ink/70 md:text-lg">
              Butikowe studio reformer pilates. Kameralne sesje, doświadczone instruktorki,
              atmosfera spa.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                to="/grafik"
                className="group inline-flex items-center gap-3 rounded-full bg-ink px-8 py-4 text-xs font-semibold uppercase tracking-widest text-cream shadow-lg shadow-ink/30 transition-all hover:bg-terracotta hover:shadow-terracotta/40"
              >
                Zarezerwuj zajęcia
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/zajecia"
                className="inline-flex items-center gap-2 rounded-full border-2 border-ink/80 bg-cream/60 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-ink backdrop-blur-sm transition-all hover:bg-ink hover:text-cream"
              >
                Poznaj zajęcia
              </Link>
            </div>
          </div>
        </div>

        <div className="absolute right-8 top-32 hidden text-mocha lg:block">
          <Stamp />
        </div>
      </section>

      {/* O STUDIU */}
      <section className="relative px-6 py-24 md:px-10 md:py-40">
        <div className="mx-auto grid max-w-7xl gap-16 md:grid-cols-2 md:items-center">
          <div className="relative">
            <img
              src={aboutImg}
              alt="Sesja pilates"
              width={1080}
              height={1500}
              loading="lazy"
              className="aspect-[4/5] w-full object-cover"
            />
            <div className="absolute -bottom-8 -right-4 hidden text-terracotta md:block">
              <Stamp text="FLOW & HARMONY · STUDIO PILATES · " />
            </div>
          </div>

          <div>
            <span className="text-xs uppercase tracking-widest text-terracotta">O studiu</span>
            <h2 className="mt-4 font-display text-5xl leading-tight md:text-6xl">
              Pilates,<br />który <em className="italic">czujesz</em>.
            </h2>
            <div className="mt-8 space-y-5 text-base leading-relaxed text-foreground/75">
              <p>
                Flow & Harmony to butikowe studio reformer pilates stworzone z myślą o tych,
                którzy szukają więcej niż treningu — szukają chwili dla siebie.
              </p>
              <p>
                Kameralne grupy do 10 osób, prywatne sale VIP, certyfikowane
                instruktorki i wnętrze, w którym chce się zostać dłużej.
              </p>
            </div>
            <Link
              to="/studio"
              className="mt-10 inline-flex items-center gap-3 text-xs uppercase tracking-widest text-foreground hover:text-terracotta"
            >
              Poznaj naszą historię <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ZAJĘCIA */}
      <section className="bg-sand px-6 py-24 md:px-10 md:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-end justify-between gap-6 md:flex-row md:items-end">
            <div>
              <span className="text-xs uppercase tracking-widest text-terracotta">Nasze zajęcia</span>
              <h2 className="mt-4 max-w-2xl font-display text-5xl leading-tight md:text-6xl">
                Wybierz format, który odpowiada <em className="italic">Tobie</em>.
              </h2>
            </div>
            <Link
              to="/zajecia"
              className="text-xs uppercase tracking-widest text-foreground hover:text-terracotta"
            >
              Wszystkie zajęcia →
            </Link>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {classes.map((c, i) => (
              <article key={c.name} className="group">
                <div className="overflow-hidden">
                  <img
                    src={c.img}
                    alt={c.name}
                    width={900}
                    height={1100}
                    loading="lazy"
                    className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="mt-6 flex items-baseline justify-between">
                  <h3 className="font-display text-2xl">{c.name}</h3>
                  <span className="text-xs uppercase tracking-widest text-mocha">0{i + 1}</span>
                </div>
                <p className="mt-1 text-xs uppercase tracking-widest text-terracotta">{c.sub}</p>
                <p className="mt-4 text-sm leading-relaxed text-foreground/70">{c.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CECHY */}
      <section className="px-6 py-24 md:px-10">
        <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-3">
          {[
            { icon: Users, title: "Kameralne grupy", text: "Maksymalnie 10 osób na sesji reformer." },
            { icon: Sparkles, title: "Premium sprzęt", text: "Profesjonalne reformery i akcesoria." },
            { icon: Clock, title: "Elastyczny grafik", text: "Zajęcia od rana do wieczora, 6 dni w tygodniu." },
          ].map((f) => (
            <div key={f.title} className="border-t border-border pt-8">
              <f.icon size={24} className="text-terracotta" strokeWidth={1.25} />
              <h3 className="mt-6 font-display text-2xl">{f.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-foreground/70">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CENNIK PREVIEW */}
      <section className="bg-ink px-6 py-24 text-cream md:px-10 md:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-end justify-between gap-6 md:flex-row md:items-end">
            <div>
              <span className="text-xs uppercase tracking-widest text-nude">Karnety</span>
              <h2 className="mt-4 max-w-2xl font-display text-5xl leading-tight md:text-6xl">
                Wybierz <em className="italic">swój</em> rytm.
              </h2>
            </div>
            <Link
              to="/cennik"
              className="text-xs uppercase tracking-widest text-cream/80 hover:text-cream"
            >
              Pełny cennik →
            </Link>
          </div>

          <div className="mt-16 grid gap-px bg-cream/10 md:grid-cols-4">
            {memberships.map((m) => (
              <div key={m.name} className="bg-ink p-8">
                <h3 className="font-display text-xl text-cream">{m.name}</h3>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="font-display text-5xl text-nude">{m.price}</span>
                  <span className="text-sm text-cream/60">zł</span>
                </div>
                <p className="mt-3 text-xs uppercase tracking-widest text-cream/50">{m.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24 md:px-10 md:py-40">
        <div className="mx-auto max-w-4xl text-center">
          <Calendar size={28} className="mx-auto text-terracotta" strokeWidth={1.25} />
          <h2 className="mt-8 font-display text-5xl leading-tight md:text-7xl">
            Zacznij <em className="italic text-terracotta">dziś</em>.
            <br />Pierwsza sesja za 79 zł.
          </h2>
          <p className="mx-auto mt-8 max-w-xl text-foreground/70">
            Pakiet Intro dla nowych klientek — poznaj reformer, naszą filozofię i atmosferę studia.
          </p>
          <Link
            to="/grafik"
            className="mt-10 inline-flex items-center gap-3 rounded-full bg-foreground px-10 py-4 text-xs uppercase tracking-widest text-cream transition-all hover:bg-terracotta"
          >
            Zarezerwuj sesję Intro
            <ArrowRight size={16} />
          </Link>
          <div className="mt-12 flex items-center justify-center gap-2 text-xs uppercase tracking-widest text-mocha">
            <MapPin size={14} /> ul. Poznańska 117 · Kamionki
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
