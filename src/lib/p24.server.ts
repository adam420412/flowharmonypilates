// Przelewy24 production API helper (server-only)
import { createHash } from "crypto";

const P24_BASE = "https://secure.przelewy24.pl";

function env() {
  const merchantId = Number(process.env.P24_MERCHANT_ID);
  const posId = Number(process.env.P24_POS_ID);
  const crc = process.env.P24_CRC!;
  const apiKey = process.env.P24_API_KEY!;
  if (!merchantId || !posId || !crc || !apiKey) {
    throw new Error("P24 credentials are not configured");
  }
  return { merchantId, posId, crc, apiKey };
}

function sign(obj: Record<string, unknown>) {
  return createHash("sha384").update(JSON.stringify(obj)).digest("hex");
}

function basicAuth(posId: number, apiKey: string) {
  return "Basic " + Buffer.from(`${posId}:${apiKey}`).toString("base64");
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
  const res = await fetch(`${P24_BASE}/api/v1/transaction/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: basicAuth(posId, apiKey),
    },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as { data?: { token?: string }; error?: unknown };
  if (!res.ok || !json.data?.token) {
    throw new Error(`P24 register failed: ${JSON.stringify(json)}`);
  }
  return {
    token: json.data.token,
    redirectUrl: `${P24_BASE}/trnRequest/${json.data.token}`,
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
  return expected === p.sign;
}

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
  const res = await fetch(`${P24_BASE}/api/v1/transaction/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: basicAuth(posId, apiKey),
    },
    body: JSON.stringify({
      merchantId,
      posId,
      sessionId: params.sessionId,
      amount: params.amountGrosz,
      currency: params.currency,
      orderId: params.orderId,
      sign: signature,
    }),
  });
  const json = (await res.json()) as { data?: { status?: string } };
  return res.ok && json.data?.status === "success";
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
};
