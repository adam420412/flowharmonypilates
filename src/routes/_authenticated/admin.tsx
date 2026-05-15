import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Navigation } from "@/components/site/Navigation";
import { Footer } from "@/components/site/Footer";
import { Loader2, Save, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [{ title: "Panel administratora — Flow & Harmony" }],
  }),
  component: AdminPage,
});

type ClassRow = {
  id: string;
  starts_at: string;
  capacity: number;
  waitlist_capacity: number;
  is_cancelled: boolean;
  class_type: { name: string } | null;
  instructor: { full_name: string } | null;
};

const settingsSchema = z.object({
  cancellation_hours_before: z.coerce.number().int().min(0).max(168),
  reminder_email_hours_before: z.coerce.number().int().min(0).max(168),
  reminder_sms_hours_before: z.coerce.number().int().min(0).max(168),
});

type SettingsForm = z.infer<typeof settingsSchema>;

function AdminPage() {
  const { hasRole, loading: authLoading } = useAuth();
  const isAdmin = hasRole("admin");

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <Loader2 className="h-6 w-6 animate-spin text-mocha" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-cream">
        <Navigation />
        <div className="mx-auto flex max-w-2xl flex-col items-center px-6 pt-40 text-center">
          <ShieldAlert className="h-10 w-10 text-terracotta" strokeWidth={1.25} />
          <h1 className="mt-6 font-display text-4xl">Brak dostępu</h1>
          <p className="mt-3 text-foreground/70">
            Ta sekcja jest dostępna tylko dla administratorów.
          </p>
          <Link
            to="/"
            className="mt-8 rounded-full border border-foreground/20 px-6 py-2.5 text-xs uppercase tracking-widest hover:bg-foreground hover:text-cream"
          >
            Wróć na stronę główną
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <Navigation />
      <main className="mx-auto max-w-6xl px-6 pt-32 pb-20 md:px-10">
        <header className="mb-12">
          <span className="text-xs uppercase tracking-widest text-terracotta">Administracja</span>
          <h1 className="mt-3 font-display text-5xl md:text-6xl">Panel zarządzania</h1>
          <p className="mt-3 text-foreground/70">
            Edytuj limity miejsc na zajęciach oraz reguły rezerwacji studia.
          </p>
        </header>

        <SettingsCard />
        <ClassesCard />
      </main>
      <Footer />
    </div>
  );
}

/* -------------------- Settings -------------------- */

function SettingsCard() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<SettingsForm>({
    cancellation_hours_before: 12,
    reminder_email_hours_before: 24,
    reminder_sms_hours_before: 2,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof SettingsForm, string>>>({});

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("app_settings")
      .select("key,value")
      .in("key", [
        "cancellation_hours_before",
        "reminder_email_hours_before",
        "reminder_sms_hours_before",
      ]);
    if (error) {
      toast.error("Nie udało się pobrać ustawień");
    } else {
      const map = Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));
      setForm({
        cancellation_hours_before: Number(map.cancellation_hours_before ?? 12),
        reminder_email_hours_before: Number(map.reminder_email_hours_before ?? 24),
        reminder_sms_hours_before: Number(map.reminder_sms_hours_before ?? 2),
      });
    }
    setLoading(false);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const parsed = settingsSchema.safeParse(form);
    if (!parsed.success) {
      const errs: Partial<Record<keyof SettingsForm, string>> = {};
      for (const issue of parsed.error.issues) {
        errs[issue.path[0] as keyof SettingsForm] = issue.message;
      }
      setErrors(errs);
      return;
    }
    setErrors({});
    setSaving(true);
    const rows = Object.entries(parsed.data).map(([key, value]) => ({
      key,
      value: value as unknown as never,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await supabase.from("app_settings").upsert(rows, { onConflict: "key" });
    setSaving(false);
    if (error) {
      toast.error("Nie udało się zapisać ustawień");
    } else {
      toast.success("Ustawienia zapisane");
    }
  }

  return (
    <section className="mb-16 rounded-2xl border border-border bg-background p-8 md:p-10">
      <h2 className="font-display text-3xl">Ustawienia studia</h2>
      <p className="mt-2 text-sm text-foreground/60">
        Wartości w godzinach. Anulowanie blokowane jest, jeśli do zajęć pozostało mniej niż podana liczba godzin.
      </p>

      {loading ? (
        <div className="mt-8 flex items-center gap-3 text-sm text-foreground/60">
          <Loader2 className="h-4 w-4 animate-spin" /> Ładowanie…
        </div>
      ) : (
        <form onSubmit={save} className="mt-8 grid gap-6 md:grid-cols-3">
          <SettingField
            label="Anulowanie do (h przed)"
            value={form.cancellation_hours_before}
            onChange={(v) => setForm({ ...form, cancellation_hours_before: v })}
            error={errors.cancellation_hours_before}
            hint="Klient może odwołać rezerwację najpóźniej X h przed zajęciami."
          />
          <SettingField
            label="Email przypomnienie (h przed)"
            value={form.reminder_email_hours_before}
            onChange={(v) => setForm({ ...form, reminder_email_hours_before: v })}
            error={errors.reminder_email_hours_before}
          />
          <SettingField
            label="SMS przypomnienie (h przed)"
            value={form.reminder_sms_hours_before}
            onChange={(v) => setForm({ ...form, reminder_sms_hours_before: v })}
            error={errors.reminder_sms_hours_before}
          />

          <div className="md:col-span-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-xs uppercase tracking-widest text-cream transition-all hover:bg-terracotta disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Zapisz ustawienia
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

function SettingField({
  label,
  value,
  onChange,
  error,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  error?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-widest text-foreground/70">{label}</span>
      <input
        type="number"
        min={0}
        max={168}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full rounded-md border border-border bg-background px-4 py-2.5 font-display text-2xl outline-none focus:border-terracotta"
      />
      {hint && !error && <span className="mt-1 block text-xs text-foreground/50">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-destructive">{error}</span>}
    </label>
  );
}

/* -------------------- Classes -------------------- */

function ClassesCard() {
  const [rows, setRows] = useState<ClassRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [edits, setEdits] = useState<Record<string, { capacity: number; waitlist_capacity: number }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("classes")
      .select(
        "id,starts_at,capacity,waitlist_capacity,is_cancelled,class_type:class_types(name),instructor:instructors(full_name)",
      )
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true })
      .limit(100);
    if (error) {
      toast.error("Nie udało się pobrać zajęć");
    } else {
      setRows((data ?? []) as unknown as ClassRow[]);
    }
    setLoading(false);
  }

  function getEdit(row: ClassRow) {
    return edits[row.id] ?? { capacity: row.capacity, waitlist_capacity: row.waitlist_capacity };
  }

  function setEdit(id: string, patch: Partial<{ capacity: number; waitlist_capacity: number }>) {
    setEdits((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? rows.find((r) => r.id === id)!), ...patch } as {
        capacity: number;
        waitlist_capacity: number;
      },
    }));
  }

  async function save(row: ClassRow) {
    const draft = getEdit(row);
    const schema = z.object({
      capacity: z.coerce.number().int().min(1).max(50),
      waitlist_capacity: z.coerce.number().int().min(0).max(50),
    });
    const parsed = schema.safeParse(draft);
    if (!parsed.success) {
      toast.error("Nieprawidłowe wartości (1–50 dla limitu, 0–50 dla rezerwy)");
      return;
    }
    setSavingId(row.id);
    const { error } = await supabase
      .from("classes")
      .update({
        capacity: parsed.data.capacity,
        waitlist_capacity: parsed.data.waitlist_capacity,
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);
    setSavingId(null);
    if (error) {
      toast.error("Zapis nie powiódł się");
    } else {
      toast.success("Limity zaktualizowane");
      setRows((prev) =>
        prev.map((r) => (r.id === row.id ? { ...r, ...parsed.data } : r)),
      );
      setEdits((prev) => {
        const { [row.id]: _, ...rest } = prev;
        return rest;
      });
    }
  }

  const grouped = useMemo(() => {
    const out = new Map<string, ClassRow[]>();
    for (const r of rows) {
      const day = new Date(r.starts_at).toLocaleDateString("pl-PL", {
        weekday: "long",
        day: "2-digit",
        month: "long",
      });
      if (!out.has(day)) out.set(day, []);
      out.get(day)!.push(r);
    }
    return Array.from(out.entries());
  }, [rows]);

  return (
    <section className="rounded-2xl border border-border bg-background p-8 md:p-10">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="font-display text-3xl">Limity miejsc na zajęciach</h2>
          <p className="mt-2 text-sm text-foreground/60">
            Najbliższe nadchodzące zajęcia. Edytuj liczbę miejsc i wielkość listy rezerwowej.
          </p>
        </div>
        <button
          onClick={() => void load()}
          className="text-xs uppercase tracking-widest text-foreground/60 hover:text-terracotta"
        >
          Odśwież
        </button>
      </div>

      {loading ? (
        <div className="mt-8 flex items-center gap-3 text-sm text-foreground/60">
          <Loader2 className="h-4 w-4 animate-spin" /> Ładowanie…
        </div>
      ) : rows.length === 0 ? (
        <p className="mt-8 text-sm text-foreground/60">Brak nadchodzących zajęć.</p>
      ) : (
        <div className="mt-8 space-y-10">
          {grouped.map(([day, items]) => (
            <div key={day}>
              <h3 className="text-xs uppercase tracking-widest text-mocha">{day}</h3>
              <div className="mt-4 divide-y divide-border border-y border-border">
                {items.map((row) => {
                  const draft = getEdit(row);
                  const dirty =
                    draft.capacity !== row.capacity ||
                    draft.waitlist_capacity !== row.waitlist_capacity;
                  const time = new Date(row.starts_at).toLocaleTimeString("pl-PL", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  return (
                    <div
                      key={row.id}
                      className="grid grid-cols-1 items-center gap-4 py-4 md:grid-cols-[80px_1fr_120px_120px_auto]"
                    >
                      <div className="font-display text-2xl">{time}</div>
                      <div>
                        <div className="font-medium">
                          {row.class_type?.name ?? "—"}{" "}
                          {row.is_cancelled && (
                            <span className="ml-2 text-xs uppercase tracking-widest text-destructive">
                              odwołane
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-foreground/60">
                          {row.instructor?.full_name ?? "—"}
                        </div>
                      </div>
                      <NumberCell
                        label="Miejsca"
                        value={draft.capacity}
                        onChange={(v) => setEdit(row.id, { capacity: v })}
                        min={1}
                      />
                      <NumberCell
                        label="Rezerwa"
                        value={draft.waitlist_capacity}
                        onChange={(v) => setEdit(row.id, { waitlist_capacity: v })}
                        min={0}
                      />
                      <button
                        disabled={!dirty || savingId === row.id}
                        onClick={() => void save(row)}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-4 py-2 text-xs uppercase tracking-widest text-cream transition-all hover:bg-terracotta disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        {savingId === row.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Save className="h-3.5 w-3.5" />
                        )}
                        Zapisz
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function NumberCell({
  label,
  value,
  onChange,
  min,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
}) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-widest text-foreground/50">{label}</span>
      <input
        type="number"
        min={min}
        max={50}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-terracotta"
      />
    </label>
  );
}
