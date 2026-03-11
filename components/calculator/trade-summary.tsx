import type { Player } from "@/lib/player";
import type { LeagueSettings } from "@/lib/league-settings";
import { summarizeTeamValue } from "@/lib/value-calculation";

interface TradeSummaryProps {
  teamA: Player[];
  teamB: Player[];
  leagueSettings: LeagueSettings;
}

export function TradeSummary({ teamA, teamB, leagueSettings }: TradeSummaryProps) {
  const teamAResult = summarizeTeamValue(teamA, leagueSettings);
  const teamBResult = summarizeTeamValue(teamB, leagueSettings);

  const diff = teamAResult.total - teamBResult.total;

  const winner =
    diff > 5 ? "Team A Wins" : diff < -5 ? "Team B Wins" : "Balanced Trade";

  const explanation: string[] = [];

  if (diff > 5) {
    explanation.push("Team A carries a higher combined dynasty value score.");
  } else if (diff < -5) {
    explanation.push("Team B carries a higher combined dynasty value score.");
  } else {
    explanation.push("Total values are within a small range, indicating a fair deal.");
  }

  const avgAgeA =
    teamA.length > 0
      ? teamA.reduce((sum, p) => sum + p.age, 0) / teamA.length
      : null;

  const avgAgeB =
    teamB.length > 0
      ? teamB.reduce((sum, p) => sum + p.age, 0) / teamB.length
      : null;

  if (avgAgeA && avgAgeB) {
    if (avgAgeA < avgAgeB - 0.8) {
      explanation.push("Team A has a younger core of players.");
    } else if (avgAgeB < avgAgeA - 0.8) {
      explanation.push("Team B has a younger core of players.");
    }
  }

  const startersA = teamA.filter((p) => p.starterStatus === "STARTER").length;
  const startersB = teamB.filter((p) => p.starterStatus === "STARTER").length;

  if (startersA !== startersB) {
    explanation.push(
      `${startersA > startersB ? "Team A" : "Team B"} sends more projected starters.`
    );
  }

  const favors =
    winner === "Balanced Trade"
      ? "This looks like a fair dynasty trade based on current assumptions."
      : "Use league context, roster needs, and risk tolerance before finalizing.";

  return (
    <div className="flex flex-col gap-2 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-100 px-4 py-3 ring-1 ring-slate-200">
        <div className="flex items-center gap-6">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Team A
            </div>
            <div className="text-2xl font-bold tabular-nums text-slate-900">
              {teamAResult.total.toFixed(1)}
            </div>
          </div>

          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Team B
            </div>
            <div className="text-2xl font-bold tabular-nums text-slate-900">
              {teamBResult.total.toFixed(1)}
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-bold text-white shadow-sm">
          {winner}
        </div>
      </div>

      {/* Updated league settings display */}
      <p className="px-1 text-[10px] text-slate-500">
        {leagueSettings.superflex ? "SUPERFLEX" : "1QB"} • PPR • {leagueSettings.leagueSize}-team
        {leagueSettings.tePremium && " • TE Premium"}
      </p>

      <details className="mt-0.5">
        <summary className="cursor-pointer text-[10px] font-medium text-slate-500">
          Why this result
        </summary>

        <ul className="mt-0.5 list-disc space-y-0.5 pl-4 text-[10px] text-slate-600">
          {explanation.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <p className="mt-0.5 text-[10px] text-slate-400">{favors}</p>
      </details>
    </div>
  );
}