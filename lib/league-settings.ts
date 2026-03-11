export type QbFormat = "1QB" | "2QB" | "SUPERFLEX";
export type ScoringFormat = "STANDARD" | "HALF_PPR" | "PPR";

export type LeagueSize = 12 | 18 | 24 | 32;

export interface LeagueSettings {
  qbFormat: QbFormat;
  scoringFormat: ScoringFormat;
  leagueSize: LeagueSize;
}

export const defaultLeagueSettings: LeagueSettings = {
  qbFormat: "SUPERFLEX",
  scoringFormat: "PPR",
  leagueSize: 12
};

