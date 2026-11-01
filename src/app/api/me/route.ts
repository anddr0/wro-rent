import { requireUser } from "@/server/auth";
import { withErrorHandling } from "@/server/http";

// The mini app calls this on open to find out who the user is.
export const GET = withErrorHandling(async (req) => {
  const user = await requireUser(req);
  return Response.json({ user });
});
