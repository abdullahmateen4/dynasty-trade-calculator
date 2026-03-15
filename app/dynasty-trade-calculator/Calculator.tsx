"use client";

import * as React from "react";
import { supabase } from "@/lib/supabaseClient";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
    id: row.id,
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
          player_values (
            value
          )
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

  }, []);

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
            <CardTitle className="text-lg font-semibold text-slate-800">
              Team A
            </CardTitle>
          </CardHeader>

          <CardContent className="py-2">

            <div className="mb-2 space-y-1.5">

              <p className="text-[11px] text-slate-500">
                Type to search or browse players for Team A.
              </p>

              <div className="flex items-center gap-2">

                <Input
                  placeholder="Search and add player to Team A…"
                  value={searchA}
                  onChange={(e) => {
                    setSearchA(e.target.value);
                    setShowAllA(false);
                  }}
                />

                <Button
                  type="button"
                  onClick={() => setShowAllA(prev => !prev)}
                >
                  {showAllA ? "Hide" : "Browse"}
                </Button>

              </div>

              {filteredA.length > 0 && (
                <div className="mt-1 max-h-52 overflow-y-auto rounded-lg border bg-white text-xs shadow-md">

                  {filteredA.map(player => (

                    <button
                      key={player.id}
                      type="button"
                      className="flex w-full items-center justify-between px-3 py-2 hover:bg-slate-50"
                      onClick={() => handleAddToTeam("A", player)}
                    >

                      <span>
                        <span className="font-medium">{player.name}</span>{" "}
                        <span className="text-[10px] text-slate-500">
                          {player.position} • {player.team}
                        </span>
                      </span>

                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold">
                        {player.baseValue}
                      </span>

                    </button>

                  ))}

                </div>
              )}

            </div>

            <div className="flex flex-col gap-2">

              {teamA.length === 0 && (
                <p className="text-center text-[11px] text-slate-500">
                  No players added yet.
                </p>
              )}

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
            <CardTitle className="text-lg font-semibold text-slate-800">
              Team B
            </CardTitle>
          </CardHeader>

          <CardContent className="py-2">

            <div className="mb-2 space-y-1.5">

              <p className="text-[11px] text-slate-500">
                Type to search or browse players for Team B.
              </p>

              <div className="flex items-center gap-2">

                <Input
                  placeholder="Search and add player to Team B…"
                  value={searchB}
                  onChange={(e) => {
                    setSearchB(e.target.value);
                    setShowAllB(false);
                  }}
                />

                <Button
                  type="button"
                  onClick={() => setShowAllB(prev => !prev)}
                >
                  {showAllB ? "Hide" : "Browse"}
                </Button>

              </div>

              {filteredB.length > 0 && (
                <div className="mt-1 max-h-52 overflow-y-auto rounded-lg border bg-white text-xs shadow-md">

                  {filteredB.map(player => (

                    <button
                      key={player.id}
                      type="button"
                      className="flex w-full items-center justify-between px-3 py-2 hover:bg-slate-50"
                      onClick={() => handleAddToTeam("B", player)}
                    >

                      <span>
                        <span className="font-medium">{player.name}</span>{" "}
                        <span className="text-[10px] text-slate-500">
                          {player.position} • {player.team}
                        </span>
                      </span>

                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold">
                        {player.baseValue}
                      </span>

                    </button>

                  ))}

                </div>
              )}

            </div>

            <div className="flex flex-col gap-2">

              {teamB.length === 0 && (
                <p className="text-center text-[11px] text-slate-500">
                  No players added yet.
                </p>
              )}

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