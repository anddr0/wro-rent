import { requireAdmin } from "@/server/auth";
import { HttpError, withErrorHandling } from "@/server/http";
import { isUuid } from "@/server/request";
import { createSupabaseClient } from "@/server/supabase";
import { deleteUnavailablePeriod } from "@/server/unavailable";

// Removes a period: the bike can be booked for that time again.
export const DELETE = withErrorHandling(
  async (
    req,
    ctx: RouteContext<"/api/admin/bikes/[id]/unavailable/[periodId]">,
  ) => {
    await requireAdmin(req);
    const { id, periodId } = await ctx.params;

    if (!isUuid(id) || !isUuid(periodId)) {
      throw new HttpError(404, "Period not found");
    }

    await deleteUnavailablePeriod(createSupabaseClient(), id, periodId);

    return Response.json({ ok: true });
  },
);
