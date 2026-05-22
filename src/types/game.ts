import type { TriominoOrientation } from '@/lib/triomino';

export type DieValue = 1 | 2 | 3 | 4 | 5 | 6;

export type CellState = DieValue | null;

export type Board = CellState[][];

export type Orientation = 'right' | 'down' | 'left' | 'up';

export interface SinglePiece {
  type: 'single';
  value: DieValue;
}

export interface DominoPiece {
  type: 'domino';
  values: [DieValue, DieValue];
  orientation: Orientation;
}

export interface TriominoPiece {
  type: 'triomino';
  values: [DieValue, DieValue, DieValue];
  orientation: TriominoOrientation;
}

export type Piece = SinglePiece | DominoPiece | TriominoPiece;

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

export interface TierLabelEvent {
  id: string;
  fromValue: DieValue;
  toValue: DieValue | 'boom';
  position: Position;
  timestamp: number;
}

export interface MergeGroupAnimation {
  cells: Position[];
  target: Position;
  value: DieValue;
  isExplosion: boolean;
}

export interface MergeAnimationState {
  phase: 'glow' | 'collapse' | 'resolve';
  groups: MergeGroupAnimation[];
  chainLink: number;
  lastPlaced: Position;
}

export type GamePhase = 'playing' | 'merging' | 'gameover';
