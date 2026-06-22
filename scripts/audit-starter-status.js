import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const RETIRED_TARGETS = [
  "Ben Roethlisberger",
  "Andy Dalton",
  "Joe Flacco",
  "Josh Johnson",
];

async function main() {
  console.log("=== AUDIT: starter_status pipeline ===\n");

  // ---- PART 1: Supabase DB current state ----
  console.log("--- PART 1: Current Supabase starter_status distribution ---");
  const supabase = createClient(supabaseUrl, supabaseKey);

  let allDbPlayers = [];
  let page = 0;
  let hasMore = true;
  while (hasMore) {
    const { data, error } = await supabase
      .from("players")
      .select("name, team, starter_status, age")
      .range(page * 1000, (page + 1) * 1000 - 1);
    if (error || !data || data.length === 0) { hasMore = false; break; }
    allDbPlayers = [...allDbPlayers, ...data];
    if (data.length < 1000) hasMore = false;
    else page++;
  }

  const statusCounts = {};
  allDbPlayers.forEach(p => {
    statusCounts[p.starter_status ?? "null"] = (statusCounts[p.starter_status ?? "null"] || 0) + 1;
  });
  console.log("Total players in DB:", allDbPlayers.length);
  console.log("starter_status distribution:", statusCounts);

  console.log("\nRetired players still in DB:");
  for (const name of RETIRED_TARGETS) {
    const found = allDbPlayers.filter(p => p.name.toLowerCase().includes(name.toLowerCase()));
    found.forEach(p => console.log(`  ${p.name} | Team: ${p.team} | Age: ${p.age} | starter_status: ${p.starter_status}`));
  }

  // ---- PART 2: Sleeper API live data ----
  console.log("\n--- PART 2: Sleeper API active field for retired players ---");
  const res = await fetch("https://api.sleeper.app/v1/players/nfl");
  if (!res.ok) { console.error("Sleeper API failed:", res.status); return; }
  const sleeperData = await res.json();
  const sleeperPlayers = Object.values(sleeperData);
  console.log("Total players from Sleeper API:", sleeperPlayers.length);

  for (const name of RETIRED_TARGETS) {
    const matches = sleeperPlayers.filter(p =>
      ((p.full_name || "") + " " + (p.first_name || "") + " " + (p.last_name || ""))
        .toLowerCase().includes(name.toLowerCase().split(" ")[1])
    );
    if (matches.length === 0) {
      console.log(`  ${name}: NOT FOUND in Sleeper`);
    } else {
      matches.forEach(p => {
        const fullName = `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim();
        console.log(`  ${fullName}: active=${p.active}, status="${p.status}", team="${p.team}", depth_chart_order=${p.depth_chart_order}`);
      });
    }
  }

  // ---- PART 3: Simulate importplayers.ts filter to see what gets through ----
  console.log("\n--- PART 3: Simulating importplayers.ts filter logic ---");
  const importFiltered = sleeperPlayers.filter(p => {
    if (!p.position) return false;
    if (!p.team) return false;
    const team = p.team.trim().toUpperCase();
    if (team === "" || team === "FA" || team === "FREE AGENT") return false;
    if (p.active !== true) return false;
    if (p.status) {
      const status = p.status.trim().toUpperCase();
      if (status === "RETIRED" || status === "INACTIVE" || status === "PRACTICE SQUAD") return false;
    }
    return true;
  });

  console.log("Players that pass importplayers.ts filter (should be rostered & active):", importFiltered.length);

  // Check if retired targets pass the filter
  for (const name of RETIRED_TARGETS) {
    const passes = importFiltered.filter(p =>
      `${p.first_name ?? ""} ${p.last_name ?? ""}`.toLowerCase().includes(name.toLowerCase().split(" ")[1])
    );
    if (passes.length > 0) {
      passes.forEach(p => console.log(`  ⚠️ PASSES FILTER: ${p.first_name} ${p.last_name} | active=${p.active} | status=${p.status} | team=${p.team}`));
    } else {
      console.log(`  ✅ Correctly excluded: "${name}"`);
    }
  }

  // ---- PART 4: Trace starter_status mapping in importplayers.ts ----
  console.log("\n--- PART 4: What depth_chart_order looks like for sample starters/backups ---");
  const skillPositions = ["QB", "RB", "WR", "TE"];
  const skillFiltered = importFiltered.filter(p => skillPositions.includes(p.position));
  const depthSample = skillFiltered.slice(0, 20);
  depthSample.forEach(p => {
    const name = `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim();
    // The import script maps: p.active === true ? "STARTER" : "BACKUP"
    const computedStatus = p.active === true ? "STARTER" : "BACKUP";
    console.log(`  ${name} | pos=${p.position} | active=${p.active} | depth_chart_order=${p.depth_chart_order} | depth_chart_position=${p.depth_chart_position} | → computed: ${computedStatus}`);
  });

  // ---- PART 5: What the update-player-values API route maps to starter_status ----
  console.log("\n--- PART 5: app/api/update-player-values/route.ts mapping ---");
  console.log("The route.ts upsert: does NOT write starter_status at all");
  console.log("Fields written: sleeper_id, name, team, position, age, injury_status");
  console.log("→ starter_status is NOT updated when this route runs.");
  console.log("→ Any existing starter_status values persist unchanged after this route.");

  console.log("\n=== AUDIT COMPLETE ===");
}

main().catch(console.error);
