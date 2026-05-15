import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Mail, MapPin, Phone, Instagram, ArrowRight, Send, Loader2, MessageCircle } from "lucide-react";
import { Navigation } from "@/components/site/Navigation";
import { Footer } from "@/components/site/Footer";
import { toast } from "sonner";

export const Route = createFileRoute("/kontakt")({
  head: () => ({
    meta: [
      { title: "Kontakt — Flow & Harmony" },
      { name: "description", content: "Studio pilates Flow & Harmony, ul. Poznańska 117, Kamionki. Napisz, zadzwoń lub odwiedź nas." },
      { property: "og:title", content: "Kontakt — Flow & Harmony" },
      { property: "og:description", content: "Skontaktuj się ze studiem Flow & Harmony." },
    ],
  }),
  component: KontaktPage,
});

function KontaktPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSending(true);
    // Mock — w realnym wdrożeniu można podpiąć pod server function lub e-mail.
    setTimeout(() => {
      setSending(false);
      toast.success("Dziękujemy! Odpowiemy najszybciej, jak to możliwe.");
      setForm({ name: "", email: "", message: "" });
    }, 600);
  }

  return (
    <div className="min-h-screen bg-cream text-foreground">
      <Navigation />

      <section className="px-6 pb-12 pt-32 md:px-10 md:pt-40">
        <div className="mx-auto max-w-6xl">
          <span className="text-xs uppercase tracking-widest text-mocha">Kontakt</span>
          <h1 className="mt-4 max-w-3xl font-display text-5xl leading-tight md:text-7xl">
            Porozmawiajmy.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-foreground/80">
            Masz pytanie o zajęcia, karnet albo chcesz zorganizować sesję dla grupy? Napisz do nas,
            zadzwoń lub po prostu wpadnij — drzwi są otwarte.
          </p>
        </div>
      </section>

      <section className="px-6 pb-24 md:px-10 md:pb-32">
        <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-2 md:gap-16">
          <div className="space-y-10">
            <ContactRow icon={MapPin} label="Adres" lines={["ul. Poznańska 117", "62-023 Kamionki"]} />
            <ContactRow icon={Phone} label="Telefon" lines={["+48 501 817 979", "Joanna Konieczna"]} href="tel:+48501817979" />
            <ContactRow icon={Mail} label="E-mail" lines={["hello@flowharmony.pl"]} href="mailto:hello@flowharmony.pl" />
            <ContactRow icon={Instagram} label="Instagram" lines={["@asia_konieczna"]} href="https://www.instagram.com/asia_konieczna/" />

            <div className="border-t border-foreground/10 pt-10">
              <h3 className="text-xs uppercase tracking-widest text-mocha">Godziny otwarcia</h3>
              <dl className="mt-4 space-y-2 text-sm text-foreground/75">
                <Row label="Pon — Pt" value="7:00 — 21:00" />
                <Row label="Sobota" value="9:00 — 14:00" />
                <Row label="Niedziela" value="zamknięte" />
              </dl>
            </div>

            <div className="border-t border-foreground/10 pt-10">
              <p className="text-sm text-foreground/80">
                Najszybciej zarezerwujesz zajęcia online —{" "}
                <Link to="/grafik" className="text-terracotta underline-offset-4 hover:underline">
                  zobacz grafik
                </Link>{" "}
                lub{" "}
                <Link to="/rejestracja" className="text-terracotta underline-offset-4 hover:underline">
                  załóż konto
                </Link>
                .
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="rounded-2xl border border-foreground/10 bg-background p-8 md:p-10">
            <h2 className="font-display text-2xl">Napisz do nas</h2>
            <p className="mt-2 text-sm text-foreground/80">Odpowiadamy w ciągu 24 godzin (w dni robocze).</p>

            <div className="mt-8 space-y-5">
              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-widest text-foreground/80">Imię</label>
                <input
                  type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-md border border-foreground/15 bg-background px-4 py-2.5 text-sm focus:border-terracotta focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-widest text-foreground/80">E-mail</label>
                <input
                  type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-md border border-foreground/15 bg-background px-4 py-2.5 text-sm focus:border-terracotta focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-widest text-foreground/80">Wiadomość</label>
                <textarea
                  required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full resize-none rounded-md border border-foreground/15 bg-background px-4 py-2.5 text-sm focus:border-terracotta focus:outline-none"
                />
              </div>
              <button
                type="submit" disabled={sending}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-6 py-3 text-xs uppercase tracking-widest text-cream hover:bg-terracotta disabled:opacity-60"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Wyślij wiadomość
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="px-6 pb-24 md:px-10 md:pb-32">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-end justify-between gap-6">
            <div>
              <span className="text-xs uppercase tracking-widest text-mocha">Dojazd</span>
              <h2 className="mt-3 font-display text-3xl md:text-4xl">Znajdź nas na mapie</h2>
              <p className="mt-3 max-w-xl text-sm text-foreground/80">
                ul. Poznańska 117, 62-023 Kamionki — kilka minut od obwodnicy Poznania.
              </p>
            </div>
            <a
              href="https://www.google.com/maps/dir/?api=1&destination=ul.+Pozna%C5%84ska+117%2C+62-023+Kamionki"
              target="_blank"
              rel="noreferrer noopener"
              className="hidden shrink-0 items-center gap-2 rounded-full border border-foreground/20 px-5 py-2.5 text-xs uppercase tracking-widest hover:border-terracotta hover:text-terracotta md:inline-flex"
            >
              Wyznacz trasę <ArrowRight size={14} />
            </a>
          </div>

          <div className="mt-8 overflow-hidden rounded-2xl border border-foreground/10 shadow-sm">
            <iframe
              title="Mapa dojazdu — ul. Poznańska 117, Kamionki"
              src="https://www.openstreetmap.org/export/embed.html?bbox=17.0123%2C52.3299%2C17.0323%2C52.3499&layer=mapnik&marker=52.3399%2C17.0223"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="block h-[420px] w-full md:h-[520px]"
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-foreground/70">
            <a
              href="https://www.openstreetmap.org/?mlat=52.3399&mlon=17.0223#map=17/52.3399/17.0223"
              target="_blank"
              rel="noreferrer noopener"
              className="underline-offset-4 hover:text-terracotta hover:underline"
            >
              Otwórz większą mapę
            </a>
            <a
              href="https://www.google.com/maps/dir/?api=1&destination=ul.+Pozna%C5%84ska+117%2C+62-023+Kamionki"
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-2 underline-offset-4 hover:text-terracotta hover:underline md:hidden"
            >
              Wyznacz trasę <ArrowRight size={12} />
            </a>
          </div>
        </div>
      </section>

      <section className="bg-sand px-6 py-20 md:px-10 md:py-28">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-display text-4xl leading-tight md:text-5xl">Wpadnij na sesję Intro</h2>
          <p className="mx-auto mt-6 max-w-xl text-foreground/80">
            Pierwsza wizyta tylko 79 zł. Załóż konto, wybierz termin i zacznij dziś.
          </p>
          <Link
            to="/rejestracja"
            className="mt-10 inline-flex items-center gap-3 rounded-full bg-foreground px-8 py-4 text-xs uppercase tracking-widest text-cream hover:bg-terracotta"
          >
            Załóż konto <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function ContactRow({
  icon: Icon, label, lines, href,
}: { icon: typeof MapPin; label: string; lines: string[]; href?: string }) {
  const content = (
    <>
      <span className="text-xs uppercase tracking-widest text-mocha">{label}</span>
      <div className="mt-2 text-base text-foreground/85">
        {lines.map((l) => <div key={l}>{l}</div>)}
      </div>
    </>
  );
  return (
    <div className="flex items-start gap-4">
      <div className="mt-1 rounded-full border border-foreground/15 p-3 text-terracotta">
        <Icon size={18} strokeWidth={1.5} />
      </div>
      <div className="flex-1">
        {href ? <a href={href} className="block hover:text-terracotta">{content}</a> : content}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-foreground/10 pb-2">
      <dt className="text-foreground/80">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
