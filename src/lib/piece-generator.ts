import { DieValue, Piece } from '@/types/game';
import { GameRules } from '@/lib/game-modes';
import { DOMINO_DIRECTIONS } from '@/lib/domino';
import { TRIOMINO_ORIENTATIONS } from '@/lib/triomino';

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

function generateDomino(turnNumber: number): Piece {
  return {
    type: 'domino',
    values: [generateValue(turnNumber), generateValue(turnNumber)],
    orientation: DOMINO_DIRECTIONS[Math.floor(Math.random() * DOMINO_DIRECTIONS.length)],
  };
}

function generateTriomino(turnNumber: number): Piece {
  return {
    type: 'triomino',
    values: [
      generateValue(turnNumber),
      generateValue(turnNumber),
      generateValue(turnNumber),
    ],
    orientation:
      TRIOMINO_ORIENTATIONS[
        Math.floor(Math.random() * TRIOMINO_ORIENTATIONS.length)
      ],
  };
}

export function generatePiece(turnNumber: number, rules: GameRules): Piece {
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

  if (rules.allowTriominoes) {
    const triominoChance = turnNumber <= 20 ? 0.12 : turnNumber <= 60 ? 0.2 : 0.28;
    if (Math.random() < triominoChance) {
      return generateTriomino(turnNumber);
    }
  }

  return generateDomino(turnNumber);
}
