import { getSupabaseServiceClient } from "../supabaseClient";

export interface NormalizedSleeperPlayer {
  sleeper_id: string;
  name: string;
  team: string | null;
  position: string | null;
  age: number | null;
  injury_status: string | null;
  status: string | null;
}

const SLEEPER_PLAYERS_URL = "https://api.sleeper.app/v1/players/nfl";

/**
 * Fetches all NFL players from the free Sleeper API.
 * https://api.sleeper.app/v1/players/nfl
 */
export async function fetchSleeperPlayers(): Promise<NormalizedSleeperPlayer[]> {
  const res = await fetch(SLEEPER_PLAYERS_URL);

  if (!res.ok) {
    console.warn("[playerMetadata] Sleeper fetch failed", await res.text());
    return [];
  }

  const data: Record<string, any> = await res.json();

  return Object.values(data).map((p: any) => ({
    sleeper_id: String(p.player_id),
    name: (p.full_name ?? p.last_name ?? "").toString(),
    team: (p.team ?? null) as string | null,
    position: (p.position ?? null) as string | null,
    age:
      typeof p.age === "number"
        ? p.age
        : p.age
        ? Number(p.age)
        : null,
    injury_status: (p.injury_status ?? null) as string | null,
    status: (p.status ?? null) as string | null
  }));
}

/**
 * Upserts normalized Sleeper players into the Supabase `players` table.
 */
export async function storeSleeperPlayersInSupabase(
  players: NormalizedSleeperPlayer[]
): Promise<void> {
  const supabase = getSupabaseServiceClient();
  if (!supabase) return;
  if (players.length === 0) return;

  const rows = players.map((p) => ({
    sleeper_id: p.sleeper_id,
    name: p.name,
    team: p.team,
    position: p.position,
    age: p.age,
    injury_status: p.injury_status,
    status: p.status
  }));

  const { error } = await supabase.from("players").upsert(rows, {
    onConflict: "sleeper_id"
  });

  if (error) {
    console.error("[playerMetadata] upsert error", error);
  }
}

/**
 * Fetches players from Sleeper and stores them in Supabase.
 */
export async function updatePlayerMetadata(): Promise<void> {
  const players = await fetchSleeperPlayers();
  await storeSleeperPlayersInSupabase(players);
}
