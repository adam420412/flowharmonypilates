/**
 * Notification sender.
 * - Email: realny enqueue do pgmq (notify.flowharmony.pl) przez Lovable Emails.
 * - SMS: nadal MOCK do czasu wpięcia SMSAPI.pl.
 * Każda wysyłka jest logowana w `notification_log` (idempotencja po bookingu).
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { enqueueRenderedEmail } from "@/lib/email/enqueue.server";

export type NotificationKind =
  | "booking_confirmation"
  | "reminder_24h"
  | "reminder_2h_sms"
  | "booking_cancelled"
  | "waitlist_promoted";

export type NotificationChannel = "email" | "sms";

export async function sendNotification(params: {
  userId: string;
  bookingId?: string | null;
  classId?: string | null;
  channel: NotificationChannel;
  kind: NotificationKind;
  recipient: string;
  subject?: string;
  body: string;
}) {
  const { userId, bookingId, classId, channel, kind, recipient, subject, body } = params;

  // Idempotencja: jeśli już wysłano dla tej kombinacji booking+channel+kind, pomiń
  if (bookingId) {
    const { data: existing } = await supabaseAdmin
      .from("notification_log")
      .select("id")
      .eq("booking_id", bookingId)
      .eq("channel", channel)
      .eq("kind", kind)
      .maybeSingle();
    if (existing) {
      return { skipped: true as const, reason: "already_sent" };
    }
  }

  // Realna wysyłka (email) lub MOCK (sms)
  let sendError: string | null = null;
  let sendStatus: "sent" | "failed" | "queued" | "suppressed" = "sent";

  if (channel === "email") {
    const r = await enqueueRenderedEmail({
      to: recipient,
      subject: subject ?? "Wiadomość od Flow & Harmony",
      body,
      label: kind,
      idempotencyKey: bookingId ? `${kind}:${bookingId}` : undefined,
    });
    if (r.ok) {
      sendStatus = "queued";
    } else if (r.reason === "suppressed") {
      sendStatus = "suppressed";
    } else {
      sendStatus = "failed";
      sendError = r.reason;
    }
  } else {
    // SMS — MOCK do czasu wpięcia SMSAPI.pl
    console.log(`[NOTIFY:SMS] → ${recipient}`);
    console.log(`  Body: ${body}`);
  }

  const { error } = await supabaseAdmin.from("notification_log").insert({
    user_id: userId,
    booking_id: bookingId ?? null,
    class_id: classId ?? null,
    channel,
    kind,
    recipient,
    status: sendStatus,
    error: sendError,
  });

  if (error) {
    console.error("[NOTIFY] log insert failed:", error.message);
    return { sent: false as const, error: error.message };
  }
  return { sent: true as const };
}

export function formatBookingEmail(opts: {
  studioName: string;
  className: string;
  instructorName: string;
  startsAt: string;
  durationMinutes: number;
  status: "confirmed" | "waitlist";
}) {
  const date = new Date(opts.startsAt).toLocaleString("pl-PL", {
    timeZone: "Europe/Warsaw",
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
  const subject =
    opts.status === "confirmed"
      ? `Potwierdzenie rezerwacji – ${opts.className}`
      : `Lista rezerwowa – ${opts.className}`;
  const body =
    opts.status === "confirmed"
      ? `Dziękujemy za rezerwację w ${opts.studioName}.\n\nZajęcia: ${opts.className}\nProwadzi: ${opts.instructorName}\nTermin: ${date}\nCzas: ${opts.durationMinutes} min\n\nDo zobaczenia na macie 🌿`
      : `Zostałaś dopisana na listę rezerwową.\n\nZajęcia: ${opts.className}\nTermin: ${date}\n\nPowiadomimy Cię, gdy zwolni się miejsce.`;
  return { subject, body };
}

export function formatReminderEmail(opts: {
  studioName: string;
  className: string;
  instructorName: string;
  startsAt: string;
}) {
  const date = new Date(opts.startsAt).toLocaleString("pl-PL", {
    timeZone: "Europe/Warsaw",
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
  return {
    subject: `Przypomnienie: ${opts.className} jutro`,
    body: `Przypominamy o jutrzejszych zajęciach w ${opts.studioName}.\n\n${opts.className}\nProwadzi: ${opts.instructorName}\nTermin: ${date}\n\nMożesz odwołać rezerwację w panelu Moje rezerwacje.`,
  };
}

export function formatReminderSms(opts: { className: string; startsAt: string }) {
  const date = new Date(opts.startsAt).toLocaleString("pl-PL", {
    timeZone: "Europe/Warsaw",
    hour: "2-digit",
    minute: "2-digit",
  });
  return `Flow & Harmony: przypominamy o zajęciach ${opts.className} dziś o ${date}. Do zobaczenia!`;
}

export function formatWaitlistPromotedEmail(opts: {
  studioName: string;
  className: string;
  instructorName: string;
  startsAt: string;
}) {
  const date = new Date(opts.startsAt).toLocaleString("pl-PL", {
    timeZone: "Europe/Warsaw",
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
  return {
    subject: `Świetna wiadomość – masz miejsce na ${opts.className}!`,
    body: `Zwolniło się miejsce i Twoja rezerwacja z listy rezerwowej została automatycznie potwierdzona.\n\nZajęcia: ${opts.className}\nProwadzi: ${opts.instructorName}\nTermin: ${date}\n\nDo zobaczenia w ${opts.studioName} 🌿\n\nJeśli nie możesz przyjść — odwołaj rezerwację w panelu Moje rezerwacje, by zwolnić miejsce kolejnej osobie.`,
  };
}

export function formatWaitlistPromotedSms(opts: { className: string; startsAt: string }) {
  const date = new Date(opts.startsAt).toLocaleString("pl-PL", {
    timeZone: "Europe/Warsaw",
    weekday: "short",
    day: "numeric",
    month: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  return `Flow & Harmony: zwolnilo sie miejsce! Twoja rezerwacja na ${opts.className} (${date}) zostala potwierdzona z listy rezerwowej.`;
}
