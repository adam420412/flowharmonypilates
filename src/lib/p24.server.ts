// Przelewy24 production API v1 helper (server-only)
// Endpoint: https://secure.przelewy24.pl/api/v1
// Auth: Basic Auth — login = POS_ID, password = P24_API_KEY
import { createHash } from "crypto";

const P24_BASE = "https://secure.przelewy24.pl";

function env() {
  const rawMerchantId = process.env.P24_MERCHANT_ID?.trim();
  const rawPosId = process.env.P24_POS_ID?.trim();
  const crc = process.env.P24_CRC?.trim();
  const apiKey = process.env.P24_API_KEY?.trim();
  const posId = Number(rawPosId);
  const merchantId = Number(rawMerchantId || rawPosId);
  const missing = [
    !rawPosId ? "P24_POS_ID" : null,
    !crc ? "P24_CRC" : null,
    !apiKey ? "P24_API_KEY" : null,
  ].filter(Boolean);
  const invalid = [
    rawMerchantId && !Number.isInteger(merchantId) ? "P24_MERCHANT_ID" : null,
    rawPosId && !Number.isInteger(posId) ? "P24_POS_ID" : null,
  ].filter(Boolean);
  if (missing.length || invalid.length || !merchantId || !posId) {
    const details = [
      missing.length ? `missing: ${missing.join(", ")}` : null,
      invalid.length ? `invalid: ${invalid.join(", ")}` : null,
    ].filter(Boolean).join("; ");
    throw new Error(`P24 credentials are not configured correctly${details ? ` (${details})` : ""}`);
  }
  return { merchantId, posId, crc: crc!, apiKey: apiKey! };
}

// SHA-384 z JSON-a, bez spacji, w dokładnej kolejności pól przekazanych w obiekcie.
function sign(obj: Record<string, unknown>) {
  const json = JSON.stringify(obj);
  return createHash("sha384").update(json).digest("hex");
}

function basicAuth(posId: number, apiKey: string) {
  return "Basic " + Buffer.from(`${posId}:${apiKey}`).toString("base64");
}

async function readBody(res: Response): Promise<{ text: string; json: unknown }> {
  const text = await res.text();
  let json: unknown = null;
  try { json = JSON.parse(text); } catch { /* keep raw */ }
  return { text, json };
}

// Sprawdza czy POS_ID + API_KEY są poprawne. Zwraca true jeśli 200.
export async function p24TestAccess(): Promise<{ ok: boolean; status: number; body: unknown }> {
  const { posId, apiKey } = env();
  const url = `${P24_BASE}/api/v1/testAccess`;
  const res = await fetch(url, {
    method: "GET",
    headers: { Authorization: basicAuth(posId, apiKey), Accept: "application/json" },
  });
  const { json, text } = await readBody(res);
  if (!res.ok) {
    console.error("[P24 testAccess] FAIL", { status: res.status, body: json ?? text });
  } else {
    console.log("[P24 testAccess] OK", { status: res.status });
  }
  return { ok: res.ok, status: res.status, body: json ?? text };
}

export type RegisterParams = {
  sessionId: string;
  amountGrosz: number;
  currency?: string;
  description: string;
  email: string;
  country?: string;
  language?: string;
  urlReturn: string;
  urlStatus: string;
};

export async function p24Register(p: RegisterParams): Promise<{ token: string; redirectUrl: string }> {
  const { merchantId, posId, crc, apiKey } = env();
  const currency = p.currency ?? "PLN";

  // Sign kolejność: sessionId, merchantId, amount, currency, crc
  const signature = sign({
    sessionId: p.sessionId,
    merchantId,
    amount: p.amountGrosz,
    currency,
    crc,
  });

  const body = {
    merchantId,
    posId,
    sessionId: p.sessionId,
    amount: p.amountGrosz,
    currency,
    description: p.description,
    email: p.email,
    country: p.country ?? "PL",
    language: p.language ?? "pl",
    urlReturn: p.urlReturn,
    urlStatus: p.urlStatus,
    sign: signature,
    encoding: "UTF-8",
  };

  const url = `${P24_BASE}/api/v1/transaction/register`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: basicAuth(posId, apiKey),
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });
  const { json, text } = await readBody(res);

  if (!res.ok) {
    console.error("[P24 register] FAIL", {
      status: res.status,
      request: { ...body, sign: signature.slice(0, 12) + "…" },
      response: json ?? text,
    });
    const errMsg =
      (json as any)?.error ??
      (json as any)?.data?.error ??
      text ??
      `HTTP ${res.status}`;
    throw new Error(`P24 register failed (HTTP ${res.status}): ${typeof errMsg === "string" ? errMsg : JSON.stringify(errMsg)}`);
  }

  const token = (json as any)?.data?.token as string | undefined;
  if (!token) {
    console.error("[P24 register] no token in response", { response: json ?? text });
    throw new Error(`P24 register: brak tokenu w odpowiedzi (${text})`);
  }

  console.log("[P24 register] OK", { sessionId: p.sessionId, token: token.slice(0, 8) + "…" });

  return {
    token,
    redirectUrl: `${P24_BASE}/trnRequest/${token}`,
  };
}

export type NotifyPayload = {
  merchantId: number;
  posId: number;
  sessionId: string;
  amount: number;
  originAmount: number;
  currency: string;
  orderId: number;
  methodId: number;
  statement: string;
  sign: string;
};

// Notyfikacja: sign = SHA-384 z {merchantId, posId, sessionId, amount, originAmount, currency, orderId, methodId, statement, crc}
export function verifyNotifySignature(p: NotifyPayload): boolean {
  const { crc } = env();
  const expected = sign({
    merchantId: p.merchantId,
    posId: p.posId,
    sessionId: p.sessionId,
    amount: p.amount,
    originAmount: p.originAmount,
    currency: p.currency,
    orderId: p.orderId,
    methodId: p.methodId,
    statement: p.statement,
    crc,
  });
  const ok = expected === p.sign;
  if (!ok) {
    console.error("[P24 notify] invalid signature", {
      sessionId: p.sessionId,
      orderId: p.orderId,
      received: p.sign?.slice(0, 12) + "…",
      expected: expected.slice(0, 12) + "…",
    });
  }
  return ok;
}

// PUT /api/v1/transaction/verify
// Sign: {sessionId, orderId, amount, currency, crc} — UWAGA: orderId zamiast merchantId
export async function p24Verify(params: {
  sessionId: string;
  amountGrosz: number;
  currency: string;
  orderId: number;
}): Promise<boolean> {
  const { merchantId, posId, crc, apiKey } = env();
  const signature = sign({
    sessionId: params.sessionId,
    orderId: params.orderId,
    amount: params.amountGrosz,
    currency: params.currency,
    crc,
  });

  const body = {
    merchantId,
    posId,
    sessionId: params.sessionId,
    amount: params.amountGrosz,
    currency: params.currency,
    orderId: params.orderId,
    sign: signature,
  };

  const url = `${P24_BASE}/api/v1/transaction/verify`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: basicAuth(posId, apiKey),
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });
  const { json, text } = await readBody(res);

  if (!res.ok) {
    console.error("[P24 verify] FAIL", {
      status: res.status,
      request: { ...body, sign: signature.slice(0, 12) + "…" },
      response: json ?? text,
    });
    return false;
  }

  const status = (json as any)?.data?.status;
  const ok = status === "success";
  if (!ok) {
    console.error("[P24 verify] status != success", { sessionId: params.sessionId, orderId: params.orderId, response: json });
  } else {
    console.log("[P24 verify] OK", { sessionId: params.sessionId, orderId: params.orderId });
  }
  return ok;
}

export type PackageDef = {
  code: string;
  name: string;
  amountGrosz: number;
};

export const PACKAGES: Record<string, PackageDef> = {
  intro: { code: "intro", name: "Wejście Intro", amountGrosz: 9900 },
  "pack-4": { code: "pack-4", name: "Karnet 4 wejścia", amountGrosz: 39000 },
  "pack-8": { code: "pack-8", name: "Karnet 8 wejść", amountGrosz: 67000 },
  "vip-solo-1": { code: "vip-solo-1", name: "VIP Solo · 1 sesja", amountGrosz: 26000 },
  "vip-solo-5": { code: "vip-solo-5", name: "VIP Solo · pakiet 5", amountGrosz: 120000 },
  "vip-duo-1": { code: "vip-duo-1", name: "VIP Duo · 1 sesja", amountGrosz: 32000 },
  "vip-duo-5": { code: "vip-duo-5", name: "VIP Duo · pakiet 5", amountGrosz: 145000 },
  // Test 1 zł — tylko do weryfikacji integracji
  "test-1pln": { code: "test-1pln", name: "TEST integracji P24 (1 zł)", amountGrosz: 100 },
};
