export type Position = "QB" | "RB" | "WR" | "TE" | "DST" | "K";
export type StarterStatus = "STARTER" | "BACKUP" | "BENCH";
export type InjuryStatus = "HEALTHY" | "MINOR" | "MAJOR";

export type Player = {
  id: string;
  name: string;
  team: string;
  position: Position;
  age: number;
  baseValue: number;
  starterStatus: StarterStatus;
  injuryStatus: InjuryStatus;
};