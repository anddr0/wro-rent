// What the admin plans API sends to the mini app.
import type { DurationUnit } from "@/lib/plans";

export type AdminPlan = {
  id: string;
  name: string;
  durationCount: number;
  durationUnit: DurationUnit;
  price: number;
  // False — hidden: customers can't pick it for a new request.
  isActive: boolean;
};

// GET /api/admin/plans
export type AdminPlansResponse = { plans: AdminPlan[] };

// GET, PATCH /api/admin/plans/[id]; POST /api/admin/plans
export type AdminPlanResponse = { plan: AdminPlan };

// The body of POST /api/admin/plans and PATCH /api/admin/plans/[id].
export type PlanFields = Omit<AdminPlan, "id">;

export const PLAN_LIMITS = {
  maxNameLength: 60,
  // The longest duration in its own unit: 365 days, 365 hours…
  maxDurationCount: 365,
};
