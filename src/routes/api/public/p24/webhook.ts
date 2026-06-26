import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/p24/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let payload: any;
        try {
          payload = await request.json();
        } catch {
          return new Response("bad json", { status: 400 });
        }

        const { verifyNotifySignature, p24Verify } = await import("@/lib/p24.server");

        if (!verifyNotifySignature(payload)) {
          return new Response("invalid signature", { status: 401 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: pay, error } = await supabaseAdmin
          .from("payments")
          .select("id, amount_grosz, currency, status")
          .eq("session_id", payload.sessionId)
          .maybeSingle();

        if (error || !pay) return new Response("payment not found", { status: 404 });
        if (pay.amount_grosz !== payload.amount || pay.currency !== payload.currency) {
          return new Response("amount mismatch", { status: 400 });
        }

        const ok = await p24Verify({
          sessionId: payload.sessionId,
          amountGrosz: payload.amount,
          currency: payload.currency,
          orderId: payload.orderId,
        });

        if (!ok) {
          await supabaseAdmin
            .from("payments")
            .update({ status: "failed", p24_order_id: payload.orderId })
            .eq("id", pay.id);
          return new Response("verify failed", { status: 400 });
        }

        if (pay.status !== "paid") {
          await supabaseAdmin
            .from("payments")
            .update({
              status: "paid",
              p24_order_id: payload.orderId,
              paid_at: new Date().toISOString(),
            })
            .eq("id", pay.id);
        }

        return new Response("ok");
      },
    },
  },
});
