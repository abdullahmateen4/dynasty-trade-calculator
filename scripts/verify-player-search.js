import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const targetPlayers = [
  "Patrick Mahomes",
  "Josh Allen",
  "Jalen Hurts",
  "Justin Jefferson",
  "Ja'Marr Chase",
  "Bijan Robinson",
  "Marvin Harrison Jr.",
  "Brock Bowers",
  "Travis Kelce"
];

async function main() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log("=== VERIFYING PLAYER SEARCH IN SUPABASE ===");
  
  let allFound = true;
  
  for (const name of targetPlayers) {
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
      .ilike("name", `%${name}%`);
      
    if (error) {
      console.error(`❌ DB error searching for ${name}:`, error);
      allFound = false;
      continue;
    }
    
    // Find the correct rostered player (e.g. Justin Jefferson on MIN rather than CLE LB)
    const exactMatches = data.filter(p => p.name.toLowerCase() === name.toLowerCase());
    const matchesToUse = exactMatches.length > 0 ? exactMatches : data;
    
    if (matchesToUse.length === 0) {
      console.log(`❌ NOT FOUND in DB: "${name}"`);
      allFound = false;
    } else {
      matchesToUse.forEach(p => {
        console.log(`✅ FOUND in DB: "${p.name}" | Team: ${p.team} | Pos: ${p.position} | Age: ${p.age} | Sleeper ID: ${p.sleeper_id}`);
      });
    }
  }
  
  if (allFound) {
    console.log("\n🎉 SUCCESS: All target players are in the database and searchable!");
  } else {
    console.log("\n⚠️ WARNING: Some target players were not found or failed to query.");
  }
}

main().catch(console.error);
