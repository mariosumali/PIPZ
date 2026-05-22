import { Board, DieValue, Piece, Position } from '@/types/game';
import { GameRules } from '@/lib/game-modes';
import { getSecondDominoPosition } from '@/lib/domino';
import { getTriominoCells, TriominoOrientation } from '@/lib/triomino';

function isWithinGrid(pos: Position, rules: GameRules): boolean {
  return (
    pos.row >= 0 &&
    pos.row < rules.gridSize &&
    pos.col >= 0 &&
    pos.col < rules.gridSize
  );
}

export function canPlacePieceAt(
  board: Board,
  piece: Piece,
  anchor: Position,
  rules: GameRules
): boolean {
  if (piece.type === 'single') {
    return (
      isWithinGrid(anchor, rules) && board[anchor.row][anchor.col] === null
    );
  }

  if (piece.type === 'domino') {
    const secondPos = getSecondDominoPosition(anchor, piece.orientation);
    return (
      isWithinGrid(anchor, rules) &&
      isWithinGrid(secondPos, rules) &&
      board[anchor.row][anchor.col] === null &&
      board[secondPos.row][secondPos.col] === null
    );
  }

  const cells = getTriominoCells(anchor, piece.orientation);
  return cells.every(
    pos => isWithinGrid(pos, rules) && board[pos.row][pos.col] === null
  );
}

export function getGhostValueAt(
  piece: Piece,
  anchor: Position,
  cell: Position
): DieValue | null {
  if (piece.type === 'single') {
    if (cell.row === anchor.row && cell.col === anchor.col) return piece.value;
    return null;
  }

  if (piece.type === 'domino') {
    if (cell.row === anchor.row && cell.col === anchor.col) return piece.values[0];
    const second = getSecondDominoPosition(anchor, piece.orientation);
    if (cell.row === second.row && cell.col === second.col) return piece.values[1];
    return null;
  }

  const cells = getTriominoCells(anchor, piece.orientation);
  const index = cells.findIndex(
    pos => pos.row === cell.row && pos.col === cell.col
  );
  if (index === -1) return null;
  return piece.values[index];
}

export function placePieceOnBoard(
  board: Board,
  piece: Piece,
  anchor: Position
): { board: Board; placedPositions: Position[] } {
  const newBoard = board.map(row => [...row]);
  const placedPositions: Position[] = [];

  if (piece.type === 'single') {
    newBoard[anchor.row][anchor.col] = piece.value;
    placedPositions.push(anchor);
    return { board: newBoard, placedPositions };
  }

  if (piece.type === 'domino') {
    const secondPos = getSecondDominoPosition(anchor, piece.orientation);
    newBoard[anchor.row][anchor.col] = piece.values[0];
    newBoard[secondPos.row][secondPos.col] = piece.values[1];
    if (piece.values[0] === piece.values[1]) {
      placedPositions.push(secondPos, anchor);
    } else {
      placedPositions.push(anchor, secondPos);
    }
    return { board: newBoard, placedPositions };
  }

  const cells = getTriominoCells(anchor, piece.orientation);
  const allSame =
    piece.values[0] === piece.values[1] && piece.values[1] === piece.values[2];

  cells.forEach((pos, i) => {
    newBoard[pos.row][pos.col] = piece.values[i];
  });

  if (allSame) {
    for (const pos of cells) {
      if (pos.row !== anchor.row || pos.col !== anchor.col) {
        placedPositions.push(pos);
      }
    }
    placedPositions.push(anchor);
  } else {
    placedPositions.push(anchor);
    for (const pos of cells) {
      if (pos.row !== anchor.row || pos.col !== anchor.col) {
        placedPositions.push(pos);
      }
    }
  }

  return { board: newBoard, placedPositions };
}
