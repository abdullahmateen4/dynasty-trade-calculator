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
  "https://api.fantasycalc.com/values/current?isDynasty=true&numQbs=1&numTeams=12&ppr=1",
  "https://api.fantasycalc.com/values/current",
  "https://api.fantasycalc.com/values"
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

      const players = playersArray.map((p: any) => {
        const playerObj = p.player ?? p;
        return {
          id: String(playerObj.id ?? playerObj.player_id ?? p.id ?? ""),
          name: playerObj.name ?? p.name,
          position: (playerObj.position ?? p.position ?? "").toString(),
          market_value: Number(p.value ?? playerObj.value ?? 0),
          trade_frequency: Number(p.maybeTradeFrequency ?? p.trade_frequency ?? p.trades ?? 0),
        };
      });

      console.log(`✅ SUCCESS: fetched ${players.length} players`);
      return players;
    } catch (err) {
      console.warn("❌ Failed attempt, trying next...", err);
    }
  }

  console.error("❌ All FantasyCalc sources failed");
  return [];
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[.'’\-]/g, "")
    .replace(/\s+(jr|sr|ii|iii|iv|v)$/i, "")
    .replace(/\s+/g, "");
}

/**
 * Mapping with normalized exact matching and duplicate ID protection
 */
export async function mapFantasyCalcPlayersToSupabase(
  fcPlayers: FantasyCalcPlayer[]
): Promise<FantasyCalcWithPlayerId[]> {
  const supabase = getSupabaseServiceClient();

  if (!supabase || fcPlayers.length === 0) {
    return fcPlayers.map((p) => ({ ...p, player_id: null }));
  }

  let players: any[] = [];
  let page = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await supabase
      .from("players")
      .select("id, name, position")
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.warn("[fantasyCalc] failed to load players", error);
      return fcPlayers.map((p) => ({ ...p, player_id: null }));
    }
    if (!data || data.length === 0) break;
    players = players.concat(data);
    page++;
  }

  const normalizedDBPlayers = players.map(pl => ({
    id: pl.id,
    name: pl.name,
    position: (pl.position ?? "").toString().toUpperCase(),
    normName: normalizeName(pl.name)
  }));

  const mapped: FantasyCalcWithPlayerId[] = [];
  const assignedPlayerIds = new Set<string>();

  for (const p of fcPlayers) {
    const nameLower = p.name.toLowerCase();
    const posUpper = p.position.toUpperCase();
    const normFCName = normalizeName(p.name);

    // 1. Direct match (exact name & position)
    let matched = normalizedDBPlayers.find(
      (pl) =>
        pl.name.toLowerCase() === nameLower &&
        (!posUpper || pl.position === posUpper)
    );

    // 2. Normalized match (exact after stripping punctuation/spaces & position)
    if (!matched) {
      matched = normalizedDBPlayers.find(
        (pl) =>
          pl.normName === normFCName &&
          (!posUpper || pl.position === posUpper)
      );
    }

    let playerId: string | null = null;
    if (matched && !assignedPlayerIds.has(matched.id)) {
      playerId = matched.id;
      assignedPlayerIds.add(matched.id);
    }

    mapped.push({ ...p, player_id: playerId });
  }

  return mapped;
}