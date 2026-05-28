import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

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
    return { ok: true as const };
  });
