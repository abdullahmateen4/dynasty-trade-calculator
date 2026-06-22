import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function main() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Fetch all players to analyze them in JS
  const { data: players, error } = await supabase
    .from("players")
    .select("*");
    
  if (error) {
    console.error("Error fetching players:", error);
    return;
  }
  
  console.log("Total players fetched:", players.length);
  
  const statusCounts = {};
  const teamCounts = {};
  const starterStatusCounts = {};
  
  players.forEach((p) => {
    statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
    teamCounts[p.team] = (teamCounts[p.team] || 0) + 1;
    starterStatusCounts[p.starter_status] = (starterStatusCounts[p.starter_status] || 0) + 1;
  });
  
  console.log("Status counts:", statusCounts);
  console.log("Team 'FA' or null counts:", {
    nullTeams: players.filter(p => p.team === null).length,
    emptyTeams: players.filter(p => p.team === "").length,
    faTeams: players.filter(p => p.team && p.team.toUpperCase() === "FA").length,
    freeAgentTeams: players.filter(p => p.team && p.team.toUpperCase() === "FREE AGENT").length
  });
  
  // Filter players based on our criteria
  const rostered = players.filter((p) => {
    // 1. Team is null, empty, "FA", or "Free Agent"
    if (!p.team) return false;
    const t = p.team.trim().toUpperCase();
    if (t === "" || t === "FA" || t === "FREE AGENT") return false;
    
    // 2. Status is retired, inactive, practice squad
    if (p.status) {
      const s = p.status.trim().toUpperCase();
      if (s === "RETIRED" || s === "INACTIVE" || s === "PRACTICE SQUAD") return false;
    }
    
    // 3. Exclude inactive players
    // Wait, check starter_status or active status in case?
    // Let's see if starter_status is 'false' or false, does it mean inactive?
    // In Sleeper, active is a boolean (starter_status in DB stores p.active === true as string or boolean? In Bear Pascoe, starter_status is string 'false')
    
    return true;
  });
  
  console.log("Filtered rostered players count:", rostered.length);
  if (rostered.length > 0) {
    console.log("Sample filtered player:", rostered[0]);
  }
}

main().catch(console.error);
