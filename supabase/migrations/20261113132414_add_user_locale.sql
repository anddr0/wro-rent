-- App language the user picked by hand in settings (В-1).
-- Null until they pick one: then the app follows language_code from Telegram.
-- en and uk are allowed already, their translations come before launch.

alter table public.users
  add column locale text
  check (locale in ('pl', 'en', 'uk', 'ru'));
