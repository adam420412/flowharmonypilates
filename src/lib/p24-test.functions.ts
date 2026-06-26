import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const testP24Connection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const rawPosId = process.env.P24_POS_ID?.trim();
    const rawMerchantId = process.env.P24_MERCHANT_ID?.trim();
    const apiKey = process.env.P24_API_KEY?.trim();
    const crc = process.env.P24_CRC?.trim();

    const posId = Number(rawPosId);
    const merchantId = Number(rawMerchantId || rawPosId);

    const config = {
      P24_POS_ID: rawPosId ? `set (${rawPosId.length} chars, parsed=${Number.isInteger(posId) ? posId : "NaN"})` : "missing",
      P24_MERCHANT_ID: rawMerchantId ? `set (${rawMerchantId.length} chars, parsed=${Number.isInteger(merchantId) ? merchantId : "NaN"})` : `missing (fallback to POS_ID)`,
      P24_API_KEY: apiKey ? `set (${apiKey.length} chars)` : "missing",
      P24_CRC: crc ? `set (${crc.length} chars)` : "missing",
    };

    if (!rawPosId || !apiKey || !crc || !Number.isInteger(posId) || !Number.isInteger(merchantId)) {
      return {
        ok: false,
        step: "config",
        message: "Brakuje lub niepoprawne sekrety P24",
        config,
      };
    }

    const auth = "Basic " + Buffer.from(`${posId}:${apiKey}`).toString("base64");
    const url = "https://secure.przelewy24.pl/api/v1/testAccess";

    try {
      const res = await fetch(url, {
        method: "GET",
        headers: { Authorization: auth, Accept: "application/json" },
      });
      const text = await res.text();
      let json: unknown = null;
      try { json = JSON.parse(text); } catch { /* keep text */ }

      return {
        ok: res.ok,
        step: "testAccess",
        status: res.status,
        endpoint: url,
        response: json ?? text,
        config,
        hint:
          res.status === 401
            ? "POS ID + API Key nie pasują do siebie. Sprawdź w panelu P24 → Moje dane → Klucze, że Klucz do raportów (REST API) należy do TEGO POS-a co P24_POS_ID. Wyłącz też restrykcje IP na czas testu."
            : res.ok
              ? "Połączenie OK — autoryzacja działa."
              : "P24 zwraca błąd inny niż 401 — sprawdź odpowiedź.",
      };
    } catch (e) {
      return {
        ok: false,
        step: "network",
        message: e instanceof Error ? e.message : String(e),
        config,
      };
    }
  });
