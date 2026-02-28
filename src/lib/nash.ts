import { Pokemon, calculateDamage } from './pokemon-data';

export function buildPayoffMatrix(p1: Pokemon, p2: Pokemon): number[][] {
  const n1 = p1.moves.length;
  const n2 = p2.moves.length;
  const matrix: number[][] = [];
  for (let i = 0; i < n1; i++) {
    matrix[i] = [];
    for (let j = 0; j < n2; j++) {
      // Damage capped by attacker's own HP
      const dmg1 = Math.min(calculateDamage(p1, p2, p1.moves[i], true), p1.maxHp);
      const dmg2 = Math.min(calculateDamage(p2, p1, p2.moves[j], true), p2.maxHp);
      matrix[i][j] = dmg1 - dmg2;
    }
  }
  return matrix;
}

// Simple Nash equilibrium solver using support enumeration for 2-player zero-sum games
// For zero-sum games, we solve the linear program via maximin
function solveZeroSum(matrix: number[][]): { p1: number[]; p2: number[] } | null {
  const m = matrix.length;
  const n = matrix[0].length;
  
  // Use iterative best response / fictitious play for simplicity
  const p1 = new Array(m).fill(1 / m);
  const p2 = new Array(n).fill(1 / n);
  
  for (let iter = 0; iter < 1000; iter++) {
    // Best response for p2 given p1
    const p2Payoffs = new Array(n).fill(0);
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < m; i++) {
        p2Payoffs[j] += p1[i] * matrix[i][j];
      }
    }
    const minJ = p2Payoffs.indexOf(Math.min(...p2Payoffs));
    
    // Best response for p1 given p2
    const p1Payoffs = new Array(m).fill(0);
    for (let i = 0; i < m; i++) {
      for (let j = 0; j < n; j++) {
        p1Payoffs[i] += p2[j] * matrix[i][j];
      }
    }
    const maxI = p1Payoffs.indexOf(Math.max(...p1Payoffs));
    
    // Update with smoothing
    const lr = 2 / (iter + 2);
    for (let i = 0; i < m; i++) p1[i] = p1[i] * (1 - lr) + (i === maxI ? lr : 0);
    for (let j = 0; j < n; j++) p2[j] = p2[j] * (1 - lr) + (j === minJ ? lr : 0);
  }
  
  return { p1, p2 };
}

export function computeNash(p1: Pokemon, p2: Pokemon) {
  const matrix = buildPayoffMatrix(p1, p2);
  const result = solveZeroSum(matrix);
  if (!result) return null;
  
  // Expected damage per round (capped by attacker's HP)
  let expDmg1 = 0;
  let expDmg2 = 0;
  for (let i = 0; i < p1.moves.length; i++) {
    for (let j = 0; j < p2.moves.length; j++) {
      const d1 = Math.min(calculateDamage(p1, p2, p1.moves[i], true), p1.maxHp);
      const d2 = Math.min(calculateDamage(p2, p1, p2.moves[j], true), p2.maxHp);
      expDmg1 += result.p1[i] * result.p2[j] * d1;
      expDmg2 += result.p1[i] * result.p2[j] * d2;
    }
  }
  
  const rounds = 3;
  const hp1Left = p1.maxHp - expDmg2 * rounds;
  const hp2Left = p2.maxHp - expDmg1 * rounds;
  
  let winner: string;
  if (hp1Left > hp2Left) winner = p1.name;
  else if (hp2Left > hp1Left) winner = p2.name;
  else winner = 'Tie';
  
  return {
    p1Strategy: result.p1,
    p2Strategy: result.p2,
    expDmg1,
    expDmg2,
    hp1Left,
    hp2Left,
    winner,
  };
}
