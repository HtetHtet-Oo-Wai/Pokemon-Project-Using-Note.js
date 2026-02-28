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
const RESOLVE_TOTAL_MS = 1400; // longer for sequential turns

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
  const [healingP1, setHealingP1] = useState<string | null>(null);
  const [healingP2, setHealingP2] = useState<string | null>(null);

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

  // Turn order state for sequential battles
  const [turnOrder, setTurnOrder] = useState<"p1" | "p2" | null>(null);

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
    setTurnOrder(null);

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
    setTurnOrder(null);
    addLog(round, message, "result");
    playFaint();
  };

  const resetAnimations = () => {
    setShakingP1(false);
    setShakingP2(false);
    setDamageP1(null);
    setDamageP2(null);
    setHealingP1(null);
    setHealingP2(null);
    setAttackingP1(false);
    setAttackingP2(false);
    setEffectTextP1(null);
    setEffectTextP2(null);
  };

  // Helper to apply a single move (attack or heal)
  const applyMove = (
    attacker: Pokemon,
    defender: Pokemon,
    moveIndex: number,
    attackerCurrentHp: number,
    defenderCurrentHp: number,
    isAttackerP1: boolean
  ): { newAttackerHp: number; newDefenderHp: number; damage: number; heal: number; effectiveness: number } => {
    const move = attacker.moves[moveIndex];
    const effectiveness = getTypeEffectiveness(move.type, defender.types);
    
    let damage = 0;
    let heal = 0;
    
    if (move.basePower === 0) {
      // Healing move (like Recover) - heal 50% of max HP
      heal = Math.floor(attacker.maxHp * 0.5);
    } else {
      // Attack move
      const rawDmg = calculateDamage(attacker, defender, move);
      damage = Math.min(rawDmg, attackerCurrentHp);
    }
    
    const newAttackerHp = Math.min(attackerCurrentHp + heal, attacker.maxHp);
    const newDefenderHp = Math.max(0, defenderCurrentHp - damage);
    
    return { newAttackerHp, newDefenderHp, damage, heal, effectiveness };
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

    // Determine turn order based on speed
    // Higher speed goes first
    let first: "p1" | "p2";
    let second: "p1" | "p2";
    
    if (p1.speed >= p2.speed) {
      first = "p1";
      second = "p2";
    } else {
      first = "p2";
      second = "p1";
    }

    setTurnOrder(first);

    // Log the turn order
    const firstName = first === "p1" ? p1.name : p2.name;
    addLog(round, `${firstName} is faster and moves first!`, "info");

    // Initial HP state
    let p1Hp = p1.currentHp;
    let p2Hp = p2.currentHp;

    // === FIRST TURN (faster Pokemon) ===
    if (first === "p1") {
      // P1 moves first
      const result = applyMove(p1, p2, selectedP1, p1Hp, p2Hp, true);
      p1Hp = result.newAttackerHp;
      p2Hp = result.newDefenderHp;

      // Animate P1 attack
      setAttackingP1(true);
      
      // Show effectiveness text for attack
      if (result.damage > 0) {
        const effText = effectivenessText(result.effectiveness);
        if (effText) {
          setEffectTextP2(effText);
          setTimeout(() => setEffectTextP2(null), EFFECT_DURATION_MS);
        }
        
        // Shake defender and show damage
        setShakingP2(true);
        setDamageP2(String(result.damage));
        
        // Sound effects
        if (result.effectiveness >= 2) {
          playSuperEffective();
          toast.success("Super Effective!", {
            description: `${p1.name}'s ${move1.name} is super effective!`,
            duration: 1300,
          });
        } else if (result.effectiveness <= 0.5 && result.effectiveness > 0) {
          playNotEffective();
          toast.warning("Not Very Effective...", {
            description: `${p1.name}'s ${move1.name} is not very effective...`,
            duration: 1300,
          });
        } else if (result.effectiveness === 0) {
          playNotEffective();
          toast.error("No Effect!", {
            description: `${p1.name}'s ${move1.name} had no effect!`,
            duration: 1300,
          });
        }
      } else if (result.heal > 0) {
        // Healing move
        setHealingP1(String(result.heal));
        toast.info("💚 Heal!", {
          description: `${p1.name} recovered ${result.heal} HP!`,
          duration: 1300,
        });
        addLog(round, `${p1.name}'s ${move1.name} recovered ${result.heal} HP!`, "heal");
      }

      // Log damage/heal
      if (result.damage > 0) {
        addLog(round, `${p1.name}'s ${move1.name} dealt ${result.damage} damage!`, "damage");
      }

      // Check if P2 fainted
      if (p2Hp <= 0) {
        setTimeout(() => {
          toast.success("🏆 Knockout!", {
            description: `${p1.name} wins by knockout!`,
            duration: 3000,
          });
          endGame(`Player 1 wins by knockout! 🏆`);
          resetAnimations();
          setP2((prev) => ({ ...prev, currentHp: 0 }));
        }, RESOLVE_TOTAL_MS);
        return;
      }
    } else {
      // P2 moves first
      const result = applyMove(p2, p1, selectedP2, p2Hp, p1Hp, false);
      p2Hp = result.newAttackerHp;
      p1Hp = result.newDefenderHp;

      // Animate P2 attack
      setAttackingP2(true);
      
      // Show effectiveness text for attack
      if (result.damage > 0) {
        const effText = effectivenessText(result.effectiveness);
        if (effText) {
          setEffectTextP1(effText);
          setTimeout(() => setEffectTextP1(null), EFFECT_DURATION_MS);
        }
        
        // Shake defender and show damage
        setShakingP1(true);
        setDamageP1(String(result.damage));
        
        // Sound effects
        if (result.effectiveness >= 2) {
          playSuperEffective();
          toast.success("Super Effective!", {
            description: `${p2.name}'s ${move2.name} is super effective!`,
            duration: 1300,
          });
        } else if (result.effectiveness <= 0.5 && result.effectiveness > 0) {
          playNotEffective();
          toast.warning("Not Very Effective...", {
            description: `${p2.name}'s ${move2.name} is not very effective...`,
            duration: 1300,
          });
        } else if (result.effectiveness === 0) {
          playNotEffective();
          toast.error("No Effect!", {
            description: `${p2.name}'s ${move2.name} had no effect!`,
            duration: 1300,
          });
        }
      } else if (result.heal > 0) {
        // Healing move
        setHealingP2(String(result.heal));
        toast.info("💚 Heal!", {
          description: `${p2.name} recovered ${result.heal} HP!`,
          duration: 1300,
        });
        addLog(round, `${p2.name}'s ${move2.name} recovered ${result.heal} HP!`, "heal");
      }

      // Log damage/heal
      if (result.damage > 0) {
        addLog(round, `${p2.name}'s ${move2.name} dealt ${result.damage} damage!`, "damage");
      }

      // Check if P1 fainted
      if (p1Hp <= 0) {
        setTimeout(() => {
          toast.success("🏆 Knockout!", {
            description: `${p2.name} wins by knockout!`,
            duration: 3000,
          });
          endGame(`Player 2 wins by knockout! 🏆`);
          resetAnimations();
          setP1((prev) => ({ ...prev, currentHp: 0 }));
        }, RESOLVE_TOTAL_MS);
        return;
      }
    }

    // === SECOND TURN (slower Pokemon) ===
    // Delay for sequential animation
    setTimeout(() => {
      setTurnOrder(second);
      
      if (second === "p1") {
        // P1 moves second
        const result = applyMove(p1, p2, selectedP1, p1Hp, p2Hp, true);
        p1Hp = result.newAttackerHp;
        p2Hp = result.newDefenderHp;

        // Animate P1 result.newDefender attack
        setAttackingP1(true);
        
        // Show effectiveness text for attack
        if (result.damage > 0) {
          const effText = effectivenessText(result.effectiveness);
          if (effText) {
            setEffectTextP2(effText);
            setTimeout(() => setEffectTextP2(null), EFFECT_DURATION_MS);
          }
          
          // Shake defender and show damage
          setShakingP2(true);
          setDamageP2(String(result.damage));
          
          // Sound effects
          if (result.effectiveness >= 2) {
            playSuperEffective();
          } else if (result.effectiveness <= 0.5 && result.effectiveness > 0) {
            playNotEffective();
          } else if (result.effectiveness === 0) {
            playNotEffective();
          }
          
          addLog(round, `${p1.name}'s ${move1.name} dealt ${result.damage} damage!`, "damage");
        } else if (result.heal > 0) {
          // Healing move
          setHealingP1(String(result.heal));
          toast.info("💚 Heal!", {
            description: `${p1.name} recovered ${result.heal} HP!`,
            duration: 1300,
          });
          addLog(round, `${p1.name}'s ${move1.name} recovered ${result.heal} HP!`, "heal");
        }

        // Check if P2 fainted
        if (p2Hp <= 0) {
          setTimeout(() => {
            toast.success("🏆 Knockout!", {
              description: `${p1.name} wins by knockout!`,
              duration: 3000,
            });
            endGame(`Player 1 wins by knockout! 🏆`);
            resetAnimations();
          }, RESOLVE_TOTAL_MS);
          return;
        }
      } else {
        // P2 moves second
        const result = applyMove(p2, p1, selectedP2, p2Hp, p1Hp, false);
        p2Hp = result.newAttackerHp;
        p1Hp = result.newDefenderHp;

        // Animate P2 attack
        setAttackingP2(true);
        
        // Show effectiveness text for attack
        if (result.damage > 0) {
          const effText = effectivenessText(result.effectiveness);
          if (effText) {
            setEffectTextP1(effText);
            setTimeout(() => setEffectTextP1(null), EFFECT_DURATION_MS);
          }
          
          // Shake defender and show damage
          setShakingP1(true);
          setDamageP1(String(result.damage));
          
          // Sound effects
          if (result.effectiveness >= 2) {
            playSuperEffective();
          } else if (result.effectiveness <= 0.5 && result.effectiveness > 0) {
            playNotEffective();
          } else if (result.effectiveness === 0) {
            playNotEffective();
          }
          
          addLog(round, `${p2.name}'s ${move2.name} dealt ${result.damage} damage!`, "damage");
        } else if (result.heal > 0) {
          // Healing move
          setHealingP2(String(result.heal));
          toast.info("💚 Heal!", {
            description: `${p2.name} recovered ${result.heal} HP!`,
            duration: 1300,
          });
          addLog(round, `${p2.name}'s ${move2.name} recovered ${result.heal} HP!`, "heal");
        }

        // Check if P1 fainted
        if (p1Hp <= 0) {
          setTimeout(() => {
            toast.success("🏆 Knockout!", {
              description: `${p2.name} wins by knockout!`,
              duration: 3000,
            });
            endGame(`Player 2 wins by knockout! 🏆`);
            resetAnimations();
          }, RESOLVE_TOTAL_MS);
          return;
        }
      }

      // Apply final HP changes
      setP1((prev) => ({ ...prev, currentHp: p1Hp }));
      setP2((prev) => ({ ...prev, currentHp: p2Hp }));

      // Record HP history
      setHpHistory((prev) => [
        ...prev,
        {
          round,
          p1Hp,
          p2Hp,
          p1Name: p1.name,
          p2Name: p2.name,
        },
      ]);

      // Decide result after animations settle
      setTimeout(() => {
        // KO checks (should already be handled above, but just in case)
        if (p2Hp <= 0) {
          toast.success("🏆 Knockout!", {
            description: `${p1.name} wins by knockout!`,
            duration: 3000,
          });
          endGame(`Player 1 wins by knockout! 🏆`);
          resetAnimations();
          return;
        }

        if (p1Hp <= 0) {
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
          if (p1Hp > p2Hp) {
            toast.success("🏆 Victory!", {
              description: `${p1.name} wins with more HP!`,
              duration: 3000,
            });
            endGame(`Player 1 wins with more HP! 🏆`);
            resetAnimations();
            return;
          } else if (p2Hp > p1Hp) {
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

        // Continue to next round
        resetAnimations();
        setResolving(false);
        setTurnOrder(null);
        setRound((prev) => prev + 1);
      }, RESOLVE_TOTAL_MS);
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
    setTurnOrder(null);
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

      {/* Turn order indicator */}
      {turnOrder && gameActive && (
        <div className="text-center mb-4">
          <div className="inline-block px-4 py-1 rounded-full bg-primary/20 border border-primary/50">
            <span className="font-pixel text-xs text-primary">
              {turnOrder === "p1" ? `▶ ${p1.name}'s Turn` : `▶ ${p2.name}'s Turn`}
            </span>
          </div>
        </div>
      )}

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
            healingText={healingP1}
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
            healingText={healingP2}
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