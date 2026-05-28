import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { Loader2, Download, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Profile = {
  id: string;
  display_name: string | null;
  phone: string | null;
  sms_opt_in: boolean;
  created_at: string;
};

type BookingAgg = {
  user_id: string;
  total: number;
  confirmed: number;
  cancelled: number;
  lastAt: string | null;
};

type HistoryRow = {
  id: string;
  status: string;
  created_at: string;
  classes: { starts_at: string; class_type: { name: string } | null } | null;
};

export function ClientsCard() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [aggs, setAggs] = useState<Map<string, BookingAgg>>(new Map());
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Profile | null>(null);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    const [{ data: profs }, { data: bk }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id,display_name,phone,sms_opt_in,created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("bookings")
        .select("user_id,status,classes!inner(starts_at)")
        .order("created_at", { ascending: false }),
    ]);
    const map = new Map<string, BookingAgg>();
    type BkRow = { user_id: string; status: string; classes: { starts_at: string } };
    for (const b of (bk ?? []) as unknown as BkRow[]) {
      const entry = map.get(b.user_id) ?? {
        user_id: b.user_id,
        total: 0,
        confirmed: 0,
        cancelled: 0,
        lastAt: null,
      };
      entry.total += 1;
      if (b.status === "confirmed") entry.confirmed += 1;
      if (b.status === "cancelled") entry.cancelled += 1;
      const t = b.classes.starts_at;
      if (!entry.lastAt || new Date(t) > new Date(entry.lastAt)) entry.lastAt = t;
      map.set(b.user_id, entry);
    }
    setProfiles((profs ?? []) as Profile[]);
    setAggs(map);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter(
      (p) =>
        (p.display_name ?? "").toLowerCase().includes(q) ||
        (p.phone ?? "").toLowerCase().includes(q),
    );
  }, [profiles, query]);

  function exportCsv() {
    const rows = [["Imię", "Telefon", "SMS opt-in", "Rezerwacje", "Potwierdzone", "Anulowane", "Ostatnia wizyta"]];
    for (const p of filtered) {
      const a = aggs.get(p.id);
      rows.push([
        p.display_name ?? "",
        p.phone ?? "",
        p.sms_opt_in ? "TAK" : "NIE",
        String(a?.total ?? 0),
        String(a?.confirmed ?? 0),
        String(a?.cancelled ?? 0),
        a?.lastAt ? format(new Date(a.lastAt), "yyyy-MM-dd HH:mm") : "",
      ]);
    }
    const csv = rows
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `klientki-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function openClient(p: Profile) {
    setOpen(p);
    setHistoryLoading(true);
    const { data } = await supabase
      .from("bookings")
      .select("id,status,created_at,classes(starts_at,class_type:class_types(name))")
      .eq("user_id", p.id)
      .order("created_at", { ascending: false })
      .limit(100);
    setHistory((data ?? []) as unknown as HistoryRow[]);
    setHistoryLoading(false);
  }

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/50" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Szukaj po imieniu lub telefonie…"
            className="w-full rounded-full border border-border bg-background py-2 pl-10 pr-4 text-sm"
          />
        </div>
        <button
          onClick={exportCsv}
          className="inline-flex items-center gap-2 rounded-full border border-foreground/20 px-4 py-2 text-xs uppercase tracking-widest hover:bg-foreground/5"
        >
          <Download className="h-4 w-4" />
          Eksport CSV
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 text-sm text-foreground/80">
          <Loader2 className="h-4 w-4 animate-spin" /> Ładowanie klientek…
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-background">
          <table className="w-full text-sm">
            <thead className="bg-foreground/5 text-left text-xs uppercase tracking-widest text-foreground/60">
              <tr>
                <th className="px-4 py-3">Imię</th>
                <th className="px-4 py-3">Telefon</th>
                <th className="px-4 py-3">SMS</th>
                <th className="px-4 py-3">Rezerwacje</th>
                <th className="px-4 py-3">Ostatnia wizyta</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((p) => {
                const a = aggs.get(p.id);
                return (
                  <tr key={p.id}>
                    <td className="px-4 py-3">{p.display_name ?? "—"}</td>
                    <td className="px-4 py-3">{p.phone ?? "—"}</td>
                    <td className="px-4 py-3">{p.sms_opt_in ? "✓" : "—"}</td>
                    <td className="px-4 py-3">
                      {a?.confirmed ?? 0} <span className="text-foreground/50">/ {a?.total ?? 0}</span>
                    </td>
                    <td className="px-4 py-3 text-foreground/70">
                      {a?.lastAt ? format(new Date(a.lastAt), "d MMM yyyy", { locale: pl }) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openClient(p)}
                        className="text-xs uppercase tracking-widest text-terracotta hover:underline"
                      >
                        Szczegóły
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-foreground/60">
                    Brak wyników.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{open?.display_name ?? "Klientka"}</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-foreground/70">
            {open?.phone ?? "brak telefonu"} · SMS: {open?.sms_opt_in ? "TAK" : "NIE"}
          </div>
          <div className="mt-4 max-h-96 overflow-y-auto">
            {historyLoading ? (
              <div className="flex items-center gap-2 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" /> Ładowanie historii…
              </div>
            ) : history.length === 0 ? (
              <p className="text-sm text-foreground/60">Brak rezerwacji.</p>
            ) : (
              <ul className="divide-y divide-border">
                {history.map((h) => (
                  <li key={h.id} className="flex items-center justify-between py-2 text-sm">
                    <div>
                      <div className="font-medium">{h.classes?.class_type?.name ?? "—"}</div>
                      <div className="text-foreground/60">
                        {h.classes?.starts_at
                          ? format(new Date(h.classes.starts_at), "d MMM yyyy HH:mm", { locale: pl })
                          : "—"}
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        h.status === "confirmed"
                          ? "bg-emerald-100 text-emerald-700"
                          : h.status === "waitlist"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-foreground/10 text-foreground/60"
                      }`}
                    >
                      {h.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
