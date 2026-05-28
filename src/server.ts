import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => ((m as { default?: ServerEntry }).default ?? (m as unknown as ServerEntry)),
    );
  }
  return serverEntryPromise;
}

function brandedErrorResponse(): Response {
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isCatastrophicSsrErrorBody(body: string, responseStatus: number): boolean {
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return false;
  }

  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    return false;
  }

  const fields = payload as Record<string, unknown>;
  const expectedKeys = new Set(["message", "status", "unhandled"]);
  if (!Object.keys(fields).every((key) => expectedKeys.has(key))) {
    return false;
  }

  return (
    fields.unhandled === true &&
    fields.message === "HTTPError" &&
    (fields.status === undefined || fields.status === responseStatus)
  );
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isCatastrophicSsrErrorBody(body, response.status)) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return brandedErrorResponse();
}

const CANONICAL_HOST = "www.flowharmony.pl";
// Hosts that should NOT be redirected (preview/dev environments).
const REDIRECT_EXEMPT_HOST_SUFFIXES = [
  ".lovable.dev",
  "-dev.lovable.app",
  "id-preview--",
];

function canonicalRedirect(request: Request): Response | null {
  const url = new URL(request.url);
  const host = url.hostname;

  if (host === CANONICAL_HOST) return null;
  if (host === "localhost" || host === "127.0.0.1") return null;
  if (REDIRECT_EXEMPT_HOST_SUFFIXES.some((s) => host.endsWith(s) || host.includes(s))) {
    return null;
  }

  // Only redirect the old Lovable published URL → canonical www.
  // NOTE: apex (flowharmony.pl) redirect is intentionally disabled — while DNS
  // for apex vs www points to different hosts (cyberfolks vs Lovable), adding
  // a 301 here can create a redirect loop with the other host's own redirect.
  // Re-enable `host === "flowharmony.pl"` only after both A records point to Lovable.
  const shouldRedirect = host.endsWith(".lovable.app");



  if (!shouldRedirect) return null;

  const target = `https://${CANONICAL_HOST}${url.pathname}${url.search}`;
  return new Response(null, {
    status: 301,
    headers: {
      location: target,
      "cache-control": "public, max-age=3600",
    },
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const redirect = canonicalRedirect(request);
      if (redirect) return redirect;

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return brandedErrorResponse();
    }
  },
};
