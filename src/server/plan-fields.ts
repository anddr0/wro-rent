import "server-only";
import { PLAN_LIMITS } from "@/lib/admin-plans";
import type { PlanFields } from "@/lib/admin-plans";
import { DURATION_UNITS } from "@/lib/plans";
import type { DurationUnit } from "@/lib/plans";
import { HttpError } from "@/server/http";
import { readAmount, readRequiredText } from "@/server/request";

// Reads and checks the body of "create a plan" and "save a plan".
export function readPlanFields(body: Record<string, unknown>): PlanFields {
  if (typeof body.isActive !== "boolean") {
    throw new HttpError(400, "isActive must be true or false");
  }

  return {
    name: readRequiredText(body.name, "name", PLAN_LIMITS.maxNameLength),
    durationCount: readDurationCount(body.durationCount),
    durationUnit: readDurationUnit(body.durationUnit),
    price: readAmount(body.price, "price"),
    isActive: body.isActive,
  };
}

function readDurationCount(value: unknown): number {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new HttpError(400, "durationCount must be a whole number");
  }
  if (value < 1 || value > PLAN_LIMITS.maxDurationCount) {
    throw new HttpError(400, "durationCount is out of range");
  }
  return value;
}

function readDurationUnit(value: unknown): DurationUnit {
  for (const unit of DURATION_UNITS) {
    if (unit === value) {
      return unit;
    }
  }
  throw new HttpError(400, "Unknown durationUnit");
}
