import { Orientation, Position } from '@/types/game';

export const DOMINO_DIRECTIONS: Orientation[] = ['right', 'down', 'left', 'up'];

export function rotateDominoOrientation(orientation: Orientation): Orientation {
  const index = DOMINO_DIRECTIONS.indexOf(orientation);
  return DOMINO_DIRECTIONS[(index + 1) % DOMINO_DIRECTIONS.length];
}

export function getDominoOffset(orientation: Orientation): Position {
  switch (orientation) {
    case 'right':
      return { row: 0, col: 1 };
    case 'down':
      return { row: 1, col: 0 };
    case 'left':
      return { row: 0, col: -1 };
    case 'up':
      return { row: -1, col: 0 };
  }
}

export function getSecondDominoPosition(anchor: Position, orientation: Orientation): Position {
  const offset = getDominoOffset(orientation);
  return {
    row: anchor.row + offset.row,
    col: anchor.col + offset.col,
  };
}
