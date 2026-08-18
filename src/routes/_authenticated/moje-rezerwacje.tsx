import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { format, differenceInHours } from "date-fns";
import { pl } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { Navigation } from "@/components/site/Navigation";
import { Footer } from "@/components/site/Footer";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { notifyWaitlistPromoted } from "@/lib/notifications.functions";
import { payForBooking, expireUnpaidBookings } from "@/lib/booking-payments.functions";
import { PaymentCountdown } from "@/components/booking/PaymentCountdown";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/moje-rezerwacje")({
  component: MyBookingsPage,
});

type PromotionNotice = {
  channel: "email" | "sms";
  status: string;
  created_at: string;
};

type BookingRow = {
  id: string;
  status: "confirmed" | "waitlist" | "cancelled";
  created_at: string;
  payment_due_at?: string | null;
  waitlist_position?: number | null;
  promotion_notices?: PromotionNotice[];
  classes: {
    id: string;
    starts_at: string;
    duration_minutes: number;
    is_cancelled: boolean;
    class_types: { name: string; color: string } | null;
    instructors: { full_name: string } | null;
  } | null;
};

function MyBookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoursBefore, setHoursBefore] = useState(12);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const notifyWaitlistPromotedFn = useServerFn(notifyWaitlistPromoted);
  const payFn = useServerFn(payForBooking);
  const expireFn = useServerFn(expireUnpaidBookings);
  const [payingId, setPayingId] = useState<string | null>(null);

  async function pay(bookingId: string) {
    setPayingId(bookingId);
    try {
      const { redirectUrl } = await payFn({ data: { bookingId } });
      window.location.href = redirectUrl;
    } catch (e) {
      setPayingId(null);
      toast.error(e instanceof Error ? e.message : "Nie udało się rozpocząć płatności");
    }
  }

  async function load() {
    if (!user) return;
    setLoading(true);
    try { await expireFn(); } catch { /* ignore */ }
    const [{ data }, { data: settings }] = await Promise.all([
      supabase
        .from("bookings")
        .select(`
          id, status, created_at, payment_due_at,
          classes:class_id (
            id, starts_at, duration_minutes, is_cancelled,
            class_types:class_type_id (name, color),
            instructors:instructor_id (full_name)
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase.from("app_settings").select("value").eq("key", "cancellation_hours_before").maybeSingle(),
    ]);
    const rows = ((data ?? []) as unknown as BookingRow[]);
    const bookingIds = rows.map((b) => b.id);
    const { data: notices } = bookingIds.length
      ? await supabase
          .from("notification_log")
          .select("booking_id, channel, status, created_at")
          .eq("user_id", user.id)
          .eq("kind", "waitlist_promoted")
          .in("booking_id", bookingIds)
      : { data: [] as Array<{ booking_id: string; channel: string; status: string; created_at: string }> };
    const noticesByBooking = new Map<string, PromotionNotice[]>();
    for (const n of notices ?? []) {
      if (!n.booking_id) continue;
      const arr = noticesByBooking.get(n.booking_id) ?? [];
      arr.push({ channel: n.channel as "email" | "sms", status: n.status, created_at: n.created_at });
      noticesByBooking.set(n.booking_id, arr);
    }
    const withPositions = await Promise.all(
      rows.map(async (b) => {
        const promotion_notices = noticesByBooking.get(b.id);
        if (b.status !== "waitlist") return { ...b, promotion_notices };
        const { data: pos } = await supabase.rpc("waitlist_position", { _booking_id: b.id });
        return { ...b, waitlist_position: typeof pos === "number" ? pos : null, promotion_notices };
      })
    );
    setBookings(withPositions);
    if (settings?.value) setHoursBefore(Number(settings.value));
    setLoading(false);
  }

  useEffect(() => { load(); }, [user]);

  // Odświeżaj co 30 s, by pilnować terminów płatności
  useEffect(() => {
    if (!user) return;
    const t = setInterval(() => { load(); }, 30_000);
    return () => clearInterval(t);
  }, [user]);

  async function cancel() {
    if (!confirmId) return;
    setCancelling(true);
    const cancelledBooking = bookings.find((b) => b.id === confirmId);
    const classId = cancelledBooking?.classes?.id;
    const { data, error } = await supabase.rpc("cancel_booking", { _booking_id: confirmId });
    setCancelling(false);
    setConfirmId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    const result = data as { ok: boolean; error?: string; hours_before?: number; promoted_user_id?: string | null };
    if (!result.ok) {
      if (result.error === "too_late") {
        toast.error(`Rezerwację można odwołać najpóźniej ${result.hours_before} h przed zajęciami.`);
      } else {
        toast.error("Nie udało się odwołać rezerwacji");
      }
      return;
    }
    toast.success("Rezerwacja odwołana");
    if (result.promoted_user_id && classId) {
      try {
        await notifyWaitlistPromotedFn({
          data: { classId, promotedUserId: result.promoted_user_id },
        });
      } catch (e) {
        console.error("waitlist promoted notification failed:", e);
      }
    }
    load();
  }

  const upcoming = bookings.filter((b) => b.classes && new Date(b.classes.starts_at) >= new Date());
  const past = bookings.filter((b) => !b.classes || new Date(b.classes.starts_at) < new Date());

  return (
    <div className="min-h-screen bg-cream">
      <Navigation />
      <main className="mx-auto max-w-4xl px-6 pb-24 pt-32 md:px-10">
        <p className="text-xs uppercase tracking-widest text-mocha">Twoje konto</p>
        <h1 className="mt-2 font-display text-5xl text-foreground">Moje rezerwacje</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Rezerwację możesz odwołać najpóźniej <strong className="text-foreground">{hoursBefore} h</strong> przed zajęciami.
        </p>

        <section className="mt-10">
          <h2 className="mb-4 font-display text-2xl text-foreground">Nadchodzące</h2>
          {loading ? (
            <SkeletonList />
          ) : upcoming.length === 0 ? (
            <EmptyState />
          ) : (
            <ul className="space-y-3">
              {upcoming.map((b) => (
                <BookingCard
                  key={b.id}
                  booking={b}
                  hoursBefore={hoursBefore}
                  onCancel={() => setConfirmId(b.id)}
                  onPay={() => pay(b.id)}
                  paying={payingId === b.id}
                />
              ))}
            </ul>
          )}
        </section>

        {past.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-4 font-display text-2xl text-foreground">Historia</h2>
            <ul className="space-y-3 opacity-70">
              {past.map((b) => (
                <BookingCard key={b.id} booking={b} hoursBefore={hoursBefore} onCancel={() => {}} pastView />
              ))}
            </ul>
          </section>
        )}
      </main>
      <Footer />

      <AlertDialog open={!!confirmId} onOpenChange={(o) => !o && setConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Odwołać rezerwację?</AlertDialogTitle>
            <AlertDialogDescription>
              Po odwołaniu pierwsza osoba z listy rezerwowej zostanie automatycznie zapisana na zajęcia.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Wróć</AlertDialogCancel>
            <AlertDialogAction onClick={cancel} disabled={cancelling}>
              {cancelling ? "Odwoływanie…" : "Tak, odwołaj"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function BookingCard({
  booking, hoursBefore, onCancel, onPay, paying, pastView,
}: {
  booking: BookingRow; hoursBefore: number; onCancel: () => void; onPay?: () => void; paying?: boolean; pastView?: boolean;
}) {
  const c = booking.classes;
  if (!c) return null;
  const startsAt = new Date(c.starts_at);
  const hoursUntil = differenceInHours(startsAt, new Date());
  const canCancel = !pastView && booking.status !== "cancelled" && hoursUntil >= hoursBefore && !c.is_cancelled;
  const dueAt = booking.payment_due_at ? new Date(booking.payment_due_at) : null;
  const needsPayment =
    !pastView && booking.status === "confirmed" && !c.is_cancelled && !!dueAt && dueAt.getTime() > Date.now();

  const statusBadge =
    c.is_cancelled ? { label: "Zajęcia odwołane", cls: "bg-destructive/15 text-destructive" }
    : booking.status === "cancelled" ? { label: "Odwołana", cls: "bg-muted text-muted-foreground" }
    : booking.status === "waitlist" ? { label: "Lista rezerwowa", cls: "bg-terracotta/15 text-terracotta" }
    : { label: "Potwierdzona", cls: "bg-forest/15 text-forest" };

  return (
    <li className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-foreground/10 bg-background p-5">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="inline-block rounded-sm px-2 py-0.5 text-[10px] uppercase tracking-widest text-cream"
            style={{ backgroundColor: c.class_types?.color ?? "var(--terracotta)" }}
          >
            {c.class_types?.name ?? "—"}
          </span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest ${statusBadge.cls}`}>
            {statusBadge.label}
          </span>
          {booking.status === "waitlist" && booking.waitlist_position != null && (
            <span className="rounded-full bg-terracotta/10 px-2 py-0.5 text-[10px] uppercase tracking-widest text-terracotta ring-1 ring-terracotta/30">
              Pozycja #{booking.waitlist_position}
            </span>
          )}
        </div>
        <div className="mt-2 font-display text-xl text-foreground">
          {format(startsAt, "EEEE, d MMM · HH:mm", { locale: pl })}
        </div>
        <div className="text-sm text-muted-foreground">
          {c.instructors?.full_name} · {c.duration_minutes} min
        </div>
        {booking.status === "waitlist" && booking.waitlist_position != null && !pastView && (
          <p className="mt-1 text-xs text-terracotta">
            Jesteś na <strong>{booking.waitlist_position}.</strong> miejscu listy rezerwowej. Powiadomimy Cię, gdy zwolni się miejsce.
          </p>
        )}
        {!pastView && booking.status === "confirmed" && booking.payment_due_at && new Date(booking.payment_due_at).getTime() > Date.now() && (
          <div className="mt-2 rounded-lg border border-terracotta/30 bg-terracotta/10 p-2.5 text-xs text-terracotta">
            <PaymentCountdown dueAt={booking.payment_due_at} />
            <p className="mt-1">
              Rezerwacja nieopłacona — opłać do{" "}
              <strong>{format(new Date(booking.payment_due_at), "d MMM, HH:mm", { locale: pl })}</strong>,
              inaczej termin zostanie automatycznie zwolniony.
            </p>
          </div>
        )}
        {booking.promotion_notices && booking.promotion_notices.length > 0 && (
          <div className="mt-2 rounded-lg border border-forest/30 bg-forest/10 p-2.5">
            <p className="text-[11px] font-medium uppercase tracking-widest text-forest">
              Powiadomienie o awansie z listy rezerwowej
            </p>
            <ul className="mt-1 space-y-0.5">
              {booking.promotion_notices.map((n, i) => {
                const ok = n.status === "sent";
                return (
                  <li key={i} className="flex items-center gap-2 text-xs text-forest">
                    <span className={`inline-block h-1.5 w-1.5 rounded-full ${ok ? "bg-forest" : "bg-destructive"}`} />
                    <span className="uppercase tracking-widest text-[10px]">{n.channel}</span>
                    <span>{ok ? "wysłano" : `błąd (${n.status})`}</span>
                    <span className="text-forest/70">
                      · {format(new Date(n.created_at), "d MMM, HH:mm", { locale: pl })}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
      {!pastView && booking.status !== "cancelled" && (
        <div className="flex flex-col items-end gap-2">
          {needsPayment && onPay && (
            <button
              onClick={onPay}
              disabled={paying}
              className="rounded-full bg-terracotta px-5 py-2 text-xs uppercase tracking-widest text-cream transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {paying ? "Przekierowuję…" : "Zapłać"}
            </button>
          )}
          {canCancel ? (
            <button
              onClick={onCancel}
              className="rounded-full border border-foreground/20 px-4 py-2 text-xs uppercase tracking-widest text-foreground transition-all hover:border-destructive hover:text-destructive"
            >
              Odwołaj
            </button>
          ) : (
            <span className="text-xs text-muted-foreground">
              Nie można już odwołać<br />
              (min. {hoursBefore} h przed)
            </span>
          )}
        </div>
      )}
    </li>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-foreground/5" />)}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-foreground/15 bg-background p-10 text-center">
      <p className="text-muted-foreground">Brak nadchodzących rezerwacji.</p>
      <Link to="/grafik" className="mt-4 inline-block rounded-full bg-foreground px-6 py-2.5 text-xs uppercase tracking-widest text-cream">
        Zarezerwuj zajęcia
      </Link>
    </div>
  );
}
