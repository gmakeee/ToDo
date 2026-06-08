-- Users
create table public.users (
  id uuid primary key default gen_random_uuid(),
  telegram_id bigint unique not null,
  username text,
  first_name text,
  level int not null default 1,
  xp int not null default 0,
  timezone text not null default 'UTC',
  created_at timestamptz not null default now()
);

-- Habit templates
create table public.habit_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  emoji text not null default '✨',
  category text not null,
  frequency text not null check (frequency in ('daily', 'weekly', 'monthly')),
  times_per_period int not null default 1,
  description text
);

-- Habits
create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  template_id uuid references public.habit_templates(id) on delete set null,
  name text not null,
  emoji text not null default '✨',
  frequency text not null check (frequency in ('daily', 'weekly', 'monthly')),
  times_per_period int not null default 1,
  remind_at time[],
  is_paused boolean not null default false,
  paused_until date,
  streak int not null default 0,
  longest_streak int not null default 0,
  created_at timestamptz not null default now(),
  archived_at timestamptz
);

-- Completions
create table public.completions (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid references public.habits(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  completed_at timestamptz not null default now(),
  mood smallint check (mood between 1 and 5),
  note text
);

-- Achievements
create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  type text not null,
  habit_id uuid references public.habits(id) on delete set null,
  earned_at timestamptz not null default now()
);

-- Daily motivation cache
create table public.daily_motivation (
  id uuid primary key default gen_random_uuid(),
  date date unique not null default current_date,
  text text not null,
  author text
);

-- Indexes
create index on public.completions(habit_id, completed_at desc);
create index on public.completions(user_id, completed_at desc);
create index on public.habits(user_id) where archived_at is null;

-- Seed templates
insert into public.habit_templates (name, emoji, category, frequency, times_per_period, description) values
  ('Утренняя медитация', '🧘', 'Здоровье', 'daily', 1, 'Начни день с 10 минут тишины'),
  ('Пить воду', '💧', 'Здоровье', 'daily', 8, '8 стаканов в день'),
  ('Прогулка', '🚶', 'Спорт', 'daily', 1, 'Минимум 30 минут на свежем воздухе'),
  ('Читать', '📚', 'Саморазвитие', 'daily', 1, 'Хотя бы 20 страниц в день'),
  ('Спортзал', '💪', 'Спорт', 'weekly', 3, '3 тренировки в неделю'),
  ('Дневник', '📝', 'Саморазвитие', 'daily', 1, 'Записывай мысли перед сном'),
  ('Ранний подъём', '🌅', 'Режим', 'daily', 1, 'Вставай до 7 утра'),
  ('Без соцсетей', '📵', 'Режим', 'daily', 1, 'Первый час после пробуждения без телефона'),
  ('Уборка', '🧹', 'Дом', 'weekly', 2, 'Поддерживай чистоту'),
  ('Звонок близким', '📞', 'Отношения', 'weekly', 2, 'Не забывай о тех, кто важен');
