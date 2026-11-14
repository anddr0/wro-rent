// What the admin bikes API sends to the mini app.

// A bike in the admin's list.
export type AdminBike = {
  id: string;
  name: string;
  // False — hidden from customers.
  isAvailable: boolean;
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
  // In order; the first one is the cover.
  photos: BikePhotoItem[];
  // A bike that was ever booked can't be deleted, only archived (А-4).
  hasBookings: boolean;
};

// GET, PATCH /api/admin/bikes/[id]; POST /api/admin/bikes; the photo routes
export type AdminBikeResponse = { bike: AdminBikeDetails };

// The body of POST /api/admin/bikes and PATCH /api/admin/bikes/[id].
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
