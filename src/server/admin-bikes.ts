import "server-only";
import type {
  AdminBike,
  AdminBikeDetails,
  BikeFields,
} from "@/lib/admin-bikes";
import { BIKE_PHOTOS_BUCKET, bikePhotoUrl } from "@/lib/bike-photos";
import { HttpError } from "@/server/http";
import type { Supabase } from "@/server/supabase";

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

// Saves the name, the description and the visibility (А-3).
export async function updateBike(
  supabase: Supabase,
  bikeId: string,
  fields: BikeFields,
): Promise<AdminBikeDetails> {
  const { data, error } = await supabase
    .from("bikes")
    .update({
      name: fields.name,
      description: descriptionOrNull(fields.description),
      is_available: fields.isAvailable,
    })
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

function descriptionOrNull(description: string): string | null {
  if (description === "") {
    return null;
  }
  return description;
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

// Switches "temporarily unavailable" on or off. Bookings that already exist
// are not touched; new requests are refused while it is on.
export async function setBikePaused(
  supabase: Supabase,
  bikeId: string,
  isPaused: boolean,
): Promise<AdminBikeDetails> {
  const { data, error } = await supabase
    .from("bikes")
    .update({ is_paused: isPaused })
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
