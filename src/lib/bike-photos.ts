// Bike photos are files in the public Supabase Storage bucket `bike-photos`.
// The mini app loads them from its own domain, /bike-photos/..., and Next
// forwards those requests to Storage (rewrites in next.config.ts). So the
// browser never talks to Supabase, and in development photos open on a phone
// too, although Supabase runs on the computer's 127.0.0.1.
export const BIKE_PHOTOS_BUCKET = "bike-photos";

// `path` is the file's path inside the bucket, as stored in bike_photos.path.
export function bikePhotoUrl(path: string): string {
  return `/${BIKE_PHOTOS_BUCKET}/${path}`;
}
