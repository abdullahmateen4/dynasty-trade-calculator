import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function searchPlayers(searchTerm: string) {
  if (!searchTerm || searchTerm.length < 2) return [];

  const term = searchTerm.trim();

  try {
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .ilike("name", `%${term}%`)
      .limit(20);

    if (error) {
      console.error("❌ Search error:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("❌ Unexpected error:", err);
    return [];
  }
}