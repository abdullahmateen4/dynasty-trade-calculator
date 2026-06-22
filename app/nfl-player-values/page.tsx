"use client";

import * as React from "react";
import type { Player } from "@/lib/player";
import { getSupabaseClient } from "@/lib/supabaseClient";

function cleanStringForSearch(str: string): string {
  return str
    .toLowerCase()
    .replace(/[.'’\-]/g, "")
    .replace(/\s+(jr|sr|ii|iii|iv|v)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

export default function NflPlayerValuesPage() {
  const [query, setQuery] = React.useState("");
  const [positionFilter, setPositionFilter] = React.useState<string>("ALL");
  const [players, setPlayers] = React.useState<Array<Player & { rank: number }>>([]);

  // 🔥 Fetch data from Supabase
  React.useEffect(() => {
    const fetchPlayers = async () => {
      const supabase = getSupabaseClient();

      // 1. Fetch exact total count in Supabase for debug logging
      const { count: dbCount, error: countError } = await supabase
        .from("players")
        .select("*", { count: "exact", head: true });

      if (countError) {
        console.error("[Rankings] Error fetching exact player count:", countError);
      }

      // 2. Fetch all players in pages of 1000 with joined player_values
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
            injury_status,
            player_values(value)
          `)
          .order("id", { ascending: true })
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) {
          console.error(`[Rankings] Supabase error on page ${page}:`, error);
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

      const formatted = allRows.map((p: any) => {
        const valObj = p.player_values;
        const rawValue = Array.isArray(valObj)
          ? valObj[0]?.value
          : valObj?.value;
        const baseValue = Number(rawValue ?? 0);

        return {
          id: p.id,
          sleeper_id: p.sleeper_id || p.id,
          name: p.name,
          team: p.team,
          position: p.position,
          age: p.age,
          baseValue: baseValue,
          starterStatus: p.starter_status,
          injuryStatus: p.injury_status,
          rank: 0, // Assigned after sorting
        };
      });

      // 3. Sort players by value descending, then by name ascending
      formatted.sort((a, b) => {
        if (b.baseValue !== a.baseValue) {
          return b.baseValue - a.baseValue;
        }
        return a.name.localeCompare(b.name);
      });

      // 4. Dynamically assign global ranks
      const ranked = formatted.map((p, index) => ({
        ...p,
        rank: index + 1,
      }));

      console.log(`[Rankings] Total players in Supabase (exact count query): ${dbCount}`);
      console.log(`[Rankings] Total players loaded into state: ${ranked.length}`);

      setPlayers(ranked);
    };

    fetchPlayers();
  }, []);

  // Dynamically extract all unique positions present in the loaded dataset
  const positions = React.useMemo(() => {
    const set = new Set<string>();
    players.forEach((p) => {
      if (p.position) {
        set.add(p.position.trim().toUpperCase());
      }
    });
    return Array.from(set).sort();
  }, [players]);

  // 🔍 Filtering logic
  const filteredPlayers = React.useMemo(() => {
    const qClean = cleanStringForSearch(query);

    return players.filter((p) => {
      const matchesPosition =
        positionFilter === "ALL" || p.position === positionFilter;

      if (!qClean) return matchesPosition;

      const nameClean = cleanStringForSearch(p.name ?? "");
      const teamClean = (p.team ?? "").toLowerCase();
      const posClean = (p.position ?? "").toLowerCase();

      const matchesSearch =
        nameClean.includes(qClean) ||
        teamClean.includes(qClean) ||
        posClean.includes(qClean) ||
        `${nameClean} ${teamClean} ${posClean}`.includes(qClean);

      return matchesSearch && matchesPosition;
    });
  }, [query, positionFilter, players]);

  // 🚀 Rendering optimization: display only top 100 matches in the table
  const displayedPlayers = React.useMemo(() => {
    return filteredPlayers.slice(0, 100);
  }, [filteredPlayers]);

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
            <option value="ALL">All Positions</option>
            {positions.map((pos) => (
              <option key={pos} value={pos}>
                {pos}
              </option>
            ))}
          </select>
        </div>

        {/* 📊 Count Display Banner */}
        <div className="flex justify-between items-center text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
          <span>Showing top {displayedPlayers.length} of {filteredPlayers.length} matches</span>
          <span>Loaded {players.length} total players</span>
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
              {displayedPlayers.map((player) => (
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