"use client";

import * as React from "react";
import type { Player } from "@/lib/player";

const MOCK_RANKED_PLAYERS: Array<Player & { rank: number }> = [
  {
    id: "mah-1",
    rank: 1,
    name: "Patrick Mahomes (KC)",
    team: "KC",
    position: "QB",
    age: 28,
    baseValue: 98,
    starterStatus: "STARTER",
    injuryStatus: "HEALTHY"
  },
  {
    id: "jed-2",
    rank: 2,
    name: "Justin Jefferson (MIN)",
    team: "MIN",
    position: "WR",
    age: 25,
    baseValue: 96,
    starterStatus: "STARTER",
    injuryStatus: "HEALTHY"
  },
  {
    id: "jam-3",
    rank: 3,
    name: "Ja'Marr Chase (CIN)",
    team: "CIN",
    position: "WR",
    age: 25,
    baseValue: 95,
    starterStatus: "STARTER",
    injuryStatus: "HEALTHY"
  },
  {
    id: "bij-4",
    rank: 4,
    name: "Bijan Robinson (ATL)",
    team: "ATL",
    position: "RB",
    age: 22,
    baseValue: 94,
    starterStatus: "STARTER",
    injuryStatus: "HEALTHY"
  },
  {
    id: "lam-5",
    rank: 5,
    name: "Lamar Jackson (BAL)",
    team: "BAL",
    position: "QB",
    age: 28,
    baseValue: 93,
    starterStatus: "STARTER",
    injuryStatus: "HEALTHY"
  },
  {
    id: "ajb-6",
    rank: 6,
    name: "A.J. Brown (PHI)",
    team: "PHI",
    position: "WR",
    age: 27,
    baseValue: 92,
    starterStatus: "STARTER",
    injuryStatus: "HEALTHY"
  },
  {
    id: "sun-7",
    rank: 7,
    name: "Amon-Ra St. Brown (DET)",
    team: "DET",
    position: "WR",
    age: 24,
    baseValue: 91,
    starterStatus: "STARTER",
    injuryStatus: "HEALTHY"
  },
  {
    id: "gar-8",
    rank: 8,
    name: "Garrett Wilson (NYJ)",
    team: "NYJ",
    position: "WR",
    age: 24,
    baseValue: 90,
    starterStatus: "STARTER",
    injuryStatus: "HEALTHY"
  }
];

export default function NflPlayerValuesPage() {
  const [query, setQuery] = React.useState("");
  const [positionFilter, setPositionFilter] = React.useState<string>("ALL");

  const filteredPlayers = React.useMemo(() => {
    const q = query.toLowerCase().trim();

    return MOCK_RANKED_PLAYERS.filter((p) => {
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.team.toLowerCase().includes(q);

      const matchesPosition =
        positionFilter === "ALL" || p.position === positionFilter;

      return matchesSearch && matchesPosition;
    });
  }, [query, positionFilter]);

  return (
    <div className="space-y-6">

      <header className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
          NFL Dynasty Player Values & Rankings
        </h1>

        <p className="max-w-2xl text-sm text-slate-600">
          Dynasty-focused list of NFL players with their base dynasty value,
          current NFL team, and positional ranking.
        </p>
      </header>


      <section className="flex flex-col gap-3 rounded-xl border border-border bg-white p-3 shadow-card md:p-4">

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search player or team..."
            className="h-9 w-full rounded-lg border border-border px-3 text-sm"
          />

          <select
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value)}
            className="h-8 rounded-lg border border-border px-2 text-xs"
          >
            <option value="ALL">All</option>
            <option value="QB">QB</option>
            <option value="RB">RB</option>
            <option value="WR">WR</option>
            <option value="TE">TE</option>
          </select>

        </div>


        <div className="overflow-x-auto">

          <table className="min-w-full text-xs">

            <thead>
              <tr className="text-left text-[11px] uppercase text-slate-500">
                <th className="px-3 py-2">Rank</th>
                <th className="px-3 py-2">Player</th>
                <th className="px-3 py-2">Team</th>
                <th className="px-3 py-2">Pos</th>
                <th className="px-3 py-2 text-right">Value</th>
              </tr>
            </thead>

            <tbody>

              {filteredPlayers.map((player) => (
                <tr
                  key={player.id}
                  className="cursor-pointer bg-slate-50 hover:bg-slate-100"
                  onClick={() =>
                    (window.location.href = `/player/${player.name
                      .toLowerCase()
                      .replace(/\s+/g, "-")}`)
                  }
                >

                  <td className="px-3 py-2 font-semibold">
                    #{player.rank}
                  </td>

                  <td className="px-3 py-2 text-sm font-medium">
                    {player.name}
                  </td>

                  <td className="px-3 py-2">
                    {player.team}
                  </td>

                  <td className="px-3 py-2">
                    {player.position}
                  </td>

                  <td className="px-3 py-2 text-right">
                    {player.baseValue}
                  </td>

                </tr>
              ))}

            </tbody>

          </table>

        </div>

      </section>

    </div>
  );
}