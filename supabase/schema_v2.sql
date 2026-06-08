-- ToDo tasks
create table public.todos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  title text not null,
  description text,
  deadline timestamptz,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.todos(user_id, completed, created_at desc);

-- Mood logs (up to 3 per day: morning / afternoon / evening)
create table public.mood_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  period text not null check (period in ('morning', 'afternoon', 'evening')),
  mood text not null,         -- emoji string
  mood_score smallint check (mood_score between 1 and 5),
  note text,
  logged_at timestamptz not null default now(),
  -- one log per user per period per day
  unique (user_id, period, (logged_at::date))
);
create index on public.mood_logs(user_id, logged_at desc);
