import { useEffect, useMemo, useState } from "react";
import { addDays, format, startOfWeek } from "date-fns";
import { pl } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

type ClassItem = {
  id: string;
  starts_at: string;
  capacity: number;
  price_grosz: number;
  is_cancelled: boolean;
  class_type: { name: string; color: string | null } | null;
  instructor: { full_name: string } | null;
};

type Participant = {
  booking_id: string;
  user_id: string;
  status: string;
  created_at: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  paid: boolean;
  amount_grosz: number | null;
};

export function CalendarView() {
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [counts, setCounts] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [openClass, setOpenClass] = useState<ClassItem | null>(null);
  const [participants, setParticipants] = useState<Participant[] | null>(null);
  const [partsLoading, setPartsLoading] = useState(false);

  const weekEnd = useMemo(() => addDays(weekStart, 7), [weekStart]);

  useEffect(() => {
    void load();
  }, [weekStart]);

  async function load() {
    setLoading(true);
    const { data: cls } = await supabase
      .from("classes")
      .select(
        "id,starts_at,capacity,price_grosz,is_cancelled,class_type:class_types(name,color),instructor:instructors(full_name)",
      )
      .gte("starts_at", weekStart.toISOString())
      .lt("starts_at", weekEnd.toISOString())
      .order("starts_at");

    const classList = (cls ?? []) as unknown as ClassItem[];
    setClasses(classList);

    if (classList.length > 0) {
      const ids = classList.map((c) => c.id);
      const { data: bk } = await supabase
        .from("bookings")
        .select("class_id")
        .eq("status", "confirmed")
        .in("class_id", ids);
      const map = new Map<string, number>();
      for (const row of (bk ?? []) as Array<{ class_id: string }>) {
        map.set(row.class_id, (map.get(row.class_id) ?? 0) + 1);
      }
      setCounts(map);
    } else {
      setCounts(new Map());
    }
    setLoading(false);
  }

  async function openParticipants(c: ClassItem) {
    setOpenClass(c);
    setParticipants(null);
    setPartsLoading(true);

    const { data: bookings } = await supabase
      .from("bookings")
      .select("id, user_id, status, created_at")
      .eq("class_id", c.id)
      .neq("status", "cancelled")
      .order("status", { ascending: true })
      .order("created_at", { ascending: true });

    const rows = (bookings ?? []) as Array<{ id: string; user_id: string; status: string; created_at: string }>;
    if (rows.length === 0) {
      setParticipants([]);
      setPartsLoading(false);
      return;
    }

    const userIds = Array.from(new Set(rows.map((b) => b.user_id)));
    const [{ data: profiles }, { data: payments }] = await Promise.all([
      supabase.from("profiles").select("id, display_name, phone").in("id", userIds),
      supabase
        .from("payments")
        .select("user_id, status, amount_grosz, email")
        .eq("class_id", c.id)
        .in("user_id", userIds),
    ]);
    const profMap = new Map<string, { display_name: string | null; phone: string | null }>(
      (profiles ?? []).map((p: { id: string; display_name: string | null; phone: string | null }) => [p.id, { display_name: p.display_name, phone: p.phone }]),
    );
    const paidMap = new Map<string, { paid: boolean; amount: number | null; email: string | null }>();
    for (const p of (payments ?? []) as Array<{ user_id: string; status: string; amount_grosz: number | null; email: string | null }>) {
      const cur = paidMap.get(p.user_id) ?? { paid: false, amount: null, email: p.email };
      if (p.status === "paid") {
        paidMap.set(p.user_id, { paid: true, amount: p.amount_grosz, email: p.email ?? cur.email });
      } else if (!cur.paid) {
        paidMap.set(p.user_id, { ...cur, email: p.email ?? cur.email });
      }
    }

    const parts: Participant[] = rows.map((b) => {
      const prof = profMap.get(b.user_id);
      const pay = paidMap.get(b.user_id);
      return {
        booking_id: b.id,
        user_id: b.user_id,
        status: b.status,
        created_at: b.created_at,
        display_name: prof?.display_name ?? null,
        email: pay?.email ?? null,
        phone: prof?.phone ?? null,
        paid: pay?.paid ?? false,
        amount_grosz: pay?.amount ?? null,
      };
    });
    setParticipants(parts);
    setPartsLoading(false);
  }

  const days = useMemo(
    () => Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  return (
    <section>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl">
            {format(weekStart, "d MMM", { locale: pl })} – {format(addDays(weekStart, 6), "d MMM yyyy", { locale: pl })}
          </h2>
          <p className="mt-1 text-xs text-foreground/60">Kliknij zajęcia, aby zobaczyć listę uczestników i status płatności.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekStart((d) => addDays(d, -7))}
            className="rounded-full border border-foreground/20 p-2 hover:bg-foreground/5"
            aria-label="Poprzedni tydzień"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
            className="rounded-full border border-foreground/20 px-4 py-2 text-xs uppercase tracking-widest hover:bg-foreground/5"
          >
            Dziś
          </button>
          <button
            onClick={() => setWeekStart((d) => addDays(d, 7))}
            className="rounded-full border border-foreground/20 p-2 hover:bg-foreground/5"
            aria-label="Następny tydzień"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 text-sm text-foreground/80">
          <Loader2 className="h-4 w-4 animate-spin" /> Ładowanie grafiku…
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-7">
          {days.map((day) => {
            const dayKey = format(day, "yyyy-MM-dd");
            const items = classes.filter(
              (c) => format(new Date(c.starts_at), "yyyy-MM-dd") === dayKey,
            );
            return (
              <div key={dayKey} className="rounded-2xl border border-border bg-background p-3 min-h-[160px]">
                <div className="mb-2 border-b border-border pb-2">
                  <div className="text-xs uppercase tracking-widest text-foreground/60">
                    {format(day, "EEE", { locale: pl })}
                  </div>
                  <div className="font-display text-lg">{format(day, "d MMM", { locale: pl })}</div>
                </div>
                <div className="space-y-2">
                  {items.length === 0 ? (
                    <p className="text-xs text-foreground/50">—</p>
                  ) : (
                    items.map((c) => {
                      const confirmed = counts.get(c.id) ?? 0;
                      const full = confirmed >= c.capacity;
                      return (
                        <button
                          type="button"
                          key={c.id}
                          onClick={() => openParticipants(c)}
                          className={`w-full text-left rounded-lg border p-2 text-xs transition-colors hover:bg-foreground/5 ${
                            c.is_cancelled
                              ? "border-foreground/20 bg-foreground/5 opacity-60 line-through"
                              : full
                                ? "border-terracotta/40 bg-terracotta/10"
                                : "border-border"
                          }`}
                          style={
                            !c.is_cancelled && !full && c.class_type?.color
                              ? { borderLeftColor: c.class_type.color, borderLeftWidth: 3 }
                              : undefined
                          }
                        >
                          <div className="font-medium">{format(new Date(c.starts_at), "HH:mm")}</div>
                          <div className="truncate">{c.class_type?.name ?? "—"}</div>
                          <div className="text-foreground/60 truncate">{c.instructor?.full_name ?? ""}</div>
                          <div className="mt-1 flex items-center justify-between gap-1">
                            <span className="text-[10px]">{confirmed}/{c.capacity}</span>
                            {c.price_grosz > 0 && (
                              <span className="text-[10px] font-medium">{(c.price_grosz / 100).toFixed(0)} zł</span>
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!openClass} onOpenChange={(o) => { if (!o) { setOpenClass(null); setParticipants(null); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {openClass?.class_type?.name ?? "Zajęcia"} — {openClass ? format(new Date(openClass.starts_at), "d MMM yyyy, HH:mm", { locale: pl }) : ""}
            </DialogTitle>
            <DialogDescription>
              {openClass?.instructor?.full_name}
              {openClass?.is_cancelled && <span className="ml-2 text-destructive font-medium">· ODWOŁANE</span>}
              {openClass && openClass.price_grosz > 0 && (
                <span className="ml-2">· Cena: {(openClass.price_grosz / 100).toFixed(0)} zł</span>
              )}
            </DialogDescription>
          </DialogHeader>

          {partsLoading ? (
            <div className="flex items-center gap-2 py-6 text-sm text-foreground/70">
              <Loader2 className="h-4 w-4 animate-spin" /> Ładowanie uczestników…
            </div>
          ) : !participants || participants.length === 0 ? (
            <p className="py-6 text-center text-sm text-foreground/60">Brak zapisanych uczestników.</p>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wider text-foreground/60">
                  <tr className="border-b border-border">
                    <th className="py-2 pr-2">#</th>
                    <th className="py-2 pr-2">Klient</th>
                    <th className="py-2 pr-2">Kontakt</th>
                    <th className="py-2 pr-2">Status</th>
                    <th className="py-2 pr-2">Płatność</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map((p, i) => (
                    <tr key={p.booking_id} className="border-b border-border/60">
                      <td className="py-2 pr-2 text-foreground/60">{i + 1}</td>
                      <td className="py-2 pr-2">{p.display_name ?? "—"}</td>
                      <td className="py-2 pr-2 text-xs">
                        <div>{p.email ?? ""}</div>
                        <div className="text-foreground/60">{p.phone ?? ""}</div>
                      </td>
                      <td className="py-2 pr-2">
                        {p.status === "confirmed" ? (
                          <span className="rounded bg-forest/15 px-2 py-0.5 text-xs text-forest">Zapisany</span>
                        ) : p.status === "waitlist" ? (
                          <span className="rounded bg-terracotta/15 px-2 py-0.5 text-xs text-terracotta">Rezerwa</span>
                        ) : (
                          <span className="text-xs text-foreground/60">{p.status}</span>
                        )}
                      </td>
                      <td className="py-2 pr-2 text-xs">
                        {p.paid ? (
                          <span className="rounded bg-forest/15 px-2 py-0.5 text-forest">
                            Zapłacone{p.amount_grosz ? ` · ${(p.amount_grosz / 100).toFixed(0)} zł` : ""}
                          </span>
                        ) : (
                          <span className="text-foreground/60">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
