import { getSupabaseServiceClient } from "../supabaseClient";

export interface FantasyCalcPlayer {
  id: string;
  name: string;
  position: string;
  market_value: number;
  trade_frequency: number;
}

export interface FantasyCalcWithPlayerId extends FantasyCalcPlayer {
  player_id: string | null;
}

const FANTASYCALC_PLAYERS_URL = "https://fantasycalc.com/api/v1/players";

/**
 * Fetches dynasty market values from FantasyCalc public API.
 * https://fantasycalc.com/api/v1/players
 */
export async function fetchFantasyCalcPlayers(): Promise<FantasyCalcPlayer[]> {
  const res = await fetch(FANTASYCALC_PLAYERS_URL);

  if (!res.ok) {
    console.warn("[fantasyCalc] fetch failed", await res.text());
    return [];
  }

  const data: any[] = await res.json();

  return data
    .filter((p) => typeof p.name === "string")
    .map((p) => ({
      id: String(p.id),
      name: p.name as string,
      position: (p.position ?? "").toString(),
      market_value: Number(p.value ?? p.market_value ?? 0),
      trade_frequency: Number(p.trades ?? p.trade_frequency ?? 0)
    }));
}

/**
 * Maps FantasyCalc players to Supabase player IDs by name and position.
 */
export async function mapFantasyCalcPlayersToSupabase(
  fcPlayers: FantasyCalcPlayer[]
): Promise<FantasyCalcWithPlayerId[]> {
  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    return fcPlayers.map((p) => ({ ...p, player_id: null }));
  }

  if (fcPlayers.length === 0) return [];

  const { data: players, error } = await supabase
    .from("players")
    .select("id, name, position");

  if (error || !players) {
    console.warn("[fantasyCalc] failed to load players", error);
    return fcPlayers.map((p) => ({ ...p, player_id: null }));
  }

  return fcPlayers.map((p) => {
    const nameLower = p.name.toLowerCase();
    const posUpper = p.position.toUpperCase();

    const direct = players.find(
      (pl) =>
        (pl.name as string).toLowerCase() === nameLower &&
        (!posUpper || (pl.position ?? "").toString().toUpperCase() === posUpper)
    );

    const partial =
      direct ??
      players.find((pl) =>
        (pl.name as string).toLowerCase().includes(nameLower.split(" ")[0] || "")
      );

    return { ...p, player_id: partial?.id ?? null };
  });
}
