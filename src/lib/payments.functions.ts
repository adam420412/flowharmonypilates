import { createServerFn } from "@tanstack/react-start";
import { getRequestHost } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const startCheckoutSchema = z.object({
  packageCode: z.string().min(1).max(40),
});

export const startCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => startCheckoutSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { p24Register, PACKAGES } = await import("./p24.server");
    const pkg = PACKAGES[data.packageCode];
    if (!pkg) throw new Error("Nieznany pakiet");

    const { supabase, userId } = context;
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", userId)
      .maybeSingle();
    const { data: userResp } = await supabase.auth.getUser();
    const email = userResp.user?.email;
    if (!email) throw new Error("Brak adresu e-mail użytkownika");

    const sessionId = `fh_${userId.slice(0, 8)}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const { error: insErr } = await supabase.from("payments").insert({
      user_id: userId,
      package_code: pkg.code,
      package_name: pkg.name,
      amount_grosz: pkg.amountGrosz,
      currency: "PLN",
      session_id: sessionId,
      email,
      status: "pending",
    });
    if (insErr) throw new Error(insErr.message);

    const host = getRequestHost();
    const base = host?.includes("localhost") ? `http://${host}` : `https://${host ?? "www.flowharmony.pl"}`;

    const { token, redirectUrl } = await p24Register({
      sessionId,
      amountGrosz: pkg.amountGrosz,
      description: `${pkg.name} — ${profile?.display_name ?? email}`,
      email,
      urlReturn: `${base}/payment-success?sessionId=${encodeURIComponent(sessionId)}`,
      urlStatus: `${base}/api/public/p24/webhook`,
    });

    await supabase.from("payments").update({ p24_token: token }).eq("session_id", sessionId);

    return { redirectUrl, sessionId };
  });

const statusSchema = z.object({ sessionId: z.string().min(1) });

export const getPaymentStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => statusSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("payments")
      .select("status, package_name, amount_grosz, paid_at, booking_id, class_id")
      .eq("session_id", data.sessionId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

// === Per-class booking checkout (TEST: 1 PLN per slot) ===
const TEST_CLASS_PRICE_GROSZ = 100;

const classCheckoutSchema = z.object({ classId: z.string().uuid() });

export const startClassCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => classCheckoutSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { p24Register } = await import("./p24.server");
    const { supabase, userId } = context;

    const { data: cls, error: clsErr } = await supabase
      .from("classes")
      .select("id, starts_at, is_cancelled, class_type:class_types(name)")
      .eq("id", data.classId)
      .maybeSingle();
    if (clsErr || !cls) throw new Error("Nie znaleziono zajęć");
    if (cls.is_cancelled) throw new Error("Zajęcia odwołane");

    const { data: userResp } = await supabase.auth.getUser();
    const email = userResp.user?.email;
    if (!email) throw new Error("Brak adresu e-mail użytkownika");

    const className = (cls.class_type as { name?: string } | null)?.name ?? "Zajęcia";
    const when = new Date(cls.starts_at).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" });
    const sessionId = `fhc_${userId.slice(0, 8)}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const { error: insErr } = await supabase.from("payments").insert({
      user_id: userId,
      package_code: "class-booking",
      package_name: `${className} — ${when}`,
      amount_grosz: TEST_CLASS_PRICE_GROSZ,
      currency: "PLN",
      session_id: sessionId,
      email,
      status: "pending",
      class_id: cls.id,
    });
    if (insErr) throw new Error(insErr.message);

    const host = getRequestHost();
    const base = host?.includes("localhost") ? `http://${host}` : `https://${host ?? "www.flowharmony.pl"}`;

    const { token, redirectUrl } = await p24Register({
      sessionId,
      amountGrosz: TEST_CLASS_PRICE_GROSZ,
      description: `${className} — ${when}`,
      email,
      urlReturn: `${base}/platnosc/status?sessionId=${encodeURIComponent(sessionId)}`,
      urlStatus: `${base}/api/public/p24/webhook`,
    });

    await supabase.from("payments").update({ p24_token: token }).eq("session_id", sessionId);
    return { redirectUrl, sessionId };
  });

