import type { AdminSummaryResponse } from "@/lib/admin-bookings";
import { getAdminSummary } from "@/server/admin-bookings";
import { requireAdmin } from "@/server/auth";
import { withErrorHandling } from "@/server/http";
import { createSupabaseClient } from "@/server/supabase";

// What needs attention today, for the admin's home page (А-0).
export const GET = withErrorHandling(async (req) => {
  await requireAdmin(req);

  const response: AdminSummaryResponse = await getAdminSummary(
    createSupabaseClient(),
    new Date(),
  );
  return Response.json(response);
});
