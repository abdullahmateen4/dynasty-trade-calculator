/* eslint-disable no-console */

import "dotenv/config";

import {
  fetchFantasyCalcPlayers,
  mapFantasyCalcPlayersToSupabase
} from "../lib/services/fantasyCalcService";

import {
  buildDynastyInputsFromFantasyCalc,
  computeDynastyValues,
  saveDynastyValuesToSupabase
} from "../lib/services/dynastyValueEngine";

export async function runUpdateDynastyValues(): Promise<void> {
  console.log("🚀 [updateDynastyValues] starting update pipeline");

  // =========================
  // ❌ STEP 1 REMOVED (Sleeper API causing timeout)
  // =========================
  console.log("⚠️ Skipping player metadata (Sleeper API issue)");

  // =========================
  // STEP 2 — Fetch FantasyCalc
  // =========================
  let fcPlayers: any[] = [];

  try {
    fcPlayers = await fetchFantasyCalcPlayers();
    console.log(`📊 fetched ${fcPlayers.length} FantasyCalc players`);
  } catch (err) {
    console.error("❌ FantasyCalc fetch failed", err);
    return;
  }

  if (!fcPlayers.length) {
    console.warn("❌ no FantasyCalc players found");
    return;
  }

  // =========================
  // STEP 3 — Map players
  // =========================
  const mapped = await mapFantasyCalcPlayersToSupabase(fcPlayers);
  console.log(`🔗 mapped ${mapped.length} players`);

  // =========================
  // STEP 4 — Build inputs
  // =========================
  const inputs = await buildDynastyInputsFromFantasyCalc(mapped);

  if (!inputs.length) {
    console.warn("❌ no valid inputs");
    return;
  }

  console.log(`🧠 computing values for ${inputs.length} players`);

  // =========================
  // STEP 5 — Compute values
  // =========================
  const values = computeDynastyValues(inputs);

  if (!values.length) {
    console.warn("❌ no computed values");
    return;
  }

  // =========================
  // STEP 6 — Save to DB
  // =========================
  try {
    await saveDynastyValuesToSupabase(values);
    console.log(`💾 saved ${values.length} player values`);
  } catch (err) {
    console.error("❌ failed to save values", err);
    return;
  }

  console.log("🎉 update pipeline completed successfully");
}

// =========================
// RUN SCRIPT
// =========================
(async () => {
  try {
    await runUpdateDynastyValues();
    console.log("✅ script finished");
    process.exit(0);
  } catch (err) {
    console.error("💥 fatal error", err);
    process.exit(1);
  }
})();