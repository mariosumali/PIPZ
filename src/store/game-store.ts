import { create } from 'zustand';
import { Board, DominoPiece, GamePhase, Piece, Position, ScoreEvent } from '@/types/game';
import {
  createEmptyBoard,
  findMergeGroups,
  resolveMerge,
  calculateMergeScore,
  canPlaceSingle,
  canPlaceDomino,
} from '@/lib/game-logic';
import { generatePiece } from '@/lib/piece-generator';
import { playPlaceSound, playMergeSound, playExplosionSound, playRotateSound } from '@/lib/sounds';

interface GameState {
  board: Board;
  currentPiece: Piece | null;
  score: number;
  bestScore: number;
  turnNumber: number;
  phase: GamePhase;
  scoreEvents: ScoreEvent[];
  mergingCells: Position[];
  explodingCells: Position[];

  placePiece: (position: Position) => void;
  rotatePiece: () => void;
  resetGame: () => void;
  dismissScoreEvent: (id: string) => void;
}

function loadBestScore(): number {
  if (typeof window === 'undefined') return 0;
  const stored = localStorage.getItem('pipz-best-score');
  return stored ? parseInt(stored, 10) : 0;
}

function saveBestScore(score: number) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('pipz-best-score', score.toString());
}

function checkGameOver(board: Board, piece: Piece): boolean {
  if (piece.type === 'single') {
    return !canPlaceSingle(board);
  }
  return !canPlaceDomino(board);
}

export const useGameStore = create<GameState>((set, get) => ({
  board: createEmptyBoard(),
  currentPiece: null,
  score: 0,
  bestScore: 0,
  turnNumber: 1,
  phase: 'playing',
  scoreEvents: [],
  mergingCells: [],
  explodingCells: [],

  placePiece: (position: Position) => {
    const { board, currentPiece, score, turnNumber } = get();
    if (!currentPiece || get().phase !== 'playing') return;

    let newBoard = board.map(row => [...row]);
    const placedPositions: Position[] = [];

    if (currentPiece.type === 'single') {
      if (newBoard[position.row][position.col] !== null) return;
      newBoard[position.row][position.col] = currentPiece.value;
      placedPositions.push(position);
    } else {
      const domino = currentPiece as DominoPiece;
      const secondPos: Position = domino.orientation === 'horizontal'
        ? { row: position.row, col: position.col + 1 }
        : { row: position.row + 1, col: position.col };

      if (
        secondPos.row >= 6 || secondPos.col >= 6 ||
        newBoard[position.row][position.col] !== null ||
        newBoard[secondPos.row][secondPos.col] !== null
      ) return;

      newBoard[position.row][position.col] = domino.values[0];
      newBoard[secondPos.row][secondPos.col] = domino.values[1];
      placedPositions.push(position, secondPos);
    }

    let totalScore = score;
    let chainLink = 0;
    const allScoreEvents: ScoreEvent[] = [];
    let allMergingCells: Position[] = [];
    let allExplodingCells: Position[] = [];

    playPlaceSound();

    let mergeGroups = findMergeGroups(newBoard);
    let lastTarget = position;
    let hasExplosion = false;

    while (mergeGroups.length > 0) {
      chainLink++;

      for (const group of mergeGroups) {
        const points = calculateMergeScore(group, chainLink);
        totalScore += points;

        const isExplosion = group.value === 6;
        if (isExplosion) {
          allExplodingCells = [...allExplodingCells, ...group.cells];
          hasExplosion = true;
        } else {
          allMergingCells = [...allMergingCells, ...group.cells];
        }

        allScoreEvents.push({
          id: `${Date.now()}-${chainLink}-${Math.random()}`,
          points,
          position: group.cells[0],
          chainLink,
          timestamp: Date.now(),
        });

        const target = group.cells.find(
          c => c.row === lastTarget.row && c.col === lastTarget.col
        ) || group.cells[group.cells.length - 1];
        
        newBoard = resolveMerge(newBoard, group, lastTarget);
        lastTarget = target;
      }

      mergeGroups = findMergeGroups(newBoard);
    }

    if (chainLink > 0) {
      setTimeout(() => {
        if (hasExplosion) {
          playExplosionSound();
        } else {
          playMergeSound(chainLink);
        }
      }, 100);
    }

    const newTurn = turnNumber + 1;
    const nextPiece = generatePiece(newTurn);

    let newBestScore = get().bestScore;
    if (totalScore > newBestScore) {
      newBestScore = totalScore;
      saveBestScore(newBestScore);
    }

    const isGameOver = checkGameOver(newBoard, nextPiece);

    set({
      board: newBoard,
      score: totalScore,
      bestScore: newBestScore,
      turnNumber: newTurn,
      currentPiece: nextPiece,
      phase: isGameOver ? 'gameover' : 'playing',
      scoreEvents: [...get().scoreEvents, ...allScoreEvents],
      mergingCells: allMergingCells,
      explodingCells: allExplodingCells,
    });

    setTimeout(() => {
      set({ mergingCells: [], explodingCells: [] });
    }, 600);
  },

  rotatePiece: () => {
    const { currentPiece } = get();
    if (!currentPiece || currentPiece.type !== 'domino') return;
    playRotateSound();

    const wasVertical = currentPiece.orientation === 'vertical';
    set({
      currentPiece: {
        ...currentPiece,
        orientation: wasVertical ? 'horizontal' : 'vertical',
        values: wasVertical
          ? [currentPiece.values[1], currentPiece.values[0]]
          : currentPiece.values,
      },
    });
  },

  resetGame: () => {
    const firstPiece = generatePiece(1);
    set({
      board: createEmptyBoard(),
      currentPiece: firstPiece,
      score: 0,
      turnNumber: 1,
      phase: 'playing',
      scoreEvents: [],
      mergingCells: [],
      explodingCells: [],
      bestScore: loadBestScore(),
    });
  },

  dismissScoreEvent: (id: string) => {
    set({
      scoreEvents: get().scoreEvents.filter(e => e.id !== id),
    });
  },
}));
