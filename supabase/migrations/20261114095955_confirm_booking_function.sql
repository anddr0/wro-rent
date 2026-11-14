-- Confirming a request (slice 4.3) changes several bookings at once, and it
-- has to happen all or nothing: the request becomes confirmed, and every
-- other pending request for the same bike and overlapping dates is rejected.
-- A function runs in one transaction, so two admins pressing "confirm" on
-- two overlapping requests at the same moment can't both succeed.
--
-- Returns the ids of the requests it rejected: their customers get a message.
create function public.confirm_booking(p_booking_id uuid)
returns setof uuid
language plpgsql
as $$
declare
  v_booking public.bookings;
begin
  -- "for update" makes a second confirm of the same request wait for this one.
  select * into v_booking
  from public.bookings
  where id = p_booking_id
  for update;

  if not found then
    raise exception 'booking_not_found';
  end if;
  if v_booking.status <> 'pending' then
    raise exception 'booking_not_pending';
  end if;

  -- If a confirmed or active booking already overlaps these dates, the
  -- bookings_no_overlap constraint stops this update (error 23P01).
  update public.bookings
  set status = 'confirmed'
  where id = p_booking_id;

  return query
  update public.bookings
  set status = 'rejected'
  where bike_id = v_booking.bike_id
    and status = 'pending'
    and id <> p_booking_id
    and tstzrange(starts_at, ends_at) && tstzrange(v_booking.starts_at, v_booking.ends_at)
  returning id;
end;
$$;

-- Only the server (secret key) may call it, like everything else in the base.
revoke execute on function public.confirm_booking(uuid) from public, anon, authenticated;
grant execute on function public.confirm_booking(uuid) to service_role;
