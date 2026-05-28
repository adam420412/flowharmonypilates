import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { addDays, format, startOfDay } from "date-fns";
import { pl } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type Stats = {
  classesNext7: number;
  confirmedNext7: number;
  capacityNext7: number;
  waitlistNext7: number;
  cancelledNext7: number;
};

type DayBar = { day: string; rezerwacje: number; miejsca: number };

type TopClient = { user_id: string; display_name: string | null; count: number };

export function DashboardCard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    classesNext7: 0,
    confirmedNext7: 0,
    capacityNext7: 0,
    waitlistNext7: 0,
    cancelledNext7: 0,
  });
  const [perDay, setPerDay] = useState<DayBar[]>([]);
  const [topClients, setTopClients] = useState<TopClient[]>([]);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    const from = startOfDay(new Date());
    const to = addDays(from, 7);

    const [{ data: classes }, { data: bookings }, { data: monthBookings }] = await Promise.all([
      supabase
        .from("classes")
        .select("id,starts_at,capacity,is_cancelled")
        .gte("starts_at", from.toISOString())
        .lt("starts_at", to.toISOString()),
      supabase
        .from("bookings")
        .select("id,class_id,status,classes!inner(starts_at)")
        .gte("classes.starts_at", from.toISOString())
        .lt("classes.starts_at", to.toISOString()),
      supabase
        .from("bookings")
        .select("user_id,status,profiles:profiles!bookings_user_id_fkey(display_name)")
        .gte("created_at", addDays(from, -30).toISOString())
        .eq("status", "confirmed"),
    ]);

    const cs = classes ?? [];
    const bs = (bookings ?? []) as unknown as Array<{
      class_id: string;
      status: string;
      classes: { starts_at: string };
    }>;

    const classesNext7 = cs.filter((c) => !c.is_cancelled).length;
    const cancelledNext7 = cs.filter((c) => c.is_cancelled).length;
    const capacityNext7 = cs.filter((c) => !c.is_cancelled).reduce((s, c) => s + (c.capacity ?? 0), 0);
    const confirmedNext7 = bs.filter((b) => b.status === "confirmed").length;
    const waitlistNext7 = bs.filter((b) => b.status === "waitlist").length;

    // per day buckets
    const dayMap = new Map<string, { rezerwacje: number; miejsca: number }>();
    for (let i = 0; i < 7; i++) {
      const d = addDays(from, i);
      dayMap.set(format(d, "yyyy-MM-dd"), { rezerwacje: 0, miejsca: 0 });
    }
    for (const c of cs) {
      if (c.is_cancelled) continue;
      const key = format(new Date(c.starts_at), "yyyy-MM-dd");
      const entry = dayMap.get(key);
      if (entry) entry.miejsca += c.capacity ?? 0;
    }
    for (const b of bs) {
      if (b.status !== "confirmed") continue;
      const key = format(new Date(b.classes.starts_at), "yyyy-MM-dd");
      const entry = dayMap.get(key);
      if (entry) entry.rezerwacje += 1;
    }
    const perDayArr: DayBar[] = Array.from(dayMap.entries()).map(([k, v]) => ({
      day: format(new Date(k), "EEE d", { locale: pl }),
      ...v,
    }));

    // top clients last 30 days
    type MonthBookingRow = {
      user_id: string;
      status: string;
      profiles: { display_name: string | null } | null;
    };
    const mb = (monthBookings ?? []) as unknown as MonthBookingRow[];
    const counts = new Map<string, TopClient>();
    for (const b of mb) {
      const existing = counts.get(b.user_id);
      if (existing) existing.count += 1;
      else
        counts.set(b.user_id, {
          user_id: b.user_id,
          display_name: b.profiles?.display_name ?? null,
          count: 1,
        });
    }
    const top = [...counts.values()].sort((a, b) => b.count - a.count).slice(0, 5);

    setStats({ classesNext7, confirmedNext7, capacityNext7, waitlistNext7, cancelledNext7 });
    setPerDay(perDayArr);
    setTopClients(top);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="mt-8 flex items-center gap-3 text-sm text-foreground/80">
        <Loader2 className="h-4 w-4 animate-spin" /> Ładowanie statystyk…
      </div>
    );
  }

  const occupancy =
    stats.capacityNext7 > 0 ? Math.round((stats.confirmedNext7 / stats.capacityNext7) * 100) : 0;

  return (
    <section className="space-y-8">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <Kpi label="Zajęcia (7 dni)" value={stats.classesNext7} />
        <Kpi label="Rezerwacje" value={stats.confirmedNext7} />
        <Kpi label="Obłożenie" value={`${occupancy}%`} />
        <Kpi label="Lista rezerwowa" value={stats.waitlistNext7} />
        <Kpi label="Odwołane" value={stats.cancelledNext7} />
      </div>

      <div className="rounded-2xl border border-border bg-background p-6">
        <h3 className="font-display text-xl">Obłożenie w najbliższym tygodniu</h3>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={perDay}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="day" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Bar dataKey="miejsca" fill="hsl(var(--muted))" />
              <Bar dataKey="rezerwacje" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-background p-6">
        <h3 className="font-display text-xl">Top klientki (ostatnie 30 dni)</h3>
        {topClients.length === 0 ? (
          <p className="mt-3 text-sm text-foreground/70">Brak rezerwacji w tym okresie.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {topClients.map((c) => (
              <li key={c.user_id} className="flex items-center justify-between py-2 text-sm">
                <span>{c.display_name ?? "—"}</span>
                <span className="font-medium">{c.count} rezerwacji</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function Kpi({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <div className="text-[11px] uppercase tracking-widest text-foreground/60">{label}</div>
      <div className="mt-2 font-display text-3xl">{value}</div>
    </div>
  );
}
