import "server-only";
import { BIKE_LIMITS } from "@/lib/admin-bikes";
import { BIKE_PHOTOS_BUCKET } from "@/lib/bike-photos";
import { HttpError } from "@/server/http";
import type { Supabase } from "@/server/supabase";

// The image types the bucket takes, and the file extension for each.
const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

async function listPhotos(supabase: Supabase, bikeId: string) {
  const { data, error } = await supabase
    .from("bike_photos")
    .select("id, path, sort_order")
    .eq("bike_id", bikeId)
    .order("sort_order");

  if (error) {
    throw error;
  }
  return data;
}

// Uploads a photo and puts it last (А-3). The bike must exist.
export async function addBikePhoto(
  supabase: Supabase,
  bikeId: string,
  file: File,
): Promise<void> {
  const extension = EXTENSIONS[file.type];
  if (!extension) {
    throw new HttpError(
      400,
      "The photo must be JPEG, PNG or WebP",
      "bad_photo",
    );
  }
  if (file.size === 0 || file.size > BIKE_LIMITS.maxPhotoBytes) {
    throw new HttpError(400, "The photo is empty or too large", "bad_photo");
  }

  const photos = await listPhotos(supabase, bikeId);
  if (photos.length >= BIKE_LIMITS.maxPhotos) {
    throw new HttpError(409, "Too many photos", "too_many_photos");
  }

  let lastSortOrder = 0;
  for (const photo of photos) {
    if (photo.sort_order > lastSortOrder) {
      lastSortOrder = photo.sort_order;
    }
  }

  // A random name: two uploads of "IMG_0001.jpg" must not overwrite each other.
  const path = `${bikeId}/${crypto.randomUUID()}.${extension}`;
  const bucket = supabase.storage.from(BIKE_PHOTOS_BUCKET);

  const { error: uploadError } = await bucket.upload(path, file, {
    contentType: file.type,
  });
  if (uploadError) {
    throw uploadError;
  }

  const { error: insertError } = await supabase
    .from("bike_photos")
    .insert({ bike_id: bikeId, path, sort_order: lastSortOrder + 1 });
  if (insertError) {
    // Don't leave a file that no row points to.
    await bucket.remove([path]);
    throw insertError;
  }
}

export async function deleteBikePhoto(
  supabase: Supabase,
  bikeId: string,
  photoId: string,
): Promise<void> {
  const { data: photo, error } = await supabase
    .from("bike_photos")
    .delete()
    .eq("id", photoId)
    .eq("bike_id", bikeId)
    .select("path")
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!photo) {
    throw new HttpError(404, "Photo not found");
  }

  const { error: storageError } = await supabase.storage
    .from(BIKE_PHOTOS_BUCKET)
    .remove([photo.path]);
  if (storageError) {
    // The photo is gone from the app; a leftover file only takes space.
    console.error("Could not delete a bike photo file:", storageError.message);
  }
}

// Puts the bike's photos in the given order; the first becomes the cover.
// `photoIds` must be all the photos of the bike, each once.
export async function reorderBikePhotos(
  supabase: Supabase,
  bikeId: string,
  photoIds: string[],
): Promise<void> {
  const photos = await listPhotos(supabase, bikeId);

  const knownIds = new Set(photos.map((photo) => photo.id));
  const givenIds = new Set(photoIds);
  const isSameSet =
    photoIds.length === photos.length &&
    givenIds.size === photos.length &&
    photoIds.every((id) => knownIds.has(id));
  if (!isSameSet) {
    throw new HttpError(400, "photoIds must list every photo of the bike once");
  }

  // A bike has at most ten photos, so one update per photo is fine.
  for (let index = 0; index < photoIds.length; index++) {
    const { error } = await supabase
      .from("bike_photos")
      .update({ sort_order: index + 1 })
      .eq("id", photoIds[index])
      .eq("bike_id", bikeId);
    if (error) {
      throw error;
    }
  }
}
