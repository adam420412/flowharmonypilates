import { fromZonedTime } from "date-fns-tz";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const SHEET_TAB = "Grafik";
const SHEET_RANGE = `${SHEET_TAB}!A2:I1000`;
const TIMEZONE = "Europe/Warsaw";

// Default duration + capacity per class-type slug (matches enforce_class_capacity)
const TYPE_DEFAULTS: Record<string, { duration: number; capacity: number }> = {
  intro: { duration: 60, capacity: 1 },
  "reformer-basic": { duration: 55, capacity: 6 },
  "reformer-flow": { duration: 55, capacity: 6 },
  "vip-1on1": { duration: 55, capacity: 1 },
  "vip-duo": { duration: 55, capacity: 2 },
  "cadillac-1on1": { duration: 55, capacity: 1 },
};

type SyncSummary = {
  ok: boolean;
  read_rows: number;
  parsed: number;
  inserted: number;
  updated: number;
  cancelled: number;
  deleted: number;
  errors: Array<{ row: number; reason: string }>;
};

export async function syncScheduleFromSheet(): Promise<SyncSummary> {
  const sheetId = process.env.SCHEDULE_SHEET_ID;
  const lovableKey = process.env.LOVABLE_API_KEY;
  const gwKey = process.env.GOOGLE_SHEETS_API_KEY;
  if (!sheetId || !lovableKey || !gwKey) {
    throw new Error("Brak konfiguracji: SCHEDULE_SHEET_ID / LOVABLE_API_KEY / GOOGLE_SHEETS_API_KEY");
  }

  // 1. Read sheet
  const url = `https://connector-gateway.lovable.dev/google_sheets/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(SHEET_RANGE)}`;
  const resp = await fetch(url, {
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": gwKey,
    },
  });
  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Google Sheets ${resp.status}: ${body}`);
  }
  const data = (await resp.json()) as { values?: string[][] };
  const rows = data.values ?? [];

  // 2. Load reference data
  const [typesRes, instrRes] = await Promise.all([
    supabaseAdmin.from("class_types").select("id, slug, default_price_grosz"),
    supabaseAdmin.from("instructors").select("id, full_name, is_active"),
  ]);
  if (typesRes.error) throw typesRes.error;
  if (instrRes.error) throw instrRes.error;
  const typeBySlug = new Map(typesRes.data!.map((t) => [t.slug, t.id]));
  const defaultPriceBySlug = new Map(
    typesRes.data!.map((t) => [t.slug, t.default_price_grosz as number | null]),
  );
  const instructorByName = new Map(
    instrRes.data!.map((i) => [i.full_name.trim().toLowerCase(), i.id]),
  );

  // 3. Parse sheet rows
  const errors: SyncSummary["errors"] = [];
  type Parsed = {
    starts_at: string;
    class_type_id: string;
    instructor_id: string;
    duration_minutes: number;
    capacity: number;
    waitlist_capacity: number;
    price_grosz: number;
    notes: string | null;
    is_cancelled: boolean;
    slug: string;
  };
  const parsed: Parsed[] = [];
  const seenKey = new Set<string>();

  rows.forEach((row, idx) => {
    const rowNum = idx + 2; // sheet row (header = 1)
    const [dateS, timeS, slugS, instrS, priceS, capS, waitS, notesS, cancelledS] = [
      row[0], row[1], row[2], row[3], row[4], row[5], row[6], row[7], row[8],
    ].map((v) => (v ?? "").toString().trim());

    if (!dateS && !timeS && !slugS && !instrS && !priceS) return; // empty row

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateS)) {
      errors.push({ row: rowNum, reason: `Zła data (oczekiwano YYYY-MM-DD): "${dateS}"` });
      return;
    }
    if (!/^\d{1,2}:\d{2}$/.test(timeS)) {
      errors.push({ row: rowNum, reason: `Zła godzina (oczekiwano HH:MM): "${timeS}"` });
      return;
    }
    const slug = slugS.toLowerCase();
    const classTypeId = typeBySlug.get(slug);
    if (!classTypeId) {
      errors.push({ row: rowNum, reason: `Nieznany typ zajęć (slug): "${slugS}"` });
      return;
    }
    const instructorId = instructorByName.get(instrS.toLowerCase());
    if (!instructorId) {
      errors.push({ row: rowNum, reason: `Nieznany instruktor: "${instrS}"` });
      return;
    }

    const defaults = TYPE_DEFAULTS[slug] ?? { duration: 55, capacity: 6 };
    const capacity = capS ? Math.max(1, parseInt(capS, 10) || defaults.capacity) : defaults.capacity;
    const waitlist = waitS ? Math.max(0, parseInt(waitS, 10) || 0) : 0;
    const isCancelled = /^(tak|yes|true|1)$/i.test(cancelledS);

    // Price: required, PLN → grosze
    if (!priceS) {
      errors.push({ row: rowNum, reason: `Brak ceny (kolumna E) — zajęcia pominięte` });
      return;
    }
    const priceNum = parseFloat(priceS.replace(",", ".").replace(/\s/g, ""));
    if (!isFinite(priceNum) || priceNum < 0) {
      errors.push({ row: rowNum, reason: `Zła cena: "${priceS}" (podaj np. 90 lub 89.50)` });
      return;
    }
    const priceGrosz = Math.round(priceNum * 100);

    // Interpret date+time as Europe/Warsaw local → UTC ISO
    const [hh, mm] = timeS.split(":");
    const localIso = `${dateS}T${hh.padStart(2, "0")}:${mm}:00`;
    const startsAt = fromZonedTime(localIso, TIMEZONE);
    if (isNaN(startsAt.getTime())) {
      errors.push({ row: rowNum, reason: `Nie udało się sparsować daty/godziny` });
      return;
    }

    const key = `${startsAt.toISOString()}|${classTypeId}`;
    if (seenKey.has(key)) {
      errors.push({ row: rowNum, reason: `Duplikat: te same zajęcia już są w arkuszu wyżej` });
      return;
    }
    seenKey.add(key);

    parsed.push({
      starts_at: startsAt.toISOString(),
      class_type_id: classTypeId,
      instructor_id: instructorId,
      duration_minutes: defaults.duration,
      capacity,
      waitlist_capacity: waitlist,
      price_grosz: priceGrosz,
      notes: notesS || null,
      is_cancelled: isCancelled,
      slug,
    });
  });

  // 4. Load existing future classes (from today midnight Warsaw)
  const nowIso = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // 1h grace
  const { data: existing, error: exErr } = await supabaseAdmin
    .from("classes")
    .select("id, starts_at, class_type_id")
    .gte("starts_at", nowIso);
  if (exErr) throw exErr;

  const existingByKey = new Map<string, string>();
  for (const c of existing ?? []) {
    existingByKey.set(`${new Date(c.starts_at).toISOString()}|${c.class_type_id}`, c.id);
  }

  let inserted = 0;
  let updated = 0;
  let cancelled = 0;
  let deleted = 0;

  // 5. Upsert parsed rows
  for (const p of parsed) {
    const key = `${p.starts_at}|${p.class_type_id}`;
    const existingId = existingByKey.get(key);
    const payload = {
      class_type_id: p.class_type_id,
      instructor_id: p.instructor_id,
      starts_at: p.starts_at,
      duration_minutes: p.duration_minutes,
      capacity: p.capacity,
      waitlist_capacity: p.waitlist_capacity,
      price_grosz: p.price_grosz,
      notes: p.notes,
      is_cancelled: p.is_cancelled,
    };
    if (existingId) {
      const { error } = await supabaseAdmin.from("classes").update(payload).eq("id", existingId);
      if (error) errors.push({ row: 0, reason: `Update ${existingId}: ${error.message}` });
      else updated++;
      existingByKey.delete(key);
    } else {
      const { error } = await supabaseAdmin.from("classes").insert(payload);
      if (error) errors.push({ row: 0, reason: `Insert ${key}: ${error.message}` });
      else inserted++;
    }
  }

  // 6. Handle removed rows: cancel if they have bookings, else delete
  const orphanIds = Array.from(existingByKey.values());
  if (orphanIds.length > 0) {
    const { data: withBookings } = await supabaseAdmin
      .from("bookings")
      .select("class_id")
      .in("class_id", orphanIds);
    const bookedSet = new Set((withBookings ?? []).map((b) => b.class_id));
    const toDelete = orphanIds.filter((id) => !bookedSet.has(id));
    const toCancel = orphanIds.filter((id) => bookedSet.has(id));
    if (toDelete.length > 0) {
      const { error } = await supabaseAdmin.from("classes").delete().in("id", toDelete);
      if (error) errors.push({ row: 0, reason: `Delete: ${error.message}` });
      else deleted = toDelete.length;
    }
    if (toCancel.length > 0) {
      const { error } = await supabaseAdmin
        .from("classes")
        .update({ is_cancelled: true })
        .in("id", toCancel);
      if (error) errors.push({ row: 0, reason: `Cancel: ${error.message}` });
      else cancelled = toCancel.length;
    }
  }

  return {
    ok: true,
    read_rows: rows.length,
    parsed: parsed.length,
    inserted,
    updated,
    cancelled,
    deleted,
    errors,
  };
}
