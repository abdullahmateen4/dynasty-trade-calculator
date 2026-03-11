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

const clamp = (value: number, min = 1, max = 100) =>
  Math.min(max, Math.max(min, value));

function getAgeAdjustment(age: number): number {
  if (age >= 22 && age <= 26) return 3;
  if (age >= 27 && age <= 29) return 1;
  if (age >= 30 && age <= 32) return -2;
  if (age >= 33) return -5;
  return 0;
}

function getInjuryAdjustment(status: InjuryStatus): number {
  switch (status) {
    case "MINOR":
      return -2;
    case "MAJOR":
      return -6;
    case "HEALTHY":
    default:
      return 0;
  }
}

function getStarterAdjustment(status: StarterStatus): number {
  switch (status) {
    case "STARTER":
      return 3;
    case "BACKUP":
      return -4;
    default:
      return 0;
  }
}

function getPositionBaseAdjustment(position: Position, league: LeagueSettings) {
  const sizeFactor = league.leagueSize / 12;

  if (position === "QB") {
    if (league.qbFormat === "SUPERFLEX") return 8 * sizeFactor;
    if (league.qbFormat === "2QB") return 5 * sizeFactor;
    return 2 * sizeFactor;
  }

  if (position === "RB") {
    if (league.scoringFormat === "PPR") return 3 * sizeFactor;
    if (league.scoringFormat === "HALF_PPR") return 2 * sizeFactor;
    return 1 * sizeFactor;
  }

  if (position === "WR") {
    if (league.scoringFormat === "PPR") return 4 * sizeFactor;
    if (league.scoringFormat === "HALF_PPR") return 3 * sizeFactor;
    return 1.5 * sizeFactor;
  }

  if (position === "TE") {
    if (league.scoringFormat === "PPR") return 3 * sizeFactor;
    return 1.5 * sizeFactor;
  }

  return 0;
}

function getScheduleAdjustment(_player: Player): number {
  return 0;
}

function getProjectionAdjustment(baseValue: number): number {
  const centered = baseValue - 50;
  return centered / 50;
}

export function calculatePlayerValue(
  player: Player,
  leagueSettings: LeagueSettings
): PlayerValueBreakdown {
  // #region agent log
  fetch("http://127.0.0.1:7801/ingest/0929cd9c-c1fd-4bdc-8876-6cbf98bbecdf", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "f6b2b7"
    },
    body: JSON.stringify({
      sessionId: "f6b2b7",
      runId: "pre-fix",
      hypothesisId: "H1",
      location: "lib/value-calculation.ts:calculatePlayerValue",
      message: "Calculating player value with league settings",
      data: {
        playerId: player.id,
        position: player.position,
        qbFormat: leagueSettings.qbFormat,
        scoringFormat: leagueSettings.scoringFormat,
        leagueSize: leagueSettings.leagueSize
      },
      timestamp: Date.now()
    })
  }).catch(() => {});
  // #endregion agent log

  const ageAdjustment = getAgeAdjustment(player.age);
  const injuryAdjustment = getInjuryAdjustment(player.injuryStatus);
  const starterAdjustment = getStarterAdjustment(player.starterStatus);
  const positionAdjustment = getPositionBaseAdjustment(
    player.position,
    leagueSettings
  );
  const scheduleAdjustment = getScheduleAdjustment(player);
  const projectionAdjustment = getProjectionAdjustment(player.baseValue);

  const raw =
    player.baseValue +
    ageAdjustment +
    injuryAdjustment +
    starterAdjustment +
    positionAdjustment +
    scheduleAdjustment +
    projectionAdjustment;

  const finalValue = clamp(raw);

  return {
    baseValue: player.baseValue,
    ageAdjustment,
    injuryAdjustment,
    positionAdjustment,
    starterAdjustment,
    scheduleAdjustment,
    projectionAdjustment,
    finalValue
  };
}

export function summarizeTeamValue(
  players: Player[],
  leagueSettings: LeagueSettings
) {
  const breakdowns = players.map((p) => calculatePlayerValue(p, leagueSettings));
  const total = breakdowns.reduce((sum, b) => sum + b.finalValue, 0);

  return {
    total,
    breakdowns
  };
}

