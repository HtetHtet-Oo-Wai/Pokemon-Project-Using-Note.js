import { useEffect, useState } from 'react';
import { Pokemon, TYPE_COLORS, PokemonType } from '@/lib/pokemon-data';

interface PokemonCardProps {
  pokemon: Pokemon;
  player: 1 | 2;
  selectedMove: number | null;
  onSelectMove: (idx: number) => void;
  isActive: boolean;
  isShaking: boolean;
  damageText: string | null;
  effectText: string | null;
}

function getHpColor(pct: number): string {
  if (pct > 0.5) return 'bg-green-500';
  if (pct > 0.25) return 'bg-yellow-500';
  return 'bg-red-500';
}

function getTypeColorClass(type: PokemonType): string {
  return TYPE_COLORS[type] || 'bg-muted';
}

function getEffectClass(text: string) {
  if (text.includes("SUPER")) return "text-emerald-400";
  if (text.includes("NOT")) return "text-amber-300";
  if (text.includes("NO EFFECT")) return "text-slate-300";
  return "text-primary";
}

export default function PokemonCard({
  pokemon, player, selectedMove, onSelectMove, isActive, isShaking, damageText, effectText
}: PokemonCardProps) {
  const hpPct = pokemon.currentHp / pokemon.maxHp;
  const [imageOk, setImageOk] = useState(true);

  useEffect(() => {
    setImageOk(true);
  }, [pokemon.imageSrc]);

  const showImage = Boolean(pokemon.imageSrc) && imageOk;

  return (
    <div className={`panel-gradient rounded-xl p-6 relative transition-all duration-300 ${isShaking ? 'animate-shake' : ''}`}>
      {damageText && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-2xl font-pixel text-destructive animate-damage z-10">
          -{damageText}
        </div>
      )}
      {effectText && (
        <div
          className={`absolute top-12 left-1/2 -translate-x-1/2 text-sm md:text-base font-pixel tracking-wide
      ${getEffectClass(effectText)} animate-effect-pop z-10 drop-shadow`}
        >
          {effectText}
        </div>
      )}
      
      <div className="text-center mb-4">
        <span className="text-xs font-pixel text-muted-foreground tracking-wider">
          PLAYER {player}
        </span>
      </div>

      {/* Pokemon Avatar */}
      <div className="flex justify-center mb-4">
        <div className="w-28 h-28 rounded-full bg-secondary flex items-center justify-center text-6xl border-2 border-border shadow-lg overflow-hidden">
          {showImage ? (
            <img
              src={pokemon.imageSrc}
              alt={pokemon.name}
              className="w-full h-full object-contain"
              onError={() => setImageOk(false)}
            />
          ) : (
            <span className="text-6xl">{pokemon.emoji}</span>
          )}
        </div>
      </div>

      {/* Name & Types */}
      <h2 className="text-xl font-bold text-center text-foreground mb-2">{pokemon.name}</h2>
      <div className="flex gap-2 justify-center mb-4">
        {pokemon.types.map(t => (
          <span key={t} className={`${getTypeColorClass(t)} text-xs px-3 py-1 rounded-full font-semibold text-primary-foreground`}>
            {t}
          </span>
        ))}
      </div>

      {/* HP Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>HP</span>
          <span>{pokemon.currentHp}/{pokemon.maxHp}</span>
        </div>
        <div className="w-full h-4 bg-secondary rounded-full overflow-hidden">
          <div
            className={`h-full ${getHpColor(hpPct)} rounded-full transition-all duration-500 ease-out`}
            style={{ width: `${Math.max(0, hpPct * 100)}%` }}
          />
        </div>
      </div>

      {/* Moves */}
      <div className="space-y-2">
        <p className="text-xs font-pixel text-muted-foreground text-center tracking-wider mb-2">MOVES</p>
        {pokemon.moves.map((move, idx) => (
          <button
            key={move.name}
            onClick={() => isActive && onSelectMove(idx)}
            disabled={!isActive}
            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
              ${selectedMove === idx
                ? 'ring-2 ring-primary bg-primary/20 text-foreground scale-[1.02]'
                : 'bg-secondary/50 text-secondary-foreground hover:bg-secondary'
              }
              ${!isActive ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-[1.01]'}
            `}
          >
            <div className="flex items-center justify-between">
              <span>{move.name}</span>
              <div className="flex items-center gap-2">
                <span className={`${getTypeColorClass(move.type)} text-[10px] px-2 py-0.5 rounded text-primary-foreground`}>
                  {move.type}
                </span>
                <span className="text-xs text-muted-foreground">
                  {move.basePower > 0 ? `${move.basePower}pw` : '-'}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
