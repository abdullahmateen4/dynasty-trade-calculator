import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fetch from "node-fetch";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function main() {
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: dbPlayers } = await supabase
    .from("players")
    .select("*")
    .ilike("name", "%Tretter%");
  
  console.log("DB Players:", dbPlayers);

  if (dbPlayers.length > 0 && dbPlayers[0].sleeper_id) {
    const res = await fetch("https://api.sleeper.app/v1/players/nfl");
    const sleeperData = await res.json();
    const p = sleeperData[dbPlayers[0].sleeper_id];
    console.log("Sleeper Player:", p);
  }
}

main().catch(console.error);
