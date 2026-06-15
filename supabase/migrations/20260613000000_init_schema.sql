-- ============================================================
-- ZipRace – Database Schema Migration
-- Run this in the Supabase SQL Editor for your project.
-- ============================================================

-- ── Enums ──────────────────────────────────────────────────
create type if not exists public.room_status as enum (
  'lobby', 'countdown', 'in_round', 'results', 'closed'
);
create type if not exists public.room_mode as enum (
  'ranked', 'casual', 'private', 'practice'
);
create type if not exists public.friend_status as enum (
  'pending', 'accepted', 'blocked'
);

-- ── Profiles ─────────────────────────────────────────────────
create table if not exists public.profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  username       text unique not null check (char_length(username) between 3 and 24),
  display_name   text,
  avatar_url     text,
  country        text,
  xp             integer not null default 0,
  level          integer not null default 1,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles are readable by all"
  on public.profiles for select using (true);
create policy "users update own profile"
  on public.profiles for update using (auth.uid() = id);

-- ── Puzzles ──────────────────────────────────────────────────
create table if not exists public.puzzles (
  id             uuid primary key default gen_random_uuid(),
  grid_size      smallint not null check (grid_size between 4 and 10),
  checkpoints    jsonb not null,
  walls          jsonb not null default '[]'::jsonb,
  difficulty     smallint not null check (difficulty between 1 and 5),
  is_daily       boolean not null default false,
  daily_date     date,
  solution       jsonb,  -- server-only: never select this in public queries
  created_at     timestamptz not null default now()
);
create unique index if not exists puzzles_daily_date_idx
  on public.puzzles(daily_date) where is_daily;
alter table public.puzzles enable row level security;
create policy "puzzles readable" on public.puzzles for select using (true);

-- Public view WITHOUT the solution column
create or replace view public.puzzles_public as
  select id, grid_size, checkpoints, walls, difficulty, is_daily, daily_date, created_at
  from public.puzzles;

-- ── Rooms ────────────────────────────────────────────────────
create table if not exists public.rooms (
  id               uuid primary key default gen_random_uuid(),
  code             text unique not null,
  host_id          uuid not null references public.profiles(id),
  mode             public.room_mode not null,
  status           public.room_status not null default 'lobby',
  puzzle_id        uuid references public.puzzles(id),
  max_players      smallint not null default 8 check (max_players between 2 and 8),
  difficulty       smallint not null default 2,
  round_started_at timestamptz,
  created_at       timestamptz not null default now()
);
alter table public.rooms enable row level security;
create policy "rooms readable by all" on public.rooms for select using (true);
create policy "host manages room" on public.rooms for all
  using (auth.uid() = host_id) with check (auth.uid() = host_id);

-- ── Room Players ──────────────────────────────────────────────
create table if not exists public.room_players (
  room_id     uuid references public.rooms(id) on delete cascade,
  user_id     uuid references public.profiles(id) on delete cascade,
  joined_at   timestamptz not null default now(),
  progress    smallint not null default 0,
  finished_at timestamptz,
  solve_ms    integer,
  placement   smallint,
  primary key (room_id, user_id)
);
alter table public.room_players enable row level security;
create policy "room players readable" on public.room_players for select using (true);
create policy "user manages own row" on public.room_players for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Matches ───────────────────────────────────────────────────
create table if not exists public.matches (
  id          uuid primary key default gen_random_uuid(),
  room_id     uuid references public.rooms(id),
  puzzle_id   uuid references public.puzzles(id),
  mode        public.room_mode not null,
  finished_at timestamptz not null default now()
);
alter table public.matches enable row level security;
create policy "matches readable" on public.matches for select using (true);

create table if not exists public.match_results (
  match_id      uuid references public.matches(id) on delete cascade,
  user_id       uuid references public.profiles(id),
  placement     smallint not null,
  solve_ms      integer,
  rating_before integer,
  rating_after  integer,
  primary key (match_id, user_id)
);
alter table public.match_results enable row level security;
create policy "results readable" on public.match_results for select using (true);

-- ── Ratings ───────────────────────────────────────────────────
create table if not exists public.ratings (
  user_id      uuid references public.profiles(id) on delete cascade,
  mode         public.room_mode not null,
  rating       integer not null default 1000,
  games_played integer not null default 0,
  updated_at   timestamptz not null default now(),
  primary key (user_id, mode)
);
alter table public.ratings enable row level security;
create policy "ratings readable" on public.ratings for select using (true);

-- ── Friendships ───────────────────────────────────────────────
create table if not exists public.friendships (
  requester_id uuid references public.profiles(id) on delete cascade,
  addressee_id uuid references public.profiles(id) on delete cascade,
  status       public.friend_status not null default 'pending',
  created_at   timestamptz not null default now(),
  primary key (requester_id, addressee_id),
  check (requester_id <> addressee_id)
);
alter table public.friendships enable row level security;
create policy "see own friendships" on public.friendships for select
  using (auth.uid() = requester_id or auth.uid() = addressee_id);
create policy "manage own requests" on public.friendships for all
  using (auth.uid() = requester_id or auth.uid() = addressee_id)
  with check (auth.uid() = requester_id or auth.uid() = addressee_id);

-- ── Daily Results ─────────────────────────────────────────────
create table if not exists public.daily_results (
  user_id     uuid references public.profiles(id) on delete cascade,
  daily_date  date not null,
  solve_ms    integer,
  completed   boolean not null default false,
  primary key (user_id, daily_date)
);
alter table public.daily_results enable row level security;
create policy "own daily readable+writable" on public.daily_results for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Streaks ───────────────────────────────────────────────────
create table if not exists public.streaks (
  user_id        uuid primary key references public.profiles(id) on delete cascade,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_completed date
);
alter table public.streaks enable row level security;
create policy "own streak readable" on public.streaks for select
  using (auth.uid() = user_id);
create policy "own streak writable" on public.streaks for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Achievements ──────────────────────────────────────────────
create table if not exists public.achievements (
  id          text primary key,
  name        text not null,
  description text,
  tier        smallint default 1
);
create table if not exists public.user_achievements (
  user_id        uuid references public.profiles(id) on delete cascade,
  achievement_id text references public.achievements(id),
  earned_at      timestamptz not null default now(),
  primary key (user_id, achievement_id)
);
alter table public.user_achievements enable row level security;
create policy "achievements readable" on public.user_achievements for select using (true);

-- ── Indexes ───────────────────────────────────────────────────
create index if not exists room_players_room_idx on public.room_players(room_id);
create index if not exists match_results_user_idx on public.match_results(user_id);
create index if not exists ratings_mode_rating_idx on public.ratings(mode, rating desc);
create index if not exists daily_results_date_idx on public.daily_results(daily_date);

-- ── Trigger: auto-create profile + ratings on signup ──────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    'player_' || substr(new.id::text, 1, 8),
    coalesce(new.raw_user_meta_data->>'full_name', 'Player')
  )
  on conflict (id) do nothing;

  insert into public.ratings (user_id, mode) values
    (new.id, 'ranked'), (new.id, 'casual')
  on conflict do nothing;

  insert into public.streaks (user_id) values (new.id)
  on conflict do nothing;

  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Trigger: updated_at ───────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ── Seed: Achievements ────────────────────────────────────────
insert into public.achievements (id, name, description, tier) values
  ('first_solve',    'First Solve',       'Complete your first puzzle',              1),
  ('first_win',      'First Win',         'Win your first multiplayer match',         1),
  ('streak_3',       'On a Roll',         'Complete the daily puzzle 3 days in a row',1),
  ('streak_7',       'Week Warrior',      'Complete the daily puzzle 7 days in a row',2),
  ('streak_30',      'Month Master',      'Complete the daily puzzle 30 days in a row',3),
  ('wins_10',        'Veteran',           'Win 10 ranked matches',                   2),
  ('wins_100',       'Champion',          'Win 100 ranked matches',                  3),
  ('sub30_solve',    'Speed Demon',       'Solve a puzzle in under 30 seconds',      2),
  ('perfect_daily',  'Daily Perfectionist','Complete 7 dailies without a miss',       2)
on conflict do nothing;
