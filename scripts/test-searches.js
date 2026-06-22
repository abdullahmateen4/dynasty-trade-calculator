import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const testNames = [
  "Patrick Mahomes",
  "Josh Allen",
  "Justin Jefferson",
  "Ja'Marr Chase",
  "Micah Parsons",
  "T.J. Watt",
  "Justin Tucker"
];

async function main() {
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log("Checking test search players in database...");
  for (const name of testNames) {
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
      .ilike("name", `%${name}%`);
      
    if (error) {
      console.error(`Error searching for ${name}:`, error);
    } else {
      console.log(`\n🔍 Search Name: "${name}" (matches: ${data.length})`);
      data.forEach((p) => {
        console.log(`   - Name: ${p.name} | Team: ${p.team} | Pos: ${p.position} | Age: ${p.age} | Starter: ${p.starter_status} | Value: ${p.player_values?.value ?? 0}`);
      });
    }
  }
}

main().catch(console.error);
