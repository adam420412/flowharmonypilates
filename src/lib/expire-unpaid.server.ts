import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { notifyPromotedBooking } from "./waitlist-notify.server";

/** Odwołuje nieopłacone rezerwacje po terminie i powiadamia awansowane osoby. */
export async function runExpireUnpaidBookings() {
  const { data, error } = await supabaseAdmin.rpc("expire_unpaid_bookings");
  if (error) return { ok: false as const, error: error.message };

  const result = data as unknown as {
    ok: boolean;
    expired: number;
    promotions: Array<{ class_id: string; user_id: string; booking_id: string }>;
  };

  for (const p of result?.promotions ?? []) {
    try {
      await notifyPromotedBooking({ classId: p.class_id, userId: p.user_id, bookingId: p.booking_id });
    } catch (e) {
      console.error("expire-unpaid notify failed", e);
    }
  }

  return { ok: true as const, expired: result?.expired ?? 0, promoted: result?.promotions?.length ?? 0 };
}
