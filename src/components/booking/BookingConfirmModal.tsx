import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

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
  onConfirm: () => Promise<void> | void;
  loading?: boolean;
}

export function BookingConfirmModal({ open, onOpenChange, slot, onConfirm, loading }: Props) {
  if (!slot) return null;
  const isWaitlist = slot.status === "waitlist";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
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

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Anuluj
          </Button>
          <Button onClick={onConfirm} disabled={loading}>
            {loading ? "Zapisywanie…" : isWaitlist ? "Dopisz na rezerwę" : "Rezerwuję"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
