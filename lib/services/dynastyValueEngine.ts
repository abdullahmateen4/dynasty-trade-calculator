import { getSupabaseServiceClient } from "../supabaseClient";
import type { FantasyCalcWithPlayerId } from "./fantasyCalcService";

export interface DynastyValueInput {
  player_id: string | null;
  name: string;
  position: string;
  age: number | null;
  rank: number;
  market_value: number;
}

export interface DynastyValueResult extends DynastyValueInput {
  baseValue: number;
  ageFactor: number;
  positionMultiplier: number;
  calculatedValue: number;
  finalValue: number;
  tier: number;
}

function computeBaseValue(rank: number): number {
  return 10000 * Math.exp(-0.015 * rank);
}

function computeAgeFactor(position: string, age: number | null): number {
  if (!age) return 1;
  const peaks: Record<string, number> = {
    QB: 28,
    RB: 24,
    WR: 26,
    TE: 27
  };
  const peak = peaks[position.toUpperCase()] ?? 26;
  const raw = 1 + (peak - age) * 0.02;
  return Math.min(1.2, Math.max(0.75, raw));
}

function computePositionMultiplier(
  input: DynastyValueInput,
  positionRank: number
): number {
  const pos = input.position.toUpperCase();
  let mult = 1;
  if (pos === "QB" && positionRank <= 10) mult *= 1.15;
  if (pos === "RB" && input.age !== null && input.age <= 25) mult *= 1.1;
  if (pos === "WR" && input.age !== null && input.age <= 26) mult *= 1.1;
  if (pos === "TE" && positionRank <= 5) mult *= 1.15;
  return mult;
}

/**
 * Builds dynasty inputs from FantasyCalc + Supabase player metadata.
 */
export async function buildDynastyInputsFromFantasyCalc(
  fcPlayers: FantasyCalcWithPlayerId[]
): Promise<DynastyValueInput[]> {
  const sorted = [...fcPlayers].sort((a, b) => b.market_value - a.market_value);
  const supabase = getSupabaseServiceClient();

  if (!supabase) {
    return sorted.map((p, i) => ({
      player_id: p.player_id,
      name: p.name,
      position: p.position,
      age: null,
      rank: i + 1,
      market_value: p.market_value
    }));
  }

  const { data: players, error } = await supabase
    .from("players")
    .select("id, age, position");

  if (error || !players) {
    return sorted.map((p, i) => ({
      player_id: p.player_id,
      name: p.name,
      position: p.position,
      age: null,
      rank: i + 1,
      market_value: p.market_value
    }));
  }

  const infoById = new Map<string, { age: number | null; position: string }>();
  players.forEach((p: any) => {
    infoById.set(p.id, { age: p.age ?? null, position: (p.position ?? "").toString() });
  });

  return sorted.map((p, i) => {
    const info = p.player_id ? infoById.get(p.player_id) : undefined;
    return {
      player_id: p.player_id,
      name: p.name,
      position: info?.position || p.position,
      age: info?.age ?? null,
      rank: i + 1,
      market_value: p.market_value
    };
  });
}

/**
 * Combines player metadata and market values to compute dynasty trade values.
 * Assigns tiers based on value drops > 12%.
 */
export function computeDynastyValues(
  inputs: DynastyValueInput[]
): DynastyValueResult[] {
  const byPosition: Record<string, DynastyValueInput[]> = {};
  for (const p of inputs) {
    const key = p.position.toUpperCase();
    if (!byPosition[key]) byPosition[key] = [];
    byPosition[key].push(p);
  }
  Object.values(byPosition).forEach((arr) => arr.sort((a, b) => a.rank - b.rank));

  const interim: DynastyValueResult[] = inputs.map((input) => {
    const arr = byPosition[input.position.toUpperCase()] ?? [];
    const posRank = arr.findIndex((p) => p.player_id === input.player_id) + 1 || 999;

    const baseValue = computeBaseValue(input.rank);
    const ageFactor = computeAgeFactor(input.position, input.age);
    const positionMultiplier = computePositionMultiplier(input, posRank);
    const calculatedValue = baseValue * ageFactor * positionMultiplier;
    const blended = 0.6 * calculatedValue + 0.4 * (input.market_value || 0);

    return {
      ...input,
      baseValue,
      ageFactor,
      positionMultiplier,
      calculatedValue,
      finalValue: Math.round(blended),
      tier: 0
    };
  });

  interim.sort((a, b) => b.finalValue - a.finalValue);

  let currentTier = 1;
  let prev: number | null = null;
  for (const p of interim) {
    if (prev !== null && (prev - p.finalValue) / prev > 0.12) currentTier += 1;
    p.tier = currentTier;
    prev = p.finalValue;
  }

  return interim;
}

/**
 * Saves dynasty values to Supabase (player_values + player_value_history).
 */
export async function saveDynastyValuesToSupabase(
  values: DynastyValueResult[]
): Promise<void> {
  const supabase = getSupabaseServiceClient();
  if (!supabase || values.length === 0) return;

  const withIds = values.filter((v) => v.player_id);
  if (withIds.length === 0) return;

  const playerValuesRows = withIds.map((v) => ({
    player_id: v.player_id,
    value: v.finalValue,
    tier: v.tier
  }));

  const historyRows = withIds.map((v) => ({
    player_id: v.player_id,
    value: v.finalValue
  }));

  const [pvRes, histRes] = await Promise.all([
    supabase.from("player_values").upsert(playerValuesRows, { onConflict: "player_id" }),
    supabase.from("player_value_history").insert(historyRows)
  ]);

  if (pvRes.error) console.error("[dynastyValueEngine] player_values error", pvRes.error);
  if (histRes.error) console.error("[dynastyValueEngine] player_value_history error", histRes.error);
}
