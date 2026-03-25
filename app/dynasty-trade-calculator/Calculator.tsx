"use client";

import * as React from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { LeagueSettingsPanel } from "@/components/calculator/league-settings-panel";
import { TradeSummary } from "@/components/calculator/trade-summary";
import { PlayerCard } from "@/components/player/player-card";

import {
  defaultLeagueSettings,
  type LeagueSettings
} from "@/lib/league-settings";

import type { Player } from "@/lib/player";

/* -----------------------------
Mapper: DB → UI
----------------------------- */

function mapPlayerRowToPlayer(row: any): Player {
  return {
    id: String(row.id),

    // ✅ FIX ADDED (nothing else changed)
    sleeper_id: String(row.sleeper_id ?? row.id),

    name: row.name,
    team: row.team ?? "",
    position: row.position ?? "",
    age: row.age ?? null,
    baseValue: row.player_values?.[0]?.value ?? 0,
    starterStatus: row.starter_status ?? false,
    injuryStatus: row.injury_status ?? null
  };
}

export default function Calculator() {

  const supabase = React.useMemo(() => getSupabaseClient(), []);

  const [players, setPlayers] = React.useState<Player[]>([]);
  const [leagueSettings, setLeagueSettings] =
    React.useState<LeagueSettings>(defaultLeagueSettings);

  const [teamA, setTeamA] = React.useState<Player[]>([]);
  const [teamB, setTeamB] = React.useState<Player[]>([]);

  const [searchA, setSearchA] = React.useState("");
  const [searchB, setSearchB] = React.useState("");

  const [showAllA, setShowAllA] = React.useState(false);
  const [showAllB, setShowAllB] = React.useState(false);

  /* -----------------------------
  Load players from Supabase
  ----------------------------- */

  React.useEffect(() => {

    async function loadPlayers() {

      const { data, error } = await supabase
        .from("players")
        .select(`
          id,
          name,
          team,
          position,
          age,
          starter_status,
          injury_status,
          player_values(value)
        `)
        .order("name");

      if (error) {
        console.error("Error loading players:", error);
        return;
      }

      const mappedPlayers = (data || []).map(mapPlayerRowToPlayer);
      setPlayers(mappedPlayers);
    }

    loadPlayers();

  }, [supabase]);

  /* -----------------------------
  Handlers
  ----------------------------- */

  const handleRemovePlayer = (team: "A" | "B", playerId: string) => {
    if (team === "A") {
      setTeamA(prev => prev.filter(p => p.id !== playerId));
    } else {
      setTeamB(prev => prev.filter(p => p.id !== playerId));
    }
  };

  const handleAddToTeam = (team: "A" | "B", player: Player) => {
    if (team === "A") {
      setTeamA(prev => [...prev, player]);
      setSearchA("");
      setShowAllA(false);
    } else {
      setTeamB(prev => [...prev, player]);
      setSearchB("");
      setShowAllB(false);
    }
  };

  /* -----------------------------
  Filters
  ----------------------------- */

  const filteredA = React.useMemo(() => {

    const q = searchA.toLowerCase().trim();

    const base = players.filter(p => {
      const text = `${p.name} ${p.team} ${p.position}`.toLowerCase();
      return showAllA ? true : text.includes(q);
    });

    if (!showAllA && !q) return [];
    return base.slice(0, 8);

  }, [searchA, showAllA, players]);

  const filteredB = React.useMemo(() => {

    const q = searchB.toLowerCase().trim();

    const base = players.filter(p => {
      const text = `${p.name} ${p.team} ${p.position}`.toLowerCase();
      return showAllB ? true : text.includes(q);
    });

    if (!showAllB && !q) return [];
    return base.slice(0, 8);

  }, [searchB, showAllB, players]);

  /* -----------------------------
  UI
  ----------------------------- */

  return (

    <div className="flex flex-col gap-4">

      <section className="grid gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">

        <Card className="border-slate-200 shadow-md">
          <CardHeader className="py-2.5 bg-blue-50 border-b border-blue-100 rounded-t-lg">
            <CardTitle className="text-lg font-semibold text-slate-800">
              League Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <LeagueSettingsPanel
              value={leagueSettings}
              onChange={setLeagueSettings}
            />
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-md">
          <CardHeader className="py-2.5 bg-blue-50 border-b border-blue-100 rounded-t-lg">
            <CardTitle className="text-lg font-semibold text-slate-800">
              Trade Result
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <TradeSummary
              teamA={teamA}
              teamB={teamB}
              leagueSettings={leagueSettings}
            />
          </CardContent>
        </Card>

      </section>

      <section className="grid gap-3 md:grid-cols-2">

        {/* TEAM A */}
        <Card className="h-full border-slate-200 shadow-md">
          <CardHeader className="py-2.5 bg-blue-50 border-b border-blue-100 rounded-t-lg">
            <CardTitle>Team A</CardTitle>
          </CardHeader>
          <CardContent className="py-2">

            <Input
              placeholder="Search player..."
              value={searchA}
              onChange={(e) => {
                setSearchA(e.target.value);
                setShowAllA(false);
              }}
            />

            {filteredA.length > 0 && (
              <div className="max-h-60 overflow-y-auto border mt-2 rounded">
                {filteredA.map(player => (
                  <button
                    key={player.id}
                    onClick={() => handleAddToTeam("A", player)}
                    className="w-full text-left p-2 hover:bg-gray-100"
                  >
                    {player.name} ({player.position} - {player.team})
                  </button>
                ))}
              </div>
            )}

            <div className="mt-3 flex flex-col gap-2">
              {teamA.map(player => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  onRemove={() => handleRemovePlayer("A", player.id)}
                />
              ))}
            </div>

          </CardContent>
        </Card>

        {/* TEAM B */}
        <Card className="h-full border-slate-200 shadow-md">
          <CardHeader className="py-2.5 bg-blue-50 border-b border-blue-100 rounded-t-lg">
            <CardTitle>Team B</CardTitle>
          </CardHeader>
          <CardContent className="py-2">

            <Input
              placeholder="Search player..."
              value={searchB}
              onChange={(e) => {
                setSearchB(e.target.value);
                setShowAllB(false);
              }}
            />

            {filteredB.length > 0 && (
              <div className="max-h-60 overflow-y-auto border mt-2 rounded">
                {filteredB.map(player => (
                  <button
                    key={player.id}
                    onClick={() => handleAddToTeam("B", player)}
                    className="w-full text-left p-2 hover:bg-gray-100"
                  >
                    {player.name} ({player.position} - {player.team})
                  </button>
                ))}
              </div>
            )}

            <div className="mt-3 flex flex-col gap-2">
              {teamB.map(player => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  onRemove={() => handleRemovePlayer("B", player.id)}
                />
              ))}
            </div>

          </CardContent>
        </Card>

      </section>

    </div>
  );
}