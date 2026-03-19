import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabaseClient";

// ✅ CRITICAL FIXES FOR VERCEL
export const runtime = "nodejs";        // 🔥 fixes fetch failure
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function calculateAge(birthDate: number | null): number | null {
  if (!birthDate) return null;

  const today = new Date();
  const birth = new Date(birthDate);

  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();

  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

export async function GET() {
  try {
    const supabase = getSupabaseServiceClient();

    // ✅ STABLE FETCH (fixed for Vercel)
    const res = await fetch("https://api.sleeper.app/v1/players/nfl", {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      throw new Error(`Sleeper API failed: ${res.status}`);
    }

    const data = await res.json();

    // ✅ FILTER EARLY (reduces load)
    const playersArray = Object.values(data).filter((p: any) =>
      ["QB", "RB", "WR", "TE"].includes(p.position)
    );

    // ✅ TRANSFORM DATA
    const filteredPlayers = playersArray.map((p: any) => ({
      sleeper_id: String(p.player_id),
      name: p.full_name,
      team: p.team || null,
      position: p.position,
      age: p.birth_date
        ? calculateAge(new Date(p.birth_date).getTime())
        : null,
      starter_status: p.active === true,
      injury_status: p.injury_status || null,
    }));

    // ✅ BATCH INSERT (safe for serverless)
    const batchSize = 500;
    let totalInserted = 0;

    for (let i = 0; i < filteredPlayers.length; i += batchSize) {
      const batch = filteredPlayers.slice(i, i + batchSize);

      const { error } = await supabase
        .from("players")
        .upsert(batch, { onConflict: "sleeper_id" });

      if (error) {
        console.error("Batch insert error:", error);
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      totalInserted += batch.length;
    }

    return NextResponse.json({
      success: true,
      total_players: totalInserted,
    });

  } catch (err: any) {
    console.error("Import error:", err);

    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}