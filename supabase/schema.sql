-- Dynasty Trade Calculator — Supabase Schema
-- This schema reflects the actual table structure used by the application.

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  sleeper_id text unique,
  name text not null,
  team text,
  position text check (position in ('QB', 'RB', 'WR', 'TE', 'DST', 'K')),
  age integer check (age > 0 or age is null),
  starter_status text,
  injury_status text,
  status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists players_name_trgm_idx on public.players using gin (name gin_trgm_ops);
create index if not exists players_team_idx on public.players (team);
create index if not exists players_position_idx on public.players (position);
create index if not exists players_sleeper_id_idx on public.players (sleeper_id);

-- Current dynasty values (one row per player, upserted on each update)
create table if not exists public.player_values (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players (id) on delete cascade,
  value integer not null default 0,
  tier integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (player_id)
);

create index if not exists player_values_player_id_idx on public.player_values (player_id);
create index if not exists player_values_value_idx on public.player_values (value desc);

-- Monthly value history for trend charts
create table if not exists public.player_value_history (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players (id) on delete cascade,
  value integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists player_value_history_player_id_idx
  on public.player_value_history (player_id);

-- Stored trades for analytics
create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  team_a_players uuid[] not null,
  team_b_players uuid[] not null,
  league_settings jsonb not null,
  trade_result jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists trades_created_at_idx on public.trades (created_at desc);
