import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabaseClient";

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

    // 1️⃣ Fetch from Sleeper API
    const res = await fetch("https://api.sleeper.app/v1/players/nfl");
    const data = await res.json();

    // 2️⃣ Convert object → array
    const playersArray = Object.values(data);

    // 3️⃣ Filter + transform
    const filteredPlayers = playersArray
      .filter((p: any) =>
        ["QB", "RB", "WR", "TE"].includes(p.position)
      )
      .map((p: any) => ({
        sleeper_id: String(p.player_id),
        name: p.full_name,
        team: p.team || null,
        position: p.position,
        age: calculateAge(p.birth_date ? Number(p.birth_date) : null),
        starter_status: p.active === true,
        injury_status: p.injury_status || null,
      }));

    // 4️⃣ Batch insert (important for Vercel)
    const batchSize = 500;
    let totalInserted = 0;

    for (let i = 0; i < filteredPlayers.length; i += batchSize) {
      const batch = filteredPlayers.slice(i, i + batchSize);

      const { error } = await supabase
        .from("players")
        .upsert(batch, { onConflict: "sleeper_id" });

      if (error) {
        console.error("Batch insert error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
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