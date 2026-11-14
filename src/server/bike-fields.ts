import "server-only";
import { BIKE_LIMITS } from "@/lib/admin-bikes";
import type { BikeFields } from "@/lib/admin-bikes";
import { HttpError } from "@/server/http";
import { readOptionalText, readRequiredText } from "@/server/request";

// Reads and checks the body of "create a bike" and "save a bike".
export function readBikeFields(body: Record<string, unknown>): BikeFields {
  if (typeof body.isAvailable !== "boolean") {
    throw new HttpError(400, "isAvailable must be true or false");
  }

  return {
    name: readRequiredText(body.name, "name", BIKE_LIMITS.maxNameLength),
    description:
      readOptionalText(
        body.description,
        "description",
        BIKE_LIMITS.maxDescriptionLength,
      ) ?? "",
    isAvailable: body.isAvailable,
  };
}
