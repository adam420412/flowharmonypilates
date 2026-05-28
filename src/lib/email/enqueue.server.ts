/**
 * Server-side helpers to enqueue transactional emails directly to the
 * pgmq queue used by /lovable/email/queue/process. Mirrors the suppression
 * + unsubscribe-token logic of /lovable/email/transactional/send, but is
 * called from server functions (no HTTP round-trip, no JWT needed).
 */
import * as React from "react";
import { render } from "@react-email/components";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { TEMPLATES } from "@/lib/email-templates/registry";

const SITE_NAME = "Flow & Harmony";
const SENDER_DOMAIN = "notify.flowharmony.pl";
const FROM_DOMAIN = "flowharmony.pl";

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Bardzo proste opakowanie HTML dla maili budowanych z plaintext body. */
function plainBodyToHtml(subject: string, body: string) {
  const html = escapeHtml(body).replace(/\n/g, "<br/>");
  return `<!doctype html><html lang="pl"><head><meta charset="utf-8"><title>${escapeHtml(
    subject,
  )}</title></head><body style="margin:0;padding:0;background:#ffffff;font-family:Arial,sans-serif;color:#1a1a1a;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <h1 style="font-size:20px;margin:0 0 16px;color:#1a1a1a;">${escapeHtml(subject)}</h1>
    <div style="font-size:14px;line-height:1.6;color:#333;">${html}</div>
    <p style="margin-top:32px;font-size:12px;color:#999;">${SITE_NAME}</p>
  </div></body></html>`;
}

async function ensureUnsubscribeToken(email: string): Promise<string | null> {
  const normalized = email.toLowerCase();
  const { data: existing } = await supabaseAdmin
    .from("email_unsubscribe_tokens")
    .select("token, used_at")
    .eq("email", normalized)
    .maybeSingle();

  if (existing && !existing.used_at) return existing.token;
  if (existing && existing.used_at) return null; // suppressed-ish

  const token = generateToken();
  await supabaseAdmin
    .from("email_unsubscribe_tokens")
    .upsert(
      { token, email: normalized },
      { onConflict: "email", ignoreDuplicates: true },
    );
  const { data: stored } = await supabaseAdmin
    .from("email_unsubscribe_tokens")
    .select("token")
    .eq("email", normalized)
    .maybeSingle();
  return stored?.token ?? null;
}

async function isSuppressed(email: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("suppressed_emails")
    .select("id")
    .eq("email", email.toLowerCase())
    .maybeSingle();
  return !!data;
}

export type EnqueueResult =
  | { ok: true; messageId: string }
  | { ok: false; reason: string };

async function enqueueCore(opts: {
  to: string;
  subject: string;
  html: string;
  text: string;
  label: string;
  idempotencyKey?: string;
}): Promise<EnqueueResult> {
  const messageId = crypto.randomUUID();
  if (await isSuppressed(opts.to)) {
    await supabaseAdmin.from("email_send_log").insert({
      message_id: messageId,
      template_name: opts.label,
      recipient_email: opts.to,
      status: "suppressed",
    });
    return { ok: false, reason: "suppressed" };
  }

  const unsubToken = await ensureUnsubscribeToken(opts.to);
  if (!unsubToken) {
    return { ok: false, reason: "unsubscribe_token_failed" };
  }

  await supabaseAdmin.from("email_send_log").insert({
    message_id: messageId,
    template_name: opts.label,
    recipient_email: opts.to,
    status: "pending",
  });

  const { error } = await supabaseAdmin.rpc("enqueue_email", {
    queue_name: "transactional_emails",
    payload: {
      message_id: messageId,
      to: opts.to,
      from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
      sender_domain: SENDER_DOMAIN,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
      purpose: "transactional",
      label: opts.label,
      idempotency_key: opts.idempotencyKey ?? messageId,
      unsubscribe_token: unsubToken,
      queued_at: new Date().toISOString(),
    },
  });

  if (error) {
    await supabaseAdmin.from("email_send_log").insert({
      message_id: messageId,
      template_name: opts.label,
      recipient_email: opts.to,
      status: "failed",
      error_message: `enqueue: ${error.message}`,
    });
    return { ok: false, reason: `enqueue_failed: ${error.message}` };
  }
  return { ok: true, messageId };
}

/** Wysyła e-mail zbudowany z tekstowego body (np. formatBookingEmail). */
export async function enqueueRenderedEmail(opts: {
  to: string;
  subject: string;
  body: string;
  label: string;
  idempotencyKey?: string;
}) {
  return enqueueCore({
    to: opts.to,
    subject: opts.subject,
    html: plainBodyToHtml(opts.subject, opts.body),
    text: opts.body,
    label: opts.label,
    idempotencyKey: opts.idempotencyKey,
  });
}

/** Wysyła e-mail używając zarejestrowanego szablonu React Email. */
export async function enqueueTemplateEmail(opts: {
  templateName: string;
  to: string;
  data?: Record<string, any>;
  idempotencyKey?: string;
}) {
  const tpl = TEMPLATES[opts.templateName];
  if (!tpl) return { ok: false as const, reason: `template_not_found:${opts.templateName}` };

  const element = React.createElement(tpl.component, opts.data ?? {});
  const html = await render(element);
  const text = await render(element, { plainText: true });
  const subject =
    typeof tpl.subject === "function" ? tpl.subject(opts.data ?? {}) : tpl.subject;

  return enqueueCore({
    to: opts.to,
    subject,
    html,
    text,
    label: opts.templateName,
    idempotencyKey: opts.idempotencyKey,
  });
}
