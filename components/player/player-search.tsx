"use client";

import * as React from "react";
import type { Player } from "@/lib/player";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlayerCard } from "./player-card";
import { searchPlayers } from "@/lib/services/playerSearchService";

interface PlayerSearchProps {
  onSelect: (player: Player) => void;
}

export function PlayerSearch({ onSelect }: PlayerSearchProps) {
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<Player[]>([]);
  const [loading, setLoading] = React.useState(false);

  // 🔥 THIS IS THE MAIN SEARCH ENGINE
  React.useEffect(() => {
    console.log("🔥 EFFECT RUN:", query);

    const delay = setTimeout(async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      console.log("🚀 CALLING SEARCH");

      setLoading(true);

      const data = await searchPlayers(query);

      console.log("📦 DATA RETURNED:", data);

      setResults(data);
      setLoading(false);
    }, 300);

    return () => clearTimeout(delay);
  }, [query]);

  return (
    <div className="flex flex-col gap-3">
      {/* 🔍 INPUT */}
      <div className="flex items-center gap-2">
        <Input
          placeholder="Search by player, team, or position…"
          value={query}
          onChange={(e) => {
            console.log("⌨️ INPUT:", e.target.value);
            setQuery(e.target.value);
          }}
        />

        <Button
          type="button"
          className="hidden whitespace-nowrap md:inline-flex"
          onClick={() => {
            setQuery("");
            setResults([]);
          }}
        >
          Clear
        </Button>
      </div>

      {/* ⏳ LOADING */}
      {loading && (
        <p className="text-xs text-slate-500">Searching players...</p>
      )}

      {/* 📋 RESULTS */}
      <div className="flex max-h-72 flex-col gap-2 overflow-y-auto">
        {!loading && results.length === 0 && query.length >= 2 && (
          <p className="py-4 text-center text-xs text-slate-500">
            No players match this search.
          </p>
        )}

        {results.map((player) => (
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