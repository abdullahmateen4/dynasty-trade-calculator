import type { Player } from "@/lib/player";
import { cn } from "@/lib/utils";

interface PlayerCardProps {
  player: Player;
  value?: number;
  className?: string;
  onRemove?: () => void;
}

export function PlayerCard({
  player,
  value,
  className,
  onRemove
}: PlayerCardProps) {

  // Remove team abbreviation from name if present
  const cleanName = player.name.replace(/\s*\(.*?\)/, "");

  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-lg border border-border bg-white px-3 py-2 shadow-sm",
        className
      )}
    >
      {/* Player Info */}
      <div className="flex flex-col leading-tight">

        {/* Player Name */}
        <span className="text-sm font-semibold text-slate-800">
          {cleanName}
        </span>

        {/* Player Details */}
        <span className="text-[11px] text-slate-500">
          {player.position} • Age {player.age} • {player.team}
        </span>

      </div>

      {/* Value + Remove */}
      <div className="flex items-center gap-2">

        {typeof value === "number" && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
            {value.toFixed(0)}
          </span>
        )}

        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-xs text-slate-400 transition hover:text-red-500"
          >
            ×
          </button>
        )}

      </div>
    </div>
  );
}