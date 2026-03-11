import type { Position } from "./player";
import type { LeagueSettings } from "./league-settings";

export interface RankedPlayerInput {
  id: string;
  name: string;
  position: Position;
  age: number;
  rank: number;
  projectedPoints: number;
  positionalAveragePoints: number;
  replacementProjectedPoints: number;
  maxVorpAtPosition: number;
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
    leagueMultiplier: number;
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
  if (rank <= 0) return 10000;
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

/*
League Settings Impact
*/
function getLeagueMultiplier(
  position: Position,
  league: LeagueSettings
) {

  let multiplier = 1;

  // Superflex QB boost
  if (position === "QB" && league.superflex) {
    multiplier *= 1.25;
  }

  // TE Premium
  if (position === "TE" && league.tePremium) {
    multiplier *= 1.15;
  }

  // League size scarcity
  if (league.leagueSize === 10) multiplier *= 0.95;
  if (league.leagueSize === 12) multiplier *= 1;
  if (league.leagueSize === 14) multiplier *= 1.08;
  if (league.leagueSize === 16) multiplier *= 1.15;

  return multiplier;
}

export function calculateFinalPlayerValue(
  input: RankedPlayerInput,
  league: LeagueSettings
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

  const leagueMultiplier = getLeagueMultiplier(input.position, league);

  const rawValue =
    baseValue *
    ageMultiplier *
    projectionMultiplier *
    vorpMultiplier *
    marketMultiplier *
    leagueMultiplier;

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
      marketMultiplier,
      leagueMultiplier
    }
  };
}

export function calculateTrade(
  input: TradeInput,
  league: LeagueSettings
): TradeResult {

  const teamAPlayerResults = input.teamAPlayers.map(p =>
    calculateFinalPlayerValue(p, league)
  );

  const teamBPlayerResults = input.teamBPlayers.map(p =>
    calculateFinalPlayerValue(p, league)
  );

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

  const absDiff = Math.abs(difference);

  let fairnessRating: TradeResult["fairnessRating"] = "FAIR";

  if (absDiff >= 300 && absDiff <= 1000) {
    fairnessRating = "SLIGHT_ADVANTAGE";
  }

  if (absDiff > 1000) {
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