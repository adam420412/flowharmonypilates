import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/hooks/expire-unpaid")({
  server: {
    handlers: {
      POST: async () => {
        try {
          const { runExpireUnpaidBookings } = await import("@/lib/expire-unpaid.server");
          const summary = await runExpireUnpaidBookings();
          return new Response(JSON.stringify(summary), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : "unknown";
          console.error("expire-unpaid failed:", message);
          return new Response(JSON.stringify({ ok: false, error: message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
