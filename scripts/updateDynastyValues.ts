/* eslint-disable no-console */

// This script is independent of the existing calculator logic.
// It pulls player data, calculates dynasty values, and stores results in Supabase.

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

// STEP 1 — Update Sleeper player metadata
try {
await updatePlayerMetadata();
console.log("[updateDynastyValues] player metadata updated from Sleeper");
} catch (err) {
console.warn("[updateDynastyValues] player metadata step failed", err);
}

// STEP 2 — Fetch FantasyCalc values
let fcPlayers: any[] = [];

try {
fcPlayers = await fetchFantasyCalcPlayers();
console.log(`[updateDynastyValues] fetched ${fcPlayers.length} FantasyCalc players`);
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

// STEP 3 — Map FantasyCalc players to Supabase IDs
const mapped = await mapFantasyCalcPlayersToSupabase(fcPlayers);

console.log(`[updateDynastyValues] mapped ${mapped.length} players`);

// STEP 4 — Build dynasty calculation inputs
const inputs = await buildDynastyInputsFromFantasyCalc(mapped);

if (!inputs || inputs.length === 0) {
console.warn(
"[updateDynastyValues] no valid dynasty inputs after mapping; aborting"
);
return;
}

console.log(`[updateDynastyValues] computing values for ${inputs.length} players`);

// STEP 5 — Compute dynasty values
const values = computeDynastyValues(inputs);

// STEP 6 — Save values + history
await saveDynastyValuesToSupabase(values);

console.log(
`[updateDynastyValues] successfully updated dynasty values for ${values.length} players`
);
}

// Force execution when script runs
(async () => {
try {
await runUpdateDynastyValues();
console.log("[updateDynastyValues] done");
process.exit(0);
} catch (err) {
console.error("[updateDynastyValues] fatal error", err);
process.exit(1);
}
})();
