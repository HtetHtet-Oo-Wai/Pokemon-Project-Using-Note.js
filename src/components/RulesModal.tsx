// src/components/RulesModal.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface RulesModalProps {
  open: boolean;
  onClose: () => void;
}

export default function RulesModal({ open, onClose }: RulesModalProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent className="bg-card border-border max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-pixel text-sm text-primary">
            📘 Game Rules
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[65vh] pr-4">
          <div className="space-y-6 text-sm">
            {/* Objective */}
            <section className="panel-gradient rounded-xl p-4">
              <h3 className="font-pixel text-xs text-muted-foreground tracking-wider mb-3">
                1) OBJECTIVE
              </h3>
              <ul className="space-y-2 text-foreground">
                <li>🏆 Win by knocking out the opponent (HP becomes 0), or</li>
                <li>🏆 After 3 rounds, the Pokémon with more HP wins.</li>
              </ul>
            </section>

            {/* Turn Flow */}
            <section className="panel-gradient rounded-xl p-4">
              <h3 className="font-pixel text-xs text-muted-foreground tracking-wider mb-3">
                2) TURN FLOW
              </h3>
              <ol className="space-y-2 text-foreground list-decimal list-inside">
                <li>Each player chooses 1 move.</li>
                <li>Both moves deal damage for that round.</li>
                <li>HP updates and Round increases.</li>
                <li>Battle ends if someone is knocked out or Round 3 finishes.</li>
              </ol>
              <p className="mt-3 text-muted-foreground">
                Tip: Your battle log shows what happened each round.
              </p>
            </section>

            {/* Types */}
            <section className="panel-gradient rounded-xl p-4">
              <h3 className="font-pixel text-xs text-muted-foreground tracking-wider mb-3">
                3) TYPE ADVANTAGE (LIKE ROCK–PAPER–SCISSORS)
              </h3>
              <p className="text-foreground mb-3">
                Some move types are strong or weak against certain Pokémon types.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-lg bg-secondary/30 border border-border p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">Super Effective</span>
                    <Badge variant="outline" className="border-primary/40 text-primary">
                      x2
                    </Badge>
                  </div>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>⚡ Electric → 🕊 Flying</li>
                    <li>⚡ Electric → 🌊 Water</li>
                    <li>🔥 Fire → 🌿 Grass</li>
                    <li>🌊 Water → 🔥 Fire</li>
                    <li>🌿 Grass → 🌊 Water</li>
                    <li>👊 Fighting → ⚪ Normal / 🧊 Ice / 🪨 Rock</li>
                    <li>🧠 Psychic → 👊 Fighting / ☠️ Poison</li>
                    <li>🌑 Dark → 🧠 Psychic / 👻 Ghost</li>
                    <li>🛡 Steel → 🧊 Ice / 🪨 Rock / 🧚 Fairy</li>
                    <li>🐉 Dragon → 🐉 Dragon</li>
                    <li>🧚 Fairy → 🐉 Dragon / 🌑 Dark / 👊 Fighting</li>
                  </ul>
                </div>

                <div className="rounded-lg bg-secondary/30 border border-border p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">Not Very Effective / No Effect</span>
                    <Badge variant="outline" className="border-border text-muted-foreground">
                      x0.5 / x0
                    </Badge>
                  </div>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>⚡ Electric → ⚡ Electric / 🌿 Grass (x0.5)</li>
                    <li>🔥 Fire → 🔥 Fire / 🌊 Water / 🪨 Rock (x0.5)</li>
                    <li>🌊 Water → 🌊 Water / 🌿 Grass (x0.5)</li>
                    <li>🌿 Grass → 🔥 Fire / 🌿 Grass (x0.5)</li>
                    <li>👊 Fighting → 🕊 Flying / ☠️ Poison / 🧠 Psychic / 🐛 Bug / 🧚 Fairy (x0.5)</li>
                    <li>🧠 Psychic → 🛡 Steel (x0.5), 🌑 Dark (x0)</li>
                    <li>🌑 Dark → 👊 Fighting / 🧚 Fairy (x0.5), 🌑 Dark (x0.5)</li>
                    <li>🛡 Steel → 🔥 Fire / 🌊 Water / ⚡ Electric (x0.5)</li>
                    <li>🐉 Dragon → 🛡 Steel (x0.5), 🧚 Fairy (x0)</li>
                    <li>🧚 Fairy → 🔥 Fire / ☠️ Poison / 🛡 Steel (x0.5)</li>
                  </ul>
                </div>
              </div>

              <p className="mt-3 text-muted-foreground">
                Note: If a matchup isn’t listed, it is treated as normal effectiveness (x1) in this project.
              </p>
            </section>

            {/* STAB */}
            <section className="panel-gradient rounded-xl p-4">
              <h3 className="font-pixel text-xs text-muted-foreground tracking-wider mb-3">
                4) SAME-TYPE BONUS (STAB)
              </h3>
              <p className="text-foreground">
                If a Pokémon uses a move that matches one of its own types, that move becomes stronger.
              </p>
              <ul className="mt-3 space-y-2 text-muted-foreground">
                <li>🔥 Charizard using a Fire move → bonus</li>
                <li>⚡ Pikachu using an Electric move → bonus</li>
                <li>⚡ Pikachu using a Normal move → no bonus</li>
              </ul>
            </section>

            {/* Randomness */}
            <section className="panel-gradient rounded-xl p-4">
              <h3 className="font-pixel text-xs text-muted-foreground tracking-wider mb-3">
                5) SMALL RANDOMNESS
              </h3>
              <p className="text-foreground">
                Damage can vary slightly each time so battles aren’t always the same.
              </p>
              <p className="mt-2 text-muted-foreground">
                (This is intentional: it makes the battle more exciting.)
              </p>
            </section>

            {/* Nash */}
            <section className="panel-gradient rounded-xl p-4">
              <h3 className="font-pixel text-xs text-muted-foreground tracking-wider mb-3">
                6) NASH PREDICTION (OPTIONAL)
              </h3>
              <p className="text-foreground">
                The Nash modal shows the predicted best move-mix (strategy) for each Pokémon.
              </p>
              <p className="mt-2 text-muted-foreground">
                It’s a “recommendation / prediction”, not a guaranteed win.
              </p>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}