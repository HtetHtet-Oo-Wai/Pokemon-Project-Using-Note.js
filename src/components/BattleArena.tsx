// src/pages/BattleArena.tsx
import { useState, useCallback } from "react";
import {
  allPokemonTemplates,
  Pokemon,
  calculateDamage,
  getTypeEffectiveness,
} from "@/lib/pokemon-data";

import PokemonCard from "@/components/PokemonCard";
import BattleLog from "@/components/BattleLog";
import type { BattleLogEntry } from "@/components/BattleLog";

import NashModal from "@/components/NashModal";
import RulesModal from "@/components/RulesModal";
import HpProgressModal, { HpEntry } from "@/components/HpProgressModal";

import SoundToggle from "@/components/SoundToggle";
import { useSound } from "@/hooks/useSound";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";
import { Swords, RotateCcw, Brain, BarChart3, BookOpen } from "lucide-react";
import { toast } from "sonner";

const MAX_ROUNDS = 3;

// Keep animation durations in one place (easier to tune)
const EFFECT_DURATION_MS = 900;
const RESOLVE_TOTAL_MS = 950; // slightly > EFFECT_DURATION_MS

export default function BattleArena() {
  const templates = allPokemonTemplates();

  const [p1, setP1] = useState<Pokemon>({ ...templates[0] });
  const [p2, setP2] = useState<Pokemon>({ ...templates[1] });

  const [gameActive, setGameActive] = useState(false);
  const [round, setRound] = useState(0);

  const [selectedP1, setSelectedP1] = useState<number | null>(null);
  const [selectedP2, setSelectedP2] = useState<number | null>(null);

  const [log, setLog] = useState<BattleLogEntry[]>([]);
  const [hpHistory, setHpHistory] = useState<HpEntry[]>([]);
  const [resultText, setResultText] = useState("");

  const [shakingP1, setShakingP1] = useState(false);
  const [shakingP2, setShakingP2] = useState(false);
  const [damageP1, setDamageP1] = useState<string | null>(null);
  const [damageP2, setDamageP2] = useState<string | null>(null);

  const [effectTextP1, setEffectTextP1] = useState<string | null>(null);
  const [effectTextP2, setEffectTextP2] = useState<string | null>(null);

  const [nashOpen, setNashOpen] = useState(false);
  const [hpOpen, setHpOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);

  // Animation states
  const [showEntrance, setShowEntrance] = useState(false);
  const [attackingP1, setAttackingP1] = useState(false);
  const [attackingP2, setAttackingP2] = useState(false);

  // Prevent clicking moves during animation / resolution
  const [resolving, setResolving] = useState(false);

  // Sound hook
  const {
    soundEnabled,
    toggleSound,
    playClick,
    playAttack,
    playFaint,
    playSuperEffective,
    playNotEffective,
    markInteracted,
  } = useSound();

  const addLog = useCallback(
    (r: number, text: string, type: BattleLogEntry["type"] = "info") => {
      setLog((prev) => [...prev, { round: r, text, type }]);
    },
    []
  );

  const selectP1Pokemon = (name: string) => {
    if (gameActive) return;
    playClick();
    const t = templates.find((p) => p.name === name);
    if (t) setP1({ ...t });
  };

  const selectP2Pokemon = (name: string) => {
    if (gameActive) return;
    playClick();
    const t = templates.find((p) => p.name === name);
    if (t) setP2({ ...t });
  };

  const effectivenessText = (mult: number) => {
    if (mult === 0) return "NO EFFECT!";
    if (mult >= 2) return "SUPER EFFECTIVE!";
    if (mult <= 0.5) return "NOT VERY EFFECTIVE...";
    return null;
  };

  const startGame = () => {
    markInteracted();
    playClick();

    // Reset state
    setShowEntrance(true);
    setGameActive(true);
    setRound(1);
    setLog([]);
    setResultText("");
    setSelectedP1(null);
    setSelectedP2(null);
    setResolving(false);

    // Reset HP
    setP1((prev) => ({ ...prev, currentHp: prev.maxHp }));
    setP2((prev) => ({ ...prev, currentHp: prev.maxHp }));

    // Init HP history
    setHpHistory([
      {
        round: 0,
        p1Hp: p1.maxHp,
        p2Hp: p2.maxHp,
        p1Name: p1.name,
        p2Name: p2.name,
      },
    ]);

    addLog(1, "Battle started! Select your moves.");
    toast.success(`Battle started: ${p1.name} vs ${p2.name}!`, {
      description: "Round 1 - Select your moves!",
      duration: 2500,
    });

    setTimeout(() => setShowEntrance(false), 600);
  };

  const endGame = (message: string) => {
    setGameActive(false);
    setResultText(message);
    setResolving(false);
    addLog(round, message, "result");
    playFaint();
  };

  const resetAnimations = () => {
    setShakingP1(false);
    setShakingP2(false);
    setDamageP1(null);
    setDamageP2(null);
    setAttackingP1(false);
    setAttackingP2(false);
    setEffectTextP1(null);
    setEffectTextP2(null);
  };

  const battle = () => {
    if (selectedP1 === null || selectedP2 === null) return;
    if (!gameActive) return;
    if (resolving) return;

    markInteracted();
    playAttack();

    setResolving(true);

    const move1 = p1.moves[selectedP1];
    const move2 = p2.moves[selectedP2];

    const eff1 = getTypeEffectiveness(move1.type, p2.types);
    const eff2 = getTypeEffectiveness(move2.type, p1.types);

    const rawDmg1 = calculateDamage(p1, p2, move1);
    const rawDmg2 = calculateDamage(p2, p1, move2);

    // Cap damage by attacker's remaining HP (your rule)
    const finalDmg1 = Math.min(rawDmg1, p1.currentHp);
    const finalDmg2 = Math.min(rawDmg2, p2.currentHp);

    const finalP2Hp = Math.max(0, p2.currentHp - finalDmg1);
    const finalP1Hp = Math.max(0, p1.currentHp - finalDmg2);

    // --- Animations (attack forward)
    setAttackingP1(true);
    setTimeout(() => setAttackingP2(true), 150);

    // Effect popups (defender)
    const t1 = effectivenessText(eff1);
    const t2 = effectivenessText(eff2);
    setEffectTextP2(t1); // P1 attacks P2
    setTimeout(() => setEffectTextP1(t2), 300); // P2 attacks P1

    setTimeout(() => {
      setEffectTextP1(null);
      setEffectTextP2(null);
    }, EFFECT_DURATION_MS);

    // Damage shake + float
    setShakingP2(true);
    setDamageP2(String(finalDmg1));
    setShakingP1(true);
    setDamageP1(String(finalDmg2));

    // Apply HP
    setP2((prev) => ({ ...prev, currentHp: finalP2Hp }));
    setP1((prev) => ({ ...prev, currentHp: finalP1Hp }));

    // Record HP history (so HP progress modal has data)
    setHpHistory((prev) => [
      ...prev,
      {
        round,
        p1Hp: finalP1Hp,
        p2Hp: finalP2Hp,
        p1Name: p1.name,
        p2Name: p2.name,
      },
    ]);

    // Sounds + toasts (effectiveness)
    if (eff1 >= 2) {
      playSuperEffective();
      toast.success("Super Effective!", {
        description: `${p1.name}'s ${move1.name} is super effective!`,
        duration: 1300,
      });
    } else if (eff1 <= 0.5 && eff1 > 0) {
      playNotEffective();
      toast.warning("Not Very Effective...", {
        description: `${p1.name}'s ${move1.name} is not very effective...`,
        duration: 1300,
      });
    } else if (eff1 === 0) {
      playNotEffective();
      toast.error("No Effect!", {
        description: `${p1.name}'s ${move1.name} had no effect!`,
        duration: 1300,
      });
    }

    addLog(round, `${p1.name}'s ${move1.name} dealt ${finalDmg1} damage!`, "damage");
    addLog(round, `${p2.name}'s ${move2.name} dealt ${finalDmg2} damage!`, "damage");

    // Decide result AFTER animations settle (cleaner UX)
    setTimeout(() => {
      // KO checks
      if (finalP2Hp <= 0) {
        toast.success("🏆 Knockout!", {
          description: `${p1.name} wins by knockout!`,
          duration: 3000,
        });
        endGame(`Player 1 wins by knockout! 🏆`);
        resetAnimations();
        return;
      }

      if (finalP1Hp <= 0) {
        toast.success("🏆 Knockout!", {
          description: `${p2.name} wins by knockout!`,
          duration: 3000,
        });
        endGame(`Player 2 wins by knockout! 🏆`);
        resetAnimations();
        return;
      }

      // Last round outcome
      if (round >= MAX_ROUNDS) {
        if (finalP1Hp > finalP2Hp) {
          toast.success("🏆 Victory!", {
            description: `${p1.name} wins with more HP!`,
            duration: 3000,
          });
          endGame(`Player 1 wins with more HP! 🏆`);
          resetAnimations();
          return;
        } else if (finalP2Hp > finalP1Hp) {
          toast.success("🏆 Victory!", {
            description: `${p2.name} wins with more HP!`,
            duration: 3000,
          });
          endGame(`Player 2 wins with more HP! 🏆`);
          resetAnimations();
          return;
        } else {
          toast.info("🤝 It's a Tie!", {
            description: "Both Pokémon have the same HP remaining!",
            duration: 3000,
          });
          endGame("It's a tie! 🤝");
          resetAnimations();
          return;
        }
      }

      // Continue
      resetAnimations();
      setResolving(false);
      setRound((prev) => prev + 1);
    }, RESOLVE_TOTAL_MS);
  };

  const resetGame = () => {
    playClick();
    setGameActive(false);
    setRound(0);
    setLog([]);
    setHpHistory([]);
    setResultText("");
    setSelectedP1(null);
    setSelectedP2(null);
    setResolving(false);
    setShowEntrance(false);
    resetAnimations();

    setP1((prev) => ({ ...prev, currentHp: prev.maxHp }));
    setP2((prev) => ({ ...prev, currentHp: prev.maxHp }));
  };

  const handleButtonClick = (action: () => void) => {
    markInteracted();
    playClick();
    action();
  };

  const selectedP1Name =
    selectedP1 !== null && p1.moves[selectedP1] ? p1.moves[selectedP1].name : "—";
  const selectedP2Name =
    selectedP2 !== null && p2.moves[selectedP2] ? p2.moves[selectedP2].name : "—";

  return (
    <div className="min-h-screen game-gradient scanlines">
      {/* Sound Toggle */}
      <SoundToggle soundEnabled={soundEnabled} onToggle={toggleSound} />

      {/* Header */}
      <header className="text-center pt-8 pb-4">
        <h1 className="font-pixel text-lg md:text-2xl text-primary tracking-wider mb-2">
          POKÉMON TYPE BATTLE
        </h1>
        <p className="text-sm text-muted-foreground">
          Nash Equilibrium Prediction & HP Progress
        </p>
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => handleButtonClick(() => setRulesOpen(true))}
            className="text-xs font-pixel text-primary/90 hover:text-primary underline underline-offset-4"
          >
            View Game Rules
          </button>
        </div>
      </header>

      {/* Round indicator */}
      <div className="text-center mb-4">
        <div className="inline-block px-6 py-2 rounded-full bg-secondary border border-border">
          <span className="font-pixel text-xs text-foreground">
            {round === 0 ? "SELECT HEROES & START" : `ROUND ${round} / ${MAX_ROUNDS}`}
          </span>
        </div>
      </div>

      {/* Selected move preview (makes battle clearer) */}
      {gameActive && (
        <div className="text-center mb-6 text-xs text-muted-foreground">
          <span className="mr-3">P1 selected: {selectedP1Name}</span>
          <span>P2 selected: {selectedP2Name}</span>
        </div>
      )}

      {/* Pokemon Selectors */}
      {!gameActive && round === 0 && (
        <div className="flex justify-center gap-8 mb-6 px-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">P1:</span>
            <Select value={p1.name} onValueChange={selectP1Pokemon}>
              <SelectTrigger className="w-40 bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {templates.map((p) => (
                  <SelectItem key={p.name} value={p.name}>
                    <div className="flex items-center gap-2">
                      {p.imageSrc ? (
                        <img
                          src={p.imageSrc}
                          alt={p.name}
                          className="w-5 h-5 object-contain"
                        />
                      ) : (
                        <span>{p.emoji}</span>
                      )}
                      <span>{p.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">P2:</span>
            <Select value={p2.name} onValueChange={selectP2Pokemon}>
              <SelectTrigger className="w-40 bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {templates.map((p) => (
                  <SelectItem key={p.name} value={p.name}>
                    <div className="flex items-center gap-2">
                      {p.imageSrc ? (
                        <img
                          src={p.imageSrc}
                          alt={p.name}
                          className="w-5 h-5 object-contain"
                        />
                      ) : (
                        <span>{p.emoji}</span>
                      )}
                      <span>{p.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Battle Area */}
      <div className="max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <PokemonCard
            pokemon={p1}
            player={1}
            opponentTypes={p2.types}
            selectedMove={selectedP1}
            onSelectMove={setSelectedP1}
            isActive={gameActive && !resolving}
            isShaking={shakingP1}
            damageText={damageP1}
            effectText={effectTextP1}
            attacking={attackingP1}
            showEntrance={showEntrance}
          />
          <PokemonCard
            pokemon={p2}
            player={2}
            opponentTypes={p1.types}
            selectedMove={selectedP2}
            onSelectMove={setSelectedP2}
            isActive={gameActive && !resolving}
            isShaking={shakingP2}
            damageText={damageP2}
            effectText={effectTextP2}
            attacking={attackingP2}
            showEntrance={showEntrance}
          />
        </div>

        {/* Result */}
        {resultText && (
          <div className="text-center mb-6 animate-slide-up">
            <div className="inline-block px-8 py-4 rounded-xl bg-primary/10 border border-primary/30 glow-primary">
              <p className="font-pixel text-sm text-primary">{resultText}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          {!gameActive && round === 0 && (
            <Button
              onClick={startGame}
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold gap-2"
            >
              <Swords className="w-5 h-5" /> Start Game
            </Button>
          )}

          {gameActive && (
            <Button
              onClick={battle}
              size="lg"
              disabled={selectedP1 === null || selectedP2 === null || resolving}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold gap-2 battle-glow"
            >
              <Swords className="w-5 h-5" />
              {resolving ? "Resolving..." : `BATTLE (Round ${round})`}
            </Button>
          )}

          <Button onClick={resetGame} variant="outline" size="lg" className="gap-2">
            <RotateCcw className="w-4 h-4" /> Reset
          </Button>

          <Button
            onClick={() => setNashOpen(true)}
            variant="outline"
            size="lg"
            className="gap-2 border-primary/40 text-primary hover:bg-primary/10"
          >
            <Brain className="w-4 h-4" /> Nash Prediction
          </Button>

          <Button
            onClick={() => setHpOpen(true)}
            variant="outline"
            size="lg"
            className="gap-2 border-game-water/40 text-game-water hover:bg-game-water/10"
          >
            <BarChart3 className="w-4 h-4" /> HP Progress
          </Button>

          <Button
            onClick={() => setRulesOpen(true)}
            variant="outline"
            size="lg"
            className="gap-2 border-border text-foreground hover:bg-secondary/30"
          >
            <BookOpen className="w-4 h-4" /> Rules
          </Button>
        </div>

        {/* Battle Log */}
        <BattleLog entries={log} />
      </div>

      <div className="h-8" />

      {/* Modals */}
      <NashModal open={nashOpen} onClose={() => setNashOpen(false)} p1={p1} p2={p2} />
      <RulesModal open={rulesOpen} onClose={() => setRulesOpen(false)} />
      <HpProgressModal
        open={hpOpen}
        onClose={() => setHpOpen(false)}
        data={hpHistory}
        p1Name={p1.name}
        p2Name={p2.name}
      />
    </div>
  );
}