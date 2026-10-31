# Vityas Bike Rent

Telegram-бот и Telegram Mini App для проката велосипедов.

## Структура

```
apps/
  web/       Next.js 16: мини-апп + вебхук бота (/api/telegram/webhook)
packages/
  bot/       Логика Telegram-бота (grammY), без привязки к транспорту
  db/        Общие типы базы данных Supabase
supabase/    Конфиг, миграции и seed
```

Бот работает через вебхук и в деве, и в проде: Telegram присылает обновления
POST-запросом на `APP_URL/api/telegram/webhook`. Один деплой — и мини-апп, и бот.

## Окружения

У одного бота может быть только один вебхук, поэтому ботов два:

| Окружение | Бот                    | `APP_URL`                                   |
| --------- | ---------------------- | ------------------------------------------- |
| dev       | `@vitya_bike_rent_bot` | постоянный ngrok-домен                      |
| prod      | отдельный прод-бот     | домен продакшена                            |

## Запуск локально

Нужны Node.js 22+ (`fnm use`) и запущенный Docker.

```bash
npm install
npm run db:start                                # локальный Supabase в Docker
cp apps/web/.env.example apps/web/.env.local    # заполнить, см. ниже
ngrok http --url <твой-домен>.ngrok-free.dev 3000
npm run dev
npm run webhook:set                             # один раз и после смены APP_URL/секрета
```

Ключи локального Supabase: `npx supabase status -o env`.

| Переменная                             | Откуда                     | Где можно использовать        |
| -------------------------------------- | -------------------------- | ----------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | `API_URL`                  | везде                         |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `PUBLISHABLE_KEY`          | браузер; доступ ограничен RLS |
| `SUPABASE_SECRET_KEY`                  | `SECRET_KEY`               | только сервер; полный доступ  |

В облаке ключи создаются в Dashboard → Project Settings → API Keys.

## Локальная база

Локальный Supabase поднимает Supabase CLI: он сам запускает Docker-контейнеры
(`supabase_*_vityas_bike_rent`) по настройкам из `supabase/config.toml`.
Свой docker-compose не нужен.

| Сервис          | Адрес                    | Зачем                                  |
| --------------- | ------------------------ | -------------------------------------- |
| API             | http://127.0.0.1:54321   | сюда ходит supabase-js                 |
| Postgres        | 127.0.0.1:54322          | прямой доступ (psql, DBeaver)          |
| Studio          | http://127.0.0.1:54323   | веб-интерфейс: таблицы, SQL-редактор   |

Отключены как ненужные: realtime, edge functions, analytics, почтовый сервер.

- `npm run db:stop` останавливает контейнеры, данные сохраняются.
- `npm run db:reset` пересоздаёт базу с нуля из миграций и `seed.sql`.

## Скрипты

| Команда                  | Что делает                                       |
| ------------------------ | ------------------------------------------------ |
| `npm run dev`            | Next.js в режиме разработки                      |
| `npm run build`          | продакшен-сборка                                 |
| `npm run typecheck`      | проверка типов во всех пакетах                   |
| `npm run lint`           | ESLint                                           |
| `npm run webhook:set`    | зарегистрировать вебхук на `APP_URL` из `.env.local` |
| `npm run webhook:info`   | текущий вебхук бота и последняя ошибка           |
| `npm run webhook:delete` | снять вебхук                                     |
| `npm run db:start`       | запуск локального Supabase (Docker)              |
| `npm run db:reset`       | пересоздать локальную БД с миграциями и seed     |
| `npm run db:types`       | сгенерировать типы БД в `packages/db`            |

Переменные из окружения shell важнее `.env.local`, поэтому вебхук для прода
ставится так: `BOT_TOKEN=… APP_URL=https://… TELEGRAM_WEBHOOK_SECRET=… npm run webhook:set`.
