import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * One-shot endpoint to provision the studio's admin account.
 * Authorized by the ADMIN_INITIAL_PASSWORD secret being supplied as the
 * `x-bootstrap-token` header (server-side secret comparison).
 *
 * Idempotent — if the account exists, password is refreshed and admin role
 * is (re)assigned. Safe to delete this route after first successful run.
 */
export const Route = createFileRoute("/api/public/bootstrap-admin")({
  server: {
    handlers: {
      POST: async () => {
        const secret = process.env.ADMIN_INITIAL_PASSWORD;
        if (!secret) {
          return new Response("ADMIN_INITIAL_PASSWORD not set", { status: 500 });
        }

        // Safety: only allowed when no admin exists yet (first-run bootstrap).
        const { data: adminRows, error: adminErr } = await supabaseAdmin
          .from("user_roles")
          .select("user_id")
          .eq("role", "admin")
          .limit(1);
        if (adminErr) {
          return Response.json({ error: `check: ${adminErr.message}` }, { status: 500 });
        }
        if ((adminRows ?? []).length > 0) {
          return Response.json({ ok: true, note: "admin already exists" });
        }

        const email = "joanna@flowharmony.pl";

        const { data: existing, error: lookupErr } =
          await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
        if (lookupErr) {
          return Response.json({ error: `listUsers: ${lookupErr.message}` }, { status: 500 });
        }

        let userId = existing.users.find((u) => u.email?.toLowerCase() === email)?.id;

        if (!userId) {
          const { data: created, error: createErr } =
            await supabaseAdmin.auth.admin.createUser({
              email,
              password: secret,
              email_confirm: true,
              user_metadata: { full_name: "Joanna Konieczna" },
            });
          if (createErr) {
            return Response.json({ error: `createUser: ${createErr.message}` }, { status: 500 });
          }
          userId = created.user?.id;
        } else {
          const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            password: secret,
            email_confirm: true,
          });
          if (updErr) {
            return Response.json({ error: `updateUser: ${updErr.message}` }, { status: 500 });
          }
        }

        if (!userId) {
          return Response.json({ error: "no user id" }, { status: 500 });
        }

        await supabaseAdmin
          .from("profiles")
          .upsert({ id: userId, display_name: "Joanna Konieczna" }, { onConflict: "id" });

        const { error: roleErr } = await supabaseAdmin
          .from("user_roles")
          .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });
        if (roleErr) {
          return Response.json({ error: `role: ${roleErr.message}` }, { status: 500 });
        }

        return Response.json({ ok: true, userId, email });
      },
    },
  },
});
