# Habit Tracker — Инструкция по запуску

## 1. Supabase

1. Открой [supabase.com](https://supabase.com) → твой проект → **SQL Editor**
2. Выполни `supabase/schema.sql` — создаст все таблицы и шаблоны
3. Выполни `supabase/functions.sql` — создаст RPC функцию для XP

## 2. Заполни .env.local

```
NEXT_PUBLIC_SUPABASE_URL=       # Project Settings → API → Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # Project Settings → API → anon/public key
SUPABASE_SERVICE_ROLE_KEY=      # Project Settings → API → service_role key

TELEGRAM_BOT_TOKEN=             # Токен от @BotFather
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=  # username бота (без @)

OPENROUTER_API_KEY=             # openrouter.ai → Keys

NEXT_PUBLIC_APP_URL=            # После деплоя: https://your-app.vercel.app
```

## 3. Деплой на Vercel

```bash
npm install -g vercel
vercel --prod
```

Или через GitHub: push в репо → подключи в vercel.com → добавь все env vars.

## 4. Настрой Telegram бота

После деплоя открой в браузере:
```
https://your-app.vercel.app/api/bot
```
Это установит webhook. Проверь в [@BotFather](https://t.me/botfather):
- `/setmenubutton` → выбери бота → введи URL приложения

## 5. Команды бота

- `/start` — приветствие + кнопка открыть приложение
- `/stats` — быстрая статистика в чате
- `/habits` — ссылка на приложение
