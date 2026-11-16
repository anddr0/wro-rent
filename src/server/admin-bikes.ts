import "server-only";
import type {
  AdminBike,
  AdminBikeDetails,
  BikeFields,
  BikeSaveRequest,
  SavedPhoto,
} from "@/lib/admin-bikes";
import { BIKE_LIMITS } from "@/lib/admin-bikes";
import { BIKE_PHOTOS_BUCKET, bikePhotoUrl } from "@/lib/bike-photos";
import { MAX_UNAVAILABLE_DAYS } from "@/lib/unavailable";
import type { NewUnavailablePeriod } from "@/lib/unavailable";
import {
  checkPhotoFile,
  removePhotoFiles,
  uploadPhotoFile,
} from "@/server/bike-photos";
import { HttpError } from "@/server/http";
import type { Supabase } from "@/server/supabase";
import { listUnavailablePeriods } from "@/server/unavailable";

// The admin's bikes (А-1): the ones in use, or the archived ones.
export async function listAdminBikes(
  supabase: Supabase,
  isArchived: boolean,
): Promise<AdminBike[]> {
  let query = supabase
    .from("bikes")
    .select("id, name, is_available, is_paused, bike_photos(path)")
    .order("name")
    // Only the first photo of each bike: the cover.
    .order("sort_order", { referencedTable: "bike_photos" })
    .limit(1, { referencedTable: "bike_photos" });

  if (isArchived) {
    query = query.not("archived_at", "is", null);
  } else {
    query = query.is("archived_at", null);
  }

  const { data: bikes, error } = await query;
  if (error) {
    throw error;
  }

  const busyUntilByBike = await findBusyBikes(supabase);

  return bikes.map((bike) => {
    const cover = bike.bike_photos[0];
    return {
      id: bike.id,
      name: bike.name,
      isAvailable: bike.is_available,
      isPaused: bike.is_paused,
      coverUrl: cover ? bikePhotoUrl(cover.path) : null,
      busyUntil: busyUntilByBike.get(bike.id) ?? null,
    };
  });
}

// Bikes that are with customers right now: bike id → when the rental ends.
async function findBusyBikes(supabase: Supabase): Promise<Map<string, string>> {
  const { data, error } = await supabase
    .from("bookings")
    .select("bike_id, ends_at")
    .eq("status", "active");

  if (error) {
    throw error;
  }

  const busyUntilByBike = new Map<string, string>();
  for (const booking of data) {
    busyUntilByBike.set(booking.bike_id, booking.ends_at);
  }
  return busyUntilByBike;
}

// One bike for its edit page. Throws 404 when there is no such bike.
export async function getAdminBike(
  supabase: Supabase,
  bikeId: string,
): Promise<AdminBikeDetails> {
  const { data: bike, error } = await supabase
    .from("bikes")
    .select(
      "id, name, description, is_available, is_paused, archived_at, bike_photos(id, path)",
    )
    .eq("id", bikeId)
    .order("sort_order", { referencedTable: "bike_photos" })
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!bike) {
    throw new HttpError(404, "Bike not found");
  }

  return {
    id: bike.id,
    name: bike.name,
    description: bike.description,
    isAvailable: bike.is_available,
    isArchived: bike.archived_at !== null,
    isPaused: bike.is_paused,
    photos: bike.bike_photos.map((photo) => ({
      id: photo.id,
      url: bikePhotoUrl(photo.path),
    })),
    hasBookings: await hasBookings(supabase, bikeId),
    unavailablePeriods: await listUnavailablePeriods(
      supabase,
      bikeId,
      new Date(),
    ),
  };
}

async function hasBookings(
  supabase: Supabase,
  bikeId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("bookings")
    .select("id")
    .eq("bike_id", bikeId)
    .limit(1);

  if (error) {
    throw error;
  }
  return data.length > 0;
}

// Adds a bike (А-2). Photos are added afterwards, on its edit page.
export async function createBike(
  supabase: Supabase,
  fields: BikeFields,
): Promise<AdminBikeDetails> {
  const { data, error } = await supabase
    .from("bikes")
    .insert({
      name: fields.name,
      description: descriptionOrNull(fields.description),
      is_available: fields.isAvailable,
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }
  return getAdminBike(supabase, data.id);
}

function descriptionOrNull(description: string): string | null {
  if (description === "") {
    return null;
  }
  return description;
}

// Saves everything the admin changed on the bike's page at once (А-3):
// the fields, the pause, the photos and the unavailable periods. New photo
// files are uploaded first; then one database transaction writes the rest
// (the save_bike function), and only after that the files of deleted photos
// are removed. If anything fails, nothing of the save is left behind.
export async function saveBike(
  supabase: Supabase,
  bikeId: string,
  request: BikeSaveRequest,
  newFiles: File[],
  now: Date,
): Promise<AdminBikeDetails> {
  const current = await getAdminBike(supabase, bikeId);
  checkSavedPhotos(request.photos, current, newFiles);
  checkNewPeriods(request.newPeriods, now);

  const uploadedPaths: string[] = [];
  try {
    // The saved list for the database: ids of kept photos, paths of new ones.
    const photosForDatabase: ({ id: string } | { path: string })[] = [];
    for (const photo of request.photos) {
      if (photo.kind === "existing") {
        photosForDatabase.push({ id: photo.id });
      } else {
        const path = await uploadPhotoFile(
          supabase,
          bikeId,
          newFiles[photo.file],
        );
        uploadedPaths.push(path);
        photosForDatabase.push({ path });
      }
    }

    const { data: deletedPaths, error } = await supabase.rpc("save_bike", {
      p_bike_id: bikeId,
      p_name: request.name,
      p_description: request.description,
      p_is_available: request.isAvailable,
      p_is_paused: request.isPaused,
      p_photos: photosForDatabase,
      p_deleted_period_ids: request.deletedPeriodIds,
      p_new_periods: request.newPeriods.map((period) => ({
        starts_at: period.startsAt,
        ends_at: period.endsAt,
      })),
    });
    if (error) {
      if (error.message.includes("bike_not_found")) {
        throw new HttpError(404, "Bike not found");
      }
      throw error;
    }

    await removePhotoFiles(supabase, deletedPaths);
  } catch (error) {
    // Don't leave new files that no row points to.
    await removePhotoFiles(supabase, uploadedPaths);
    throw error;
  }

  return getAdminBike(supabase, bikeId);
}

// The photos the admin saves must be the bike's own ones or files sent
// with the request, each once, and not more than the limit.
function checkSavedPhotos(
  photos: SavedPhoto[],
  current: AdminBikeDetails,
  newFiles: File[],
): void {
  if (photos.length > BIKE_LIMITS.maxPhotos) {
    throw new HttpError(409, "Too many photos", "too_many_photos");
  }

  const currentIds = new Set(current.photos.map((photo) => photo.id));
  const usedIds = new Set<string>();
  const usedFiles = new Set<number>();
  for (const photo of photos) {
    if (photo.kind === "existing") {
      if (!currentIds.has(photo.id) || usedIds.has(photo.id)) {
        throw new HttpError(400, "Unknown photo in the list");
      }
      usedIds.add(photo.id);
    } else {
      const file = newFiles[photo.file];
      if (!file || usedFiles.has(photo.file)) {
        throw new HttpError(400, "A new photo has no file", "bad_photo");
      }
      checkPhotoFile(file);
      usedFiles.add(photo.file);
    }
  }
}

const DAY = 24 * 60 * 60 * 1000;

function checkNewPeriods(periods: NewUnavailablePeriod[], now: Date): void {
  for (const period of periods) {
    const startsAt = new Date(period.startsAt);
    const endsAt = new Date(period.endsAt);
    if (endsAt <= startsAt) {
      throw new HttpError(400, "A period must end after it starts");
    }
    // A period that is already over closes nothing.
    if (endsAt <= now) {
      throw new HttpError(400, "A period is in the past");
    }
    if (endsAt.getTime() - startsAt.getTime() > MAX_UNAVAILABLE_DAYS * DAY) {
      throw new HttpError(400, "A period is too long");
    }
  }
}

// Moves a bike to the archive or brings it back (А-5).
export async function setBikeArchived(
  supabase: Supabase,
  bikeId: string,
  isArchived: boolean,
): Promise<AdminBikeDetails> {
  let archivedAt: string | null = null;
  if (isArchived) {
    archivedAt = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("bikes")
    .update({ archived_at: archivedAt })
    .eq("id", bikeId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!data) {
    throw new HttpError(404, "Bike not found");
  }
  return getAdminBike(supabase, bikeId);
}

// Postgres error "another table still refers to this row": here, a booking.
const FOREIGN_KEY_VIOLATION = "23503";

// Deletes a bike added by mistake (А-4). A bike that was ever booked can only
// be archived: its bookings would lose their bike.
export async function deleteBike(
  supabase: Supabase,
  bikeId: string,
): Promise<void> {
  const bike = await getAdminBike(supabase, bikeId);
  if (bike.hasBookings) {
    throw new HttpError(
      409,
      "A bike with bookings can only be archived",
      "bike_has_bookings",
    );
  }

  // The rows in bike_photos go away with the bike; the files don't.
  const { data: photos, error: photosError } = await supabase
    .from("bike_photos")
    .select("path")
    .eq("bike_id", bikeId);
  if (photosError) {
    throw photosError;
  }

  const { error } = await supabase.from("bikes").delete().eq("id", bikeId);
  if (error) {
    // A booking was created between the check above and the delete.
    if (error.code === FOREIGN_KEY_VIOLATION) {
      throw new HttpError(
        409,
        "A bike with bookings can only be archived",
        "bike_has_bookings",
      );
    }
    throw error;
  }

  if (photos.length > 0) {
    const paths = photos.map((photo) => photo.path);
    const { error: storageError } = await supabase.storage
      .from(BIKE_PHOTOS_BUCKET)
      .remove(paths);
    if (storageError) {
      // The bike is gone; leftover files only take space.
      console.error("Could not delete bike photo files:", storageError.message);
    }
  }
}
