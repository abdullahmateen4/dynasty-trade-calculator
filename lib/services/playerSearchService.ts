import { getSupabaseClient } from "../supabaseClient";
import type { Player } from "../player";

export async function searchPlayers(searchTerm: string): Promise<Player[]> {
  if (!searchTerm || searchTerm.trim().length < 2) return [];

  const term = searchTerm.trim();
  const termLower = term.toLowerCase();

  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("players")
    .select(`
      id,
      sleeper_id,
      name,
      team,
      position,
      age,
      starter_status,
      injury_status
    `)
    .ilike("name", `%${term}%`)
    .not("team", "is", null)
    .neq("team", "")
    .neq("team", "FA")
    .limit(100);

  if (error) {
    console.error("❌ Search error:", error);
    return [];
  }

  const rows = data ?? [];

  const cleaned = rows
    .filter((row: any) => {
      const team = String(row.team ?? "").trim().toUpperCase();
      if (!team) return false;
      if (team === "FA") return false;
      if (team === "FREE AGENT") return false;
      return true;
    })
    .sort((a: any, b: any) => {
      const aName = String(a.name ?? "").toLowerCase();
      const bName = String(b.name ?? "").toLowerCase();

      const aRank =
        aName === termLower ? 0 :
          aName.startsWith(termLower) ? 1 :
            aName.includes(termLower) ? 2 :
              3;

      const bRank =
        bName === termLower ? 0 :
          bName.startsWith(termLower) ? 1 :
            bName.includes(termLower) ? 2 :
              3;

      if (aRank !== bRank) return aRank - bRank;

      return aName.localeCompare(bName);
    });

  console.log("SEARCH:", term);
  console.log("RESULTS:", cleaned.map((p: any) => p.name));

  return cleaned.map((row: any): Player => ({
    id: String(row.id),
    sleeper_id: row.sleeper_id || String(row.id),
    name: row.name,
    team: row.team ?? "",
    position: row.position ?? "",
    age: row.age ?? null,
    baseValue: 0,
    starterStatus: row.starter_status ?? false,
    injuryStatus: row.injury_status ?? null
  }));
}