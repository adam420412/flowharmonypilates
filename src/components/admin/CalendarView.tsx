import { useEffect, useMemo, useState } from "react";
import { addDays, format, startOfWeek } from "date-fns";
import { pl } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type ClassItem = {
  id: string;
  starts_at: string;
  capacity: number;
  is_cancelled: boolean;
  class_type: { name: string; color: string | null } | null;
  instructor: { full_name: string } | null;
};

type BookingCount = { class_id: string; confirmed: number };

export function CalendarView() {
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [counts, setCounts] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);

  const weekEnd = useMemo(() => addDays(weekStart, 7), [weekStart]);

  useEffect(() => {
    void load();
  }, [weekStart]);

  async function load() {
    setLoading(true);
    const { data: cls } = await supabase
      .from("classes")
      .select(
        "id,starts_at,capacity,is_cancelled,class_type:class_types(name,color),instructor:instructors(full_name)",
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
      for (const row of (bk ?? []) as BookingCount[]) {
        map.set(row.class_id, (map.get(row.class_id) ?? 0) + 1);
      }
      setCounts(map);
    } else {
      setCounts(new Map());
    }
    setLoading(false);
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
                        <div
                          key={c.id}
                          className={`rounded-lg border p-2 text-xs ${
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
                          <div className="mt-1 text-[10px]">
                            {confirmed}/{c.capacity}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
