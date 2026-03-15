import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function getBaseValue(position: string) {
  switch (position) {
    case "QB":
      return 7000
    case "RB":
      return 6000
    case "WR":
      return 6500
    case "TE":
      return 5000
    default:
      return 3000
  }
}

export async function GET() {
  try {

    const { data: players, error } = await supabase
      .from("players")
      .select("id, position")

    if (error) throw error

    const values = players.map((p: any) => ({
      player_id: p.id,
      value: getBaseValue(p.position),
      tier: null
    }))

    const { error: insertError } = await supabase
      .from("player_values")
      .upsert(values, { onConflict: "player_id" })

    if (insertError) throw insertError

    return NextResponse.json({
      success: true,
      playersUpdated: values.length
    })

  } catch (err) {

    console.error(err)

    return NextResponse.json({
      success: false
    })
  }
}