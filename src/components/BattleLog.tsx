import { Info, Zap, Trophy } from "lucide-react";

export type BattleLogEntry = {
  round: number;
  text: string;
  type: "info" | "damage" | "result";
};

interface BattleLogProps {
  entries: BattleLogEntry[];
}

const iconMap = {
  info: <Info className="w-4 h-4" />,
  damage: <Zap className="w-4 h-4" />,
  result: <Trophy className="w-4 h-4" />,
};

export default function BattleLog({ entries }: BattleLogProps) {
  return (
    <div className="panel-gradient rounded-xl p-4 max-h-56 overflow-y-auto">
      <h3 className="text-xs font-pixel text-muted-foreground tracking-wider mb-3">
        BATTLE LOG
      </h3>

      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">No actions yet...</p>
      ) : (
        <div className="space-y-2">
          {entries.map((e, i) => (
            <div
              key={i}
              className={`flex gap-2 items-start rounded-lg px-3 py-2 border ${
                e.type === "damage"
                  ? "border-destructive/30 bg-destructive/10"
                  : e.type === "result"
                  ? "border-primary/30 bg-primary/10"
                  : "border-border bg-secondary/20"
              }`}
            >
              <div
                className={`mt-0.5 ${
                  e.type === "damage"
                    ? "text-destructive"
                    : e.type === "result"
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {iconMap[e.type]}
              </div>

              <div className="flex-1">
                <div className="text-[10px] text-muted-foreground font-mono mb-0.5">
                  ROUND {e.round}
                </div>
                <div className="text-sm text-foreground font-mono leading-snug">
                  {e.text}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
