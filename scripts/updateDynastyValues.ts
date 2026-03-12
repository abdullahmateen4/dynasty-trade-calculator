/* eslint-disable no-console */

// This script is completely independent of the existing calculator logic.
// It can be run with ts-node or compiled to JavaScript and executed with Node.
// It will:
// 1. Fetch player metadata from Sleeper and store it in Supabase.
// 2. Fetch dynasty market values from FantasyCalc.
// 3. Combine those inputs in the dynasty value engine.
// 4. Save current values and append history rows in Supabase.

import { updatePlayerMetadata } from "../lib/services/playerMetadataService";
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
  console.log("[updateDynastyValues] starting update pipeline");

  // 1) Refresh player metadata (intended to be called roughly weekly)
  try {
    await updatePlayerMetadata();
    console.log("[updateDynastyValues] player metadata updated from Sleeper");
  } catch (err) {
    console.warn("[updateDynastyValues] player metadata step failed", err);
  }

  // 2) Fetch FantasyCalc market values
  let fcPlayers;
  try {
    fcPlayers = await fetchFantasyCalcPlayers();
  } catch (err) {
    console.error("[updateDynastyValues] FantasyCalc fetch failed", err);
    return;
  }

  if (!fcPlayers || fcPlayers.length === 0) {
    console.warn(
      "[updateDynastyValues] FantasyCalc returned no players; aborting value update"
    );
    return;
  }

  // 3) Map FantasyCalc players to Supabase player IDs
  const mapped = await mapFantasyCalcPlayersToSupabase(fcPlayers);

  // 4) Build dynasty engine inputs (adds age, position, rank)
  const inputs = await buildDynastyInputsFromFantasyCalc(mapped);

  if (inputs.length === 0) {
    console.warn(
      "[updateDynastyValues] no valid dynasty inputs after mapping; aborting"
    );
    return;
  }

  // 5) Calculate dynasty values + tiers
  const values = computeDynastyValues(inputs);

  // 6) Persist current values and append history rows
  await saveDynastyValuesToSupabase(values);

  console.log(
    `[updateDynastyValues] successfully updated dynasty values for ${values.length} players`
  );
}

// Optional convenience for direct execution with ts-node or compiled JS:
if (require.main === module) {
  runUpdateDynastyValues()
    .then(() => {
      console.log("[updateDynastyValues] done");
    })
    .catch((err) => {
      console.error("[updateDynastyValues] fatal error", err);
      process.exit(1);
    });
}

