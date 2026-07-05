import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/hooks/sync-schedule")({
  server: {
    handlers: {
      POST: async () => {
        try {
          const { syncScheduleFromSheet } = await import("@/lib/schedule-sync.server");
          const summary = await syncScheduleFromSheet();
          console.log("sync-schedule:", JSON.stringify(summary));
          return new Response(JSON.stringify(summary), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : "unknown";
          console.error("sync-schedule failed:", message);
          return new Response(JSON.stringify({ ok: false, error: message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
      GET: async () => {
        // Convenience: allow manual trigger from browser
        try {
          const { syncScheduleFromSheet } = await import("@/lib/schedule-sync.server");
          const summary = await syncScheduleFromSheet();
          return new Response(JSON.stringify(summary, null, 2), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : "unknown";
          return new Response(JSON.stringify({ ok: false, error: message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
