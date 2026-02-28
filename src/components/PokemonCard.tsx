import { useEffect, useMemo, useState } from "react";
import type { ElementType } from "react";
import {
	Pokemon,
	TYPE_COLORS,
	PokemonType,
	getTypeEffectiveness,
} from "@/lib/pokemon-data";
import { Sword, Shield, Zap, Info } from "lucide-react";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface PokemonCardProps {
	pokemon: Pokemon;
	player: 1 | 2;
	opponentTypes: PokemonType[];

	selectedMove: number | null;
	onSelectMove: (idx: number) => void;

	isActive: boolean;
	isShaking: boolean;

	damageText: string | null;
	effectText: string | null;

	attacking?: boolean;
	showEntrance?: boolean;
}

function getHpColorHsl(pct: number): string {
	if (pct > 0.5) return "hsl(142, 70%, 45%)";
	if (pct > 0.25) return "hsl(45, 90%, 55%)";
	return "hsl(0, 80%, 50%)";
}

function getTypeColorClass(type: PokemonType): string {
	return TYPE_COLORS[type] || "bg-muted";
}

function getEffectClass(text: string) {
	if (text.includes("SUPER")) return "text-emerald-400";
	if (text.includes("NOT")) return "text-amber-300";
	if (text.includes("NO EFFECT")) return "text-slate-300";
	return "text-primary";
}

function getEffLabel(eff: number) {
	if (eff === 0) return "0x";
	if (eff >= 2) return "2x";
	if (eff <= 0.5) return "0.5x";
	return "1x";
}

// Mini stat bar component
function StatBar({
	icon: Icon,
	label,
	value,
	maxValue = 150,
	color,
}: {
	icon: ElementType;
	label: string;
	value: number;
	maxValue?: number;
	color: string;
}) {
	const pct = Math.min((value / maxValue) * 100, 100);

	return (
		<div className="flex items-center gap-2">
			<Icon className="w-3 h-3 text-muted-foreground" />
			<span className="text-[10px] text-muted-foreground w-8">{label}</span>
			<div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
				<div
					className={`h-full ${color} rounded-full transition-all duration-500`}
					style={{ width: `${pct}%` }}
				/>
			</div>
			<span className="text-[10px] font-mono text-muted-foreground w-5">{value}</span>
		</div>
	);
}

export default function PokemonCard({
	pokemon,
	player,
	opponentTypes,
	selectedMove,
	onSelectMove,
	isActive,
	isShaking,
	damageText,
	effectText,
	attacking = false,
	showEntrance = false,
}: PokemonCardProps) {
	const hpPct = pokemon.currentHp / pokemon.maxHp;

	const [imageOk, setImageOk] = useState(true);
	const [isHovered, setIsHovered] = useState(false);
	const [detailsOpen, setDetailsOpen] = useState(false);

	useEffect(() => {
		setImageOk(true);
	}, [pokemon.imageSrc]);

	const showImage = Boolean(pokemon.imageSrc) && imageOk;

	const entranceClass = useMemo(() => {
		if (!showEntrance) return "";
		return player === 1 ? "animate-entrance-p1" : "animate-entrance-p2";
	}, [showEntrance, player]);

	const shakeClass = useMemo(() => {
		if (isShaking && attacking) {
			return player === 1 ? "animate-attack-p1" : "animate-attack-p2";
		}
		if (isShaking) return "animate-shake";
		return "";
	}, [isShaking, attacking, player]);

	const handleCardClick = (e: React.MouseEvent) => {
		const target = e.target as HTMLElement;
		if (target.closest("button")) return; // don't interfere with move clicks
		setDetailsOpen(true); // clicking card opens details (nice UX)
	};

	return (
		<>
			<div
				className={`panel-gradient rounded-xl p-6 relative transition-all duration-300 card-hover-lift card-glow-hover ${entranceClass} ${shakeClass} ${isShaking && !attacking ? "animate-flash-damage" : ""
					}`}
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
				onClick={handleCardClick}
			>
				{/* Details Button */}
				<button
					onClick={(e) => {
						e.stopPropagation();
						setDetailsOpen(true);
					}}
					className="absolute top-3 right-3 w-7 h-7 rounded-full bg-secondary/80 hover:bg-secondary border border-border flex items-center justify-center transition-all duration-200 hover:scale-110 z-10"
					aria-label="View details"
				>
					<Info className="w-4 h-4 text-muted-foreground" />
				</button>

				{damageText && (
					<div className="absolute top-4 left-1/2 -translate-x-1/2 text-2xl font-pixel text-destructive animate-damage z-10">
						-{damageText}
					</div>
				)}

				{effectText && (
					<div
						className={`absolute top-12 left-1/2 -translate-x-1/2 text-sm md:text-base font-pixel tracking-wide ${getEffectClass(
							effectText
						)} animate-effect-pop z-10 drop-shadow`}
					>
						{effectText}
					</div>
				)}

				<div className="text-center mb-4">
					<span className="text-xs font-pixel text-muted-foreground tracking-wider">
						PLAYER {player}
					</span>
				</div>

				{/* Avatar */}
				<div className="flex justify-center mb-4">
					<div
						className={`w-28 h-28 rounded-full bg-secondary flex items-center justify-center text-6xl border-2 border-border shadow-lg overflow-hidden transition-all duration-300 ${isHovered ? "scale-110 ring-2 ring-primary/50" : ""
							}`}
					>
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
				<h2 className="text-xl font-bold text-center text-foreground mb-2">
					{pokemon.name}
				</h2>

				<div className="flex gap-2 justify-center mb-4 flex-wrap">
					{pokemon.types.map((t) => (
						<TooltipProvider key={t} delayDuration={200}>
							<Tooltip>
								<TooltipTrigger asChild>
									<span
										className={`${getTypeColorClass(
											t
										)} text-xs px-3 py-1 rounded-full font-semibold text-primary-foreground shadow-sm cursor-help`}
									>
										{t}
									</span>
								</TooltipTrigger>

								<TooltipContent className="max-w-xs text-xs bg-card border-border p-3 rounded-lg shadow-xl">
									<p className="font-bold mb-2 text-primary">{t} Type</p>

									{(() => {
										// same logic as your previous version
										const allTypes: PokemonType[] = [
											"Electric", "Fire", "Water", "Grass", "Fighting", "Psychic",
											"Dark", "Steel", "Dragon", "Fairy", "Flying", "Normal",
											"Ghost", "Ice", "Poison", "Ground", "Rock", "Bug",
										];

										const strong: string[] = [];
										const weak: string[] = [];
										const noEffect: string[] = [];

										for (const defType of allTypes) {
											const eff = getTypeEffectiveness(t, [defType]);
											if (eff >= 2) strong.push(defType);
											else if (eff <= 0.5 && eff > 0) weak.push(defType);
											else if (eff === 0) noEffect.push(defType);
										}

										return (
											<div className="space-y-1">
												{strong.length > 0 && (
													<p className="text-green-400">
														🟢 <span className="text-foreground">Super effective:</span>{" "}
														{strong.join(", ")}
													</p>
												)}
												{weak.length > 0 && (
													<p className="text-amber-400">
														🟡 <span className="text-foreground">Not very effective:</span>{" "}
														{weak.join(", ")}
													</p>
												)}
												{noEffect.length > 0 && (
													<p className="text-slate-400">
														⚪ <span className="text-foreground">No effect:</span>{" "}
														{noEffect.join(", ")}
													</p>
												)}
											</div>
										);
									})()}
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					))}
				</div>

				{/* HP */}
				<div className="mb-4">
					<div className="flex justify-between text-xs text-muted-foreground mb-1">
						<span>HP</span>
						<span>
							{pokemon.currentHp}/{pokemon.maxHp}
						</span>
					</div>

					<div className="w-full h-4 bg-secondary rounded-full overflow-hidden shadow-inner">
						<div
							className="h-full rounded-full hp-bar-transition relative overflow-hidden"
							style={{
								width: `${Math.max(0, hpPct * 100)}%`,
								backgroundColor: getHpColorHsl(hpPct),
							}}
						>
							<div className="absolute top-0 left-0 right-0 h-1/2 bg-white/20 rounded-t-full" />
						</div>
					</div>
				</div>

				{/* Stats */}
				<div className="my-2">
					<div className="space-y-1.5 py-2 border-t border-border/50">
						<StatBar icon={Sword} label="ATK" value={pokemon.attack} color="bg-red-500" />
						<StatBar icon={Shield} label="DEF" value={pokemon.defense} color="bg-blue-500" />
						<StatBar icon={Zap} label="SPD" value={pokemon.speed} color="bg-yellow-500" />
					</div>
				</div>

				{/* Moves */}
				<div className="space-y-2">
					<p className="text-xs font-pixel text-muted-foreground text-center tracking-wider mb-2">
						MOVES
					</p>

					{pokemon.moves.map((move, idx) => {
						const eff = getTypeEffectiveness(move.type, opponentTypes);
						const effLabel = getEffLabel(eff);

						const effChipClass =
							eff === 0
								? "bg-slate-500/30 text-slate-200"
								: eff >= 2
									? "bg-emerald-500/20 text-emerald-200"
									: eff <= 0.5
										? "bg-amber-500/20 text-amber-200"
										: "bg-secondary/70 text-muted-foreground";

						return (
							<button
								key={move.name}
								onClick={() => isActive && onSelectMove(idx)}
								disabled={!isActive}
								className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                  ${selectedMove === idx
										? "ring-2 ring-primary bg-primary/20 text-foreground scale-[1.02]"
										: "bg-secondary/50 text-secondary-foreground hover:bg-secondary"
									}
                  ${!isActive
										? "opacity-50 cursor-not-allowed"
										: "cursor-pointer hover:scale-[1.01]"
									}
                `}
							>
								<div className="flex items-center justify-between">
									<span className="flex items-center gap-2">
										{move.name}
										{selectedMove === idx && (
											<span className="text-[10px] px-2 py-0.5 rounded bg-primary/20 text-primary">
												✓
											</span>
										)}
									</span>

									<div className="flex items-center gap-2">
										{/* Effectiveness preview vs opponent */}
										<span className={`text-[10px] px-2 py-0.5 rounded ${effChipClass}`}>
											{effLabel}
										</span>

										<span
											className={`${getTypeColorClass(
												move.type
											)} text-[10px] px-2 py-0.5 rounded text-primary-foreground`}
										>
											{move.type}
										</span>

										<span className="text-xs text-muted-foreground">
											{move.basePower > 0 ? `${move.basePower}pw` : "-"}
										</span>
									</div>
								</div>
							</button>
						);
					})}
				</div>
			</div>

			{/* Details Dialog */}
			<Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
				<DialogContent className="bg-card border-border max-w-md mx-auto p-6 rounded-xl shadow-2xl">
					<DialogHeader>
						<DialogTitle className="font-pixel text-sm text-primary flex items-center gap-2">
							{pokemon.imageSrc ? (
								<img
									src={pokemon.imageSrc}
									alt={pokemon.name}
									className="w-8 h-8 object-contain"
								/>
							) : (
								<span className="text-2xl">{pokemon.emoji}</span>
							)}
							{pokemon.name} - Details
						</DialogTitle>
					</DialogHeader>

					<div className="space-y-4">
						{/* Types */}
						<div>
							<h4 className="text-xs font-pixel text-muted-foreground mb-2">TYPES</h4>
							<div className="flex gap-2 flex-wrap">
								{pokemon.types.map((t) => (
									<span
										key={t}
										className={`${getTypeColorClass(
											t
										)} text-xs px-3 py-1 rounded-full font-semibold text-primary-foreground`}
									>
										{t}
									</span>
								))}
							</div>
						</div>

						{/* Stats */}
						<div>
							<h4 className="text-xs font-pixel text-muted-foreground mb-2">STATS</h4>
							<div className="space-y-2">
								<StatBar icon={Sword} label="ATK" value={pokemon.attack} color="bg-red-500" />
								<StatBar
									icon={Shield}
									label="DEF"
									value={pokemon.defense}
									color="bg-blue-500"
								/>
								<StatBar icon={Zap} label="SPD" value={pokemon.speed} color="bg-yellow-500" />

								<div className="flex justify-between text-sm mt-2 pt-2 border-t border-border">
									<span className="text-muted-foreground">Max HP</span>
									<span className="font-bold">{pokemon.maxHp}</span>
								</div>
							</div>
						</div>

						{/* Moves */}
						<div>
							<h4 className="text-xs font-pixel text-muted-foreground mb-2">MOVES</h4>
							<div className="space-y-2">
								{pokemon.moves.map((move, idx) => {
									const eff = getTypeEffectiveness(move.type, opponentTypes);
									const effLabel = getEffLabel(eff);

									return (
										<div key={idx} className="bg-secondary/30 rounded-lg p-3">
											<div className="flex items-center justify-between mb-1">
												<span className="font-medium">{move.name}</span>
												<div className="flex items-center gap-2">
													<span className="text-[10px] px-2 py-0.5 rounded bg-secondary/70 text-muted-foreground">
														{effLabel}
													</span>
													<span
														className={`${getTypeColorClass(
															move.type
														)} text-[10px] px-2 py-0.5 rounded text-primary-foreground`}
													>
														{move.type}
													</span>
												</div>
											</div>

											<div className="text-xs text-muted-foreground">
												Power: {move.basePower > 0 ? move.basePower : "Status"}
											</div>
										</div>
									);
								})}
							</div>

							<p className="text-xs text-muted-foreground mt-2">
								Effectiveness labels are vs the current opponent (2x / 1x / 0.5x / 0x).
							</p>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}