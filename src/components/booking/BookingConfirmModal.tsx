import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { useEffect, useState } from "react";
import { Phone, UserPlus } from "lucide-react";
import { Link } from "@tanstack/react-router";

export type SlotInfo = {
  classId: string;
  startsAt: string;
  className: string;
  classColor: string;
  instructorName: string;
  durationMinutes: number;
  status: "available" | "waitlist";
};

export type GuestData = {
  fullName: string;
  email: string;
  phone: string;
  smsOptIn: boolean;
  acceptTerms: boolean;
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slot: SlotInfo | null;
  onConfirm: (extras: { phone?: string; smsOptIn?: boolean; guest?: GuestData }) => Promise<void> | void;
  loading?: boolean;
  /** Pokaż pole telefonu + zgodę na SMS, jeśli klient jest zalogowany i nie ma jeszcze numeru */
  askPhone?: boolean;
  /** Tryb gościa — wymaga imienia, e-maila i telefonu */
  guestMode?: boolean;
}

export function BookingConfirmModal({ open, onOpenChange, slot, onConfirm, loading, askPhone, guestMode }: Props) {
  const [phone, setPhone] = useState("");
  const [smsOptIn, setSmsOptIn] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [guestError, setGuestError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setPhone(""); setSmsOptIn(false); setPhoneError(null);
      setFullName(""); setEmail(""); setAcceptTerms(false); setGuestError(null);
    }
  }, [open]);

  if (!slot) return null;
  const isWaitlist = slot.status === "waitlist";

  function handleConfirm() {
    let trimmed = phone.trim();

    if (guestMode && !isWaitlist) {
      if (fullName.trim().length < 2) { setGuestError("Podaj imię i nazwisko"); return; }
      if (!/^\S+@\S+\.\S+$/.test(email.trim())) { setGuestError("Podaj poprawny e-mail"); return; }
      const digits = trimmed.replace(/\s|-/g, "");
      if (!/^(\+?\d{9,15})$/.test(digits)) { setGuestError("Podaj poprawny numer telefonu"); return; }
      if (!acceptTerms) { setGuestError("Musisz zaakceptować regulamin i politykę prywatności"); return; }
      const normalized = digits.startsWith("+") ? digits : `+48${digits}`;
      onConfirm({
        guest: {
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: normalized,
          smsOptIn,
          acceptTerms: true,
        },
      });
      return;
    }

    if (askPhone && smsOptIn) {
      const digits = trimmed.replace(/\s|-/g, "");
      const ok = /^(\+?\d{9,15})$/.test(digits);
      if (!ok) { setPhoneError("Podaj poprawny numer telefonu"); return; }
      trimmed = digits.startsWith("+") ? digits : `+48${digits}`;
    }
    onConfirm({
      phone: trimmed && askPhone ? trimmed : undefined,
      smsOptIn: askPhone ? smsOptIn : undefined,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {isWaitlist ? "Dopisać na listę rezerwową?" : "Potwierdź rezerwację"}
          </DialogTitle>
          <DialogDescription>
            {isWaitlist
              ? "Brak wolnych miejsc. Dopisanie do rezerwy daje Ci szansę wejścia, gdy ktoś odwoła zajęcia."
              : "Sprawdź szczegóły zajęć przed potwierdzeniem."}
          </DialogDescription>
        </DialogHeader>

        {isWaitlist ? (
          <div className="rounded-md border border-terracotta/30 bg-terracotta/10 px-3 py-2 text-xs text-terracotta">
            Komplet — limit miejsc wyczerpany. Możesz dołączyć do listy rezerwowej (bez opłaty).
            {guestMode && <div className="mt-1">Lista rezerwowa wymaga konta — <Link to="/logowanie" className="underline">zaloguj się</Link> lub <Link to="/rejestracja" className="underline">załóż konto</Link>.</div>}
          </div>
        ) : (
          <div className="rounded-md border border-foreground/20 bg-foreground/5 px-3 py-2 text-xs text-foreground/80">
            Rezerwacja wymaga opłacenia online (Przelewy24). <strong>Tryb testowy: 1,00 zł</strong>. Po opłaceniu miejsce zostanie potwierdzone automatycznie.
          </div>
        )}

        <div className="space-y-3 rounded-lg border border-border bg-cream/40 p-4">
          <div className="flex items-center gap-2">
            <span
              className="inline-block rounded-sm px-2 py-0.5 text-[10px] uppercase tracking-widest text-cream"
              style={{ backgroundColor: slot.classColor }}
            >
              {slot.className}
            </span>
          </div>
          <div className="font-display text-2xl text-foreground">
            {format(new Date(slot.startsAt), "EEEE, d MMM · HH:mm", { locale: pl })}
          </div>
          <div className="text-sm text-muted-foreground">
            Prowadzi: <span className="text-foreground">{slot.instructorName}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Czas trwania: {slot.durationMinutes} min
          </div>
        </div>

        {guestMode && !isWaitlist && (
          <div className="space-y-3 rounded-lg border border-terracotta/20 bg-terracotta/5 p-4">
            <div className="flex items-start gap-2 text-xs text-mocha">
              <UserPlus className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                Rezerwujesz bez logowania. Po opłaceniu utworzymy Ci konto i wyślemy e-mail z linkiem do ustawienia hasła. Masz już konto? <Link to="/logowanie" className="underline">Zaloguj się</Link>.
              </span>
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-mocha">Imię i nazwisko</label>
              <input
                type="text" value={fullName} onChange={(e) => { setFullName(e.target.value); setGuestError(null); }}
                placeholder="Anna Kowalska" autoComplete="name"
                className="mt-1 w-full rounded-md border border-foreground/15 bg-background px-3 py-2 text-sm focus:border-terracotta focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-mocha">E-mail</label>
              <input
                type="email" value={email} onChange={(e) => { setEmail(e.target.value); setGuestError(null); }}
                placeholder="anna@example.com" autoComplete="email"
                className="mt-1 w-full rounded-md border border-foreground/15 bg-background px-3 py-2 text-sm focus:border-terracotta focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-mocha">Telefon</label>
              <input
                type="tel" value={phone} onChange={(e) => { setPhone(e.target.value); setGuestError(null); }}
                placeholder="+48 600 000 000" autoComplete="tel"
                className="mt-1 w-full rounded-md border border-foreground/15 bg-background px-3 py-2 text-sm focus:border-terracotta focus:outline-none"
              />
            </div>
            <label className="flex items-start gap-2 text-xs text-foreground">
              <input type="checkbox" checked={smsOptIn} onChange={(e) => setSmsOptIn(e.target.checked)} className="mt-0.5" />
              <span>Zgoda na SMS-y przypominające (opcjonalnie).</span>
            </label>
            <label className="flex items-start gap-2 text-xs text-foreground">
              <input type="checkbox" checked={acceptTerms} onChange={(e) => { setAcceptTerms(e.target.checked); setGuestError(null); }} className="mt-0.5" />
              <span>
                Akceptuję <Link to="/regulamin" className="underline">regulamin</Link> i <Link to="/polityka-prywatnosci" className="underline">politykę prywatności</Link>.
              </span>
            </label>
            {guestError && <p className="text-xs text-destructive">{guestError}</p>}
          </div>
        )}

        {askPhone && !guestMode && (
          <div className="space-y-3 rounded-lg border border-terracotta/20 bg-terracotta/5 p-4">
            <div className="flex items-start gap-2 text-xs text-mocha">
              <Phone className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                Potwierdzenie wyślemy na e-mail. Możesz też dostać <strong>SMS-przypomnienie 2h przed</strong> zajęciami.
              </span>
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-mocha">Telefon (opcjonalnie)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setPhoneError(null); }}
                placeholder="+48 600 000 000"
                className="mt-1 w-full rounded-md border border-foreground/15 bg-background px-3 py-2 text-sm focus:border-terracotta focus:outline-none"
              />
              {phoneError && <p className="mt-1 text-xs text-destructive">{phoneError}</p>}
            </div>
            <label className="flex items-start gap-2 text-xs text-foreground">
              <input
                type="checkbox"
                checked={smsOptIn}
                onChange={(e) => setSmsOptIn(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                Wyrażam zgodę na otrzymywanie SMS-ów przypominających o zajęciach od Flow & Harmony. Zgodę mogę wycofać w panelu konta.
              </span>
            </label>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Anuluj
          </Button>
          <Button onClick={handleConfirm} disabled={loading || (guestMode && isWaitlist)}>
            {loading ? "Przekierowuję…" : isWaitlist ? "Dopisz na rezerwę" : "Zapłać i zarezerwuj (1 zł)"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
