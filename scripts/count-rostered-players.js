import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function main() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const { data, error, count } = await supabase
    .from("players")
    .select("*", { count: "exact" })
    .not("team", "is", null)
    .neq("team", "")
    .neq("team", "FA")
    .neq("team", "FREE AGENT");
    
  if (error) {
    console.error("Error getting count:", error);
    return;
  }
  
  console.log("Total rostered players in Supabase:", count);
  console.log("Returned row count (rostered):", data.length);
}

main().catch(console.error);
