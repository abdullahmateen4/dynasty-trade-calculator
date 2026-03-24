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

// ✅ MULTIPLE FALLBACK SOURCES
const URLS = [
  "https://api.fantasycalc.com/values",
  "https://fantasycalc.com/api/v1/players?format=json"
];

export async function fetchFantasyCalcPlayers(): Promise<FantasyCalcPlayer[]> {
  for (const url of URLS) {
    try {
      console.log(`🌐 Trying: ${url}`);

      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "application/json",
        },
      });

      const text = await res.text();

      // ❌ HTML detected → skip
      if (text.startsWith("<!DOCTYPE") || text.startsWith("<html")) {
        console.warn("❌ Blocked (HTML response)");
        continue;
      }

      const data = JSON.parse(text);

      // ✅ Case 1: { players: [] }
      const playersArray = Array.isArray(data)
        ? data
        : data.players ?? [];

      if (!Array.isArray(playersArray) || playersArray.length === 0) {
        console.warn("⚠️ Empty response, trying next...");
        continue;
      }

      const players = playersArray.map((p: any) => ({
        id: String(p.id ?? p.player_id ?? ""),
        name: p.name,
        position: (p.position ?? "").toString(),
        market_value: Number(p.value ?? 0),
        trade_frequency: Number(p.trades ?? 0),
      }));

      console.log(`✅ SUCCESS: fetched ${players.length} players`);
      return players;
    } catch (err) {
      console.warn("❌ Failed attempt, trying next...", err);
    }
  }

  console.error("❌ All FantasyCalc sources failed");
  return [];
}

/**
 * Mapping (same as before)
 */
export async function mapFantasyCalcPlayersToSupabase(
  fcPlayers: FantasyCalcPlayer[]
): Promise<FantasyCalcWithPlayerId[]> {
  const supabase = getSupabaseServiceClient();

  if (!supabase || fcPlayers.length === 0) {
    return fcPlayers.map((p) => ({ ...p, player_id: null }));
  }

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
        (!posUpper ||
          (pl.position ?? "").toString().toUpperCase() === posUpper)
    );

    const partial =
      direct ??
      players.find((pl) =>
        (pl.name as string)
          .toLowerCase()
          .includes(nameLower.split(" ")[0] || "")
      );

    return { ...p, player_id: partial?.id ?? null };
  });
}