/* eslint-disable no-console */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";
import { deriveStarterStatus } from "../lib/deriveStarterStatus";

// ✅ Load env variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("❌ Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ✅ Age calculation helper
function calculateAge(birthDate: number | null): number | null {
  if (!birthDate) return null;

  const today = new Date();
  const birth = new Date(birthDate);

  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();

  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

async function runImport() {
  try {
    console.log("🚀 Fetching players from Sleeper...");

    const res = await fetch("https://api.sleeper.app/v1/players/nfl");

    if (!res.ok) {
      throw new Error(`Sleeper API failed: ${res.status}`);
    }

    const data = await res.json();
    const playersArray = Object.values(data as Record<string, any>);

    // Fetch current database player count before cleanup
    const { count: countBefore } = await supabase
      .from("players")
      .select("*", { count: "exact", head: true });
    
    console.log(`📊 Total players in Supabase before cleanup: ${countBefore ?? 0}`);

    // Filter to only keep currently rostered NFL players from all positions
    const rosteredSleeperPlayers = playersArray.filter((p: any) => {
      // 1. Must have a position
      if (!p.position) return false;

      // 2. Keep players with a real NFL team value
      // 3. Remove free agents where team is null, empty, "FA", or "Free Agent"
      if (!p.team) return false;
      const team = p.team.trim().toUpperCase();
      if (team === "" || team === "FA" || team === "FREE AGENT") return false;

      // 4. Remove retired, inactive, practice squad
      if (p.active !== true) return false;
      if (p.status) {
        const status = p.status.trim().toUpperCase();
        if (status === "RETIRED" || status === "INACTIVE" || status === "PRACTICE SQUAD") {
          return false;
        }
      }

      return true;
    });

    console.log(`📊 Rostered players identified in Sleeper: ${rosteredSleeperPlayers.length}`);

    // Deduplicate imported list by sleeper_id and name+team
    const seenIds = new Set<string>();
    const seenNames = new Set<string>();
    const uniqueRostered: any[] = [];

    for (const p of rosteredSleeperPlayers) {
      const sleeperId = String(p.player_id);
      if (seenIds.has(sleeperId)) continue;
      seenIds.add(sleeperId);

      const nameLower = `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim().toLowerCase();
      const teamLower = p.team ? p.team.trim().toLowerCase() : "";
      const nameTeamKey = `${nameLower}|${teamLower}`;
      if (seenNames.has(nameTeamKey)) continue;
      seenNames.add(nameTeamKey);

      uniqueRostered.push(p);
    }

    // Transform data
    const playersToUpsert = uniqueRostered.map((p: any) => ({
      sleeper_id: String(p.player_id),
      name: `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim(),
      team: p.team || null,
      position: p.position,
      age: p.birth_date
        ? calculateAge(new Date(p.birth_date).getTime())
        : null,
      // ✅ FIXED: derive from depth_chart_order, not p.active
      starter_status: deriveStarterStatus(p),
      injury_status: p.injury_status || null,
    }));

    // Batch insert/upsert to Supabase
    const batchSize = 500;
    let totalInserted = 0;

    for (let i = 0; i < playersToUpsert.length; i += batchSize) {
      const batch = playersToUpsert.slice(i, i + batchSize);

      const { error } = await supabase
        .from("players")
        .upsert(batch, { onConflict: "sleeper_id" });

      if (error) {
        console.error("❌ Batch insert error:", error);
        return;
      }

      totalInserted += batch.length;
      console.log(`✅ Upserted ${totalInserted} players`);
    }

    // Now, clean up database: delete any players that are no longer currently rostered (i.e. not in our imported sleeper_ids)
    console.log("🧹 Pruning unrostered players from database...");
    
    // Load all current player IDs from DB
    let dbPlayersList: any[] = [];
    let page = 0;
    while (true) {
      const { data: pageData, error } = await supabase
        .from("players")
        .select("id, sleeper_id")
        .range(page * 1000, (page + 1) * 1000 - 1);
      if (error || !pageData || pageData.length === 0) break;
      dbPlayersList = dbPlayersList.concat(pageData);
      page++;
    }

    const sleeperIdSet = new Set(playersToUpsert.map((p) => p.sleeper_id));
    const idsToDelete = dbPlayersList
      .filter((p) => !p.sleeper_id || !sleeperIdSet.has(p.sleeper_id))
      .map((p) => p.id);

    if (idsToDelete.length > 0) {
      console.log(`🗑️ Deleting ${idsToDelete.length} unrostered players from database...`);
      for (let i = 0; i < idsToDelete.length; i += 100) {
        const batch = idsToDelete.slice(i, i + 100);
        const { error } = await supabase
          .from("players")
          .delete()
          .in("id", batch);
        if (error) {
          console.error("❌ Delete batch error:", error);
        }
      }
    }

    // Fetch final database player count after cleanup
    const { count: countAfter } = await supabase
      .from("players")
      .select("*", { count: "exact", head: true });

    console.log(`📊 Total rostered players in Supabase after cleanup: ${countAfter ?? 0}`);
    console.log("🎉 DONE — Players imported and database cleaned successfully");

  } catch (err: any) {
    console.error("❌ Import failed:", err.message);
  }
}

// ✅ Run script
runImport();