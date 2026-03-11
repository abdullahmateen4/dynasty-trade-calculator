import * as React from "react";
import type { Player } from "@/lib/player";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlayerCard } from "./player-card";

interface PlayerSearchProps {
  players: Player[];
  onSelect: (player: Player) => void;
}

export function PlayerSearch({ players, onSelect }: PlayerSearchProps) {
  const [query, setQuery] = React.useState("");

  const filtered = React.useMemo(() => {
    const q = query.toLowerCase();
    return players.filter((p) => {
      const nameMatch = p.name.toLowerCase().includes(q);
      const teamMatch = p.team.toLowerCase().includes(q);
      const positionMatch = p.position.toLowerCase().includes(q);
      return nameMatch || teamMatch || positionMatch;
    });
  }, [players, query]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Search by player, team, or position…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button
          type="button"
          className="hidden whitespace-nowrap md:inline-flex"
          onClick={() => setQuery("")}
        >
          Clear
        </Button>
      </div>
      <div className="flex max-h-72 flex-col gap-2 overflow-y-auto">
        {filtered.length === 0 && (
          <p className="py-4 text-center text-xs text-slate-500">
            No players match this search yet.
          </p>
        )}
        {filtered.map((player) => (
          <button
            key={player.id}
            type="button"
            onClick={() => onSelect(player)}
            className="text-left"
          >
            <PlayerCard player={player} />
          </button>
        ))}
      </div>
    </div>
  );
}

