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
    sleeper_id: row.sleeper_id || String(row.id),
    name: row.name,
    team: row.team ?? "",
    position: row.position ?? "",
    age: row.age ?? null,
    baseValue: 0,
    starterStatus: row.starter_status ?? false,
    injuryStatus: row.injury_status ?? null
  };
}

function cleanStringForSearch(str: string): string {
  return str
    .toLowerCase()
    .replace(/[.'’\-]/g, "")
    .replace(/\s+(jr|sr|ii|iii|iv|v)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
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
      // 1. Fetch the exact count of players in the Supabase table for debug logging
      const { count: dbCount, error: countError } = await supabase
        .from("players")
        .select("*", { count: "exact", head: true });

      if (countError) {
        console.error("[Calculator] Error fetching exact player count:", countError);
      }

      // 2. Fetch all players using pagination
      let allRows: any[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from("players")
          .select(`
            id,
            sleeper_id,
            name,
            team,
            position,
            age,
            starter_status,
            injury_status
          `)
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) {
          console.error(`[Calculator] Error loading players on page ${page}:`, error);
          break;
        }

        if (data && data.length > 0) {
          allRows = [...allRows, ...data];
          if (data.length < pageSize) {
            hasMore = false;
          } else {
            page++;
          }
        } else {
          hasMore = false;
        }
      }

      const rawList = allRows;
      console.log("🔥 [Calculator] PLAYER LOADING COMPLETED 🔥");
      console.log(`[Calculator] Total players in Supabase (exact count query): ${dbCount}`);
      console.log(`[Calculator] Total players loaded before cleanup: ${rawList.length}`);

      // Filter to only keep currently rostered NFL players
      const rostered = rawList.filter((row: any) => {
        if (!row.team) return false;

        const team = row.team.trim().toUpperCase();

        if (team === "" || team === "FA" || team === "FREE AGENT") {
          return false;
        }

        return true;
      });

      console.log(`[Calculator] Rostered players after team filtering: ${rostered.length}`);

      // Deduplicate
      const seenIds = new Set<string>();
      const seenNames = new Set<string>();
      const uniqueRostered: any[] = [];

      for (const row of rostered) {
        const sleeperId = row.sleeper_id;

        if (sleeperId) {
          if (seenIds.has(sleeperId)) continue;
          seenIds.add(sleeperId);
        }

        const nameTeamKey = `${row.name.toLowerCase().trim()}|${row.team?.toLowerCase().trim()}`;

        if (row.team) {
          if (seenNames.has(nameTeamKey)) continue;
          seenNames.add(nameTeamKey);
        }

        uniqueRostered.push(row);
      }

      // Sort results by Dynasty value descending, Name ascending
      uniqueRostered.sort((a, b) => {
        const valA = 0;
        const valB = 0;

        if (valB !== valA) {
          return valB - valA;
        }

        return a.name.localeCompare(b.name);
      });

      console.log(`[Calculator] Total unique rostered players loaded: ${uniqueRostered.length}`);

      const mappedPlayers = uniqueRostered.map(mapPlayerRowToPlayer);
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
    const qClean = cleanStringForSearch(searchA);

    const base = players.filter(p => {
      if (showAllA) return true;
      const nameClean = cleanStringForSearch(p.name);
      const teamClean = p.team.toLowerCase();
      const posClean = p.position.toLowerCase();

      return nameClean.includes(qClean) || 
             teamClean.includes(qClean) || 
             posClean.includes(qClean) || 
             `${nameClean} ${teamClean} ${posClean}`.includes(qClean);
    });

    if (!showAllA && !qClean) return [];
    return base.slice(0, 8);
  }, [searchA, showAllA, players]);

  const filteredB = React.useMemo(() => {
    const qClean = cleanStringForSearch(searchB);

    const base = players.filter(p => {
      if (showAllB) return true;
      const nameClean = cleanStringForSearch(p.name);
      const teamClean = p.team.toLowerCase();
      const posClean = p.position.toLowerCase();

      return nameClean.includes(qClean) || 
             teamClean.includes(qClean) || 
             posClean.includes(qClean) || 
             `${nameClean} ${teamClean} ${posClean}`.includes(qClean);
    });

    if (!showAllB && !qClean) return [];
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