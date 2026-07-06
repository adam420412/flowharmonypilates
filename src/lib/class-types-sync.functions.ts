import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Push all class_types rows into the "Zajęcia" tab of the schedule Google
 * Sheet. Called by the admin panel after a class type is created, edited,
 * or removed so the sheet stays in sync with the app.
 */
export const pushClassTypesToSheetFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin, error: roleErr } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleErr) throw new Error(roleErr.message);
    if (!isAdmin) throw new Error("Forbidden");

    const { pushClassTypesToSheet } = await import("@/lib/schedule-sync.server");
    return await pushClassTypesToSheet();
  });

/**
 * Pull class-type defaults (name + default price) from the "Zajęcia" tab
 * into DB. Admin-triggered one-off refresh.
 */
export const pullClassTypesFromSheetFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin, error: roleErr } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleErr) throw new Error(roleErr.message);
    if (!isAdmin) throw new Error("Forbidden");

    const { syncClassTypesFromSheet } = await import("@/lib/schedule-sync.server");
    return await syncClassTypesFromSheet();
  });
