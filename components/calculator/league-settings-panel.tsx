import type { LeagueSettings } from "@/lib/league-settings";
import { defaultLeagueSettings } from "@/lib/league-settings";

interface LeagueSettingsPanelProps {
  value: LeagueSettings;
  onChange: (value: LeagueSettings) => void;
}

export function LeagueSettingsPanel({
  value,
  onChange
}: LeagueSettingsPanelProps) {
  const handleChange = <K extends keyof LeagueSettings>(
    key: K,
    newValue: LeagueSettings[K]
  ) => {
    onChange({ ...value, [key]: newValue });
  };

  return (
    <div className="grid gap-3 text-xs md:grid-cols-3">
      <div className="flex flex-col gap-1">
        <label className="font-medium text-slate-700">QB Format</label>
        <select
          className="h-9 rounded-lg border border-border bg-white px-2 text-xs shadow-sm"
          value={value.qbFormat}
          onChange={(e) =>
            handleChange("qbFormat", e.target.value as LeagueSettings["qbFormat"])
          }
        >
          <option value="1QB">1QB</option>
          <option value="2QB">2QB</option>
          <option value="SUPERFLEX">Superflex</option>
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="font-medium text-slate-700">Scoring</label>
        <select
          className="h-9 rounded-lg border border-border bg-white px-2 text-xs shadow-sm"
          value={value.scoringFormat}
          onChange={(e) =>
            handleChange(
              "scoringFormat",
              e.target.value as LeagueSettings["scoringFormat"]
            )
          }
        >
          <option value="PPR">PPR</option>
          <option value="HALF_PPR">Half PPR</option>
          <option value="STANDARD">Standard</option>
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="font-medium text-slate-700">League Size</label>
        <select
          className="h-9 rounded-lg border border-border bg-white px-2 text-xs shadow-sm"
          value={value.leagueSize}
          onChange={(e) =>
            handleChange("leagueSize", Number(e.target.value) as any)
          }
        >
          {[12, 18, 24, 32].map((size) => (
            <option key={size} value={size}>
              {size} Teams
            </option>
          ))}
        </select>
      </div>
      <p className="col-span-full text-[11px] text-slate-500">
        Settings update positional value curves in real time. Defaults to{" "}
        {defaultLeagueSettings.qbFormat} • {defaultLeagueSettings.scoringFormat} •{" "}
        {defaultLeagueSettings.leagueSize}-team.
      </p>
    </div>
  );
}

