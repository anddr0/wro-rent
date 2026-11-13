import type { BikesResponse } from "@/lib/catalog";
import { requireUser } from "@/server/auth";
import {
  cheapestPrice,
  listActivePlans,
  listVisibleBikes,
} from "@/server/catalog";
import { withErrorHandling } from "@/server/http";
import { createSupabaseClient } from "@/server/supabase";

// The catalog: bikes customers can see and the price "from" (К-1).
export const GET = withErrorHandling(async (req) => {
  await requireUser(req);
  const supabase = createSupabaseClient();

  const [bikes, plans] = await Promise.all([
    listVisibleBikes(supabase),
    listActivePlans(supabase),
  ]);

  const response: BikesResponse = { bikes, priceFrom: cheapestPrice(plans) };
  return Response.json(response);
});
