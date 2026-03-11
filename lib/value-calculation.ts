import type { LeagueSettings } from "./league-settings";
import type { InjuryStatus, Player, Position, StarterStatus } from "./player";

export interface PlayerValueBreakdown {
  baseValue: number;
  ageAdjustment: number;
  injuryAdjustment: number;
  positionAdjustment: number;
  starterAdjustment: number;
  scheduleAdjustment: number;
  projectionAdjustment: number;
  finalValue: number;
}

/*
Target value scale used by most dynasty trade calculators

Elite players: 9000–10000
Top starters: 7000–8500
Mid starters: 4500–6500
Flex players: 2500–4000
Bench players: <2000
*/

const MAX_VALUE = 10000;

const clamp = (value: number, min = 0, max = MAX_VALUE) =>
  Math.min(max, Math.max(min, value));

/*
Convert ranking/base score to dynasty trade value
Uses exponential decay similar to real calculators
*/
function rankToValue(rank: number): number {
  const decay = 0.015;
  return Math.round(MAX_VALUE * Math.exp(-rank * decay));
}

function getAgeAdjustment(age: number): number {
  if (age <= 22) return 1.15;
  if (age <= 25) return 1.10;
  if (age <= 27) return 1.05;
  if (age <= 29) return 1.0;
  if (age <= 31) return 0.92;
  return 0.80;
}

function getInjuryAdjustment(status: InjuryStatus): number {
  switch (status) {
    case "MINOR":
      return 0.97;
    case "MAJOR":
      return 0.90;
    case "HEALTHY":
    default:
      return 1;
  }
}

function getStarterAdjustment(status: StarterStatus): number {
  switch (status) {
    case "STARTER":
      return 1.05;
    case "BACKUP":
      return 0.85;
    default:
      return 1;
  }
}

/*
Position value adjustment
Handles Superflex and TE Premium
*/
function getPositionMultiplier(
  position: Position,
  league: LeagueSettings
): number {

  const sizeFactor = league.leagueSize / 12;

  if (position === "QB") {

    // Superflex leagues make QBs much more valuable
    if (league.superflex) {
      return 1.25 * sizeFactor;
    }

    return 1.05 * sizeFactor;
  }

  if (position === "RB") {
    return 1.05 * sizeFactor;
  }

  if (position === "WR") {
    return 1.08 * sizeFactor;
  }

  if (position === "TE") {

    // TE premium increases TE value
    if (league.tePremium) {
      return 1.20 * sizeFactor;
    }

    return 1.05 * sizeFactor;
  }

  return 1;
}

function getScheduleAdjustment(_player: Player): number {
  return 1;
}

/*
Projection adjustment gives small bump to players
with stronger projections relative to base value
*/
function getProjectionAdjustment(baseValue: number): number {
  const centered = baseValue / MAX_VALUE;
  return 0.95 + centered * 0.1;
}

export function calculatePlayerValue(
  player: Player,
  leagueSettings: LeagueSettings
): PlayerValueBreakdown {

  const baseValue = rankToValue(player.baseValue);

  const ageMultiplier = getAgeAdjustment(player.age);
  const injuryMultiplier = getInjuryAdjustment(player.injuryStatus);
  const starterMultiplier = getStarterAdjustment(player.starterStatus);

  const positionMultiplier = getPositionMultiplier(
    player.position,
    leagueSettings
  );

  const scheduleMultiplier = getScheduleAdjustment(player);

  const projectionMultiplier = getProjectionAdjustment(baseValue);

  const finalValue = clamp(
    baseValue *
      ageMultiplier *
      injuryMultiplier *
      starterMultiplier *
      positionMultiplier *
      scheduleMultiplier *
      projectionMultiplier
  );

  return {
    baseValue,
    ageAdjustment: ageMultiplier,
    injuryAdjustment: injuryMultiplier,
    positionAdjustment: positionMultiplier,
    starterAdjustment: starterMultiplier,
    scheduleAdjustment: scheduleMultiplier,
    projectionAdjustment: projectionMultiplier,
    finalValue
  };
}

export function summarizeTeamValue(
  players: Player[],
  leagueSettings: LeagueSettings
) {

  const breakdowns = players.map((p) =>
    calculatePlayerValue(p, leagueSettings)
  );

  const total = breakdowns.reduce((sum, b) => sum + b.finalValue, 0);

  return {
    total,
    breakdowns
  };
}