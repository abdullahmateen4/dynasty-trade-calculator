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
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-lg border border-border bg-white px-3 py-2 text-xs shadow-sm",
        className
      )}
    >
      <div className="flex flex-col">
        <span className="font-medium">
          {player.name}{" "}
          <span className="text-[10px] text-slate-500">({player.team})</span>
        </span>
        <span className="text-[11px] text-slate-500">
          {player.position} • Age {player.age} •{" "}
          {player.starterStatus === "STARTER" ? "Starter" : "Backup"}
        </span>
      </div>
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
            className="text-[11px] text-slate-400 hover:text-red-500"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

