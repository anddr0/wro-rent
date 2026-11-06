-- Per-bike prices are dropped: every bike costs the same as the rental plan.
-- The view only existed to merge plan prices with per-bike prices.

drop view public.bike_plan_prices;
drop table public.bike_price_overrides;
