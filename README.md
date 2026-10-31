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
| dev       | отдельный dev-бот      | постоянный ngrok-домен                      |
| prod      | `@vitya_bike_rent_bot` | домен продакшена                            |

## Запуск локально

Нужен Node.js 22+ (`fnm use`).

```bash
npm install
cp apps/web/.env.example apps/web/.env.local   # заполнить
ngrok http --url <твой-домен>.ngrok-free.dev 3000
npm run dev
npm run webhook:set       # один раз, и после смены APP_URL/секрета
```

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
