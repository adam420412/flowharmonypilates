import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Mail, MapPin, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-ink text-cream">
      <div className="mx-auto max-w-7xl px-6 py-20 md:px-10">
        <div className="grid gap-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link to="/" className="inline-flex items-center gap-3">
              <h2 className="font-display text-3xl text-cream lg:text-4xl">
                Flow <em className="italic text-terracotta">&</em> Harmony
              </h2>
            </Link>
            <p className="mt-3 text-xs uppercase tracking-widest text-nude">Studio Pilates · Reformery</p>
            <p className="mt-6 max-w-md font-display text-xl italic text-cream/85">
              Twoja przestrzeń ruchu i wytchnienia.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="https://www.instagram.com/flow_harmony_pilates/"
                target="_blank"
                rel="noreferrer noopener"
                aria-label="Instagram Flow & Harmony Pilates"
                className="rounded-full border border-cream/20 p-3 transition-colors hover:bg-cream hover:text-ink"
              >
                <Instagram size={18} />
              </a>
              <a
                href="https://www.instagram.com/asia_konieczna/"
                target="_blank"
                rel="noreferrer noopener"
                aria-label="Instagram Joanny Koniecznej"
                className="rounded-full border border-cream/20 p-3 transition-colors hover:bg-cream hover:text-ink"
              >
                <Instagram size={18} />
              </a>
              <a
                href="https://www.facebook.com/joanna.konieczna.1614"
                target="_blank"
                rel="noreferrer noopener"
                aria-label="Facebook Joanny Koniecznej"
                className="rounded-full border border-cream/20 p-3 transition-colors hover:bg-cream hover:text-ink"
              >
                <Facebook size={18} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-xs uppercase tracking-widest text-nude">Studio</h4>
            <ul className="mt-6 space-y-3 text-sm text-cream/90">
              <li className="flex items-start gap-3">
                <MapPin size={16} className="mt-1 shrink-0" />
                <span>ul. Piotrowska 3<br />Kamionki</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={16} />
                <a href="tel:+48501817979" className="hover:text-cream">+48 501 817 979 · Joanna Konieczna</a>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={16} /> joanna@flowharmony.pl
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs uppercase tracking-widest text-nude">Nawigacja</h4>
            <ul className="mt-6 space-y-3 text-sm">
              <li><Link to="/studio" className="text-cream/90 hover:text-cream">O studiu</Link></li>
              <li><Link to="/zajecia" className="text-cream/90 hover:text-cream">Zajęcia</Link></li>
              <li><Link to="/grafik" className="text-cream/90 hover:text-cream">Grafik</Link></li>
              <li><Link to="/cennik" className="text-cream/90 hover:text-cream">Cennik</Link></li>
              <li><Link to="/kontakt" className="text-cream/90 hover:text-cream">Kontakt</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-cream/10 pt-8 text-xs uppercase tracking-widest text-cream/75 md:flex-row">
          <span>© {new Date().getFullYear()} Flow & Harmony</span>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link to="/regulamin" className="hover:text-cream">Regulamin</Link>
            <Link to="/polityka-prywatnosci" className="hover:text-cream">Polityka prywatności</Link>
          </div>
          <span className="normal-case tracking-normal text-cream/60">
            Strona internetowa zbudowana przez{" "}
            <a
              href="http://fotz.pl/"
              target="_blank"
              rel="noreferrer noopener"
              className="text-cream/90 underline-offset-4 hover:text-cream hover:underline"
            >
              Fotz Studio
            </a>
          </span>
        </div>

      </div>
    </footer>
  );
}
