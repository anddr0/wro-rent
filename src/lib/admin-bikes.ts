// What the admin bikes API sends to the mini app.
import type {
  NewUnavailablePeriod,
  UnavailablePeriod,
} from "@/lib/unavailable";

// A bike in the admin's list.
export type AdminBike = {
  id: string;
  name: string;
  // False — hidden from customers.
  isAvailable: boolean;
  // True — in the catalog, but can't be booked until the admin switches it off.
  isPaused: boolean;
  coverUrl: string | null;
  // When the customer who has the bike now brings it back (ISO string).
  // Null when the bike is free.
  busyUntil: string | null;
};

// GET /api/admin/bikes, GET /api/admin/bikes?archived=1
export type AdminBikesResponse = { bikes: AdminBike[] };

export type BikePhotoItem = {
  id: string;
  url: string;
};

// A bike on its edit page.
export type AdminBikeDetails = {
  id: string;
  name: string;
  description: string | null;
  isAvailable: boolean;
  isArchived: boolean;
  isPaused: boolean;
  // In order; the first one is the cover.
  photos: BikePhotoItem[];
  // A bike that was ever booked can't be deleted, only archived (А-4).
  hasBookings: boolean;
  // Times the admin closed the bike for, from now on, the nearest first.
  unavailablePeriods: UnavailablePeriod[];
};

// GET, PATCH /api/admin/bikes/[id]; POST /api/admin/bikes; the photo routes
export type AdminBikeResponse = { bike: AdminBikeDetails };

// The body of POST /api/admin/bikes (a new bike).
export type BikeFields = {
  name: string;
  description: string;
  isAvailable: boolean;
};

export const BIKE_LIMITS = {
  maxNameLength: 80,
  maxDescriptionLength: 1000,
  maxPhotos: 10,
  // The bucket's own limit, see the add_bike_photos migration.
  maxPhotoBytes: 5 * 1024 * 1024,
  // A photo is shrunk in the browser before upload so its longer side
  // is at most this many pixels.
  maxPhotoSide: 1600,
};

// A photo in the order the admin saves: one the bike has, or a new file
// sent with the same request (see newPhotoField).
export type SavedPhoto =
  { kind: "existing"; id: string } | { kind: "new"; file: number };

// PATCH /api/admin/bikes/[id]: everything the admin changed on the bike's
// page, saved with one button. Sent as a form: this object as JSON in the
// field "data", and the files of new photos in their own fields.
export type BikeSaveRequest = BikeFields & {
  isPaused: boolean;
  // All the photos the bike keeps, in order; the rest are deleted.
  photos: SavedPhoto[];
  deletedPeriodIds: string[];
  newPeriods: NewUnavailablePeriod[];
};

// The form field with the file of new photo number `index`.
export function newPhotoField(index: number): string {
  return `photo-${index}`;
}
