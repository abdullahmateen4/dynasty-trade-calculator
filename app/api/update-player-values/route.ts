import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const SLEEPER_URL = "https://api.sleeper.app/v1/players/nfl"

export async function GET() {
  try {

    const res = await fetch(SLEEPER_URL)

    if (!res.ok) {
      throw new Error("Sleeper API failed")
    }

    const sleeperPlayers = await res.json()

    const players = Object.values(sleeperPlayers)
      .filter((p: any) => p.position)
      .slice(0, 2000)
      .map((p: any) => ({
        sleeper_id: p.player_id,
        name: `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim(),
        team: p.team,
        position: p.position,
        injury_status: p.injury_status
      }))

    const { error } = await supabase
      .from("players")
      .upsert(players, {
        onConflict: "sleeper_id"
      })

    if (error) {
      console.error(error)
      throw error
    }

    return NextResponse.json({
      success: true,
      inserted: players.length
    })

  } catch (error) {

    console.error("Update pipeline error:", error)

    return NextResponse.json({
      success: false,
      error: "update failed"
    })
  }
}