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
    <div className="grid gap-3 text-xs md:grid-cols-2 lg:grid-cols-4">

      {/* Superflex Toggle */}
      <div className="flex flex-col gap-1">
        <label className="font-medium text-slate-700">Superflex</label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={value.superflex}
            onChange={(e) => handleChange("superflex", e.target.checked)}
          />
          Enable Superflex
        </label>
      </div>

      {/* TE Premium Toggle */}
      <div className="flex flex-col gap-1">
        <label className="font-medium text-slate-700">TE Premium</label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={value.tePremium}
            onChange={(e) => handleChange("tePremium", e.target.checked)}
          />
          TE Premium Scoring
        </label>
      </div>

      {/* League Size */}
      <div className="flex flex-col gap-1">
        <label className="font-medium text-slate-700">League Size</label>
        <select
          className="h-9 rounded-lg border border-border bg-white px-2 text-xs shadow-sm"
          value={value.leagueSize}
          onChange={(e) =>
            handleChange(
              "leagueSize",
              Number(e.target.value) as LeagueSettings["leagueSize"]
            )
          }
        >
          {[10, 12, 14, 16].map((size) => (
            <option key={size} value={size}>
              {size} Teams
            </option>
          ))}
        </select>
      </div>

      {/* Variance Slider */}
      <div className="flex flex-col gap-1">
        <label className="font-medium text-slate-700">
          Acceptable Variance ({value.variance}%)
        </label>
        <input
          type="range"
          min={0}
          max={20}
          step={1}
          value={value.variance}
          onChange={(e) =>
            handleChange("variance", Number(e.target.value))
          }
        />
      </div>

      {/* Future Pick Adjustment */}
      <div className="flex flex-col gap-1 col-span-full">
        <label className="font-medium text-slate-700">
          Future Pick Adjustment ({value.futurePickAdjustment}%)
        </label>
        <input
          type="range"
          min={0}
          max={50}
          step={5}
          value={value.futurePickAdjustment}
          onChange={(e) =>
            handleChange("futurePickAdjustment", Number(e.target.value))
          }
        />
      </div>

      <p className="col-span-full text-[11px] text-slate-500">
        Settings update dynasty trade values in real time. Defaults to Superflex •
        PPR • {defaultLeagueSettings.leagueSize}-team league.
      </p>

    </div>
  );
}