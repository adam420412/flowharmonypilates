import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { addDays, addWeeks, format, startOfWeek } from "date-fns";
import { pl } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Filter, Calendar as CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/site/Navigation";
import { Footer } from "@/components/site/Footer";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { BookingConfirmModal, type SlotInfo } from "@/components/booking/BookingConfirmModal";
import { sendBookingConfirmation } from "@/lib/notifications.functions";

export const Route = createFileRoute("/grafik")({
  head: () => ({
    meta: [
      { title: "Grafik zajęć — Flow & Harmony" },
      { name: "description", content: "Sprawdź dostępne zajęcia reformer pilates i zarezerwuj swój slot online." },
      { property: "og:title", content: "Grafik zajęć — Flow & Harmony" },
      { property: "og:description", content: "Tygodniowy grafik zajęć w studio Flow & Harmony — pilates reformery." },
    ],
  }),
  component: GrafikPage,
});

type ClassType = { id: string; name: string; slug: string; color: string };
type Instructor = { id: string; full_name: string };
type ClassRow = {
  id: string;
  starts_at: string;
  duration_minutes: number;
  capacity: number;
  waitlist_capacity: number;
  is_cancelled: boolean;
  class_type_id: string;
  instructor_id: string;
};
type Counts = Record<string, { confirmed: number; waitlist: number }>;

function GrafikPage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [classTypes, setClassTypes] = useState<ClassType[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [counts, setCounts] = useState<Counts>({});
  const [myBookings, setMyBookings] = useState<Record<string, string>>({});
  const [filterType, setFilterType] = useState<string>("all");
  const [filterInstructor, setFilterInstructor] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [pendingSlot, setPendingSlot] = useState<{ slot: SlotInfo; classRow: ClassRow } | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [profile, setProfile] = useState<{ phone: string | null; sms_opt_in: boolean } | null>(null);
  const sendConfirm = useServerFn(sendBookingConfirmation);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  useEffect(() => {
    Promise.all([
      supabase.from("class_types").select("id,name,slug,color").eq("is_active", true).order("sort_order"),
      supabase.from("instructors").select("id,full_name").eq("is_active", true).order("sort_order"),
    ]).then(([t, i]) => {
      setClassTypes(t.data ?? []);
      setInstructors(i.data ?? []);
    });
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user) { setProfile(null); return; }
    supabase.from("profiles").select("phone,sms_opt_in").eq("id", user.id).maybeSingle()
      .then(({ data }) => setProfile(data ? { phone: data.phone, sms_opt_in: data.sms_opt_in } : { phone: null, sms_opt_in: false }));
  }, [isAuthenticated, user]);

  useEffect(() => {
    setLoading(true);
    const from = weekStart.toISOString();
    const to = addDays(weekStart, 7).toISOString();
    Promise.all([
      supabase
        .from("classes")
        .select("id,starts_at,duration_minutes,capacity,waitlist_capacity,is_cancelled,class_type_id,instructor_id")
        .gte("starts_at", from)
        .lt("starts_at", to)
        .order("starts_at"),
      supabase.rpc("class_booked_counts", { _from: from, _to: to }),
      isAuthenticated && user
        ? supabase.from("bookings").select("id,class_id,status").eq("user_id", user.id).neq("status", "cancelled")
        : Promise.resolve({ data: [] as Array<{ id: string; class_id: string; status: string }> }),
    ]).then(([c, cnt, mine]) => {
      setClasses(c.data ?? []);
      const map: Counts = {};
      (cnt.data ?? []).forEach((r: { class_id: string; confirmed_count: number; waitlist_count: number }) => {
        map[r.class_id] = { confirmed: r.confirmed_count, waitlist: r.waitlist_count };
      });
      setCounts(map);
      const m: Record<string, string> = {};
      (mine.data ?? []).forEach((b) => {
        m[b.class_id] = b.status;
      });
      setMyBookings(m);
      setLoading(false);
    });
  }, [weekStart, isAuthenticated, user]);

  const filtered = classes.filter(
    (c) =>
      (filterType === "all" || c.class_type_id === filterType) &&
      (filterInstructor === "all" || c.instructor_id === filterInstructor),
  );

  const slotsByDay = useMemo(() => {
    const map = new Map<string, ClassRow[]>();
    weekDays.forEach((d) => map.set(format(d, "yyyy-MM-dd"), []));
    filtered.forEach((c) => {
      const k = format(new Date(c.starts_at), "yyyy-MM-dd");
      map.get(k)?.push(c);
    });
    return map;
  }, [filtered, weekDays]);

  const ctMap = Object.fromEntries(classTypes.map((c) => [c.id, c]));
  const inMap = Object.fromEntries(instructors.map((i) => [i.id, i]));

  function statusOf(c: ClassRow): "available" | "waitlist" | "full" | "cancelled" {
    if (c.is_cancelled) return "cancelled";
    const cnt = counts[c.id] ?? { confirmed: 0, waitlist: 0 };
    if (cnt.confirmed < c.capacity) return "available";
    if (cnt.waitlist < c.waitlist_capacity) return "waitlist";
    return "full";
  }

  function openBooking(c: ClassRow) {
    if (!isAuthenticated || !user) {
      toast.info("Załóż darmowe konto, aby zarezerwować zajęcia.");
      navigate({ to: "/rejestracja" });
      return;
    }
    const status = statusOf(c);
    if (status === "full" || status === "cancelled") return;
    if (myBookings[c.id]) return;
    const ct = ctMap[c.class_type_id];
    const ins = inMap[c.instructor_id];
    setPendingSlot({
      classRow: c,
      slot: {
        classId: c.id,
        startsAt: c.starts_at,
        className: ct?.name ?? "—",
        classColor: ct?.color ?? "#C2725A",
        instructorName: ins?.full_name ?? "—",
        durationMinutes: c.duration_minutes,
        status: status === "available" ? "available" : "waitlist",
      },
    });
  }

  async function refreshAll() {
    if (!user) return;
    const from = weekStart.toISOString();
    const to = addDays(weekStart, 7).toISOString();
    const [{ data: cnt }, { data: mine }] = await Promise.all([
      supabase.rpc("class_booked_counts", { _from: from, _to: to }),
      supabase.from("bookings").select("id,class_id,status").eq("user_id", user.id).neq("status", "cancelled"),
    ]);
    const map: Counts = {};
    (cnt ?? []).forEach((r: { class_id: string; confirmed_count: number; waitlist_count: number }) => {
      map[r.class_id] = { confirmed: r.confirmed_count, waitlist: r.waitlist_count };
    });
    setCounts(map);
    const mm: Record<string, string> = {};
    (mine ?? []).forEach((b) => { mm[b.class_id] = b.status; });
    setMyBookings(mm);
  }

  async function confirmBooking(extras: { phone?: string; smsOptIn?: boolean }) {
    if (!pendingSlot || !user) return;
    setBookingLoading(true);
    const desired = pendingSlot.slot.status === "available" ? "confirmed" : "waitlist";

    // Zapisz telefon + zgodę, jeśli klient właśnie je podał
    if (extras.phone || extras.smsOptIn !== undefined) {
      await supabase.from("profiles").update({
        ...(extras.phone ? { phone: extras.phone } : {}),
        ...(extras.smsOptIn !== undefined ? { sms_opt_in: extras.smsOptIn, sms_opt_in_at: extras.smsOptIn ? new Date().toISOString() : null } : {}),
      }).eq("id", user.id);
      setProfile((p) => ({
        phone: extras.phone ?? p?.phone ?? null,
        sms_opt_in: extras.smsOptIn ?? p?.sms_opt_in ?? false,
      }));
    }

    const { data: inserted, error } = await supabase.from("bookings").upsert(
      { class_id: pendingSlot.classRow.id, user_id: user.id, status: desired },
      { onConflict: "class_id,user_id" },
    ).select("id").single();

    if (error) {
      setBookingLoading(false);
      toast.error(error.message);
      return;
    }
    toast.success(desired === "confirmed" ? "Zarezerwowano!" : "Dopisano do listy rezerwowej");
    setPendingSlot(null);
    refreshAll();

    // Mock potwierdzenie email (nie blokuje UX)
    if (inserted?.id) {
      sendConfirm({ data: { bookingId: inserted.id } }).catch((e) => {
        console.warn("send confirmation failed:", e);
      });
    }
    setBookingLoading(false);
  }


  return (
    <div className="min-h-screen bg-cream">
      <Navigation />
      <main className="mx-auto max-w-7xl px-6 pb-24 pt-32 md:px-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-mocha">Rezerwacje online</p>
            <h1 className="mt-2 font-display text-5xl text-foreground md:text-6xl">Grafik zajęć</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWeekStart(addWeeks(weekStart, -1))}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-foreground/15 text-foreground hover:bg-foreground/5"
              aria-label="Poprzedni tydzień"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
              className="rounded-full border border-foreground/15 px-4 py-2 text-xs uppercase tracking-widest text-foreground hover:bg-foreground/5"
            >
              Dziś
            </button>
            <button
              onClick={() => setWeekStart(addWeeks(weekStart, 1))}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-foreground/15 text-foreground hover:bg-foreground/5"
              aria-label="Następny tydzień"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarIcon className="h-4 w-4" />
          {format(weekStart, "d MMM", { locale: pl })} – {format(addDays(weekStart, 6), "d MMM yyyy", { locale: pl })}
        </p>

        {/* Filters */}
        <div className="mt-8 flex flex-wrap items-center gap-3 rounded-2xl border border-foreground/10 bg-background p-4">
          <Filter className="h-4 w-4 text-mocha" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-md border border-foreground/15 bg-background px-3 py-2 text-sm focus:border-terracotta focus:outline-none"
          >
            <option value="all">Wszystkie zajęcia</option>
            {classTypes.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <select
            value={filterInstructor}
            onChange={(e) => setFilterInstructor(e.target.value)}
            className="rounded-md border border-foreground/15 bg-background px-3 py-2 text-sm focus:border-terracotta focus:outline-none"
          >
            <option value="all">Wszystkie instruktorki</option>
            {instructors.map((i) => (
              <option key={i.id} value={i.id}>{i.full_name}</option>
            ))}
          </select>
          {(filterType !== "all" || filterInstructor !== "all") && (
            <button
              onClick={() => { setFilterType("all"); setFilterInstructor("all"); }}
              className="text-xs uppercase tracking-widest text-terracotta hover:underline"
            >
              Wyczyść
            </button>
          )}

          <div className="ml-auto flex items-center gap-3 text-xs">
            <Legend color="bg-forest" label="Dostępne" />
            <Legend color="bg-terracotta" label="Rezerwa" />
            <Legend color="bg-destructive" label="Pełne" />
          </div>
        </div>

        {/* Week grid */}
        <div className="mt-8 grid gap-4 lg:grid-cols-7">
          {weekDays.map((day) => {
            const slots = slotsByDay.get(format(day, "yyyy-MM-dd")) ?? [];
            const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
            return (
              <div
                key={day.toISOString()}
                className={`rounded-2xl border ${isToday ? "border-terracotta/50 bg-terracotta/5" : "border-foreground/10 bg-background"} p-4`}
              >
                <div className="mb-3 border-b border-foreground/10 pb-2">
                  <div className="text-xs uppercase tracking-widest text-mocha">
                    {format(day, "EEEE", { locale: pl })}
                  </div>
                  <div className="font-display text-2xl text-foreground">
                    {format(day, "d MMM", { locale: pl })}
                  </div>
                </div>

                {loading ? (
                  <div className="space-y-2">
                    {[1,2,3].map((i) => <div key={i} className="h-16 animate-pulse rounded-md bg-foreground/5" />)}
                  </div>
                ) : slots.length === 0 ? (
                  <p className="py-6 text-center text-xs text-muted-foreground">Brak zajęć</p>
                ) : (
                  <div className="space-y-2">
                    {slots.map((c) => {
                      const ct = ctMap[c.class_type_id];
                      const ins = inMap[c.instructor_id];
                      const cnt = counts[c.id] ?? { confirmed: 0, waitlist: 0 };
                      const status = statusOf(c);
                      const mine = myBookings[c.id];
                      return (
                        <button
                          key={c.id}
                          onClick={() => openBooking(c)}
                          disabled={status === "full" || status === "cancelled" || !!mine}
                          className="group block w-full rounded-lg border border-foreground/10 bg-cream/40 p-3 text-left transition-all hover:border-terracotta/40 hover:bg-cream disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="font-medium text-sm text-foreground">
                              {format(new Date(c.starts_at), "HH:mm")}
                            </div>
                            <StatusDot status={status} />
                          </div>
                          <div
                            className="mt-1 inline-block rounded-sm px-1.5 py-0.5 text-[10px] uppercase tracking-widest text-cream"
                            style={{ backgroundColor: ct?.color ?? "#C2725A" }}
                          >
                            {ct?.name ?? "—"}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">{ins?.full_name}</div>
                          <div className="mt-1 text-[11px] text-muted-foreground">
                            {cnt.confirmed}/{c.capacity} miejsc
                            {status === "waitlist" && ` · rezerwa ${cnt.waitlist}/${c.waitlist_capacity}`}
                          </div>
                          {mine && (
                            <div className="mt-1 text-[11px] font-medium text-terracotta">
                              {mine === "confirmed" ? "✓ Zarezerwowane" : "⏳ Lista rezerwowa"}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {!isAuthenticated && (
          <div className="mt-12 flex flex-col items-center gap-4 rounded-2xl border border-terracotta/30 bg-terracotta/5 p-8 text-center">
            <p className="font-display text-2xl text-foreground">
              Załóż darmowe konto, by zarezerwować zajęcia.
            </p>
            <p className="text-sm text-foreground/80">
              Rejestracja zajmuje minutę — od razu wybierzesz termin i otrzymasz potwierdzenie e-mail.
            </p>
            <div className="mt-2 flex flex-wrap justify-center gap-3">
              <Link
                to="/rejestracja"
                className="rounded-full bg-foreground px-7 py-3 text-xs uppercase tracking-widest text-cream hover:bg-terracotta"
              >
                Załóż konto
              </Link>
              <Link
                to="/login"
                className="rounded-full border border-foreground/30 px-7 py-3 text-xs uppercase tracking-widest text-foreground hover:border-terracotta hover:text-terracotta"
              >
                Mam już konto
              </Link>
            </div>
          </div>
        )}
      </main>
      <Footer />

      <BookingConfirmModal
        open={!!pendingSlot}
        onOpenChange={(o) => { if (!o) setPendingSlot(null); }}
        slot={pendingSlot?.slot ?? null}
        onConfirm={confirmBooking}
        loading={bookingLoading}
        askPhone={!profile?.phone}
      />
    </div>
  );
}

function StatusDot({ status }: { status: "available" | "waitlist" | "full" | "cancelled" }) {
  const cls =
    status === "available" ? "bg-forest" :
    status === "waitlist" ? "bg-terracotta" :
    status === "full" ? "bg-destructive" : "bg-muted-foreground";
  return <span className={`mt-1 h-2 w-2 rounded-full ${cls}`} aria-label={status} />;
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-muted-foreground">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}
