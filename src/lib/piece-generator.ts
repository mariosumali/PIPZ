import { DieValue, Piece } from '@/types/game';

function weightedRandom(weights: number[]): number {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return weights.length - 1;
}

function generateValue(turnNumber: number): DieValue {
  let weights: number[];

  if (turnNumber <= 20) {
    weights = [40, 35, 15, 7, 2, 1];
  } else if (turnNumber <= 60) {
    weights = [20, 25, 25, 18, 8, 4];
  } else {
    weights = [10, 15, 25, 25, 15, 10];
  }

  return (weightedRandom(weights) + 1) as DieValue;
}

export function generatePiece(turnNumber: number): Piece {
  let singleChance: number;

  if (turnNumber <= 20) {
    singleChance = 0.85;
  } else if (turnNumber <= 60) {
    const t = (turnNumber - 20) / 40;
    singleChance = 0.85 - t * 0.35;
  } else {
    singleChance = 0.35;
  }

  if (Math.random() < singleChance) {
    return {
      type: 'single',
      value: generateValue(turnNumber),
    };
  }

  return {
    type: 'domino',
    values: [generateValue(turnNumber), generateValue(turnNumber)],
    orientation: Math.random() < 0.5 ? 'horizontal' : 'vertical',
  };
}
