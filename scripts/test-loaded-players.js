import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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
  
  // Fetch exactly the first 1000 (which is the default page limit in Supabase)
  const { data: players, error } = await supabase
    .from("players")
    .select("id, name, team, position")
    .range(0, 5000); // Calculator.tsx uses .range(0, 5000)
    
  if (error) {
    console.error("Error fetching players:", error);
    return;
  }
  
  console.log(`Fetched ${players.length} players from Supabase range(0, 5000).`);
  
  targetPlayers.forEach(name => {
    const found = players.find(p => p.name.toLowerCase() === name.toLowerCase());
    if (found) {
      console.log(`✅ FOUND: "${name}" is loaded! Team: ${found.team}`);
    } else {
      console.log(`❌ NOT FOUND: "${name}" is NOT loaded!`);
    }
  });
}

main().catch(console.error);
