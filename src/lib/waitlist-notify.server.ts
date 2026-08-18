import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  sendNotification,
  formatWaitlistPromotedEmail,
  formatWaitlistPromotedSms,
} from "./notifications.server";

/** Wysyła e-mail + SMS (jeśli opt-in) o awansie z listy rezerwowej. */
export async function notifyPromotedBooking(params: {
  classId: string;
  userId: string;
  bookingId: string;
}) {
  const { classId, userId, bookingId } = params;

  const [{ data: cls }, { data: profile }, { data: authUser }, { data: studio }] = await Promise.all([
    supabaseAdmin
      .from("classes")
      .select("id,starts_at,class_type_id,instructor_id")
      .eq("id", classId)
      .maybeSingle(),
    supabaseAdmin.from("profiles").select("phone,sms_opt_in").eq("id", userId).maybeSingle(),
    supabaseAdmin.auth.admin.getUserById(userId),
    supabaseAdmin.from("app_settings").select("value").eq("key", "studio_name").maybeSingle(),
  ]);
  if (!cls) return { ok: false as const, reason: "class_not_found" };

  const [{ data: ct }, { data: ins }] = await Promise.all([
    supabaseAdmin.from("class_types").select("name").eq("id", cls.class_type_id).maybeSingle(),
    supabaseAdmin.from("instructors").select("full_name").eq("id", cls.instructor_id).maybeSingle(),
  ]);

  const studioName = typeof studio?.value === "string" ? studio.value : "Flow & Harmony";
  const className = ct?.name ?? "Pilates";
  const instructorName = ins?.full_name ?? "Instruktor";
  const email = authUser?.user?.email;

  if (email) {
    const { subject, body } = formatWaitlistPromotedEmail({
      studioName,
      className,
      instructorName,
      startsAt: cls.starts_at,
    });
    await sendNotification({
      userId,
      bookingId,
      classId,
      channel: "email",
      kind: "waitlist_promoted",
      recipient: email,
      subject,
      body,
    });
  }

  if (profile?.sms_opt_in && profile.phone) {
    await sendNotification({
      userId,
      bookingId,
      classId,
      channel: "sms",
      kind: "waitlist_promoted",
      recipient: profile.phone,
      body: formatWaitlistPromotedSms({ className, startsAt: cls.starts_at }),
    });
  }

  return { ok: true as const };
}
