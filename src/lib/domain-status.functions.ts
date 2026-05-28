import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const CANONICAL = "www.flowharmony.pl";
const APEX = "flowharmony.pl";
const LOVABLE = "flowharmonypilates.lovable.app";

export type CheckResult = {
  label: string;
  url: string;
  ok: boolean;
  status: number | null;
  finalUrl: string | null;
  https: boolean;
  redirectsToCanonical: boolean | null; // null = N/A (this IS the canonical)
  error: string | null;
  durationMs: number;
};

async function checkHost(label: string, host: string, isCanonical: boolean): Promise<CheckResult> {
  const url = `https://${host}/`;
  const started = Date.now();
  try {
    // Use manual redirect handling so we can detect 301s explicitly.
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: { "user-agent": "FlowHarmony-DomainCheck/1.0" },
    });
    const finalUrl = res.url || url;
    const finalHost = new URL(finalUrl).hostname;
    return {
      label,
      url,
      ok: res.ok,
      status: res.status,
      finalUrl,
      https: finalUrl.startsWith("https://"),
      redirectsToCanonical: isCanonical ? null : finalHost === CANONICAL,
      error: null,
      durationMs: Date.now() - started,
    };
  } catch (err) {
    return {
      label,
      url,
      ok: false,
      status: null,
      finalUrl: null,
      https: false,
      redirectsToCanonical: isCanonical ? null : false,
      error: err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - started,
    };
  }
}

export const checkDomainStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const [canonical, apex, lovable] = await Promise.all([
      checkHost("Główna domena (www)", CANONICAL, true),
      checkHost("Apex (bez www)", APEX, false),
      checkHost("Stara domena Lovable", LOVABLE, false),
    ]);
    return {
      checkedAt: new Date().toISOString(),
      canonical,
      apex,
      lovable,
    };
  });
