"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LeagueSettingsPanel } from "@/components/calculator/league-settings-panel";
import { TradeSummary } from "@/components/calculator/trade-summary";
import { PlayerCard } from "@/components/player/player-card";
import { defaultLeagueSettings, type LeagueSettings } from "@/lib/league-settings";
import type { Player } from "@/lib/player";

const MOCK_PLAYERS: Player[] = [
  {
    id: "mahomes",
    name: "Patrick Mahomes (KC)",
    team: "KC",
    position: "QB",
    age: 28,
    baseValue: 98,
    starterStatus: "STARTER",
    injuryStatus: "HEALTHY"
  },
  {
    id: "jefferson",
    name: "Justin Jefferson (MIN)",
    team: "MIN",
    position: "WR",
    age: 25,
    baseValue: 96,
    starterStatus: "STARTER",
    injuryStatus: "HEALTHY"
  },
  {
    id: "rookie-rb",
    name: "Rookie RB Prospect",
    team: "FA",
    position: "RB",
    age: 22,
    baseValue: 86,
    starterStatus: "BACKUP",
    injuryStatus: "HEALTHY"
  },
  {
    id: "veteran-rb",
    name: "Veteran RB (DAL)",
    team: "DAL",
    position: "RB",
    age: 29,
    baseValue: 79,
    starterStatus: "STARTER",
    injuryStatus: "MINOR"
  }
];

export default function Calculator() {
  const [leagueSettings, setLeagueSettings] = React.useState<LeagueSettings>(
    defaultLeagueSettings
  );
  const [teamA, setTeamA] = React.useState<Player[]>([]);
  const [teamB, setTeamB] = React.useState<Player[]>([]);
  const [searchA, setSearchA] = React.useState("");
  const [searchB, setSearchB] = React.useState("");
  const [showAllA, setShowAllA] = React.useState(false);
  const [showAllB, setShowAllB] = React.useState(false);

  const handleRemovePlayer = (team: "A" | "B", playerId: string) => {
    if (team === "A") {
      setTeamA((prev) => prev.filter((p) => p.id !== playerId));
    } else {
      setTeamB((prev) => prev.filter((p) => p.id !== playerId));
    }
  };

  const handleAddToTeam = (team: "A" | "B", player: Player) => {
    if (team === "A") {
      setTeamA((prev) => [...prev, player]);
      setSearchA("");
      setShowAllA(false);
    } else {
      setTeamB((prev) => [...prev, player]);
      setSearchB("");
      setShowAllB(false);
    }
  };

  const filteredA = React.useMemo(() => {
    const q = searchA.toLowerCase().trim();
    const base = MOCK_PLAYERS.filter((p) => {
      const text = `${p.name} ${p.team} ${p.position}`.toLowerCase();
      return showAllA ? true : text.includes(q);
    });
    if (!showAllA && !q) return [];
    return base.slice(0, 8);
  }, [searchA, showAllA]);

  const filteredB = React.useMemo(() => {
    const q = searchB.toLowerCase().trim();
    const base = MOCK_PLAYERS.filter((p) => {
      const text = `${p.name} ${p.team} ${p.position}`.toLowerCase();
      return showAllB ? true : text.includes(q);
    });
    if (!showAllB && !q) return [];
    return base.slice(0, 8);
  }, [searchB, showAllB]);

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

        <Card className="h-full border-slate-200 shadow-md">

          <CardHeader className="py-2.5 bg-blue-50 border-b border-blue-100 rounded-t-lg">
            <CardTitle className="text-lg font-semibold text-slate-800">
              Team A
            </CardTitle>
          </CardHeader>

          <CardContent className="py-2">
            <div className="flex flex-col gap-2">
              {teamA.map((player) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  onRemove={() => handleRemovePlayer("A", player.id)}
                />
              ))}
            </div>
          </CardContent>

        </Card>

        <Card className="h-full border-slate-200 shadow-md">

          <CardHeader className="py-2.5 bg-blue-50 border-b border-blue-100 rounded-t-lg">
            <CardTitle className="text-lg font-semibold text-slate-800">
              Team B
            </CardTitle>
          </CardHeader>

          <CardContent className="py-2">
            <div className="flex flex-col gap-2">
              {teamB.map((player) => (
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