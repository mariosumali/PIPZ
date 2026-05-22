import { Position } from '@/types/game';

/** L-tromino rotation index (0–3), anchor at the corner cell. */
export type TriominoOrientation = 0 | 1 | 2 | 3;

export const TRIOMINO_ORIENTATIONS: TriominoOrientation[] = [0, 1, 2, 3];

const TRIOMINO_OFFSETS: Record<TriominoOrientation, Position[]> = {
  0: [
    { row: 0, col: 0 },
    { row: 0, col: 1 },
    { row: 1, col: 0 },
  ],
  1: [
    { row: 0, col: 0 },
    { row: 1, col: 0 },
    { row: 1, col: 1 },
  ],
  2: [
    { row: 0, col: 1 },
    { row: 1, col: 0 },
    { row: 1, col: 1 },
  ],
  3: [
    { row: 0, col: 0 },
    { row: 0, col: 1 },
    { row: 1, col: 1 },
  ],
};

export function rotateTriominoOrientation(
  orientation: TriominoOrientation
): TriominoOrientation {
  return ((orientation + 1) % 4) as TriominoOrientation;
}

export function getTriominoCells(
  anchor: Position,
  orientation: TriominoOrientation
): Position[] {
  return TRIOMINO_OFFSETS[orientation].map(offset => ({
    row: anchor.row + offset.row,
    col: anchor.col + offset.col,
  }));
}
