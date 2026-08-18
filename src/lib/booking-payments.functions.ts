import { createServerFn } from "@tanstack/react-start";
import { getRequestHost } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const paySchema = z.object({ bookingId: z.string().uuid() });

/**
 * Rozpoczyna płatność za istniejącą (nieopłaconą) rezerwację — np. po awansie
 * z listy rezerwowej. Rezerwacja już istnieje, więc payments.booking_id jest ustawione.
 */
export const payForBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => paySchema.parse(d))
  .handler(async ({ data, context }) => {
    const { p24Register } = await import("./p24.server");
    const { supabase, userId } = context;

    const { data: booking, error: bErr } = await supabase
      .from("bookings")
      .select("id, class_id, user_id, status, payment_due_at")
      .eq("id", data.bookingId)
      .maybeSingle();
    if (bErr || !booking) throw new Error("Nie znaleziono rezerwacji");
    if (booking.user_id !== userId) throw new Error("Brak dostępu do tej rezerwacji");
    if (booking.status !== "confirmed") throw new Error("Ta rezerwacja nie wymaga opłaty");

    const { data: cls } = await supabase
      .from("classes")
      .select("id, starts_at, is_cancelled, price_grosz, class_type:class_types(name)")
      .eq("id", booking.class_id)
      .maybeSingle();
    if (!cls) throw new Error("Nie znaleziono zajęć");
    if (cls.is_cancelled) throw new Error("Zajęcia zostały odwołane");
    if (!cls.price_grosz || cls.price_grosz < 100) {
      throw new Error("Zajęcia nie mają ustawionej ceny — skontaktuj się ze studiem.");
    }

    const { data: paid } = await supabase
      .from("payments")
      .select("id")
      .eq("booking_id", booking.id)
      .eq("status", "paid")
      .maybeSingle();
    if (paid) throw new Error("Ta rezerwacja jest już opłacona");

    const { data: userResp } = await supabase.auth.getUser();
    const email = userResp.user?.email;
    if (!email) throw new Error("Brak adresu e-mail użytkownika");

    const className = (cls.class_type as { name?: string } | null)?.name ?? "Zajęcia";
    const when = new Date(cls.starts_at).toLocaleString("pl-PL", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "Europe/Warsaw",
    });
    const sessionId = `fhb_${userId.slice(0, 8)}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const { error: insErr } = await supabase.from("payments").insert({
      user_id: userId,
      package_code: "class-booking",
      package_name: `${className} — ${when}`,
      amount_grosz: cls.price_grosz,
      currency: "PLN",
      session_id: sessionId,
      email,
      status: "pending",
      class_id: cls.id,
      booking_id: booking.id,
    });
    if (insErr) throw new Error(insErr.message);

    const host = getRequestHost();
    const base = host?.includes("localhost") ? `http://${host}` : `https://${host ?? "www.flowharmony.pl"}`;

    const { token, redirectUrl } = await p24Register({
      sessionId,
      amountGrosz: cls.price_grosz,
      description: `${className} — ${when}`,
      email,
      urlReturn: `${base}/payment-success?sessionId=${encodeURIComponent(sessionId)}`,
      urlStatus: `${base}/api/public/p24/webhook`,
    });

    await supabase.from("payments").update({ p24_token: token }).eq("session_id", sessionId);
    return { redirectUrl, sessionId };
  });

/**
 * Odwołuje rezerwacje, które nie zostały opłacone w wyznaczonym czasie,
 * i powiadamia kolejne osoby awansowane z listy rezerwowej.
 */
export const expireUnpaidBookings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { runExpireUnpaidBookings } = await import("./expire-unpaid.server");
    return runExpireUnpaidBookings();
  });
