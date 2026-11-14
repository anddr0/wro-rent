import { refreshApi } from "@/lib/use-api";

// After an admin changed a bike: reloads both the admin's lists and
// the customers' catalog, they all show bikes.
export async function refreshBikes(): Promise<void> {
  await refreshApi("/api/admin/bikes");
  await refreshApi("/api/bikes");
}
