export type DieValue = 1 | 2 | 3 | 4 | 5 | 6;

export type CellState = DieValue | null;

export type Board = CellState[][];

export type Orientation = 'horizontal' | 'vertical';

export interface SinglePiece {
  type: 'single';
  value: DieValue;
}

export interface DominoPiece {
  type: 'domino';
  values: [DieValue, DieValue];
  orientation: Orientation;
}

export type Piece = SinglePiece | DominoPiece;

export interface Position {
  row: number;
  col: number;
}

export interface MergeGroup {
  cells: Position[];
  value: DieValue;
  targetCell: Position;
}

export interface ScoreEvent {
  id: string;
  points: number;
  position: Position;
  chainLink: number;
  timestamp: number;
}

export type GamePhase = 'playing' | 'merging' | 'gameover';
