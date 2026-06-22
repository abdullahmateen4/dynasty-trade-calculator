import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const targetSearches = [
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

function cleanStringForSearch(str) {
  return str
    .toLowerCase()
    .replace(/[.'’\-]/g, "")
    .replace(/\s+(jr|sr|ii|iii|iv|v)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function main() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // 1. Fetch exact total count in Supabase
  const { count: dbCount, error: countError } = await supabase
    .from("players")
    .select("*", { count: "exact", head: true });
    
  if (countError) {
    console.error("Error fetching exact count:", countError);
    return;
  }
  
  // 2. Fetch all players in pages of 1000 (just like Calculator.tsx)
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
        injury_status
      `)
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
  
  console.log(`[SIM] Total players in Supabase (exact count): ${dbCount}`);
  console.log(`[SIM] Total players loaded from database: ${allRows.length}`);
  
  // 3. Filter to keep rostered players (Calculator.tsx logic)
  const rostered = allRows.filter((row) => {
    if (!row.team) return false;
    const team = row.team.trim().toUpperCase();
    if (team === "" || team === "FA" || team === "FREE AGENT") {
      return false;
    }
    return true;
  });
  
  console.log(`[SIM] Rostered players after team filtering: ${rostered.length}`);

  // 4. Deduplicate (Calculator.tsx logic)
  const seenIds = new Set();
  const seenNames = new Set();
  const uniqueRostered = [];

  for (const row of rostered) {
    const sleeperId = row.sleeper_id;
    if (sleeperId) {
      if (seenIds.has(sleeperId)) continue;
      seenIds.add(sleeperId);
    }

    const nameTeamKey = `${row.name.toLowerCase().trim()}|${row.team?.toLowerCase().trim()}`;
    if (row.team) {
      if (seenNames.has(nameTeamKey)) continue;
      seenNames.add(nameTeamKey);
    }

    uniqueRostered.push(row);
  }
  
  console.log(`[SIM] Unique rostered players loaded into calculator state: ${uniqueRostered.length}`);
  
  // 5. Test search filters
  console.log("\n=== TESTING SIMULATED CLIENT SEARCHES ===");
  
  let allMatched = true;
  for (const search of targetSearches) {
    const qClean = cleanStringForSearch(search);
    
    const matches = uniqueRostered.filter(p => {
      const nameClean = cleanStringForSearch(p.name);
      const teamClean = p.team.toLowerCase();
      const posClean = p.position.toLowerCase();

      return nameClean.includes(qClean) || 
             teamClean.includes(qClean) || 
             posClean.includes(qClean) || 
             `${nameClean} ${teamClean} ${posClean}`.includes(qClean);
    });
    
    if (matches.length === 0) {
      console.log(`❌ SEARCH FAILS: "${search}" (0 matches)`);
      allMatched = false;
    } else {
      console.log(`✅ SEARCH SUCCEEDS: "${search}"`);
      matches.forEach(p => {
        console.log(`   -> Found: "${p.name}" | Team: ${p.team} | Pos: ${p.position} | Age: ${p.age}`);
      });
    }
  }
  
  if (allMatched) {
    console.log("\n🎉 SUCCESS: All target searches match successfully in simulated client state!");
  } else {
    console.log("\n⚠️ FAILURE: Some target searches failed in simulated client state.");
  }
}

main().catch(console.error);
