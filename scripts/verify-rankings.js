import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function main() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log("=== SIMULATING RANKINGS PAGE FETCH & MAP ===");
  
  let allRows = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
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
        injury_status,
        player_values(value)
      `)
      .order("id", { ascending: true })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error(`Supabase error on page ${page}:`, error);
      break;
    }

    if (data && data.length > 0) {
      allRows = [...allRows, ...data];
      if (data.length < pageSize) {
        hasMore = false;
      } else {
        page++;
      }
    } else {
      hasMore = false;
    }
  }

  console.log(`Loaded ${allRows.length} total players.`);

  const formatted = allRows.map((p) => {
    const valObj = p.player_values;
    const rawValue = Array.isArray(valObj) ? valObj[0]?.value : valObj?.value;
    const baseValue = Number(rawValue ?? 0);

    return {
      id: p.id,
      name: p.name,
      team: p.team ?? "N/A",
      position: p.position ?? "N/A",
      age: p.age,
      baseValue: baseValue,
      rank: 0
    };
  });

  // Sort by baseValue descending, then by name ascending
  formatted.sort((a, b) => {
    if (b.baseValue !== a.baseValue) {
      return b.baseValue - a.baseValue;
    }
    return a.name.localeCompare(b.name);
  });

  // Dynamically assign global ranks
  const ranked = formatted.map((p, index) => ({
    ...p,
    rank: index + 1
  }));

  // Dynamically extract positions
  const positions = new Set();
  ranked.forEach(p => {
    if (p.position) positions.add(p.position.toUpperCase());
  });
  const positionsList = Array.from(positions).sort();

  console.log("\n--- Dynamic Positions Found ---");
  console.log(positionsList.join(", "));

  console.log("\n--- Top 10 Ranked Players ---");
  ranked.slice(0, 10).forEach(p => {
    console.log(`#${p.rank} | ${p.name} | Team: ${p.team} | Pos: ${p.position} | Value: ${p.baseValue}`);
  });

  const targets = ["Patrick Mahomes", "Jalen Hurts", "Marvin Harrison", "Josh Allen", "Ja'Marr Chase"];
  console.log("\n--- Verifying Target Players ---");
  targets.forEach(name => {
    const found = ranked.find(p => p.name.toLowerCase().includes(name.toLowerCase()));
    if (found) {
      console.log(`✅ FOUND: #${found.rank} | Name: ${found.name} | Team: ${found.team} | Pos: ${found.position} | Value: ${found.baseValue}`);
    } else {
      console.log(`❌ NOT FOUND: "${name}"`);
    }
  });
}

main().catch(console.error);
