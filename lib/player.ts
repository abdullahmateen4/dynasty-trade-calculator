export interface Player {
  id: string;
  name: string;
  team: string;
  position: string;
  age: number | null;

  baseValue: number;

  starterStatus: boolean;
  injuryStatus: string | null;
}