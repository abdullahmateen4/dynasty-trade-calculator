/* eslint-disable no-console */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";

// ✅ Load env variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("❌ Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ✅ Age calculation helper
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

async function runImport() {
  try {
    console.log("🚀 Fetching players from Sleeper...");

    const res = await fetch("https://api.sleeper.app/v1/players/nfl");

    if (!res.ok) {
      throw new Error(`Sleeper API failed: ${res.status}`);
    }

    const data = await res.json();

    // ✅ Convert object → array + filter positions
    const playersArray = Object.values(data as Record<string, any>).filter((p) =>
      ["QB", "RB", "WR", "TE"].includes(p.position)
    );

    console.log(`📊 Total filtered players: ${playersArray.length}`);

    // ✅ Transform data
    const players = playersArray.map((p: any) => ({
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

    // ✅ Batch insert to Supabase
    const batchSize = 500;
    let totalInserted = 0;

    for (let i = 0; i < players.length; i += batchSize) {
      const batch = players.slice(i, i + batchSize);

      const { error } = await supabase
        .from("players")
        .upsert(batch, { onConflict: "sleeper_id" });

      if (error) {
        console.error("❌ Batch insert error:", error);
        return;
      }

      totalInserted += batch.length;
      console.log(`✅ Inserted ${totalInserted} players`);
    }

    console.log("🎉 DONE — Players imported successfully");

  } catch (err: any) {
    console.error("❌ Import failed:", err.message);
  }
}

// ✅ Run script
runImport();