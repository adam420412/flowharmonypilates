import { createServerFn } from "@tanstack/react-start";
import { getRequestHost } from "@tanstack/react-start/server";
import { z } from "zod";

const guestCheckoutSchema = z.object({
  classId: z.string().uuid(),
  fullName: z.string().trim().min(2, "Podaj imię i nazwisko").max(120),
  email: z.string().trim().toLowerCase().email("Niepoprawny e-mail").max(255),
  phone: z.string().trim().min(7, "Podaj numer telefonu").max(20),
  smsOptIn: z.boolean().optional(),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: "Musisz zaakceptować regulamin i politykę prywatności" }),
  }),
});

export const startGuestClassCheckout = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => guestCheckoutSchema.parse(d))
  .handler(async ({ data }) => {
    const { p24Register } = await import("./p24.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Load class
    const { data: cls, error: clsErr } = await supabaseAdmin
      .from("classes")
      .select("id, starts_at, is_cancelled, price_grosz, capacity, class_type:class_types(name)")
      .eq("id", data.classId)
      .maybeSingle();
    if (clsErr || !cls) throw new Error("Nie znaleziono zajęć");
    if (cls.is_cancelled) throw new Error("Zajęcia zostały odwołane");
    if (!cls.price_grosz || cls.price_grosz < 100) {
      throw new Error("Zajęcia nie mają ustawionej ceny — skontaktuj się ze studiem.");
    }
    if (new Date(cls.starts_at).getTime() < Date.now()) {
      throw new Error("Zajęcia już się rozpoczęły lub odbyły");
    }

    // Sprawdź miejsca
    const { count: confirmedCount } = await supabaseAdmin
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("class_id", cls.id)
      .eq("status", "confirmed");
    if ((confirmedCount ?? 0) >= cls.capacity) {
      throw new Error("Brak wolnych miejsc na tych zajęciach");
    }

    const phoneDigits = data.phone.replace(/\s|-/g, "");
    const normalizedPhone = phoneDigits.startsWith("+")
      ? phoneDigits
      : phoneDigits.startsWith("00")
        ? `+${phoneDigits.slice(2)}`
        : `+48${phoneDigits}`;

    // Find or create the user
    const { data: existingId } = await supabaseAdmin.rpc("find_user_id_by_email", { _email: data.email });
    let userId: string | null = (existingId as string | null) ?? null;
    let createdNow = false;

    if (!userId) {
      const tempPassword = `Fh!${crypto.randomUUID()}`;
      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { full_name: data.fullName, phone: normalizedPhone },
      });
      if (createErr || !created.user) {
        throw new Error(createErr?.message ?? "Nie udało się utworzyć konta");
      }
      userId = created.user.id;
      createdNow = true;
    }

    // Update profile (trigger should have created the row on first signup)
    await supabaseAdmin.from("profiles").update({
      display_name: data.fullName,
      phone: normalizedPhone,
      ...(data.smsOptIn
        ? { sms_opt_in: true, sms_opt_in_at: new Date().toISOString() }
        : {}),
    }).eq("id", userId);

    const className = (cls.class_type as { name?: string } | null)?.name ?? "Zajęcia";
    const when = new Date(cls.starts_at).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Warsaw" });
    const sessionId = `fhg_${userId.slice(0, 8)}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const { error: insErr } = await supabaseAdmin.from("payments").insert({
      user_id: userId,
      package_code: "class-booking-guest",
      package_name: `${className} — ${when}`,
      amount_grosz: cls.price_grosz,
      currency: "PLN",
      session_id: sessionId,
      email: data.email,
      status: "pending",
      class_id: cls.id,
      is_guest: true,
    });
    if (insErr) throw new Error(insErr.message);

    const host = getRequestHost();
    const base = host?.includes("localhost") ? `http://${host}` : `https://${host ?? "www.flowharmony.pl"}`;

    const { token, redirectUrl } = await p24Register({
      sessionId,
      amountGrosz: cls.price_grosz,
      description: `${className} — ${when}`,
      email: data.email,
      urlReturn: `${base}/platnosc/status?sessionId=${encodeURIComponent(sessionId)}`,
      urlStatus: `${base}/api/public/p24/webhook`,
    });

    await supabaseAdmin.from("payments").update({ p24_token: token }).eq("session_id", sessionId);

    // For brand-new accounts, send password reset so they can claim it
    if (createdNow) {
      try {
        const { createClient } = await import("@supabase/supabase-js");
        const pub = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_PUBLISHABLE_KEY!,
          { auth: { persistSession: false, autoRefreshToken: false } },
        );
        await pub.auth.resetPasswordForEmail(data.email, {
          redirectTo: `${base}/reset-hasla`,
        });
      } catch (e) {
        console.warn("guest password setup email failed:", e);
      }
    }

    return { redirectUrl, sessionId };
  });
