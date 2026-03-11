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
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
        <div className="flex items-center gap-4">
          <div>
            <div className="text-[11px] uppercase text-slate-500">Team A</div>
            <div className="text-base font-semibold text-slate-900">
              {teamAResult.total.toFixed(1)}
            </div>
          </div>
          <div>
            <div className="text-[11px] uppercase text-slate-500">Team B</div>
            <div className="text-base font-semibold text-slate-900">
              {teamBResult.total.toFixed(1)}
            </div>
          </div>
        </div>
        <div className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
          {winner}
        </div>
      </div>
      <p className="px-1 text-[11px] text-slate-500">
        Format: <span className="font-semibold">{leagueSettings.qbFormat}</span>{" "}
        • <span className="font-semibold">{leagueSettings.scoringFormat}</span>{" "}
        •{" "}
        <span className="font-semibold">
          {leagueSettings.leagueSize}-team league
        </span>
        . Player values scale with this format.
      </p>
      <div className="mt-1 flex flex-col gap-1">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Why this result
        </div>
        <ul className="list-disc space-y-1 pl-4 text-[11px] text-slate-600">
          {explanation.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="mt-1 text-[11px] text-slate-400">{favors}</p>
      </div>
    </div>
  );
}

