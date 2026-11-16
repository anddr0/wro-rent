// The bike's page keeps every change as a draft until "Save": these are the
// pieces of that draft and the way it becomes one save request.
import type {
  AdminBikeDetails,
  BikeFields,
  BikeSaveRequest,
  SavedPhoto,
} from "@/lib/admin-bikes";
import { newPhotoField } from "@/lib/admin-bikes";

// A photo the bike has, or one picked on this page and not uploaded yet.
// `url` shows it: the stored file, or the picked file kept in the browser.
export type DraftPhoto =
  | { kind: "existing"; id: string; url: string }
  | { kind: "new"; key: string; file: Blob; url: string };

// An unavailable period the bike has, or one added on this page.
export type DraftPeriod =
  | { kind: "existing"; id: string; startsAt: string; endsAt: string }
  | { kind: "new"; key: string; startsAt: string; endsAt: string };

export type BikeDraft = {
  fields: BikeFields;
  isPaused: boolean;
  photos: DraftPhoto[];
  periods: DraftPeriod[];
};

// The draft as it starts: the bike as it is saved now.
export function draftFromBike(bike: AdminBikeDetails): BikeDraft {
  return {
    fields: {
      name: bike.name,
      description: bike.description ?? "",
      isAvailable: bike.isAvailable,
    },
    isPaused: bike.isPaused,
    photos: bike.photos.map((photo) => ({
      kind: "existing",
      id: photo.id,
      url: photo.url,
    })),
    periods: bike.unavailablePeriods.map((period) => ({
      kind: "existing",
      id: period.id,
      startsAt: period.startsAt,
      endsAt: period.endsAt,
    })),
  };
}

// A stable key of a photo or a period, saved or new, for lists and comparing.
export function draftKey(item: DraftPhoto | DraftPeriod): string {
  if (item.kind === "existing") {
    return item.id;
  }
  return item.key;
}

// Has anything changed since the page was opened?
export function isDraftChanged(draft: BikeDraft, saved: BikeDraft): boolean {
  const fieldsChanged =
    draft.fields.name !== saved.fields.name ||
    draft.fields.description !== saved.fields.description ||
    draft.fields.isAvailable !== saved.fields.isAvailable;

  // The same photos in the same order, the same periods.
  const photosChanged =
    draft.photos.map(draftKey).join() !== saved.photos.map(draftKey).join();
  const periodsChanged =
    draft.periods.map(draftKey).join() !== saved.periods.map(draftKey).join();

  return (
    fieldsChanged ||
    draft.isPaused !== saved.isPaused ||
    photosChanged ||
    periodsChanged
  );
}

// The form PATCH /api/admin/bikes/[id] takes: the draft as JSON in "data",
// and the file of every new photo in its own field.
export function buildSaveForm(draft: BikeDraft, saved: BikeDraft): FormData {
  const form = new FormData();

  const photos: SavedPhoto[] = [];
  let newFileCount = 0;
  for (const photo of draft.photos) {
    if (photo.kind === "existing") {
      photos.push({ kind: "existing", id: photo.id });
    } else {
      form.append(newPhotoField(newFileCount), photo.file, "photo.jpg");
      photos.push({ kind: "new", file: newFileCount });
      newFileCount += 1;
    }
  }

  // Saved periods that are no longer in the draft were removed.
  const keptPeriodIds = new Set(draft.periods.map(draftKey));
  const deletedPeriodIds: string[] = [];
  for (const period of saved.periods) {
    if (period.kind === "existing" && !keptPeriodIds.has(period.id)) {
      deletedPeriodIds.push(period.id);
    }
  }

  const newPeriods = [];
  for (const period of draft.periods) {
    if (period.kind === "new") {
      newPeriods.push({ startsAt: period.startsAt, endsAt: period.endsAt });
    }
  }

  const request: BikeSaveRequest = {
    name: draft.fields.name.trim(),
    description: draft.fields.description.trim(),
    isAvailable: draft.fields.isAvailable,
    isPaused: draft.isPaused,
    photos,
    deletedPeriodIds,
    newPeriods,
  };
  form.append("data", JSON.stringify(request));
  return form;
}
