import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function searchPlayers(searchTerm: string) {
  if (!searchTerm || searchTerm.length < 2) return [];

  const term = searchTerm.trim();

  try {
    // 🔥 Call Postgres fuzzy search function
    const { data, error } = await supabase.rpc("search_players", {
      search_term: term,
    });

    if (error) {
      console.error("❌ Fuzzy search error:", error);
      return [];
    }

    console.log("✅ RAW SEARCH RESULTS:", data);

    // 🔥 Extra frontend ranking (optional but useful)
    const ranked = (data || []).sort((a: any, b: any) => {
      const score = (player: any) => {
        let s = 0;
        const name = player.name?.toLowerCase() || "";
        const t = term.toLowerCase();

        if (name === t) s += 100;
        if (name.startsWith(t)) s += 50;
        if (name.includes(t)) s += 30;
        if (player.team?.toLowerCase().includes(t)) s += 20;
        if (player.position?.toLowerCase().includes(t)) s += 10;

        return s;
      };

      return score(b) - score(a);
    });

    console.log("✅ RANKED RESULTS:", ranked);

    // 🔥 IMPORTANT: Limit results for UI
    const finalResults = ranked.slice(0, 20);

    console.log("✅ FINAL RESULTS (TOP 20):", finalResults);

    return finalResults;

  } catch (err) {
    console.error("❌ Unexpected search error:", err);
    return [];
  }
}