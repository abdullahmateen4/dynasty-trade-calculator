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
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>League Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <LeagueSettingsPanel
              value={leagueSettings}
              onChange={(next) => {
                // #region agent log
                fetch(
                  "http://127.0.0.1:7801/ingest/0929cd9c-c1fd-4bdc-8876-6cbf98bbecdf",
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      "X-Debug-Session-Id": "f6b2b7"
                    },
                    body: JSON.stringify({
                      sessionId: "f6b2b7",
                      runId: "pre-fix",
                      hypothesisId: "H2",
                      location:
                        "app/dynasty-trade-calculator/Calculator.tsx:LeagueSettingsPanel.onChange",
                      message: "User changed league settings",
                      data: next,
                      timestamp: Date.now()
                    })
                  }
                ).catch(() => {});
                // #endregion agent log

                setLeagueSettings(next);
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trade Result Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <TradeSummary
              teamA={teamA}
              teamB={teamB}
              leagueSettings={leagueSettings}
            />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Team A</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-3 space-y-2">
              <p className="text-[11px] text-slate-500">
                Type to search or use the dropdown to browse players for Team A.
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
                  className="whitespace-nowrap border border-border bg-white px-2 py-1 text-[11px] font-medium text-slate-700 shadow-none hover:bg-slate-50"
                  onClick={() => setShowAllA((prev) => !prev)}
                >
                  {showAllA ? "Hide" : "Browse"}
                </Button>
              </div>
              {filteredA.length > 0 && (
                <div className="mt-1 max-h-52 overflow-y-auto rounded-lg border border-border bg-white text-xs shadow-md">
                  {filteredA.map((player) => (
                    <button
                      key={player.id}
                      type="button"
                      className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-slate-50"
                      onClick={() => handleAddToTeam("A", player)}
                    >
                      <span>
                        <span className="font-medium">{player.name}</span>{" "}
                        <span className="text-[10px] text-slate-500">
                          {player.position} • {player.team}
                        </span>
                      </span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                        {player.baseValue}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              {teamA.length === 0 && (
                <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-center text-[11px] text-slate-500">
                  No players added yet. Use{" "}
                  <span className="font-semibold">Add Player</span> to start
                  building Team A&apos;s side of the trade.
                </p>
              )}
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

        <Card className="h-full">
          <CardHeader>
            <CardTitle>Team B</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-3 space-y-2">
              <p className="text-[11px] text-slate-500">
                Type to search or use the dropdown to browse players for Team B.
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
                  className="whitespace-nowrap border border-border bg-white px-2 py-1 text-[11px] font-medium text-slate-700 shadow-none hover:bg-slate-50"
                  onClick={() => setShowAllB((prev) => !prev)}
                >
                  {showAllB ? "Hide" : "Browse"}
                </Button>
              </div>
              {filteredB.length > 0 && (
                <div className="mt-1 max-h-52 overflow-y-auto rounded-lg border border-border bg-white text-xs shadow-md">
                  {filteredB.map((player) => (
                    <button
                      key={player.id}
                      type="button"
                      className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-slate-50"
                      onClick={() => handleAddToTeam("B", player)}
                    >
                      <span>
                        <span className="font-medium">{player.name}</span>{" "}
                        <span className="text-[10px] text-slate-500">
                          {player.position} • {player.team}
                        </span>
                      </span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                        {player.baseValue}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              {teamB.length === 0 && (
                <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-center text-[11px] text-slate-500">
                  No players added yet. Use{" "}
                  <span className="font-semibold">Add Player</span> to start
                  building Team B&apos;s side of the trade.
                </p>
              )}
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