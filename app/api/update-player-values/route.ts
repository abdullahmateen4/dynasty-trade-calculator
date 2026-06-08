import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SLEEPER_URL = "https://api.sleeper.app/v1/players/nfl";

export async function GET() {
  try {
    // Validate env vars inside handler (not at module level)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { success: false, error: "Missing Supabase environment variables" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("🚀 Fetching Sleeper players...");

    // Timeout protection
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(SLEEPER_URL, {
      signal: controller.signal,
      cache: "no-store",
    });

    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`Sleeper API failed: ${res.status}`);
    }

    const sleeperPlayers = await res.json();

    console.log("📦 Transforming players...");

    const players = Object.values(sleeperPlayers)
      .filter((p: any) => p.position)
      .map((p: any) => {
        let age = null;

        if (p.birth_date) {
          const birthYear = parseInt(p.birth_date.split("-")[0]);
          const currentYear = new Date().getFullYear();
          age = currentYear - birthYear;
        }

        return {
          sleeper_id: p.player_id,
          name: `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim(),
          team: p.team ?? null,
          position: p.position,
          age,
          injury_status: p.injury_status ?? null,
        };
      });

    console.log(`✅ Total players processed: ${players.length}`);

    // Batch upsert (prevents Supabase limits)
    const batchSize = 500;
    for (let i = 0; i < players.length; i += batchSize) {
      const batch = players.slice(i, i + batchSize);

      const { error } = await supabase
        .from("players")
        .upsert(batch, { onConflict: "sleeper_id" });

      if (error) {
        console.error("❌ Batch upsert error:", error);
        throw error;
      }

      console.log(`✅ Batch ${i / batchSize + 1} inserted (${batch.length} rows)`);
    }

    return NextResponse.json({
      success: true,
      total_players: players.length,
    });

  } catch (error: any) {
    console.error("❌ Update pipeline error:", error);

    return NextResponse.json({
      success: false,
      error: error.message || "update failed",
    }, { status: 500 });
  }
}