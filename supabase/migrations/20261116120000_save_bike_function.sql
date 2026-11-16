-- The admin edits a bike as a draft and saves everything with one button:
-- fields, the pause, the photos (new ones, deleted ones, the order) and the
-- unavailable periods. This function writes it all in one transaction, so a
-- save is never half done. New photo files are uploaded to Storage before,
-- by the server; the files of deleted photos are removed after, using the
-- paths this function returns.
create function public.save_bike(
  p_bike_id uuid,
  p_name text,
  p_description text,
  p_is_available boolean,
  p_is_paused boolean,
  -- The photos the bike keeps, in their new order:
  -- { "id": "<uuid>" } for a photo it has, { "path": "<file path>" } for a new one.
  p_photos jsonb,
  p_deleted_period_ids uuid[],
  -- [{ "starts_at": "<timestamp>", "ends_at": "<timestamp>" }]
  p_new_periods jsonb
)
returns setof text
language plpgsql
as $$
declare
  v_photo jsonb;
  v_position integer;
begin
  update public.bikes
  set name = p_name,
      description = p_description,
      is_available = p_is_available,
      is_paused = p_is_paused
  where id = p_bike_id;

  if not found then
    raise exception 'bike_not_found';
  end if;

  -- Photos left out of the list are deleted; their paths are returned.
  return query
  delete from public.bike_photos
  where bike_id = p_bike_id
    and id not in (
      select (item ->> 'id')::uuid
      from jsonb_array_elements(p_photos) as item
      where item ? 'id'
    )
  returning path;

  -- The position in the list is the new order; the first photo is the cover.
  for v_photo, v_position in
    select item, position
    from jsonb_array_elements(p_photos) with ordinality as list(item, position)
  loop
    if v_photo ? 'id' then
      update public.bike_photos
      set sort_order = v_position
      where id = (v_photo ->> 'id')::uuid
        and bike_id = p_bike_id;
    else
      insert into public.bike_photos (bike_id, path, sort_order)
      values (p_bike_id, v_photo ->> 'path', v_position);
    end if;
  end loop;

  delete from public.bike_unavailable_periods
  where bike_id = p_bike_id
    and id = any (p_deleted_period_ids);

  insert into public.bike_unavailable_periods (bike_id, starts_at, ends_at)
  select
    p_bike_id,
    (item ->> 'starts_at')::timestamptz,
    (item ->> 'ends_at')::timestamptz
  from jsonb_array_elements(p_new_periods) as item;
end;
$$;

-- Only the server (secret key) may call it, like everything else in the base.
revoke execute on function public.save_bike(uuid, text, text, boolean, boolean, jsonb, uuid[], jsonb)
  from public, anon, authenticated;
grant execute on function public.save_bike(uuid, text, text, boolean, boolean, jsonb, uuid[], jsonb)
  to service_role;
