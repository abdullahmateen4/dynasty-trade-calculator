import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function main() {
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase
    .from("player_values")
    .select("*, players(name, position, team)");
    
  if (error) {
    console.error("Error fetching player_values:", error);
    return;
  }
  
  console.log("Total player_values rows:", data.length);
  
  // Group by value non-zero
  const nonZero = data.filter(d => d.value > 0);
  console.log("Total non-zero player_values rows:", nonZero.length);
  
  console.log("Sample non-zero players:");
  nonZero.slice(0, 10).forEach(d => {
    console.log(`- ${d.players?.name} (${d.players?.position} - ${d.players?.team}): Value = ${d.value}`);
  });
}

main().catch(console.error);
