import { Board, DieValue, MergeGroup, Orientation, Piece, Position } from '@/types/game';
import { GameRules } from '@/lib/game-modes';
import { getSecondDominoPosition } from '@/lib/domino';
import { getTriominoCells, TriominoOrientation } from '@/lib/triomino';
import { canPlacePieceAt } from '@/lib/piece-placement';

export function createEmptyBoard(rules: GameRules): Board {
  return Array.from({ length: rules.gridSize }, () =>
    Array.from({ length: rules.gridSize }, () => null)
  );
}

export function findMergeGroups(board: Board, rules: GameRules): MergeGroup[] {
  const { gridSize, mergeMin } = rules;
  const visited = Array.from({ length: gridSize }, () =>
    Array.from({ length: gridSize }, () => false)
  );
  const groups: MergeGroup[] = [];

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if (visited[row][col] || board[row][col] === null) continue;

      const value = board[row][col] as DieValue;
      const group: Position[] = [];
      const queue: Position[] = [{ row, col }];

      while (queue.length > 0) {
        const pos = queue.shift()!;
        if (
          pos.row < 0 ||
          pos.row >= gridSize ||
          pos.col < 0 ||
          pos.col >= gridSize ||
          visited[pos.row][pos.col] ||
          board[pos.row][pos.col] !== value
        )
          continue;

        visited[pos.row][pos.col] = true;
        group.push(pos);

        queue.push({ row: pos.row - 1, col: pos.col });
        queue.push({ row: pos.row + 1, col: pos.col });
        queue.push({ row: pos.row, col: pos.col - 1 });
        queue.push({ row: pos.row, col: pos.col + 1 });
      }

      if (group.length >= mergeMin) {
        groups.push({ cells: group, value, targetCell: group[group.length - 1] });
      }
    }
  }

  return groups;
}

/** Combo mode: only merge the lowest value groups first (2s before 3s, etc.). */
export function findLowestValueMergeGroups(
  board: Board,
  rules: GameRules
): MergeGroup[] {
  const all = findMergeGroups(board, rules);
  if (all.length === 0) return [];
  const minValue = Math.min(...all.map(g => g.value));
  return all.filter(g => g.value === minValue);
}

export function findMergeGroupsAt(
  board: Board,
  positions: Position[],
  rules: GameRules
): MergeGroup[] {
  const allGroups = findMergeGroups(board, rules);
  return allGroups.filter(group =>
    group.cells.some(cell =>
      positions.some(pos => pos.row === cell.row && pos.col === cell.col)
    )
  );
}

export function getNextMergeGroups(
  board: Board,
  rules: GameRules
): MergeGroup[] {
  return rules.useTierMerges
    ? findLowestValueMergeGroups(board, rules)
    : findMergeGroups(board, rules);
}

export function resolveMerge(board: Board, group: MergeGroup): Board {
  const newBoard = board.map(row => [...row]);
  const newValue = group.value + 1;

  const target =
    group.cells.find(
      c => c.row === group.targetCell.row && c.col === group.targetCell.col
    ) || group.cells[group.cells.length - 1];

  for (const cell of group.cells) {
    newBoard[cell.row][cell.col] = null;
  }

  if (newValue <= 6) {
    newBoard[target.row][target.col] = newValue as DieValue;
  }

  return newBoard;
}

export function getChainMultiplier(chainLink: number): number {
  if (chainLink === 1) return 1;
  if (chainLink === 2) return 1.5;
  return 1.5 + (chainLink - 2) * 0.5;
}

export function calculateMergeScore(
  group: MergeGroup,
  chainLink: number,
  mergeMin = 3
): number {
  const basePoints = group.cells.length * group.value;

  const extraCells = Math.max(0, group.cells.length - mergeMin);
  const sizeBonus = 1 + extraCells;
  const adjustedBase = basePoints * sizeBonus;

  let multiplier: number;
  if (chainLink === 1) multiplier = 1;
  else if (chainLink === 2) multiplier = 1.5;
  else multiplier = 1.5 + (chainLink - 2) * 0.5;

  let total = Math.floor(adjustedBase * multiplier);

  if (group.value === 6) {
    total += 500;
  }

  return total;
}

export function isBoardFull(board: Board): boolean {
  return board.every(row => row.every(cell => cell !== null));
}

export function canPlaceSingle(board: Board): boolean {
  return board.some(row => row.some(cell => cell === null));
}

export function canPlaceDomino(board: Board, rules: GameRules): boolean {
  const { gridSize } = rules;
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if (board[row][col] !== null) continue;
      if (col + 1 < gridSize && board[row][col + 1] === null) return true;
      if (row + 1 < gridSize && board[row + 1][col] === null) return true;
    }
  }
  return false;
}

export function canPlaceTriomino(
  board: Board,
  orientation: TriominoOrientation,
  rules: GameRules
): boolean {
  const probe: Piece = {
    type: 'triomino',
    values: [1, 1, 1],
    orientation,
  };
  const { gridSize } = rules;
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if (canPlacePieceAt(board, probe, { row, col }, rules)) return true;
    }
  }
  return false;
}

export function checkCanPlacePiece(board: Board, piece: Piece, rules: GameRules): boolean {
  if (piece.type === 'single') {
    return canPlaceSingle(board);
  }
  if (piece.type === 'domino') {
    return canPlaceDomino(board, rules);
  }
  return canPlaceTriomino(board, piece.orientation, rules);
}

export function getValidPlacements(
  board: Board,
  pieceType: 'single' | 'domino',
  orientation: Orientation,
  rules: GameRules
): Position[] {
  const { gridSize } = rules;
  const valid: Position[] = [];
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if (board[row][col] !== null) continue;
      if (pieceType === 'single') {
        valid.push({ row, col });
      } else {
        const secondPos = getSecondDominoPosition({ row, col }, orientation);
        if (
          secondPos.row >= 0 &&
          secondPos.row < gridSize &&
          secondPos.col >= 0 &&
          secondPos.col < gridSize &&
          board[secondPos.row][secondPos.col] === null
        ) {
          valid.push({ row, col });
        }
      }
    }
  }
  return valid;
}

export function isWithinGrid(pos: Position, rules: GameRules): boolean {
  return (
    pos.row >= 0 &&
    pos.row < rules.gridSize &&
    pos.col >= 0 &&
    pos.col < rules.gridSize
  );
}
