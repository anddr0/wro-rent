# Vityas Bike Rent

Telegram-бот и Telegram Mini App для проката велосипедов.

## Структура

Обычное Next.js-приложение (App Router). Бот живёт внутри него как API-роут.

```
src/
  app/         Только роутинг: страницы, layout-ы, API-роуты (вебхук бота тоже здесь)
  bot/         Логика Telegram-бота (grammY): команды и ответы
  server/      Код только для сервера: секреты, Supabase, проверка Telegram
  lib/         Код для браузера и общий: хуки, типы, типы базы
  components/  UI-компоненты (появятся вместе с интерфейсом)
scripts/       Служебные скрипты (регистрация вебхука)
supabase/      Миграции, seed и конфиг локальной базы
docs/          Принятые решения по проекту
```

Бот работает через вебхук и в деве, и в проде: Telegram присылает обновления
POST-запросом на `APP_URL/api/telegram/webhook`. Один деплой — и мини-апп, и бот.

## Окружения

У одного бота может быть только один вебхук, поэтому ботов два:

| Окружение | Бот                    | `APP_URL`              |
| --------- | ---------------------- | ---------------------- |
| dev       | `@vitya_bike_rent_bot` | постоянный ngrok-домен |
| prod      | отдельный прод-бот     | домен продакшена       |

## Запуск локально

Нужны Node.js 22+ (`fnm use`) и запущенный Docker.

```bash
npm install
npm run db:start                                # локальный Supabase в Docker
cp .env.example .env.local                      # заполнить, см. ниже
ngrok http --url <твой-домен>.ngrok-free.dev 3000
npm run dev
npm run webhook:set                             # один раз и после смены APP_URL/секрета
```

Ключи локального Supabase: `npx supabase status -o env`.

| Переменная            | Откуда       |
| --------------------- | ------------ |
| `SUPABASE_URL`        | `API_URL`    |
| `SUPABASE_SECRET_KEY` | `SECRET_KEY` |

Обе переменные только серверные: браузер в Supabase напрямую не ходит.
В облаке секретный ключ создаётся в Dashboard → Project Settings → API Keys.

## Локальная база

Локальный Supabase поднимает Supabase CLI: он сам запускает Docker-контейнеры
(`supabase_*_vityas_bike_rent`) по настройкам из `supabase/config.toml`.
Свой docker-compose не нужен.

| Сервис   | Адрес                  | Зачем                                |
| -------- | ---------------------- | ------------------------------------ |
| API      | http://127.0.0.1:54321 | сюда ходит supabase-js               |
| Postgres | 127.0.0.1:54322        | прямой доступ (psql, DBeaver)        |
| Studio   | http://127.0.0.1:54323 | веб-интерфейс: таблицы, SQL-редактор |

Отключены как ненужные: realtime, edge functions, analytics, почтовый сервер.

- `npm run db:stop` останавливает контейнеры, данные сохраняются.
- `npm run db:migrate` применяет новые миграции, данные сохраняются.
- `npm run db:reset` пересоздаёт базу с нуля из миграций и `seed.sql`.

## Скрипты

| Команда                     | Что делает                                                 |
| --------------------------- | ---------------------------------------------------------- |
| `npm run dev`               | Next.js в режиме разработки                                |
| `npm run build`             | продакшен-сборка                                           |
| `npm run typecheck`         | проверка типов                                             |
| `npm test`                  | тесты (`*.test.ts`, встроенный раннер Node)                |
| `npm run lint`              | ESLint                                                     |
| `npm run format`            | отформатировать код (Prettier)                             |
| `npm run format:check`      | проверить форматирование, ничего не меняя                  |
| `npm run webhook:set`       | вебхук и кнопка меню дев-бота на `APP_URL` из `.env.local` |
| `npm run webhook:info`      | текущий вебхук бота и последняя ошибка                     |
| `npm run webhook:delete`    | снять вебхук                                               |
| `npm run webhook:set:prod`  | то же для прод-бота, из `.env.prod`                        |
| `npm run webhook:info:prod` | вебхук прод-бота и последняя ошибка                        |
| `npm run db:start`          | запуск локального Supabase (Docker)                        |
| `npm run db:migrate`        | применить новые миграции к локальной БД                    |
| `npm run db:reset`          | пересоздать локальную БД с миграциями и seed               |
| `npm run db:types`          | сгенерировать типы БД в `src/lib/database.types.ts`        |

## Прод

| Что      | Где                                                    |
| -------- | ------------------------------------------------------ |
| мини-апп | Vercel, https://wro-rent.vercel.app (функции в Париже) |
| база     | облачный Supabase, тоже Париж                          |
| бот      | `@wro_rent_bot`                                        |

Деплой — автоматически при пуше в `main`. Переменные окружения — в Vercel
(Settings → Environment Variables, только Production), те же, что в `.env.example`.

Миграции на прод — вручную: `npx supabase db push --linked --dry-run`, проверить
список, потом то же без `--dry-run`. Seed на прод не едет.

Вебхук и кнопку меню прод-бота ставит `npm run webhook:set:prod`. Он читает `.env.prod`:
`BOT_TOKEN`, `APP_URL`, `TELEGRAM_WEBHOOK_SECRET` прод-версии, секрет — тот же, что в Vercel.
Не `.env.production.local`: такой файл Next.js сам читает при локальной сборке,
и она пошла бы в прод-базу.
