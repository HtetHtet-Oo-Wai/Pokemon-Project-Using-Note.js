// src/lib/pokemon-data.ts
export interface Move {
  name: string;
  type: PokemonType;
  basePower: number;
}

export type PokemonType =
  | "Electric"
  | "Fire"
  | "Water"
  | "Grass"
  | "Fighting"
  | "Psychic"
  | "Dark"
  | "Steel"
  | "Dragon"
  | "Fairy"
  | "Flying"
  | "Normal"
  | "Ghost"
  | "Ice"
  | "Poison"
  | "Ground"
  | "Rock"
  | "Bug";

export interface Pokemon {
  name: string;
  types: PokemonType[];
  maxHp: number;
  currentHp: number;
  speed: number;
  attack: number;
  defense: number;
  moves: Move[];
  imageSrc: string;
  emoji: string;
}

export const TYPE_COLORS: Record<PokemonType, string> = {
  Electric: "bg-game-electric",
  Fire: "bg-game-fire",
  Water: "bg-game-water",
  Grass: "bg-game-grass",
  Fighting: "bg-game-fighting",
  Psychic: "bg-game-psychic",
  Dark: "bg-game-dark",
  Steel: "bg-game-steel",
  Dragon: "bg-game-dragon",
  Fairy: "bg-game-fairy",
  Flying: "bg-game-flying",
  Normal: "bg-game-normal",
  Ghost: "bg-game-ghost",
  Ice: "bg-game-ice",
  Poison: "bg-game-poison",
  Ground: "bg-game-ground",
  Rock: "bg-game-rock",
  Bug: "bg-game-bug",
};

export const typeChart: Record<string, number> = {
  "Electric-Flying": 2.0,
  "Electric-Water": 2.0,
  "Electric-Electric": 0.5,
  "Electric-Grass": 0.5,

  "Fire-Grass": 2.0,
  "Fire-Ice": 2.0,
  "Fire-Fire": 0.5,
  "Fire-Water": 0.5,
  "Fire-Rock": 0.5,

  "Water-Fire": 2.0,
  "Water-Ground": 2.0,
  "Water-Water": 0.5,
  "Water-Grass": 0.5,

  "Grass-Water": 2.0,
  "Grass-Ground": 2.0,
  "Grass-Fire": 0.5,
  "Grass-Grass": 0.5,

  "Fighting-Normal": 2.0,
  "Fighting-Ice": 2.0,
  "Fighting-Rock": 2.0,
  "Fighting-Dark": 2.0,
  "Fighting-Steel": 2.0,
  "Fighting-Flying": 0.5,
  "Fighting-Poison": 0.5,
  "Fighting-Psychic": 0.5,
  "Fighting-Bug": 0.5,
  "Fighting-Fairy": 0.5,

  "Psychic-Fighting": 2.0,
  "Psychic-Poison": 2.0,
  "Psychic-Psychic": 0.5,
  "Psychic-Steel": 0.5,
  "Psychic-Dark": 0.0,

  "Dark-Psychic": 2.0,
  "Dark-Ghost": 2.0,
  "Dark-Dark": 0.5,
  "Dark-Fighting": 0.5,
  "Dark-Fairy": 0.5,

  "Steel-Ice": 2.0,
  "Steel-Rock": 2.0,
  "Steel-Fairy": 2.0,
  "Steel-Fire": 0.5,
  "Steel-Water": 0.5,
  "Steel-Electric": 0.5,
  "Steel-Steel": 0.5,

  "Dragon-Dragon": 2.0,
  "Dragon-Steel": 0.5,
  "Dragon-Fairy": 0.0,

  "Fairy-Fighting": 2.0,
  "Fairy-Dragon": 2.0,
  "Fairy-Dark": 2.0,
  "Fairy-Fire": 0.5,
  "Fairy-Poison": 0.5,
  "Fairy-Steel": 0.5,
};

export function getTypeEffectiveness(
  attackerType: PokemonType,
  defenderTypes: PokemonType[]
): number {
  let multiplier = 1.0;
  for (const defType of defenderTypes) {
    const key = `${attackerType}-${defType}`;
    multiplier *= typeChart[key] ?? 1.0;
  }
  return multiplier;
}

export type EffectivenessLabel =
  | "No Effect"
  | "Not Very Effective"
  | "Effective"
  | "Super Effective"
  | "Extremely Effective";

export interface DamageBreakdown {
  basePower: number;
  rngDelta: number; // -5..+5 (0 if deterministic)
  baseAfterRng: number; // basePower + rngDelta (min 1)
  effectiveness: number; // 0, 0.25, 0.5, 1, 2, 4, etc
  effectivenessLabel: EffectivenessLabel;
  stab: number; // 1.5 or 1.0
  finalDamage: number; // floor(baseAfterRng * effectiveness * stab)
}

export function effectivenessLabel(mult: number): EffectivenessLabel {
  if (mult === 0) return "No Effect";
  if (mult < 1) return "Not Very Effective";
  if (mult === 1) return "Effective";
  if (mult === 2) return "Super Effective";
  if (mult > 2) return "Extremely Effective";
  return "Effective";
}

export function getDamageBreakdown(
  attacker: Pokemon,
  defender: Pokemon,
  move: Move,
  deterministic = false,
  rngDeltaOverride?: number
): DamageBreakdown {
  if (move.basePower === 0) {
    return {
      basePower: 0,
      rngDelta: 0,
      baseAfterRng: 0,
      effectiveness: 1,
      effectivenessLabel: "Effective",
      stab: 1,
      finalDamage: 0,
    };
  }

  const rngDelta =
    deterministic ? 0 : (rngDeltaOverride ?? (Math.floor(Math.random() * 11) - 5));

  let baseAfterRng = move.basePower + rngDelta;
  if (baseAfterRng < 1) baseAfterRng = 1;

  const effectiveness = getTypeEffectiveness(move.type, defender.types);
  const stab = attacker.types.includes(move.type) ? 1.5 : 1.0;
  const finalDamage = Math.floor(baseAfterRng * effectiveness * stab);

  return {
    basePower: move.basePower,
    rngDelta,
    baseAfterRng,
    effectiveness,
    effectivenessLabel: effectivenessLabel(effectiveness),
    stab,
    finalDamage,
  };
}

export function calculateDamage(
  attacker: Pokemon,
  defender: Pokemon,
  move: Move,
  deterministic = false
): number {
  return getDamageBreakdown(attacker, defender, move, deterministic).finalDamage;
}

export function createPokemon(
  name: string,
  types: PokemonType[],
  hp: number,
  moves: Move[],
  imageSrc: string,
  emoji: string,
  speed: number,
  attack: number,
  defense: number
): Pokemon {
  return {
    name,
    types,
    maxHp: hp,
    currentHp: hp,
    speed,
    attack,
    defense,
    moves,
    imageSrc,
    emoji,
  };
}

export const allPokemonTemplates = (): Pokemon[] => [
  createPokemon(
    "Pikachu",
    ["Electric"],
    120,
    [
      { name: "Thunderbolt", type: "Electric", basePower: 40 },
      { name: "Electro Ball", type: "Electric", basePower: 30 },
      { name: "Quick Attack", type: "Normal", basePower: 20 },
      { name: "Iron Tail", type: "Steel", basePower: 30 },
    ],
    "/pokemon/pikachu.png",
    "P",
    90,
    55,
    40
  ),
  createPokemon(
    "Charizard",
    ["Fire", "Flying"],
    150,
    [
      { name: "Flamethrower", type: "Fire", basePower: 40 },
      { name: "Fire Blast", type: "Fire", basePower: 45 },
      { name: "Fly", type: "Flying", basePower: 35 },
      { name: "Dragon Claw", type: "Dragon", basePower: 35 },
    ],
    "/pokemon/charizard.png",
    "C",
    80,
    84,
    78
  ),
  createPokemon(
    "Venusaur",
    ["Grass", "Poison"],
    160,
    [
      { name: "Razor Leaf", type: "Grass", basePower: 35 },
      { name: "Solar Beam", type: "Grass", basePower: 45 },
      { name: "Sludge Bomb", type: "Poison", basePower: 35 },
      { name: "Earthquake", type: "Ground", basePower: 40 },
    ],
    "/pokemon/venusaur.png",
    "V",
    60,
    82,
    83
  ),
  createPokemon(
    "Blastoise",
    ["Water"],
    160,
    [
      { name: "Water Pulse", type: "Water", basePower: 30 },
      { name: "Hydro Cannon", type: "Water", basePower: 45 },
      { name: "Ice Beam", type: "Ice", basePower: 35 },
      { name: "Bite", type: "Dark", basePower: 30 },
    ],
    "/pokemon/blastoise.png",
    "B",
    58,
    83,
    100
  ),
  createPokemon(
    "Greninja",
    ["Water", "Dark"],
    140,
    [
      { name: "Water Shuriken", type: "Water", basePower: 30 },
      { name: "Hydro Pump", type: "Water", basePower: 45 },
      { name: "Double Team", type: "Normal", basePower: 0 },
      { name: "Night Slash", type: "Dark", basePower: 35 },
    ],
    "/pokemon/greninja.png",
    "G",
    95,
    103,
    71
  ),
  createPokemon(
    "Lucario",
    ["Fighting", "Steel"],
    140,
    [
      { name: "Aura Sphere", type: "Fighting", basePower: 40 },
      { name: "Close Combat", type: "Fighting", basePower: 45 },
      { name: "Extreme Speed", type: "Normal", basePower: 30 },
      { name: "Metal Claw", type: "Steel", basePower: 25 },
    ],
    "/pokemon/lucario.png",
    "L",
    70,
    130,
    95
  ),
  createPokemon(
    "Mewtwo",
    ["Psychic"],
    180,
    [
      { name: "Psystrike", type: "Psychic", basePower: 45 },
      { name: "Psychic", type: "Psychic", basePower: 40 },
      { name: "Shadow Ball", type: "Ghost", basePower: 35 },
      { name: "Recover", type: "Normal", basePower: 0 },
    ],
    "/pokemon/mewtwo.png",
    "M",
    85,
    150,
    70
  ),
];
