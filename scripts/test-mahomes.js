import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function main() {
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase
    .from("players")
    .select(`
      *,
      player_values(*)
    `)
    .ilike("name", "%Mahomes%");
    
  console.log("Raw Mahomes:", JSON.stringify(data, null, 2), error);
}

main().catch(console.error);
