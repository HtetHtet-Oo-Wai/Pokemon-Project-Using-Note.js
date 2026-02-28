import { Info, Zap, Trophy, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type BattleLogEntry = {
  round: number;
  text: string;
  type: "info" | "damage" | "result" | "heal";
};

interface BattleLogProps {
  entries: BattleLogEntry[];
}

const MAX_LOG_ENTRIES = 50; // Increased to show all battle logs

const iconMap = {
  info: <Info className="w-4 h-4" />,
  damage: <Zap className="w-4 h-4" />,
  result: <Trophy className="w-4 h-4" />,
  heal: <Heart className="w-4 h-4" />,
};

export default function BattleLog({ entries }: BattleLogProps) {
  // Show all entries (up to MAX_LOG_ENTRIES)
  const displayEntries = entries.slice(-MAX_LOG_ENTRIES);

  return (
    <div className="panel-gradient rounded-xl p-4 max-h-56 overflow-y-auto">
      <h3 className="text-xs font-pixel text-muted-foreground tracking-wider mb-3">
        BATTLE LOG {entries.length > MAX_LOG_ENTRIES && <span className="text-[10px]">(Last {MAX_LOG_ENTRIES})</span>}
      </h3>

      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">No actions yet...</p>
      ) : (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {displayEntries.map((e, i) => (
              <motion.div
                key={`${e.round}-${i}`}
                initial={{ opacity: 0, x: -20, height: 0 }}
                animate={{ opacity: 1, x: 0, height: "auto" }}
                exit={{ opacity: 0, x: 20, height: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={`flex gap-2 items-start rounded-lg px-3 py-2 border ${
                  e.type === "damage"
                    ? "border-destructive/30 bg-destructive/10"
                    : e.type === "result"
                    ? "border-primary/30 bg-primary/10"
                    : e.type === "heal"
                    ? "border-game-grass/30 bg-game-grass/10"
                    : "border-border bg-secondary/20"
                }`}
              >
                <div
                  className={`mt-0.5 ${
                    e.type === "damage"
                      ? "text-destructive"
                      : e.type === "result"
                      ? "text-primary"
                      : e.type === "heal"
                      ? "text-game-grass"
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
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

