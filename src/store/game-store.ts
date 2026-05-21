import { create } from 'zustand';
import {
  Board,
  DominoPiece,
  GamePhase,
  MergeAnimationState,
  MergeGroup,
  MergeGroupAnimation,
  Piece,
  Position,
  ScoreEvent,
} from '@/types/game';
import {
  createEmptyBoard,
  findMergeGroups,
  resolveMerge,
  calculateMergeScore,
  canPlaceSingle,
  canPlaceDomino,
} from '@/lib/game-logic';
import { generatePiece } from '@/lib/piece-generator';
import { getSecondDominoPosition, rotateDominoOrientation } from '@/lib/domino';
import { playPlaceSound, playMergeSound, playExplosionSound, playRotateSound } from '@/lib/sounds';

const GLOW_DURATION = 250;
const COLLAPSE_DURATION = 350;
const RESOLVE_DURATION = 300;
const CHAIN_PAUSE = 200;

interface GameState {
  board: Board;
  currentPiece: Piece | null;
  score: number;
  bestScore: number;
  turnNumber: number;
  phase: GamePhase;
  scoreEvents: ScoreEvent[];
  mergeAnimation: MergeAnimationState | null;
  resolvingCells: Position[];
  dragPreviewPosition: Position | null;

  placePiece: (position: Position) => void;
  rotatePiece: () => void;
  resetGame: () => void;
  setDragPreviewPosition: (position: Position | null) => void;
  dismissScoreEvent: (id: string) => void;
}

let mergeTimers: ReturnType<typeof setTimeout>[] = [];
let pendingScore = 0;

function clearMergeTimers() {
  mergeTimers.forEach(clearTimeout);
  mergeTimers = [];
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

function samePosition(a: Position, b: Position): boolean {
  return a.row === b.row && a.col === b.col;
}

function getMergeTarget(group: MergeGroup, recentPlacements: Position[]): Position {
  for (let i = recentPlacements.length - 1; i >= 0; i--) {
    const recent = recentPlacements[i];
    const matchingCell = group.cells.find(cell => samePosition(cell, recent));
    if (matchingCell) return matchingCell;
  }

  return group.targetCell;
}

function buildMergeAnimations(
  mergeGroups: MergeGroup[],
  recentPlacements: Position[]
): MergeGroupAnimation[] {
  return mergeGroups.map(group => {
    const target = getMergeTarget(group, recentPlacements);
    return {
      cells: group.cells,
      target,
      value: group.value,
      isExplosion: group.value === 6,
    };
  });
}

type SetFn = (partial: Partial<GameState> | ((state: GameState) => Partial<GameState>)) => void;
type GetFn = () => GameState;

function startMergeSequence(
  set: SetFn,
  get: GetFn,
  chainLink: number,
  recentPlacements: Position[]
) {
  let nextRecentPlacements = recentPlacements;

  mergeTimers.push(
    setTimeout(() => {
      const anim = get().mergeAnimation;
      if (!anim) return;
      set({ mergeAnimation: { ...anim, phase: 'collapse' } });
    }, GLOW_DURATION)
  );

  mergeTimers.push(
    setTimeout(() => {
      const { board, mergeAnimation: anim } = get();
      if (!anim) return;

      let newBoard = board.map(r => [...r]);
      const scoreEvents: ScoreEvent[] = [];
      let hasExplosion = false;
      const resolveTargets: Position[] = [];

      for (const group of anim.groups) {
        const mergeGroup: MergeGroup = {
          cells: group.cells,
          value: group.value,
          targetCell: group.target,
        };

        const points = calculateMergeScore(mergeGroup, chainLink);
        pendingScore += points;

        if (group.isExplosion) {
          hasExplosion = true;
        } else {
          resolveTargets.push(group.target);
        }

        scoreEvents.push({
          id: `${Date.now()}-${chainLink}-${Math.random()}`,
          points,
          position: group.target,
          chainLink,
          timestamp: Date.now(),
        });

        newBoard = resolveMerge(newBoard, mergeGroup);
      }

      nextRecentPlacements =
        resolveTargets.length > 0 ? resolveTargets : recentPlacements;

      if (hasExplosion) {
        playExplosionSound();
      } else {
        playMergeSound(chainLink);
      }

      let newBestScore = get().bestScore;
      if (pendingScore > newBestScore) {
        newBestScore = pendingScore;
        saveBestScore(newBestScore);
      }

      set({
        board: newBoard,
        score: pendingScore,
        bestScore: newBestScore,
        mergeAnimation: { ...anim, phase: 'resolve' },
        resolvingCells: resolveTargets,
        scoreEvents: [...get().scoreEvents, ...scoreEvents],
      });
    }, GLOW_DURATION + COLLAPSE_DURATION)
  );

  mergeTimers.push(
    setTimeout(() => {
      const { board } = get();
      set({ resolvingCells: [] });

      const nextMergeGroups = findMergeGroups(board);

      if (nextMergeGroups.length > 0) {
        const lastPlaced = nextRecentPlacements[nextRecentPlacements.length - 1];
        const nextChainLink = chainLink + 1;
        const nextAnimations = buildMergeAnimations(
          nextMergeGroups,
          nextRecentPlacements
        );

        set({
          mergeAnimation: {
            phase: 'glow',
            groups: nextAnimations,
            chainLink: nextChainLink,
            lastPlaced,
          },
        });

        mergeTimers.push(
          setTimeout(() => {
            startMergeSequence(set, get, nextChainLink, nextRecentPlacements);
          }, CHAIN_PAUSE)
        );
      } else {
        finalizeTurn(set, get);
      }
    }, GLOW_DURATION + COLLAPSE_DURATION + RESOLVE_DURATION)
  );
}

function finalizeTurn(set: SetFn, get: GetFn) {
  clearMergeTimers();
  const { board, turnNumber } = get();
  const newTurn = turnNumber + 1;
  const nextPiece = generatePiece(newTurn);

  let newBestScore = get().bestScore;
  if (pendingScore > newBestScore) {
    newBestScore = pendingScore;
    saveBestScore(newBestScore);
  }

  const isGameOver = checkGameOver(board, nextPiece);

  set({
    score: pendingScore,
    bestScore: newBestScore,
    turnNumber: newTurn,
    currentPiece: nextPiece,
    phase: isGameOver ? 'gameover' : 'playing',
    mergeAnimation: null,
    resolvingCells: [],
    dragPreviewPosition: null,
  });
}

export const useGameStore = create<GameState>((set, get) => ({
  board: createEmptyBoard(),
  currentPiece: null,
  score: 0,
  bestScore: 0,
  turnNumber: 1,
  phase: 'playing',
  scoreEvents: [],
  mergeAnimation: null,
  resolvingCells: [],
  dragPreviewPosition: null,

  placePiece: (position: Position) => {
    const { board, currentPiece, score, turnNumber } = get();
    if (!currentPiece || get().phase !== 'playing') return;

    const newBoard = board.map(row => [...row]);
    const placedPositions: Position[] = [];

    if (currentPiece.type === 'single') {
      if (newBoard[position.row][position.col] !== null) return;
      newBoard[position.row][position.col] = currentPiece.value;
      placedPositions.push(position);
    } else {
      const domino = currentPiece as DominoPiece;
      const secondPos = getSecondDominoPosition(position, domino.orientation);

      if (
        secondPos.row < 0 ||
        secondPos.row >= 6 ||
        secondPos.col < 0 ||
        secondPos.col >= 6 ||
        newBoard[position.row][position.col] !== null ||
        newBoard[secondPos.row][secondPos.col] !== null
      )
        return;

      newBoard[position.row][position.col] = domino.values[0];
      newBoard[secondPos.row][secondPos.col] = domino.values[1];
      if (domino.values[0] === domino.values[1]) {
        placedPositions.push(secondPos, position);
      } else {
        placedPositions.push(position, secondPos);
      }
    }

    playPlaceSound();

    const mergeGroups = findMergeGroups(newBoard);

    if (mergeGroups.length > 0) {
      pendingScore = score;
      const animations = buildMergeAnimations(mergeGroups, placedPositions);
      const lastPlaced = placedPositions[placedPositions.length - 1];

      set({
        board: newBoard,
        currentPiece: null,
        phase: 'merging',
        dragPreviewPosition: null,
        mergeAnimation: {
          phase: 'glow',
          groups: animations,
          chainLink: 1,
          lastPlaced,
        },
      });

      startMergeSequence(set, get, 1, placedPositions);
    } else {
      const newTurn = turnNumber + 1;
      const nextPiece = generatePiece(newTurn);

      let newBestScore = get().bestScore;
      if (score > newBestScore) {
        newBestScore = score;
        saveBestScore(newBestScore);
      }

      const isGameOver = checkGameOver(newBoard, nextPiece);

      set({
        board: newBoard,
        turnNumber: newTurn,
        currentPiece: nextPiece,
        phase: isGameOver ? 'gameover' : 'playing',
        bestScore: newBestScore,
        dragPreviewPosition: null,
      });
    }
  },

  rotatePiece: () => {
    const { currentPiece } = get();
    if (!currentPiece || currentPiece.type !== 'domino') return;
    playRotateSound();

    set({
      currentPiece: {
        ...currentPiece,
        orientation: rotateDominoOrientation(currentPiece.orientation),
      },
    });
  },

  resetGame: () => {
    clearMergeTimers();
    const firstPiece = generatePiece(1);
    set({
      board: createEmptyBoard(),
      currentPiece: firstPiece,
      score: 0,
      turnNumber: 1,
      phase: 'playing',
      scoreEvents: [],
      mergeAnimation: null,
      resolvingCells: [],
      dragPreviewPosition: null,
      bestScore: loadBestScore(),
    });
  },

  setDragPreviewPosition: (position: Position | null) => {
    set({ dragPreviewPosition: position });
  },

  dismissScoreEvent: (id: string) => {
    set({
      scoreEvents: get().scoreEvents.filter(e => e.id !== id),
    });
  },
}));
