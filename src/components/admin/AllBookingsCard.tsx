import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { Loader2, Search, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Row = {
  id: string;
  status: string;
  created_at: string;
  user_id: string;
  class_id: string;
  classes: {
    starts_at: string;
    is_cancelled: boolean;
    class_type: { name: string } | null;
    instructor: { full_name: string } | null;
  } | null;
  profile: { display_name: string | null; phone: string | null } | null;
};

export function AllBookingsCard() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "confirmed" | "waitlist" | "cancelled">("all");
  const [scope, setScope] = useState<"future" | "all">("future");
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, [scope]);

  async function load() {
    setLoading(true);
    let q = supabase
      .from("bookings")
      .select(
        "id,status,created_at,user_id,class_id,classes!inner(starts_at,is_cancelled,class_type:class_types(name),instructor:instructors(full_name))",
      )
      .order("created_at", { ascending: false })
      .limit(500);
    if (scope === "future") {
      q = q.gte("classes.starts_at", new Date().toISOString());
    }
    const { data, error } = await q;
    if (error) toast.error("Nie udało się pobrać rezerwacji");
    const baseRows = (data ?? []) as unknown as Omit<Row, "profile">[];
    const userIds = [...new Set(baseRows.map((r) => r.user_id))];
    let profileMap = new Map<string, { display_name: string | null; phone: string | null }>();
    if (userIds.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id,display_name,phone")
        .in("id", userIds);
      profileMap = new Map(
        (profs ?? []).map((p) => [p.id, { display_name: p.display_name, phone: p.phone }]),
      );
    }
    setRows(baseRows.map((r) => ({ ...r, profile: profileMap.get(r.user_id) ?? null })));
    setLoading(false);
  }

  const filtered = useMemo(() => {
    const qx = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (!qx) return true;
      return (
        (r.profile?.display_name ?? "").toLowerCase().includes(qx) ||
        (r.profile?.phone ?? "").toLowerCase().includes(qx) ||
        (r.classes?.class_type?.name ?? "").toLowerCase().includes(qx)
      );
    });
  }, [rows, query, status]);

  async function cancel(row: Row) {
    if (!confirm(`Anulować rezerwację: ${row.profile?.display_name ?? "klientka"}?`)) return;
    setCancellingId(row.id);
    const { error } = await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", row.id);
    setCancellingId(null);
    if (error) {
      toast.error("Nie udało się anulować");
    } else {
      toast.success("Rezerwacja anulowana");
      void load();
    }
  }

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/50" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Szukaj klientki, zajęć, telefonu…"
            className="w-full rounded-full border border-border bg-background py-2 pl-10 pr-4 text-sm"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
          className="rounded-full border border-border bg-background px-4 py-2 text-sm"
        >
          <option value="all">Wszystkie statusy</option>
          <option value="confirmed">Potwierdzone</option>
          <option value="waitlist">Lista rezerwowa</option>
          <option value="cancelled">Anulowane</option>
        </select>
        <select
          value={scope}
          onChange={(e) => setScope(e.target.value as typeof scope)}
          className="rounded-full border border-border bg-background px-4 py-2 text-sm"
        >
          <option value="future">Nadchodzące</option>
          <option value="all">Wszystkie</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 text-sm text-foreground/80">
          <Loader2 className="h-4 w-4 animate-spin" /> Ładowanie…
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-background">
          <table className="w-full text-sm">
            <thead className="bg-foreground/5 text-left text-xs uppercase tracking-widest text-foreground/60">
              <tr>
                <th className="px-4 py-3">Klientka</th>
                <th className="px-4 py-3">Telefon</th>
                <th className="px-4 py-3">Zajęcia</th>
                <th className="px-4 py-3">Termin</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3">{r.profile?.display_name ?? "—"}</td>
                  <td className="px-4 py-3">{r.profile?.phone ?? "—"}</td>
                  <td className="px-4 py-3">{r.classes?.class_type?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-foreground/70">
                    {r.classes?.starts_at
                      ? format(new Date(r.classes.starts_at), "d MMM yyyy HH:mm", { locale: pl })
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        r.status === "confirmed"
                          ? "bg-emerald-100 text-emerald-700"
                          : r.status === "waitlist"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-foreground/10 text-foreground/60"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {r.status !== "cancelled" && (
                      <button
                        onClick={() => cancel(r)}
                        disabled={cancellingId === r.id}
                        className="inline-flex items-center gap-1 text-xs uppercase tracking-widest text-terracotta hover:underline disabled:opacity-50"
                      >
                        {cancellingId === r.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <X className="h-3 w-3" />
                        )}
                        Anuluj
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-foreground/60">
                    Brak rezerwacji.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
