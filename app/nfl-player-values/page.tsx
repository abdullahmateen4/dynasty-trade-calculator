"use client";

import * as React from "react";
import type { Player } from "@/lib/player";
import { getSupabaseClient } from "@/lib/supabaseClient";

export default function NflPlayerValuesPage() {
  const [query, setQuery] = React.useState("");
  const [positionFilter, setPositionFilter] = React.useState<string>("ALL");
  const [players, setPlayers] = React.useState<Array<Player & { rank: number }>>([]);

  // 🔥 Fetch data from Supabase
  React.useEffect(() => {
    const fetchPlayers = async () => {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from("players")
        .select("*")
        .order("rank", { ascending: true })
        .limit(100);

      if (error) {
        console.error("Supabase error:", error);
        return;
      }

      const formatted = data.map((p: any) => ({
        id: p.id,
        name: p.name,
        team: p.team,
        position: p.position,
        age: p.age,
        baseValue: p.base_value,
        starterStatus: p.starter_status,
        injuryStatus: p.injury_status,
        rank: p.rank,
      }));

      setPlayers(formatted);
    };

    fetchPlayers();
  }, []);

  // 🔍 Filtering logic
  const filteredPlayers = React.useMemo(() => {
    const q = query.toLowerCase().trim();

    return players.filter((p) => {
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.team.toLowerCase().includes(q);

      const matchesPosition =
        positionFilter === "ALL" || p.position === positionFilter;

      return matchesSearch && matchesPosition;
    });
  }, [query, positionFilter, players]);

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