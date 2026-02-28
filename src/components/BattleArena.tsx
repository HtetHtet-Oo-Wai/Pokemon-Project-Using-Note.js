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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Swords, RotateCcw, Brain, BarChart3, BookOpen } from "lucide-react";

const MAX_ROUNDS = 3;

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

  // ✅ new: prevents clicking moves during animation / resolution
  const [resolving, setResolving] = useState(false);

  const addLog = useCallback(
    (r: number, text: string, type: BattleLogEntry["type"] = "info") => {
      setLog((prev) => [...prev, { round: r, text, type }]);
    },
    []
  );

  const selectP1Pokemon = (name: string) => {
    if (gameActive) return;
    const t = templates.find((p) => p.name === name);
    if (t) setP1({ ...t });
  };

  const selectP2Pokemon = (name: string) => {
    if (gameActive) return;
    const t = templates.find((p) => p.name === name);
    if (t) setP2({ ...t });
  };

  const startGame = () => {
    setGameActive(true);
    setRound(1);
    setLog([]);
    setHpHistory([
      {
        round: 0,
        p1Hp: p1.maxHp,
        p2Hp: p2.maxHp,
        p1Name: p1.name,
        p2Name: p2.name,
      },
    ]);
    setResultText("");
    setSelectedP1(null);
    setSelectedP2(null);
    setResolving(false);

    setP1((prev) => ({ ...prev, currentHp: prev.maxHp }));
    setP2((prev) => ({ ...prev, currentHp: prev.maxHp }));

    addLog(1, "Battle started! Select your moves.");
  };

  const endGame = (message: string) => {
    setGameActive(false);
    setResultText(message);
    setResolving(false);
    addLog(round, message, "result");
  };

  const effectivenessText = (mult: number) => {
    if (mult === 0) return "NO EFFECT!";
    if (mult >= 2) return "SUPER EFFECTIVE!";
    if (mult <= 0.5) return "NOT VERY EFFECTIVE...";
    return null;
  };

  const battle = () => {
    if (selectedP1 === null || selectedP2 === null) return;
    if (!gameActive) return;
    if (resolving) return;

    const move1 = p1.moves[selectedP1];
    const move2 = p2.moves[selectedP2];

    const eff1 = getTypeEffectiveness(move1.type, p2.types);
    const eff2 = getTypeEffectiveness(move2.type, p1.types);

    const dmg1 = calculateDamage(p1, p2, move1);
    const dmg2 = calculateDamage(p2, p1, move2);

    const t1 = effectivenessText(eff1);
    const t2 = effectivenessText(eff2);

    const newP2Hp = Math.max(0, p2.currentHp - dmg1);
    const newP1Hp = Math.max(0, p1.currentHp - dmg2);

    setResolving(true);

    // Show effectiveness popup on the defender
    setEffectTextP2(t1); // P1 attacks P2
    setTimeout(() => setEffectTextP1(t2), 300); // P2 attacks P1

    // Clear effectiveness popups with damage timing
    setTimeout(() => {
      setEffectTextP1(null);
      setEffectTextP2(null);
    }, 900);

    // Animate damage
    setShakingP2(true);
    setDamageP2(String(dmg1));
    setTimeout(() => {
      setShakingP1(true);
      setDamageP1(String(dmg2));
    }, 300);

    setTimeout(() => {
      setShakingP1(false);
      setShakingP2(false);
      setDamageP1(null);
      setDamageP2(null);
      setResolving(false);
    }, 900);

    setP1((prev) => ({ ...prev, currentHp: newP1Hp }));
    setP2((prev) => ({ ...prev, currentHp: newP2Hp }));

    addLog(
      round,
      `${p1.name}'s ${move1.name} dealt ${dmg1} damage!`,
      "damage"
    );

    addLog(
      round,
      `${p2.name}'s ${move2.name} dealt ${dmg2} damage!`,
      "damage"
    );

    const newHistory: HpEntry[] = [
      ...hpHistory,
      { round, p1Hp: newP1Hp, p2Hp: newP2Hp, p1Name: p1.name, p2Name: p2.name },
    ];
    setHpHistory(newHistory);

    setSelectedP1(null);
    setSelectedP2(null);

    // End checks
    if (newP2Hp <= 0) {
      endGame(`${p1.name} wins by knockout! 🏆`);
    } else if (newP1Hp <= 0) {
      endGame(`${p2.name} wins by knockout! 🏆`);
    } else if (round >= MAX_ROUNDS) {
      if (newP1Hp > newP2Hp) endGame(`${p1.name} wins with more HP! 🏆`);
      else if (newP2Hp > newP1Hp) endGame(`${p2.name} wins with more HP! 🏆`);
      else endGame("It's a tie! 🤝");
    } else {
      setRound((prev) => prev + 1);
    }
  };

  const resetGame = () => {
    setGameActive(false);
    setRound(0);
    setLog([]);
    setHpHistory([]);
    setResultText("");
    setSelectedP1(null);
    setSelectedP2(null);
    setResolving(false);

    setP1((prev) => ({ ...prev, currentHp: prev.maxHp }));
    setP2((prev) => ({ ...prev, currentHp: prev.maxHp }));
  };

  return (
    <div className="min-h-screen game-gradient">
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
            onClick={() => setRulesOpen(true)}
            className="text-xs font-pixel text-primary/90 hover:text-primary underline underline-offset-4"
          >
            View Game Rules
          </button>
        </div>
      </header>

      {/* Round indicator */}
      <div className="text-center mb-6">
        <div className="inline-block px-6 py-2 rounded-full bg-secondary border border-border">
          <span className="font-pixel text-xs text-foreground">
            {round === 0 ? "SELECT HEROES & START" : `ROUND ${round} / ${MAX_ROUNDS}`}
          </span>
        </div>
      </div>

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
                        <img src={p.imageSrc} alt={p.name} className="w-5 h-5 object-contain" />
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
                        <img src={p.imageSrc} alt={p.name} className="w-5 h-5 object-contain" />
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
            selectedMove={selectedP1}
            onSelectMove={setSelectedP1}
            isActive={gameActive && !resolving}
            isShaking={shakingP1}
            damageText={damageP1}
            effectText={effectTextP1}
          />
          <PokemonCard
            pokemon={p2}
            player={2}
            selectedMove={selectedP2}
            onSelectMove={setSelectedP2}
            isActive={gameActive && !resolving}
            isShaking={shakingP2}
            damageText={damageP2}
            effectText={effectTextP2}
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
