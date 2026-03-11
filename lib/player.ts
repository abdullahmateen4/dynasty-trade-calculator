export type Position = "QB" | "RB" | "WR" | "TE" | "DST" | "K";

export type StarterStatus = "STARTER" | "BACKUP";

export type InjuryStatus = "HEALTHY" | "MINOR" | "MAJOR";

export interface Player {
  id: string;
  name: string;
  team: string;
  position: Position;
  age: number;
  baseValue: number;
  starterStatus: StarterStatus;
  injuryStatus: InjuryStatus;
}

export interface PlayerValueHistoryPoint {
  month: string;
  value: number;
}

