create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  team text not null,
  position text not null check (position in ('QB', 'RB', 'WR', 'TE', 'DST', 'K')),
  age integer not null check (age > 0),
  base_value integer not null check (base_value between 1 and 100),
  starter_status text not null check (starter_status in ('STARTER', 'BACKUP')),
  injury_status text not null check (injury_status in ('HEALTHY', 'MINOR', 'MAJOR')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists players_name_trgm_idx on public.players using gin (name gin_trgm_ops);
create index if not exists players_team_idx on public.players (team);
create index if not exists players_position_idx on public.players (position);

create table if not exists public.player_value_history (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players (id) on delete cascade,
  month date not null,
  value integer not null check (value between 1 and 100),
  created_at timestamptz not null default now(),
  unique (player_id, month)
);

create index if not exists player_value_history_player_id_idx
  on public.player_value_history (player_id);

create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  team_a_players uuid[] not null,
  team_b_players uuid[] not null,
  league_settings jsonb not null,
  trade_result jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists trades_created_at_idx on public.trades (created_at desc);

