import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  sendNotification,
  formatBookingEmail,
  formatReminderEmail,
  formatReminderSms,
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
  return typeof v === "string" ? v : "Mimosa Pilates";
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
