import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Mail, MapPin, Phone, Instagram, Facebook, ArrowRight, Send, Loader2, MessageCircle } from "lucide-react";
import { Navigation } from "@/components/site/Navigation";
import { Footer } from "@/components/site/Footer";
import { toast } from "sonner";
import { submitContactMessage } from "@/lib/contact.functions";

const KONTAKT_URL = "https://flowharmonypilates.lovable.app/kontakt";

const localBusinessJsonLd = {
  "@context": "https://schema.org",
  "@type": "HealthClub",
  "@id": `${KONTAKT_URL}#studio`,
  name: "Flow & Harmony — Studio Pilates Reformery",
  legalName: "Fites Joanna Konieczna",
  taxID: "PL7822224858",
  vatID: "PL7822224858",
  description:
    "Kameralne studio pilates na reformerach w Poznaniu. Zajęcia solo, w parach i grupowe (max 4 osoby), Cadillac 1:1.",
  url: "https://flowharmony.pl",
  telephone: "+48501817979",
  email: "joanna@flowharmony.pl",
  image: "https://flowharmony.pl/og-image.jpg",
  priceRange: "$$",
  address: {
    "@type": "PostalAddress",
    streetAddress: "ul. Piotrowska 3",
    addressLocality: "Poznań",
    postalCode: "62-353",
    addressRegion: "wielkopolskie",
    addressCountry: "PL",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 52.4064,
    longitude: 16.9252,
  },
  areaServed: ["Poznań", "Kórnik", "Borówiec", "Kamionki"],
  founder: { "@type": "Person", name: "Joanna Konieczna" },
  sameAs: [
    "https://www.instagram.com/flow_harmony_pilates/",
    "https://www.instagram.com/asia_konieczna/",
    "https://www.facebook.com/joanna.konieczna.1614",
  ],
  hasMap:
    "https://www.google.com/maps/dir/?api=1&destination=ul.+Piotrowska+3%2C+62-353+Pozna%C5%84",
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "07:00",
      closes: "21:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: "Saturday",
      opens: "09:00",
      closes: "14:00",
    },
  ],
  contactPoint: [
    {
      "@type": "ContactPoint",
      telephone: "+48501817979",
      contactType: "customer service",
      areaServed: "PL",
      availableLanguage: ["Polish", "English"],
    },
  ],
};

export const Route = createFileRoute("/kontakt")({
  head: () => ({
    meta: [
      { title: "Kontakt — Studio Pilates Flow & Harmony, Poznań | Joanna Konieczna" },
      {
        name: "description",
        content:
          "Studio Pilates Flow & Harmony prowadzone przez Joannę Konieczną — ul. Piotrowska 3, 62-353 Poznań k. Poznania. Tel. +48 501 817 979. Rezerwacja online, WhatsApp, e-mail.",
      },
      { property: "og:title", content: "Kontakt — Studio Pilates Flow & Harmony, Poznań | Joanna Konieczna" },
      {
        property: "og:description",
        content:
          "Zadzwoń, napisz na WhatsApp lub odwiedź nas: ul. Piotrowska 3, Poznań. Pon–Pt 7:00–21:00, Sob 9:00–14:00.",
      },
      { property: "og:url", content: KONTAKT_URL },
      { property: "og:type", content: "website" },

      // Kontakt + lokalizacja (czytelne dla wyszukiwarek i parserów)
      { name: "contact", content: "+48 501 817 979" },
      { name: "telephone", content: "+48 501 817 979" },
      { name: "email", content: "joanna@flowharmony.pl" },
      { name: "geo.region", content: "PL-30" },
      { name: "geo.placename", content: "Poznań" },
      { name: "geo.position", content: "52.4064;16.9252" },
      { name: "ICBM", content: "52.4064, 16.9252" },
    ],
    links: [{ rel: "canonical", href: KONTAKT_URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(localBusinessJsonLd),
      },
    ],
  }),
  component: KontaktPage,
});

function KontaktPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "", website: "" });
  const [sending, setSending] = useState(false);
  const submit = useServerFn(submitContactMessage);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSending(true);
    try {
      await submit({ data: form });
      toast.success("Dziękujemy! Odpowiemy najszybciej, jak to możliwe.");
      setForm({ name: "", email: "", phone: "", message: "", website: "" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Coś poszło nie tak");
    } finally {
      setSending(false);
    }
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

      {/* Wyraźny NAP — zgodny ze schematem LocalBusiness */}
      <section className="px-6 pb-6 md:px-10">
        <div className="mx-auto max-w-6xl">
          <div
            itemScope
            itemType="https://schema.org/HealthClub"
            className="rounded-2xl border border-foreground/10 bg-background p-6 md:flex md:items-center md:justify-between md:gap-8 md:p-8"
          >
            <div className="md:flex-1">
              <h2 itemProp="name" className="font-display text-xl md:text-2xl">
                Flow & Harmony — Studio Pilates Reformery
              </h2>
              <p className="mt-1 text-sm text-foreground/70">
                <span itemProp="legalName">Fites Joanna Konieczna</span> · NIP <span itemProp="taxID">7822224858</span>
              </p>
              <div
                itemProp="address"
                itemScope
                itemType="https://schema.org/PostalAddress"
                className="mt-2 text-sm text-foreground/80"
              >
                <span itemProp="streetAddress">ul. Piotrowska 3</span>,{" "}
                <span itemProp="postalCode">62-353</span>{" "}
                <span itemProp="addressLocality">Poznań</span>
                <meta itemProp="addressRegion" content="wielkopolskie" />
                <meta itemProp="addressCountry" content="PL" />
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2 md:mt-0 md:items-end">
              <a
                href="tel:+48501817979"
                itemProp="telephone"
                className="inline-flex items-center gap-2 text-lg font-medium hover:text-terracotta"
              >
                <Phone size={18} strokeWidth={1.5} />
                +48 501 817 979
              </a>
              <a
                href="mailto:joanna@flowharmony.pl"
                itemProp="email"
                className="inline-flex items-center gap-2 text-sm text-foreground/80 hover:text-terracotta"
              >
                <Mail size={16} strokeWidth={1.5} />
                joanna@flowharmony.pl
              </a>
            </div>
          </div>
        </div>
      </section>
      <section className="px-6 pb-24 md:px-10 md:pb-32">
        <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-2 md:gap-16">
          <div className="space-y-10">
            <ContactRow icon={MapPin} label="Adres" lines={["ul. Piotrowska 3", "62-353 Poznań"]} />
            <ContactRow icon={Phone} label="Telefon" lines={["+48 501 817 979", "Joanna Konieczna"]} href="tel:+48501817979" />
            <ContactRow
              icon={MessageCircle}
              label="WhatsApp"
              lines={["Napisz do nas — odpowiadamy w ciągu kilku minut"]}
              href="https://wa.me/48501817979?text=Cze%C5%9B%C4%87%21%20Mam%20pytanie%20o%20zaj%C4%99cia%20w%20Flow%20%26%20Harmony."
            />
            <ContactRow icon={Mail} label="E-mail" lines={["joanna@flowharmony.pl"]} href="mailto:joanna@flowharmony.pl" />
            <ContactRow icon={Instagram} label="Instagram studia" lines={["@flow_harmony_pilates"]} href="https://www.instagram.com/flow_harmony_pilates/" />
            <ContactRow icon={Instagram} label="Instagram Joanny" lines={["@asia_konieczna"]} href="https://www.instagram.com/asia_konieczna/" />
            <ContactRow icon={Facebook} label="Facebook" lines={["Joanna Konieczna"]} href="https://www.facebook.com/joanna.konieczna.1614" />

            <a
              href="https://wa.me/48501817979?text=Cze%C5%9B%C4%87%21%20Mam%20pytanie%20o%20zaj%C4%99cia%20w%20Flow%20%26%20Harmony."
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-3 rounded-full bg-[#25D366] px-6 py-3 text-xs uppercase tracking-widest text-white shadow-sm transition-all hover:bg-[#1ebe5d]"
            >
              <MessageCircle size={16} strokeWidth={2} />
              Napisz na WhatsApp
            </a>

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
                <label className="mb-1.5 block text-xs uppercase tracking-widest text-foreground/80">Telefon (opcjonalnie)</label>
                <input
                  type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
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
              {/* honeypot — niewidoczne dla ludzi, łapie boty */}
              <input
                type="text" tabIndex={-1} autoComplete="off" aria-hidden="true"
                value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })}
                className="hidden"
              />
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
                ul. Piotrowska 3, 62-353 Poznań — kilka minut od obwodnicy Poznania.
              </p>
            </div>
            <a
              href="https://www.google.com/maps/dir/?api=1&destination=ul.+Piotrowska+3%2C+62-353+Pozna%C5%84"
              target="_blank"
              rel="noreferrer noopener"
              className="hidden shrink-0 items-center gap-2 rounded-full border border-foreground/20 px-5 py-2.5 text-xs uppercase tracking-widest hover:border-terracotta hover:text-terracotta md:inline-flex"
            >
              Wyznacz trasę <ArrowRight size={14} />
            </a>
          </div>

          <div className="mt-8 overflow-hidden rounded-2xl border border-foreground/10 shadow-sm">
            <iframe
              title="Mapa dojazdu — ul. Piotrowska 3, Poznań"
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
              href="https://www.google.com/maps/dir/?api=1&destination=ul.+Piotrowska+3%2C+62-353+Pozna%C5%84"
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
            Pierwsza wizyta tylko 99 zł — w kameralnej grupie max 4 osób, z indywidualnym wprowadzeniem.
          </p>
          <Link
            to="/rejestracja"
            className="mt-10 inline-flex items-center gap-3 rounded-full bg-foreground px-8 py-4 text-xs uppercase tracking-widest text-cream hover:bg-terracotta"
          >
            Załóż konto <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <a
        href="https://wa.me/48501817979?text=Cze%C5%9B%C4%87%21%20Mam%20pytanie%20o%20zaj%C4%99cia%20w%20Flow%20%26%20Harmony."
        target="_blank"
        rel="noreferrer noopener"
        aria-label="Napisz na WhatsApp"
        className="fixed bottom-6 right-6 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105 hover:bg-[#1ebe5d] md:bottom-8 md:right-8"
      >
        <MessageCircle size={26} strokeWidth={2} />
      </a>

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
