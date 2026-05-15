import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, MapPin, Sparkles, Users, Heart } from "lucide-react";
import { Navigation } from "@/components/site/Navigation";
import { Footer } from "@/components/site/Footer";
import aboutImg from "@/assets/about-pilates.jpg";
import heroImg from "@/assets/hero-studio.jpg";

export const Route = createFileRoute("/studio")({
  head: () => ({
    meta: [
      { title: "O studiu — Flow & Harmony" },
      { name: "description", content: "Butikowe studio pilates reformer w Kamionkach. Poznaj naszą historię, filozofię i przestrzeń." },
      { property: "og:title", content: "O studiu — Flow & Harmony" },
      { property: "og:description", content: "Twoja przestrzeń ruchu i wytchnienia." },
      { property: "og:image", content: heroImg },
    ],
  }),
  component: StudioPage,
});

function StudioPage() {
  return (
    <div className="min-h-screen bg-cream text-foreground">
      <Navigation />

      <section className="relative h-[60vh] min-h-[420px] w-full overflow-hidden">
        <img src={heroImg} alt="Wnętrze studia Flow & Harmony" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-cream/30 via-cream/20 to-cream/90" />
        <div className="relative z-10 flex h-full items-end px-6 pb-16 md:px-16">
          <div>
            <span className="text-xs uppercase tracking-widest text-mocha">O studiu</span>
            <h1 className="mt-4 max-w-3xl font-display text-5xl leading-tight md:text-7xl">
              Miejsce, w którym <em className="italic text-terracotta">zwalniasz</em>.
            </h1>
          </div>
        </div>
      </section>

      <section className="px-6 py-24 md:px-10 md:py-32">
        <div className="mx-auto grid max-w-6xl gap-16 md:grid-cols-2 md:items-center">
          <img src={aboutImg} alt="Sesja pilates" className="aspect-[4/5] w-full object-cover" />
          <div>
            <span className="text-xs uppercase tracking-widest text-terracotta">Historia</span>
            <h2 className="mt-4 font-display text-4xl leading-tight md:text-5xl">
              Pilates, który <em className="italic">czujesz</em>.
            </h2>
            <div className="mt-8 space-y-5 text-base leading-relaxed text-foreground/75">
              <p>
                Flow & Harmony powstało z miłości do ruchu i przekonania, że trening może być
                rytuałem, nie obowiązkiem. Tworzymy butikową przestrzeń, w której kameralność,
                estetyka i jakość spotykają się z metodą pilates Josepha Pilatesa.
              </p>
              <p>
                Pracujemy w grupach do 4 osób oraz w formacie VIP solo i duo. Naszym celem jest,
                żebyś po wyjściu czuła się silniejsza, lżejsza i naprawdę zaopiekowana.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-sand px-6 py-24 md:px-10 md:py-32">
        <div className="mx-auto max-w-6xl">
          <span className="text-xs uppercase tracking-widest text-terracotta">Filozofia</span>
          <h2 className="mt-4 max-w-3xl font-display text-4xl leading-tight md:text-5xl">
            Trzy zasady, które prowadzą każdą sesję.
          </h2>
          <div className="mt-16 grid gap-12 md:grid-cols-3">
            {[
              { icon: Heart, title: "Uważność", text: "Każde powtórzenie z intencją. Słuchamy ciała, nie liczników." },
              { icon: Users, title: "Kameralność", text: "Maksymalnie 4 osoby na sesji. Instruktor widzi i koryguje każdą z Was." },
              { icon: Sparkles, title: "Jakość", text: "Profesjonalne reformery, certyfikowane instruktorki, dopracowane wnętrze." },
            ].map((f) => (
              <div key={f.title} className="border-t border-foreground/15 pt-8">
                <f.icon size={26} className="text-terracotta" strokeWidth={1.25} />
                <h3 className="mt-6 font-display text-2xl">{f.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-foreground/80">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-24 md:px-10 md:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <MapPin size={28} className="mx-auto text-terracotta" strokeWidth={1.25} />
          <h2 className="mt-8 font-display text-4xl leading-tight md:text-6xl">
            Odwiedź nas
          </h2>
          <p className="mt-6 text-foreground/80">
            ul. Poznańska 117 · Kamionki<br />Pn–Pt 7:00–21:00 · Sb 9:00–14:00
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/grafik"
              className="inline-flex items-center gap-3 rounded-full bg-foreground px-8 py-4 text-xs uppercase tracking-widest text-cream hover:bg-terracotta"
            >
              Zarezerwuj zajęcia <ArrowRight size={16} />
            </Link>
            <Link
              to="/kontakt"
              className="text-xs uppercase tracking-widest text-foreground hover:text-terracotta"
            >
              Skontaktuj się →
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
