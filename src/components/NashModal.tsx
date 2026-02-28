import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Pokemon } from '@/lib/pokemon-data';
import { computeNash } from '@/lib/nash';
import { useMemo } from "react";

interface NashModalProps {
  open: boolean;
  onClose: () => void;
  p1: Pokemon;
  p2: Pokemon;
}

export default function NashModal({ open, onClose, p1, p2 }: NashModalProps) {
  const result = useMemo(() => {
    if (!open) return null;
    return computeNash(p1, p2);
  }, [open, p1, p2]);

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent className="bg-card border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-pixel text-sm text-primary">Nash Equilibrium Prediction</DialogTitle>
        </DialogHeader>

        {!result ? (
          <p className="text-muted-foreground">Could not compute Nash equilibrium.</p>
        ) : (
          <div className="space-y-5">
            <div className="text-center py-3 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-lg font-bold text-foreground">
                {result.winner === 'Tie'
                  ? 'Predicted Tie'
                  : `${result.winner} is predicted to win`}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[{ pkmn: p1, strat: result.p1Strategy }, { pkmn: p2, strat: result.p2Strategy }].map(({ pkmn, strat }) => (
                <div key={pkmn.name} className="bg-secondary/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center overflow-hidden">
                      {pkmn.imageSrc ? (
                        <img src={pkmn.imageSrc} alt={pkmn.name} className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-xs">{pkmn.emoji}</span>
                      )}
                    </div>
                    <p className="text-sm font-bold text-foreground">{pkmn.name}</p>
                  </div>
                  <div className="space-y-1">
                    {pkmn.moves.map((move, i) => (
                      <div key={move.name} className="flex justify-between text-xs">
                        <span className="text-muted-foreground truncate mr-2">{move.name}</span>
                        <span className="text-foreground font-mono">{(strat[i] * 100).toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-secondary/30 rounded-lg p-3">
              <p className="text-xs font-pixel text-muted-foreground mb-2">EXPECTED DMG / ROUND</p>
              <div className="flex justify-between text-sm">
                <span className="text-foreground">{p1.name} -&gt; {p2.name}: <strong>{result.expDmg1.toFixed(1)}</strong></span>
                <span className="text-foreground">{p2.name} -&gt; {p1.name}: <strong>{result.expDmg2.toFixed(1)}</strong></span>
              </div>
            </div>

            <div className="bg-secondary/30 rounded-lg p-3">
              <p className="text-xs font-pixel text-muted-foreground mb-2">EXPECTED HP AFTER 3 ROUNDS</p>
              <div className="flex justify-between text-sm">
                <span className="text-foreground">{p1.name}: <strong>{result.hp1Left.toFixed(1)}</strong></span>
                <span className="text-foreground">{p2.name}: <strong>{result.hp2Left.toFixed(1)}</strong></span>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
