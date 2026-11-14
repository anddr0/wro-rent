import type { AdminBikeResponse } from "@/lib/admin-bikes";
import { getAdminBike } from "@/server/admin-bikes";
import { requireAdmin } from "@/server/auth";
import { addBikePhoto, reorderBikePhotos } from "@/server/bike-photos";
import { HttpError, withErrorHandling } from "@/server/http";
import { isUuid, readJson } from "@/server/request";
import { createSupabaseClient } from "@/server/supabase";

type Context = RouteContext<"/api/admin/bikes/[id]/photos">;

// Uploads a photo (А-3): a form with the file in the "photo" field.
// Answers with the bike and all its photos.
export const POST = withErrorHandling(async (req, ctx: Context) => {
  await requireAdmin(req);
  const { id } = await ctx.params;
  if (!isUuid(id)) {
    throw new HttpError(404, "Bike not found");
  }

  const supabase = createSupabaseClient();
  // Throws 404 for a bike that doesn't exist, before anything is uploaded.
  await getAdminBike(supabase, id);

  const photo = await readPhoto(req);
  await addBikePhoto(supabase, id, photo);

  const response: AdminBikeResponse = {
    bike: await getAdminBike(supabase, id),
  };
  return Response.json(response, { status: 201 });
});

// Sets the order of the photos: { photoIds: [...] }, the first is the cover.
export const PUT = withErrorHandling(async (req, ctx: Context) => {
  await requireAdmin(req);
  const { id } = await ctx.params;
  if (!isUuid(id)) {
    throw new HttpError(404, "Bike not found");
  }

  const body = await readJson(req);
  const photoIds = body.photoIds;
  if (!Array.isArray(photoIds) || !photoIds.every(isUuid)) {
    throw new HttpError(400, "photoIds must be a list of ids");
  }

  const supabase = createSupabaseClient();
  await reorderBikePhotos(supabase, id, photoIds);

  const response: AdminBikeResponse = {
    bike: await getAdminBike(supabase, id),
  };
  return Response.json(response);
});

async function readPhoto(req: Request): Promise<File> {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    throw new HttpError(400, "Body must be a form with a photo");
  }

  const photo = form.get("photo");
  if (!(photo instanceof File)) {
    throw new HttpError(
      400,
      "The form must have a file in `photo`",
      "bad_photo",
    );
  }
  return photo;
}
