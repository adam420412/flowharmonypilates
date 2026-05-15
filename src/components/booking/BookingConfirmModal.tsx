import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { useEffect, useState } from "react";
import { Phone } from "lucide-react";

export type SlotInfo = {
  classId: string;
  startsAt: string;
  className: string;
  classColor: string;
  instructorName: string;
  durationMinutes: number;
  status: "available" | "waitlist";
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slot: SlotInfo | null;
  onConfirm: (extras: { phone?: string; smsOptIn?: boolean }) => Promise<void> | void;
  loading?: boolean;
  /** Pokaż pole telefonu + zgodę na SMS, jeśli klient nie ma jeszcze numeru */
  askPhone?: boolean;
}

export function BookingConfirmModal({ open, onOpenChange, slot, onConfirm, loading, askPhone }: Props) {
  const [phone, setPhone] = useState("");
  const [smsOptIn, setSmsOptIn] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  useEffect(() => {
    if (open) { setPhone(""); setSmsOptIn(false); setPhoneError(null); }
  }, [open]);

  if (!slot) return null;
  const isWaitlist = slot.status === "waitlist";

  function handleConfirm() {
    let trimmed = phone.trim();
    if (smsOptIn) {
      // Walidacja PL: +48 i 9 cyfr lub 9 cyfr
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {isWaitlist ? "Dopisać na listę rezerwową?" : "Potwierdź rezerwację"}
          </DialogTitle>
          <DialogDescription>
            {isWaitlist
              ? "Brak wolnych miejsc (limit 4 osoby na zajęciach). Dopisanie do rezerwy daje Ci szansę wejścia, gdy ktoś odwoła zajęcia."
              : "Sprawdź szczegóły zajęć przed potwierdzeniem. Limit miejsc: 4 osoby."}
          </DialogDescription>
        </DialogHeader>

        {isWaitlist && (
          <div className="rounded-md border border-terracotta/30 bg-terracotta/10 px-3 py-2 text-xs text-terracotta">
            Komplet — limit 4 miejsc został wyczerpany. Możesz dołączyć do listy rezerwowej.
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

        {askPhone && (
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
          <Button onClick={handleConfirm} disabled={loading}>
            {loading ? "Zapisywanie…" : isWaitlist ? "Dopisz na rezerwę" : "Rezerwuję"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
