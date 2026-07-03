import { createFileRoute } from "@tanstack/react-router";
import { p24TestAccess } from "@/lib/p24.server";

// TEMP: publiczny endpoint do szybkiego testu autoryzacji P24. Nie zwraca kluczy.
export const Route = createFileRoute("/api/public/p24-test")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const r = await p24TestAccess();
          return Response.json(r);
        } catch (e) {
          return Response.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
        }
      },
    },
  },
});
