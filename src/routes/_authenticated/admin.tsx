import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Navigation } from "@/components/site/Navigation";
import { Footer } from "@/components/site/Footer";
import { Loader2, Save, Send, ShieldAlert, Eye, RefreshCw } from "lucide-react";
import {
  previewWaitlistPromoted,
  sendTestWaitlistPromoted,
  getWaitlistPromotedLogs,
} from "@/lib/notifications.functions";

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
        <NotificationTestCard />
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

/* -------------------- Notification Test (Waitlist Promotion) -------------------- */

type LogRow = {
  id: string;
  channel: string;
  kind: string;
  recipient: string;
  status: string;
  error: string | null;
  created_at: string;
  booking_id: string | null;
};

function defaultStartsAt() {
  const d = new Date(Date.now() + 24 * 3600 * 1000);
  d.setMinutes(0, 0, 0);
  return d.toISOString();
}

function NotificationTestCard() {
  const previewFn = useServerFn(previewWaitlistPromoted);
  const sendFn = useServerFn(sendTestWaitlistPromoted);
  const logsFn = useServerFn(getWaitlistPromotedLogs);

  const [form, setForm] = useState({
    className: "Pilates Reformer",
    instructorName: "Anna Kowalska",
    startsAt: defaultStartsAt(),
    recipientEmail: "",
    recipientPhone: "",
  });
  const [preview, setPreview] = useState<{
    email: { subject: string; body: string };
    sms: string;
  } | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  async function loadLogs() {
    setLoadingLogs(true);
    try {
      const r = await logsFn({ data: { limit: 25 } });
      setLogs(r.logs as LogRow[]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Nie udało się pobrać logów");
    } finally {
      setLoadingLogs(false);
    }
  }

  async function handlePreview() {
    setLoadingPreview(true);
    try {
      const r = await previewFn({
        data: {
          className: form.className,
          instructorName: form.instructorName,
          startsAt: form.startsAt,
        },
      });
      setPreview(r);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Błąd podglądu");
    } finally {
      setLoadingPreview(false);
    }
  }

  async function handleSend() {
    if (!form.recipientEmail && !form.recipientPhone) {
      toast.error("Podaj e-mail lub numer telefonu odbiorcy testu");
      return;
    }
    setSending(true);
    try {
      const r = await sendFn({
        data: {
          className: form.className,
          instructorName: form.instructorName,
          startsAt: form.startsAt,
          recipientEmail: form.recipientEmail || undefined,
          recipientPhone: form.recipientPhone || undefined,
        },
      });
      toast.success("Wysłano test (mock — sprawdź logi serwera i log poniżej)");
      console.log("[test send]", r);
      void loadLogs();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Błąd wysyłki testu");
    } finally {
      setSending(false);
    }
  }

  useEffect(() => {
    void loadLogs();
  }, []);

  return (
    <section className="mt-16 rounded-2xl border border-border bg-background p-8 md:p-10">
      <div className="flex items-end justify-between gap-6 flex-wrap">
        <div>
          <h2 className="font-display text-3xl">Test powiadomień — awans z listy rezerwowej</h2>
          <p className="mt-2 max-w-2xl text-sm text-foreground/60">
            Podgląd treści e-maila i SMS-a oraz testowa wysyłka na wskazany adres / numer.
            Wpisy trafiają do dziennika powiadomień (notification_log).
          </p>
        </div>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-[10px] uppercase tracking-widest text-amber-900">
          Tryb mock — wysyłka logowana w konsoli
        </span>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <FieldText
            label="Nazwa zajęć"
            value={form.className}
            onChange={(v) => setForm({ ...form, className: v })}
          />
          <FieldText
            label="Instruktor"
            value={form.instructorName}
            onChange={(v) => setForm({ ...form, instructorName: v })}
          />
          <label className="block">
            <span className="text-xs uppercase tracking-widest text-foreground/70">
              Termin (ISO 8601)
            </span>
            <input
              type="datetime-local"
              value={toLocalDatetimeInput(form.startsAt)}
              onChange={(e) =>
                setForm({ ...form, startsAt: new Date(e.target.value).toISOString() })
              }
              className="mt-2 w-full rounded-md border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-terracotta"
            />
          </label>

          <div className="border-t border-border pt-4">
            <FieldText
              label="E-mail odbiorcy testu"
              value={form.recipientEmail}
              onChange={(v) => setForm({ ...form, recipientEmail: v })}
              placeholder="test@example.com"
              type="email"
            />
            <div className="mt-3" />
            <FieldText
              label="Telefon odbiorcy testu (opcjonalnie)"
              value={form.recipientPhone}
              onChange={(v) => setForm({ ...form, recipientPhone: v })}
              placeholder="+48600000000"
              type="tel"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => void handlePreview()}
              disabled={loadingPreview}
              className="inline-flex items-center gap-2 rounded-full border border-foreground/20 px-5 py-2.5 text-xs uppercase tracking-widest text-foreground hover:border-terracotta hover:text-terracotta disabled:opacity-50"
            >
              {loadingPreview ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
              Podgląd
            </button>
            <button
              onClick={() => void handleSend()}
              disabled={sending}
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-xs uppercase tracking-widest text-cream hover:bg-terracotta disabled:opacity-50"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Wyślij test
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-cream/40 p-5">
          <h3 className="text-xs uppercase tracking-widest text-mocha">Podgląd treści</h3>
          {!preview ? (
            <p className="mt-4 text-sm text-foreground/60">Kliknij „Podgląd" aby zobaczyć treść.</p>
          ) : (
            <div className="mt-4 space-y-5">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-foreground/50">E-mail · temat</div>
                <div className="mt-1 font-medium">{preview.email.subject}</div>
                <pre className="mt-2 whitespace-pre-wrap rounded-md border border-border bg-background p-3 text-xs leading-relaxed text-foreground/80">
                  {preview.email.body}
                </pre>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-foreground/50">SMS</div>
                <pre className="mt-2 whitespace-pre-wrap rounded-md border border-border bg-background p-3 text-xs leading-relaxed text-foreground/80">
                  {preview.sms}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-10">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl">Ostatnie powiadomienia o awansie</h3>
          <button
            onClick={() => void loadLogs()}
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-foreground/60 hover:text-terracotta"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingLogs ? "animate-spin" : ""}`} /> Odśwież
          </button>
        </div>

        {loadingLogs && logs.length === 0 ? (
          <div className="mt-4 flex items-center gap-3 text-sm text-foreground/60">
            <Loader2 className="h-4 w-4 animate-spin" /> Ładowanie…
          </div>
        ) : logs.length === 0 ? (
          <p className="mt-4 text-sm text-foreground/60">Brak wpisów w dzienniku.</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-md border border-border">
            <table className="w-full text-sm">
              <thead className="bg-cream/40 text-[10px] uppercase tracking-widest text-foreground/60">
                <tr>
                  <th className="px-3 py-2 text-left">Kiedy</th>
                  <th className="px-3 py-2 text-left">Kanał</th>
                  <th className="px-3 py-2 text-left">Odbiorca</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Booking</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((row) => (
                  <tr key={row.id} className="border-t border-border">
                    <td className="px-3 py-2 text-foreground/70">
                      {new Date(row.created_at).toLocaleString("pl-PL")}
                    </td>
                    <td className="px-3 py-2 uppercase text-[10px] tracking-widest text-foreground/70">
                      {row.channel}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">{row.recipient}</td>
                    <td className="px-3 py-2">
                      <StatusBadge status={row.status} error={row.error} />
                    </td>
                    <td className="px-3 py-2 font-mono text-[10px] text-foreground/50">
                      {row.booking_id ? row.booking_id.slice(0, 8) + "…" : "— (test)"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

function FieldText({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-widest text-foreground/70">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-md border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-terracotta"
      />
    </label>
  );
}

function StatusBadge({ status, error }: { status: string; error: string | null }) {
  const cls =
    status === "sent"
      ? "bg-emerald-100 text-emerald-800"
      : status === "failed"
      ? "bg-rose-100 text-rose-800"
      : "bg-foreground/10 text-foreground/70";
  return (
    <span
      title={error ?? undefined}
      className={`inline-block rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest ${cls}`}
    >
      {status}
    </span>
  );
}

function toLocalDatetimeInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
