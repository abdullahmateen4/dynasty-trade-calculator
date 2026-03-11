export type LeagueSize = 10 | 12 | 14 | 16;

export interface LeagueSettings {
  // Superflex toggle (ON = Superflex league, OFF = 1QB)
  superflex: boolean;

  // TE Premium scoring boost
  tePremium: boolean;

  // Supported league sizes
  leagueSize: LeagueSize;

  // Only PPR scoring supported
  scoringFormat: "PPR";

  // Trade fairness tolerance (% difference allowed)
  variance: number;

  // Future pick value discount (% per year)
  futurePickAdjustment: number;
}

export const defaultLeagueSettings: LeagueSettings = {
  superflex: true,
  tePremium: false,
  leagueSize: 12,
  scoringFormat: "PPR",
  variance: 5,
  futurePickAdjustment: 10
};