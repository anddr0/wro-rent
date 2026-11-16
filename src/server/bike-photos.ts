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

// Throws 400 "bad_photo" for a file the bucket wouldn't take.
export function checkPhotoFile(file: File): void {
  if (!EXTENSIONS[file.type]) {
    throw new HttpError(
      400,
      "The photo must be JPEG, PNG or WebP",
      "bad_photo",
    );
  }
  if (file.size === 0 || file.size > BIKE_LIMITS.maxPhotoBytes) {
    throw new HttpError(400, "The photo is empty or too large", "bad_photo");
  }
}

// Puts a photo file into Storage and returns its path in the bucket.
// The row in bike_photos is written separately (see saveBike).
export async function uploadPhotoFile(
  supabase: Supabase,
  bikeId: string,
  file: File,
): Promise<string> {
  // A random name: two uploads of "IMG_0001.jpg" must not overwrite each other.
  const path = `${bikeId}/${crypto.randomUUID()}.${EXTENSIONS[file.type]}`;

  const { error } = await supabase.storage
    .from(BIKE_PHOTOS_BUCKET)
    .upload(path, file, {
      contentType: file.type,
      // A year, in seconds. The name is random and the file never changes,
      // so phones can keep it and not download the photo again.
      cacheControl: "31536000",
    });
  if (error) {
    throw error;
  }
  return path;
}

// Removes photo files. Never throws: a leftover file only takes space, and
// what the admin saved must not look failed because of it.
export async function removePhotoFiles(
  supabase: Supabase,
  paths: string[],
): Promise<void> {
  if (paths.length === 0) {
    return;
  }
  const { error } = await supabase.storage
    .from(BIKE_PHOTOS_BUCKET)
    .remove(paths);
  if (error) {
    console.error("Could not delete bike photo files:", error.message);
  }
}
