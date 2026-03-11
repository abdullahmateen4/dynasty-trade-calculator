import type { Position } from "./player";

export interface RankedPlayerInput {
  id: string;
  name: string;
  position: Position;
  age: number;
  /** Overall dynasty rank (1 = best) */
  rank: number;
  /** Season-long projected fantasy points (format-adjusted) */
  projectedPoints: number;
  /** Average projected points at this position for a typical starter */
  positionalAveragePoints: number;
  /** Projected points for the replacement-level player at this position */
  replacementProjectedPoints: number;
  /** Maximum expected VORP at this position for normalization */
  maxVorpAtPosition: number;
  /** Optional market sentiment multiplier (0.95–1.05, default 1.0) */
  marketMultiplier?: number;
}

export interface PlayerValueResult {
  playerId: string;
  name: string;
  rawValue: number;
  finalValue: number;
  components: {
    baseValue: number;
    ageMultiplier: number;
    projectionMultiplier: number;
    vorpMultiplier: number;
    marketMultiplier: number;
  };
}

export type DraftPickId =
  | "1.01"
  | "1.02"
  | "1.03"
  | "1.04"
  | "1.05"
  | "1.06"
  | "1.07"
  | "1.08"
  | "1.09"
  | "1.10"
  | "2.01"
  | "2.02"
  | "2.03"
  | "2.04"
  | "2.05"
  | "2.06"
  | "2.07"
  | "2.08"
  | "2.09"
  | "2.10";

export interface DraftPickValue {
  id: DraftPickId;
  value: number;
}

export interface TradeInput {
  teamAPlayers: RankedPlayerInput[];
  teamBPlayers: RankedPlayerInput[];
  teamAPicks?: DraftPickId[];
  teamBPicks?: DraftPickId[];
}

export interface TradeResult {
  teamATotal: number;
  teamBTotal: number;
  difference: number;
  winner: "TEAM_A" | "TEAM_B" | "EVEN";
  fairnessRating: "FAIR" | "SLIGHT_ADVANTAGE" | "MAJOR_ADVANTAGE";
  teamAPlayers: PlayerValueResult[];
  teamBPlayers: PlayerValueResult[];
}

const DRAFT_PICK_VALUES: Record<DraftPickId, number> = {
  "1.01": 8000,
  "1.02": 7600,
  "1.03": 7200,
  "1.04": 6850,
  "1.05": 6500,
  "1.06": 6200,
  "1.07": 5900,
  "1.08": 5600,
  "1.09": 5400,
  "1.10": 5200,
  "2.01": 4500,
  "2.02": 4300,
  "2.03": 4100,
  "2.04": 3900,
  "2.05": 3700,
  "2.06": 3500,
  "2.07": 3350,
  "2.08": 3200,
  "2.09": 3100,
  "2.10": 3000
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function calculateBaseValue(rank: number): number {
  if (rank <= 0) {
    return 10000;
  }
  return 10000 * Math.exp(-0.035 * rank);
}

export function calculateAgeMultiplier(
  age: number,
  position: Position
): number {
  const peakAgeByPosition: Record<Position, number> = {
    QB: 29,
    RB: 24,
    WR: 26,
    TE: 27,
    DST: 29,
    K: 30
  };

  const decayRateByPosition: Record<Position, number> = {
    QB: 0.015,
    RB: 0.035,
    WR: 0.02,
    TE: 0.02,
    DST: 0.01,
    K: 0.01
  };

  const peakAge = peakAgeByPosition[position] ?? 27;
  const decayRate = decayRateByPosition[position] ?? 0.02;

  const rawMultiplier = 1 - (age - peakAge) * decayRate;

  return clamp(rawMultiplier, 0.7, 1.15);
}

export function calculateProjectionMultiplier(
  projectedPoints: number,
  positionalAverage: number
): number {
  if (positionalAverage <= 0) return 1;
  const ratio = projectedPoints / positionalAverage;
  return clamp(ratio, 0.85, 1.2);
}

export function calculateVORPMultiplier(
  playerProjection: number,
  replacementProjection: number,
  maxVorp: number
): number {
  if (maxVorp <= 0) return 1;
  const vorp = playerProjection - replacementProjection;
  const normalized = vorp / maxVorp;
  const multiplier = 1 + normalized;
  return clamp(multiplier, 0.9, 1.25);
}

export function calculateFinalPlayerValue(
  input: RankedPlayerInput
): PlayerValueResult {
  const baseValue = calculateBaseValue(input.rank);
  const ageMultiplier = calculateAgeMultiplier(input.age, input.position);
  const projectionMultiplier = calculateProjectionMultiplier(
    input.projectedPoints,
    input.positionalAveragePoints
  );
  const vorpMultiplier = calculateVORPMultiplier(
    input.projectedPoints,
    input.replacementProjectedPoints,
    input.maxVorpAtPosition
  );
  const marketMultiplier = clamp(input.marketMultiplier ?? 1, 0.95, 1.05);

  const rawValue =
    baseValue *
    ageMultiplier *
    projectionMultiplier *
    vorpMultiplier *
    marketMultiplier;

  const finalValue = Math.round(rawValue);

  return {
    playerId: input.id,
    name: input.name,
    rawValue,
    finalValue,
    components: {
      baseValue,
      ageMultiplier,
      projectionMultiplier,
      vorpMultiplier,
      marketMultiplier
    }
  };
}

export function getDraftPickValue(pick: DraftPickId): DraftPickValue {
  return {
    id: pick,
    value: DRAFT_PICK_VALUES[pick]
  };
}

export function calculateTrade(input: TradeInput): TradeResult {
  const teamAPlayerResults = input.teamAPlayers.map(calculateFinalPlayerValue);
  const teamBPlayerResults = input.teamBPlayers.map(calculateFinalPlayerValue);

  const teamAPickTotal =
    input.teamAPicks?.reduce(
      (sum, pick) => sum + (DRAFT_PICK_VALUES[pick] ?? 0),
      0
    ) ?? 0;

  const teamBPickTotal =
    input.teamBPicks?.reduce(
      (sum, pick) => sum + (DRAFT_PICK_VALUES[pick] ?? 0),
      0
    ) ?? 0;

  const teamAPlayersTotal = teamAPlayerResults.reduce(
    (sum, p) => sum + p.finalValue,
    0
  );
  const teamBPlayersTotal = teamBPlayerResults.reduce(
    (sum, p) => sum + p.finalValue,
    0
  );

  const teamATotal = teamAPlayersTotal + teamAPickTotal;
  const teamBTotal = teamBPlayersTotal + teamBPickTotal;

  const difference = teamATotal - teamBTotal;

  let winner: TradeResult["winner"] = "EVEN";
  if (difference > 0) winner = "TEAM_A";
  if (difference < 0) winner = "TEAM_B";

  let fairnessRating: TradeResult["fairnessRating"] = "FAIR";
  const absDiff = Math.abs(difference);
  if (absDiff >= 300 && absDiff <= 1000) {
    fairnessRating = "SLIGHT_ADVANTAGE";
  } else if (absDiff > 1000) {
    fairnessRating = "MAJOR_ADVANTAGE";
  }

  return {
    teamATotal,
    teamBTotal,
    difference,
    winner,
    fairnessRating,
    teamAPlayers: teamAPlayerResults,
    teamBPlayers: teamBPlayerResults
  };
}

