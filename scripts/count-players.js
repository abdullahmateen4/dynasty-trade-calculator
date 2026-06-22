import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function main() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const { count, error } = await supabase
    .from("players")
    .select("*", { count: "exact", head: true });
    
  if (error) {
    console.error("Error getting count:", error);
    return;
  }
  
  console.log("Total players in Supabase (exact count):", count);
}

main().catch(console.error);
