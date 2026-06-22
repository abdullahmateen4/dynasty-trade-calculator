import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function main() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const { data, error, count } = await supabase
    .from("players")
    .select("*", { count: "exact" });
    
  if (error) {
    console.error("Error getting count:", error);
    return;
  }
  
  console.log("Total players in Supabase (anon exact count):", count);
  console.log("Returned row count (anon):", data.length);
}

main().catch(console.error);
