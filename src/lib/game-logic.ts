import { Board, DieValue, MergeGroup, Orientation, Position } from '@/types/game';
import { getSecondDominoPosition } from '@/lib/domino';

const GRID_SIZE = 6;

export function createEmptyBoard(): Board {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => null)
  );
}

export function findMergeGroups(board: Board): MergeGroup[] {
  const visited = Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => false)
  );
  const groups: MergeGroup[] = [];

  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (visited[row][col] || board[row][col] === null) continue;

      const value = board[row][col] as DieValue;
      const group: Position[] = [];
      const queue: Position[] = [{ row, col }];

      while (queue.length > 0) {
        const pos = queue.shift()!;
        if (
          pos.row < 0 || pos.row >= GRID_SIZE ||
          pos.col < 0 || pos.col >= GRID_SIZE ||
          visited[pos.row][pos.col] ||
          board[pos.row][pos.col] !== value
        ) continue;

        visited[pos.row][pos.col] = true;
        group.push(pos);

        queue.push({ row: pos.row - 1, col: pos.col });
        queue.push({ row: pos.row + 1, col: pos.col });
        queue.push({ row: pos.row, col: pos.col - 1 });
        queue.push({ row: pos.row, col: pos.col + 1 });
      }

      if (group.length >= 3) {
        groups.push({ cells: group, value, targetCell: group[group.length - 1] });
      }
    }
  }

  return groups;
}

export function findMergeGroupsAt(board: Board, positions: Position[]): MergeGroup[] {
  const allGroups = findMergeGroups(board);
  return allGroups.filter(group =>
    group.cells.some(cell =>
      positions.some(pos => pos.row === cell.row && pos.col === cell.col)
    )
  );
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

export function calculateMergeScore(group: MergeGroup, chainLink: number): number {
  const basePoints = group.cells.length * group.value;

  const sizeBonus = group.cells.length >= 4 ? 1.5 : 1;
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

export function canPlaceDomino(board: Board): boolean {
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (board[row][col] !== null) continue;
      if (col + 1 < GRID_SIZE && board[row][col + 1] === null) return true;
      if (row + 1 < GRID_SIZE && board[row + 1][col] === null) return true;
    }
  }
  return false;
}

export function getValidPlacements(
  board: Board,
  pieceType: 'single' | 'domino',
  orientation: Orientation
): Position[] {
  const valid: Position[] = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (board[row][col] !== null) continue;
      if (pieceType === 'single') {
        valid.push({ row, col });
      } else {
        const secondPos = getSecondDominoPosition({ row, col }, orientation);
        if (
          secondPos.row >= 0 &&
          secondPos.row < GRID_SIZE &&
          secondPos.col >= 0 &&
          secondPos.col < GRID_SIZE &&
          board[secondPos.row][secondPos.col] === null
        ) {
          valid.push({ row, col });
        }
      }
    }
  }
  return valid;
}
