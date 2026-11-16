import "server-only";
import { BIKE_LIMITS } from "@/lib/admin-bikes";
import { newPhotoField } from "@/lib/admin-bikes";
import type {
  BikeFields,
  BikeSaveRequest,
  SavedPhoto,
} from "@/lib/admin-bikes";
import type { NewUnavailablePeriod } from "@/lib/unavailable";
import { HttpError } from "@/server/http";
import { isUuid, readOptionalText, readRequiredText } from "@/server/request";

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

const MAX_NEW_PERIODS = 50;

// Reads the form of PATCH /api/admin/bikes/[id]: the JSON in "data" and the
// files of new photos. Checks the shape; saveBike checks it against the bike.
export async function readBikeSaveForm(
  req: Request,
): Promise<{ request: BikeSaveRequest; newFiles: File[] }> {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    throw new HttpError(400, "Body must be a form");
  }

  const dataText = form.get("data");
  if (typeof dataText !== "string") {
    throw new HttpError(400, "The form must have JSON in `data`");
  }
  let data: unknown;
  try {
    data = JSON.parse(dataText);
  } catch {
    throw new HttpError(400, "`data` must be JSON");
  }
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    throw new HttpError(400, "`data` must be a JSON object");
  }
  const body = data as Record<string, unknown>;

  if (typeof body.isPaused !== "boolean") {
    throw new HttpError(400, "isPaused must be true or false");
  }

  const photos = readSavedPhotos(body.photos);
  const newFiles: File[] = [];
  for (const photo of photos) {
    if (photo.kind === "new") {
      const file = form.get(newPhotoField(photo.file));
      if (!(file instanceof File)) {
        throw new HttpError(400, "A new photo has no file", "bad_photo");
      }
      newFiles[photo.file] = file;
    }
  }

  return {
    request: {
      ...readBikeFields(body),
      isPaused: body.isPaused,
      photos,
      deletedPeriodIds: readIds(body.deletedPeriodIds, "deletedPeriodIds"),
      newPeriods: readNewPeriods(body.newPeriods),
    },
    newFiles,
  };
}

function readSavedPhotos(value: unknown): SavedPhoto[] {
  if (!Array.isArray(value)) {
    throw new HttpError(400, "photos must be a list");
  }
  const photos: SavedPhoto[] = [];
  for (const item of value) {
    if (item?.kind === "existing" && isUuid(item.id)) {
      photos.push({ kind: "existing", id: item.id });
    } else if (
      item?.kind === "new" &&
      Number.isInteger(item.file) &&
      item.file >= 0 &&
      item.file < BIKE_LIMITS.maxPhotos
    ) {
      photos.push({ kind: "new", file: item.file });
    } else {
      throw new HttpError(400, "photos has an item of an unknown shape");
    }
  }
  return photos;
}

function readIds(value: unknown, fieldName: string): string[] {
  if (!Array.isArray(value) || !value.every(isUuid)) {
    throw new HttpError(400, `${fieldName} must be a list of ids`);
  }
  return value;
}

function readNewPeriods(value: unknown): NewUnavailablePeriod[] {
  if (!Array.isArray(value) || value.length > MAX_NEW_PERIODS) {
    throw new HttpError(400, "newPeriods must be a short list");
  }
  const periods: NewUnavailablePeriod[] = [];
  for (const item of value) {
    const startsAt = readDate(item?.startsAt);
    const endsAt = readDate(item?.endsAt);
    periods.push({ startsAt, endsAt });
  }
  return periods;
}

// An ISO date as it came, after checking it is one.
function readDate(value: unknown): string {
  if (typeof value !== "string" || Number.isNaN(new Date(value).getTime())) {
    throw new HttpError(400, "A period has a date that isn't one");
  }
  return new Date(value).toISOString();
}
