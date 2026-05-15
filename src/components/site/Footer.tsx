import { Link } from "@tanstack/react-router";
import { Instagram, Mail, MapPin, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-ink text-cream">
      <div className="mx-auto max-w-7xl px-6 py-20 md:px-10">
        <div className="grid gap-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="font-display text-3xl tracking-wider-2">
              MIMOSA
              <span className="ml-2 text-base tracking-widest text-nude">PILATES</span>
            </div>
            <p className="mt-6 max-w-md font-display text-xl italic text-cream/70">
              Twoja przestrzeń ruchu i wytchnienia.
            </p>
            <div className="mt-8 flex items-center gap-4">
              <a
                href="https://instagram.com"
                aria-label="Instagram"
                className="rounded-full border border-cream/20 p-3 transition-colors hover:bg-cream hover:text-ink"
              >
                <Instagram size={18} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-xs uppercase tracking-widest text-nude">Studio</h4>
            <ul className="mt-6 space-y-3 text-sm text-cream/80">
              <li className="flex items-start gap-3">
                <MapPin size={16} className="mt-1 shrink-0" />
                <span>ul. Poznańska 117<br />Kamionki</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={16} /> +48 123 456 789
              </li>
              <li className="flex items-center gap-3">
                <Mail size={16} /> hello@mimosapilates.pl
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs uppercase tracking-widest text-nude">Nawigacja</h4>
            <ul className="mt-6 space-y-3 text-sm">
              <li><Link to="/studio" className="text-cream/80 hover:text-cream">O studiu</Link></li>
              <li><Link to="/zajecia" className="text-cream/80 hover:text-cream">Zajęcia</Link></li>
              <li><Link to="/grafik" className="text-cream/80 hover:text-cream">Grafik</Link></li>
              <li><Link to="/cennik" className="text-cream/80 hover:text-cream">Cennik</Link></li>
              <li><Link to="/kontakt" className="text-cream/80 hover:text-cream">Kontakt</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-cream/10 pt-8 text-xs uppercase tracking-widest text-cream/50 md:flex-row">
          <span>© {new Date().getFullYear()} Mimosa Pilates</span>
          <span>Designerskie studio reformer pilates</span>
        </div>
      </div>
    </footer>
  );
}
