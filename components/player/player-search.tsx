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

  // 🔥 Prevent race conditions (VERY IMPORTANT)
  const lastQueryRef = React.useRef("");

  React.useEffect(() => {
    const runSearch = async () => {
      const trimmed = query.trim();

      console.log("🔥 SEARCH TRIGGERED:", trimmed);

      if (!trimmed || trimmed.length < 2) {
        setResults([]);
        return;
      }

      lastQueryRef.current = trimmed;
      setLoading(true);

      try {
        const data = await searchPlayers(trimmed);

        console.log("📦 RESULTS FROM SUPABASE:", data);

        // 🚨 Prevent outdated results overriding new ones
        if (lastQueryRef.current !== trimmed) return;

        if (Array.isArray(data)) {
          setResults(data);
        } else {
          console.warn("⚠️ Unexpected data format:", data);
          setResults([]);
        }
      } catch (err) {
        console.error("❌ SEARCH FAILED:", err);
        setResults([]);
      } finally {
        if (lastQueryRef.current === trimmed) {
          setLoading(false);
        }
      }
    };

    // ⏱ Debounce
    const delay = setTimeout(runSearch, 300);

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
            const value = e.target.value;
            console.log("⌨️ INPUT:", value);
            setQuery(value);
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
            key={player.sleeper_id} // ✅ FIXED (no more red line)
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