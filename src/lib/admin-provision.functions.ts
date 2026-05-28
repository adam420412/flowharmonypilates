import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * One-shot: provisions joanna@flowharmony.pl as the studio's admin account.
 * Idempotent: if the account already exists, only the admin role is (re)assigned.
 * Reads the initial password from process.env.ADMIN_INITIAL_PASSWORD.
 *
 * Called manually (e.g. via invoke-server-function) — NOT exposed in the UI.
 */
export const provisionInitialAdmin = createServerFn({ method: "POST" }).handler(
  async () => {
    const email = "joanna@flowharmony.pl";
    const password = process.env.ADMIN_INITIAL_PASSWORD;
    if (!password) {
      throw new Error("ADMIN_INITIAL_PASSWORD secret is not set");
    }

    // Look up user by email
    const { data: existing, error: lookupErr } = await supabaseAdmin.auth.admin
      .listUsers({ page: 1, perPage: 200 });
    if (lookupErr) throw new Error(`listUsers failed: ${lookupErr.message}`);

    let userId: string | undefined = existing.users.find(
      (u) => u.email?.toLowerCase() === email,
    )?.id;

    if (!userId) {
      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: "Joanna Konieczna" },
      });
      if (createErr) throw new Error(`createUser failed: ${createErr.message}`);
      userId = created.user?.id;
      if (!userId) throw new Error("createUser returned no user id");
    } else {
      // Refresh password in case the secret was rotated
      const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password,
        email_confirm: true,
      });
      if (updErr) throw new Error(`updateUserById failed: ${updErr.message}`);
    }

    // Ensure profile exists
    await supabaseAdmin
      .from("profiles")
      .upsert({ id: userId, display_name: "Joanna Konieczna" }, { onConflict: "id" });

    // Ensure admin role (idempotent — unique(user_id, role))
    const { error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });
    if (roleErr) throw new Error(`role upsert failed: ${roleErr.message}`);

    return { ok: true as const, userId, email };
  },
);
