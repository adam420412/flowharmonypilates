import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { enqueueRenderedEmail } from "@/lib/email/enqueue.server";

const ContactInput = z.object({
  name: z.string().trim().min(2, "Imię jest za krótkie").max(200),
  email: z.string().trim().email("Nieprawidłowy adres e-mail").max(320),
  phone: z
    .string()
    .trim()
    .max(40)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  message: z.string().trim().min(5, "Wiadomość jest za krótka").max(5000),
  // honeypot — boty zwykle wypełniają, ludzie nie widzą tego pola
  website: z.string().max(0).optional().default(""),
});

const NOTIFY_RECIPIENTS = ["joanna@flowharmony.pl", "adam@fotz.pl"];

export const submitContactMessage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ContactInput.parse(input))
  .handler(async ({ data }) => {
    if (data.website && data.website.length > 0) {
      // honeypot tripped — pretend success, drop silently
      return { ok: true as const };
    }
    const { error } = await supabaseAdmin.from("contact_messages").insert({
      name: data.name,
      email: data.email,
      phone: data.phone,
      message: data.message,
      status: "new",
    });
    if (error) {
      console.error("contact_messages insert failed", error);
      throw new Error("Nie udało się zapisać wiadomości. Spróbuj ponownie za chwilę.");
    }

    // Powiadomienie e-mail do studia + dev (best-effort, nie blokuje zapisu)
    const subject = `Nowa wiadomość z formularza – ${data.name}`;
    const body = [
      `Nowa wiadomość z formularza kontaktowego Flow & Harmony.`,
      ``,
      `Od: ${data.name} <${data.email}>`,
      data.phone ? `Telefon: ${data.phone}` : null,
      ``,
      `Wiadomość:`,
      data.message,
    ]
      .filter(Boolean)
      .join("\n");

    await Promise.all(
      NOTIFY_RECIPIENTS.map((to) =>
        enqueueRenderedEmail({
          to,
          subject,
          body,
          label: "contact_form_notification",
        }).catch((e) => {
          console.error(`[contact] notify ${to} failed`, e);
        }),
      ),
    );

    return { ok: true as const };
  });
