/**
 * simulate-starter-status.js
 *
 * Fetches the live Sleeper NFL player data, applies the new deriveStarterStatus()
 * logic, and prints the expected STARTER / BACKUP / INACTIVE distribution by
 * total and by position.
 *
 * Does NOT connect to Supabase and does NOT modify any data.
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

// ── Inline the helper (pure JS mirror of lib/deriveStarterStatus.ts) ────────
const INACTIVE_STATUSES = new Set([
  "RETIRED",
  "INACTIVE",
  "NON-FOOTBALL ILLNESS",
  "NON-FOOTBALL INJURY",
  "PHYSICALLY UNABLE TO PERFORM",
  "PUP",
  "NFI",
  "SUSPENDED",
  "EXEMPT",
]);

function deriveStarterStatus(p) {
  if (!p.team) return "INACTIVE";
  const team = String(p.team).trim().toUpperCase();
  if (team === "" || team === "FA" || team === "FREE AGENT") return "INACTIVE";
  if (p.active !== true) return "INACTIVE";
  if (p.status) {
    const s = String(p.status).trim().toUpperCase();
    if (INACTIVE_STATUSES.has(s)) return "INACTIVE";
  }
  const depthOrder = p.depth_chart_order;
  if (depthOrder === null || depthOrder === undefined) return "BACKUP";
  const order = Number(depthOrder);
  if (Number.isNaN(order)) return "BACKUP";
  return order === 1 ? "STARTER" : "BACKUP";
}
// ────────────────────────────────────────────────────────────────────────────

const FANTASY_POSITIONS = new Set(["QB", "RB", "WR", "TE"]);

async function main() {
  console.log("🌐 Fetching Sleeper NFL players (simulation only — DB not touched)...\n");

  const res = await fetch("https://api.sleeper.app/v1/players/nfl");
  if (!res.ok) { console.error("Sleeper API failed:", res.status); return; }
  const data = await res.json();
  const all = Object.values(data);

  console.log(`Total Sleeper records: ${all.length}\n`);

  // Apply the SAME filter as importplayers.ts
  const importFiltered = all.filter(p => {
    if (!p.position) return false;
    if (!p.team) return false;
    const team = p.team.trim().toUpperCase();
    if (team === "" || team === "FA" || team === "FREE AGENT") return false;
    if (p.active !== true) return false;
    if (p.status) {
      const s = p.status.trim().toUpperCase();
      if (s === "RETIRED" || s === "INACTIVE" || s === "PRACTICE SQUAD") return false;
    }
    return true;
  });

  // Deduplicate (mirrors importplayers.ts)
  const seenIds = new Set();
  const unique = [];
  for (const p of importFiltered) {
    const id = String(p.player_id);
    if (seenIds.has(id)) continue;
    seenIds.add(id);
    unique.push(p);
  }

  // Apply new deriveStarterStatus to every player
  const withStatus = unique.map(p => ({
    name: `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim(),
    position: p.position,
    team: p.team,
    active: p.active,
    sleeperStatus: p.status,
    depthOrder: p.depth_chart_order,
    newStarterStatus: deriveStarterStatus(p),
    // OLD logic for comparison
    oldStarterStatus: p.active === true ? "STARTER" : "BACKUP",
  }));

  // ── Overall distribution ────────────────────────────────────────────────
  const totals = { STARTER: 0, BACKUP: 0, INACTIVE: 0 };
  withStatus.forEach(p => totals[p.newStarterStatus]++);

  console.log("=".repeat(55));
  console.log("EXPECTED starter_status DISTRIBUTION (new logic)");
  console.log("=".repeat(55));
  console.log(`  STARTER  : ${totals.STARTER}`);
  console.log(`  BACKUP   : ${totals.BACKUP}`);
  console.log(`  INACTIVE : ${totals.INACTIVE}`);
  console.log(`  TOTAL    : ${withStatus.length}`);
  console.log();

  // ── Fantasy position breakdown ─────────────────────────────────────────
  console.log("=".repeat(55));
  console.log("FANTASY POSITIONS (QB / RB / WR / TE) breakdown");
  console.log("=".repeat(55));
  for (const pos of ["QB", "RB", "WR", "TE"]) {
    const group = withStatus.filter(p => p.position === pos);
    const s = group.filter(p => p.newStarterStatus === "STARTER").length;
    const b = group.filter(p => p.newStarterStatus === "BACKUP").length;
    const i = group.filter(p => p.newStarterStatus === "INACTIVE").length;
    console.log(`  ${pos}: ${group.length} total → STARTER=${s}  BACKUP=${b}  INACTIVE=${i}`);
  }
  console.log();

  // ── Old vs New for known problem players ──────────────────────────────
  const watchList = [
    "Ben Roethlisberger", "Joe Flacco", "Josh Johnson", "Andy Dalton",
    "Patrick Mahomes", "Josh Allen", "Jalen Hurts",
    "Lamar Jackson", "Bijan Robinson", "Justin Jefferson",
    "Travis Kelce", "Brock Bowers",
  ];
  console.log("=".repeat(55));
  console.log("SPOT-CHECK: Old vs New starter_status");
  console.log("=".repeat(55));
  for (const name of watchList) {
    const match = withStatus.find(p => p.name.toLowerCase() === name.toLowerCase());
    if (match) {
      const changed = match.oldStarterStatus !== match.newStarterStatus ? " ⚠️ CHANGED" : "";
      console.log(`  ${match.name} (${match.position} / ${match.team})`);
      console.log(`    depth_chart_order=${match.depthOrder}  sleeperStatus="${match.sleeperStatus}"`);
      console.log(`    OLD: ${match.oldStarterStatus}  →  NEW: ${match.newStarterStatus}${changed}`);
    } else {
      console.log(`  ${name}: not in import set`);
    }
  }
  console.log();

  // ── Show all players whose status CHANGES ─────────────────────────────
  const changed = withStatus.filter(p => p.oldStarterStatus !== p.newStarterStatus);
  console.log("=".repeat(55));
  console.log(`STATUS CHANGES vs old logic: ${changed.length} players affected`);
  console.log("(These are the players who WERE wrongly STARTER, now BACKUP)");
  console.log("=".repeat(55));
  const byPos = {};
  changed.forEach(p => {
    byPos[p.position] = (byPos[p.position] || 0) + 1;
  });
  Object.entries(byPos).sort((a, b) => b[1] - a[1]).forEach(([pos, count]) => {
    console.log(`  ${pos}: ${count} players corrected`);
  });
  console.log();
  console.log("Sample of corrected players (first 30):");
  changed.slice(0, 30).forEach(p => {
    console.log(`  ${p.name} | ${p.position}/${p.team} | depth=${p.depthOrder} | ${p.oldStarterStatus} → ${p.newStarterStatus}`);
  });

  console.log("\n✅ Simulation complete. Database NOT modified.");
}

main().catch(console.error);
