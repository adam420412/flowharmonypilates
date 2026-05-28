import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  sendNotification,
  formatBookingEmail,
  formatReminderEmail,
  formatReminderSms,
  formatWaitlistPromotedEmail,
  formatWaitlistPromotedSms,
} from "./notifications.server";

async function getSetting(key: string): Promise<unknown> {
  const { data } = await supabaseAdmin
    .from("app_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  return data?.value;
}

async function getStudioName(): Promise<string> {
  const v = await getSetting("studio_name");
  return typeof v === "string" ? v : "Flow & Harmony";
}

/**
 * Wysyła potwierdzenie rezerwacji (email + opcjonalnie SMS jeśli klient ma opt-in).
 * Wywoływane natychmiast po utworzeniu bookingu.
 */
export const sendBookingConfirmation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { bookingId: string }) =>
    z.object({ bookingId: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;

    const { data: booking } = await supabaseAdmin
      .from("bookings")
      .select("id,user_id,class_id,status")
      .eq("id", data.bookingId)
      .maybeSingle();

    if (!booking || booking.user_id !== userId) {
      throw new Error("Booking not found");
    }
    if (booking.status === "cancelled") {
      return { ok: false, reason: "cancelled" as const };
    }

    const [{ data: cls }, { data: profile }, emailEnabled] = await Promise.all([
      supabaseAdmin
        .from("classes")
        .select(
          "id,starts_at,duration_minutes,class_type_id,instructor_id",
        )
        .eq("id", booking.class_id)
        .maybeSingle(),
      supabaseAdmin
        .from("profiles")
        .select("display_name,phone,sms_opt_in")
        .eq("id", userId)
        .maybeSingle(),
      getSetting("notifications_email_enabled"),
    ]);

    if (!cls) throw new Error("Class not found");

    const { data: ct } = await supabaseAdmin
      .from("class_types")
      .select("name")
      .eq("id", cls.class_type_id)
      .maybeSingle();
    const { data: ins } = await supabaseAdmin
      .from("instructors")
      .select("full_name")
      .eq("id", cls.instructor_id)
      .maybeSingle();

    // Email
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
    const email = authUser?.user?.email;
    const studioName = await getStudioName();

    const results: Record<string, unknown> = {};

    if (email && emailEnabled !== false) {
      const { subject, body } = formatBookingEmail({
        studioName,
        className: ct?.name ?? "Pilates",
        instructorName: ins?.full_name ?? "Instruktor",
        startsAt: cls.starts_at,
        durationMinutes: cls.duration_minutes,
        status: booking.status as "confirmed" | "waitlist",
      });
      results.email = await sendNotification({
        userId,
        bookingId: booking.id,
        classId: cls.id,
        channel: "email",
        kind: "booking_confirmation",
        recipient: email,
        subject,
        body,
      });
    }

    return { ok: true, ...results };
  });

/**
 * Wysyła powiadomienie email + SMS (jeśli opt-in) do osoby, której rezerwacja
 * z listy rezerwowej została automatycznie awansowana po odwołaniu miejsca.
 * Wywoływane po cancel_booking, gdy RPC zwróci promoted_user_id.
 */
export const notifyWaitlistPromoted = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { classId: string; promotedUserId: string }) =>
    z.object({
      classId: z.string().uuid(),
      promotedUserId: z.string().uuid(),
    }).parse(data),
  )
  .handler(async ({ data }) => {
    const { classId, promotedUserId } = data;

    // Znajdź awansowaną rezerwację (najnowsza confirmed na tej klasie dla tego usera)
    const { data: booking } = await supabaseAdmin
      .from("bookings")
      .select("id,class_id,user_id,status,updated_at")
      .eq("class_id", classId)
      .eq("user_id", promotedUserId)
      .eq("status", "confirmed")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!booking) return { ok: false, reason: "booking_not_found" as const };

    const [{ data: cls }, { data: profile }, { data: authUser }, emailEnabled, smsEnabled] =
      await Promise.all([
        supabaseAdmin
          .from("classes")
          .select("id,starts_at,duration_minutes,class_type_id,instructor_id")
          .eq("id", classId)
          .maybeSingle(),
        supabaseAdmin
          .from("profiles")
          .select("phone,sms_opt_in")
          .eq("id", promotedUserId)
          .maybeSingle(),
        supabaseAdmin.auth.admin.getUserById(promotedUserId),
        getSetting("notifications_email_enabled"),
        getSetting("notifications_sms_enabled"),
      ]);
    if (!cls) return { ok: false, reason: "class_not_found" as const };

    const [{ data: ct }, { data: ins }] = await Promise.all([
      supabaseAdmin.from("class_types").select("name").eq("id", cls.class_type_id).maybeSingle(),
      supabaseAdmin.from("instructors").select("full_name").eq("id", cls.instructor_id).maybeSingle(),
    ]);
    const className = ct?.name ?? "Pilates";
    const instructorName = ins?.full_name ?? "Instruktor";
    const studioName = await getStudioName();
    const email = authUser?.user?.email;

    const results: Record<string, unknown> = {};

    if (email && emailEnabled !== false) {
      const { subject, body } = formatWaitlistPromotedEmail({
        studioName, className, instructorName, startsAt: cls.starts_at,
      });
      results.email = await sendNotification({
        userId: promotedUserId,
        bookingId: booking.id,
        classId: cls.id,
        channel: "email",
        kind: "waitlist_promoted",
        recipient: email,
        subject,
        body,
      });
    }

    if (smsEnabled !== false && profile?.sms_opt_in && profile.phone) {
      const body = formatWaitlistPromotedSms({ className, startsAt: cls.starts_at });
      results.sms = await sendNotification({
        userId: promotedUserId,
        bookingId: booking.id,
        classId: cls.id,
        channel: "sms",
        kind: "waitlist_promoted",
        recipient: profile.phone,
        body,
      });
    }

    return { ok: true, ...results };
  });

/* -------------------- Admin: test/preview waitlist promotion -------------------- */

async function assertAdmin(userId: string) {
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (!data?.some((r) => r.role === "admin")) {
    throw new Error("forbidden");
  }
}

const sampleSchema = z.object({
  className: z.string().min(1).max(120),
  instructorName: z.string().min(1).max(120),
  startsAt: z.string().min(1),
});

/** Renderuje treść email + SMS dla awansu z listy rezerwowej (bez wysyłki). */
export const previewWaitlistPromoted = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: z.infer<typeof sampleSchema>) => sampleSchema.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const studioName = await getStudioName();
    const email = formatWaitlistPromotedEmail({
      studioName,
      className: data.className,
      instructorName: data.instructorName,
      startsAt: data.startsAt,
    });
    const sms = formatWaitlistPromotedSms({
      className: data.className,
      startsAt: data.startsAt,
    });
    return { email, sms, studioName };
  });

const testSendSchema = z.object({
  className: z.string().min(1).max(120),
  instructorName: z.string().min(1).max(120),
  startsAt: z.string().min(1),
  recipientEmail: z.string().email().optional().or(z.literal("")).transform((v) => v || undefined),
  recipientPhone: z.string().regex(/^\+?\d{9,15}$/).optional().or(z.literal("")).transform((v) => v || undefined),
  bookingId: z.string().uuid().optional(),
  classId: z.string().uuid().optional(),
});

/** Wysyła testowy email i/lub SMS na podany adres / numer. Loguje do notification_log. */
export const sendTestWaitlistPromoted = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: z.infer<typeof testSendSchema>) => testSendSchema.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { userId } = context;
    const studioName = await getStudioName();

    const results: Record<string, unknown> = {};

    if (data.recipientEmail) {
      const { subject, body } = formatWaitlistPromotedEmail({
        studioName,
        className: data.className,
        instructorName: data.instructorName,
        startsAt: data.startsAt,
      });
      results.email = await sendNotification({
        userId,
        bookingId: data.bookingId,
        classId: data.classId,
        channel: "email",
        kind: "waitlist_promoted",
        recipient: data.recipientEmail,
        subject,
        body,
      });
    }

    if (data.recipientPhone) {
      const body = formatWaitlistPromotedSms({
        className: data.className,
        startsAt: data.startsAt,
      });
      results.sms = await sendNotification({
        userId,
        bookingId: data.bookingId,
        classId: data.classId,
        channel: "sms",
        kind: "waitlist_promoted",
        recipient: data.recipientPhone,
        body,
      });
    }

    return { ok: true, ...results };
  });

/** Lista bookingów na liście rezerwowej (oraz ostatnio awansowanych) — do wyboru w panelu admina. */
export const listWaitlistBookings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { limit?: number }) =>
    z.object({ limit: z.number().int().min(1).max(200).optional() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);

    const { data: bookings } = await supabaseAdmin
      .from("bookings")
      .select("id,user_id,class_id,status,created_at,updated_at")
      .in("status", ["waitlist", "confirmed"])
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 100);

    if (!bookings?.length) return { bookings: [] };

    const classIds = Array.from(new Set(bookings.map((b) => b.class_id)));
    const userIds = Array.from(new Set(bookings.map((b) => b.user_id)));

    const [{ data: classes }, { data: profiles }] = await Promise.all([
      supabaseAdmin
        .from("classes")
        .select("id,starts_at,class_type_id,instructor_id,is_cancelled")
        .in("id", classIds)
        .eq("is_cancelled", false)
        .gte("starts_at", new Date(Date.now() - 7 * 24 * 3600_000).toISOString()),
      supabaseAdmin
        .from("profiles")
        .select("id,display_name,phone,sms_opt_in")
        .in("id", userIds),
    ]);

    const classMap = new Map((classes ?? []).map((c) => [c.id, c]));
    if (!classMap.size) return { bookings: [] };

    const ctIds = Array.from(new Set((classes ?? []).map((c) => c.class_type_id)));
    const insIds = Array.from(new Set((classes ?? []).map((c) => c.instructor_id)));
    const [{ data: cts }, { data: inss }] = await Promise.all([
      supabaseAdmin.from("class_types").select("id,name").in("id", ctIds),
      supabaseAdmin.from("instructors").select("id,full_name").in("id", insIds),
    ]);
    const ctMap = new Map((cts ?? []).map((c) => [c.id, c.name]));
    const insMap = new Map((inss ?? []).map((i) => [i.id, i.full_name]));
    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

    // Pobierz emaile użytkowników (admin API)
    const emailMap = new Map<string, string | null>();
    await Promise.all(
      userIds.map(async (uid) => {
        const { data: au } = await supabaseAdmin.auth.admin.getUserById(uid);
        emailMap.set(uid, au?.user?.email ?? null);
      }),
    );

    const result = bookings
      .filter((b) => classMap.has(b.class_id))
      .map((b) => {
        const cls = classMap.get(b.class_id)!;
        const profile = profileMap.get(b.user_id);
        return {
          bookingId: b.id,
          status: b.status as "waitlist" | "confirmed",
          createdAt: b.created_at,
          classId: cls.id,
          startsAt: cls.starts_at,
          className: ctMap.get(cls.class_type_id) ?? "Pilates",
          instructorName: insMap.get(cls.instructor_id) ?? "Instruktor",
          userId: b.user_id,
          displayName: profile?.display_name ?? null,
          email: emailMap.get(b.user_id) ?? null,
          phone: profile?.phone ?? null,
          smsOptIn: profile?.sms_opt_in ?? false,
        };
      })
      .sort((a, b) => {
        // waitlist najpierw, potem po starts_at rosnąco
        if (a.status !== b.status) return a.status === "waitlist" ? -1 : 1;
        return new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
      });

    return { bookings: result };
  });

/** Ostatnie wpisy z notification_log dla awansu z listy rezerwowej. */
export const getWaitlistPromotedLogs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { limit?: number }) =>
    z.object({ limit: z.number().int().min(1).max(100).optional() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { data: rows } = await supabaseAdmin
      .from("notification_log")
      .select("id,channel,kind,recipient,status,error,created_at,booking_id")
      .eq("kind", "waitlist_promoted")
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 25);
    return { logs: rows ?? [] };
  });

/**
 * Cron: wysyła przypomnienia email 24h przed i SMS ~2h przed.
 * Wywoływane co 5–15 minut przez pg_cron.
 */
export async function processScheduledReminders() {
  const [emailEnabled, smsEnabled, emailHoursVal, smsHoursVal] = await Promise.all([
    getSetting("notifications_email_enabled"),
    getSetting("notifications_sms_enabled"),
    getSetting("reminder_email_hours_before"),
    getSetting("reminder_sms_hours_before"),
  ]);
  const emailHours = typeof emailHoursVal === "number" ? emailHoursVal : 24;
  const smsHours = typeof smsHoursVal === "number" ? smsHoursVal : 2;
  const studioName = await getStudioName();

  const now = Date.now();
  const tolerance = 30 * 60 * 1000; // ±30 min

  const summary = { email_sent: 0, sms_sent: 0, errors: 0 };

  // Window helper
  async function findBookingsInWindow(hoursBefore: number) {
    const target = now + hoursBefore * 3600_000;
    const from = new Date(target - tolerance).toISOString();
    const to = new Date(target + tolerance).toISOString();

    const { data: classes, error } = await supabaseAdmin
      .from("classes")
      .select("id,starts_at,class_type_id,instructor_id,is_cancelled")
      .gte("starts_at", from)
      .lte("starts_at", to)
      .eq("is_cancelled", false);
    if (error || !classes?.length) return [];

    const classIds = classes.map((c) => c.id);
    const { data: bookings } = await supabaseAdmin
      .from("bookings")
      .select("id,user_id,class_id,status")
      .in("class_id", classIds)
      .eq("status", "confirmed");

    return (bookings ?? []).map((b) => ({
      booking: b,
      cls: classes.find((c) => c.id === b.class_id)!,
    }));
  }

  // 24h email reminders
  if (emailEnabled !== false) {
    const items = await findBookingsInWindow(emailHours);
    for (const { booking, cls } of items) {
      try {
        const { data: log } = await supabaseAdmin
          .from("notification_log")
          .select("id")
          .eq("booking_id", booking.id)
          .eq("channel", "email")
          .eq("kind", "reminder_24h")
          .maybeSingle();
        if (log) continue;

        const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(booking.user_id);
        const email = authUser?.user?.email;
        if (!email) continue;

        const [{ data: ct }, { data: ins }] = await Promise.all([
          supabaseAdmin.from("class_types").select("name").eq("id", cls.class_type_id).maybeSingle(),
          supabaseAdmin.from("instructors").select("full_name").eq("id", cls.instructor_id).maybeSingle(),
        ]);
        const { subject, body } = formatReminderEmail({
          studioName,
          className: ct?.name ?? "Pilates",
          instructorName: ins?.full_name ?? "Instruktor",
          startsAt: cls.starts_at,
        });
        const r = await sendNotification({
          userId: booking.user_id,
          bookingId: booking.id,
          classId: cls.id,
          channel: "email",
          kind: "reminder_24h",
          recipient: email,
          subject,
          body,
        });
        if ("sent" in r && r.sent) summary.email_sent++;
      } catch (e) {
        console.error("reminder_24h error:", e);
        summary.errors++;
      }
    }
  }

  // 2h SMS reminders (tylko opt-in)
  if (smsEnabled !== false) {
    const items = await findBookingsInWindow(smsHours);
    for (const { booking, cls } of items) {
      try {
        const { data: log } = await supabaseAdmin
          .from("notification_log")
          .select("id")
          .eq("booking_id", booking.id)
          .eq("channel", "sms")
          .eq("kind", "reminder_2h_sms")
          .maybeSingle();
        if (log) continue;

        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("phone,sms_opt_in")
          .eq("id", booking.user_id)
          .maybeSingle();
        if (!profile?.sms_opt_in || !profile.phone) continue;

        const { data: ct } = await supabaseAdmin
          .from("class_types")
          .select("name")
          .eq("id", cls.class_type_id)
          .maybeSingle();
        const body = formatReminderSms({
          className: ct?.name ?? "Pilates",
          startsAt: cls.starts_at,
        });
        const r = await sendNotification({
          userId: booking.user_id,
          bookingId: booking.id,
          classId: cls.id,
          channel: "sms",
          kind: "reminder_2h_sms",
          recipient: profile.phone,
          body,
        });
        if ("sent" in r && r.sent) summary.sms_sent++;
      } catch (e) {
        console.error("reminder_2h_sms error:", e);
        summary.errors++;
      }
    }
  }

  return summary;
}

/* -------------------- Admin: test wszystkich szablonów transakcyjnych -------------------- */

import { enqueueTemplateEmail } from "@/lib/email/enqueue.server";

const testAllSchema = z.object({
  recipientEmail: z.string().email(),
});

/**
 * Wysyła po jednej kopii każdego transakcyjnego szablonu (React Email) na podany adres.
 * Używa realnej infrastruktury Lovable Emails (kolejka pgmq + cron co 5s).
 */
export const sendAllTestEmails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: z.infer<typeof testAllSchema>) => testAllSchema.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);

    const studioName = await getStudioName();
    const startsAt = new Date(Date.now() + 26 * 3600_000).toISOString();
    const className = "Pilates Reformer (test)";
    const instructorName = "Anna Kowalska";

    const common = {
      siteName: studioName,
      className,
      instructorName,
      startsAt,
      durationMinutes: 55,
      studioName,
      name: "Test Klientka",
    };

    const targets: Array<{ template: string; data: Record<string, any> }> = [
      { template: "booking-confirmation", data: common },
      { template: "booking-cancelled", data: common },
      { template: "waitlist-added", data: common },
      { template: "waitlist-promoted", data: common },
      { template: "reminder-24h", data: common },
    ];

    const results: Array<{ template: string; ok: boolean; reason?: string; messageId?: string }> = [];
    for (const t of targets) {
      const r = await enqueueTemplateEmail({
        templateName: t.template,
        to: data.recipientEmail,
        data: t.data,
        idempotencyKey: `test:${t.template}:${Date.now()}`,
      });
      if (r.ok) {
        results.push({ template: t.template, ok: true, messageId: r.messageId });
      } else {
        results.push({ template: t.template, ok: false, reason: r.reason });
      }
    }

    return { recipient: data.recipientEmail, results };
  });
