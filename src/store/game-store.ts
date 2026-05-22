import { create } from 'zustand';
import {
  Board,
  GamePhase,
  MergeAnimationState,
  MergeGroup,
  MergeGroupAnimation,
  Piece,
  Position,
  ScoreEvent,
  TierLabelEvent,
} from '@/types/game';
import {
  createEmptyBoard,
  getNextMergeGroups,
  resolveMerge,
  calculateMergeScore,
  checkCanPlacePiece,
} from '@/lib/game-logic';
import { generatePiece } from '@/lib/piece-generator';
import { rotateDominoOrientation } from '@/lib/domino';
import { rotateTriominoOrientation } from '@/lib/triomino';
import { canPlacePieceAt, placePieceOnBoard } from '@/lib/piece-placement';
import { playPlaceSound, playMergeSound, playExplosionSound, playRotateSound } from '@/lib/sounds';
import {
  DEFAULT_GAME_MODE,
  GameMode,
  GameRules,
  getBestScoreKey,
  getModeInfo,
} from '@/lib/game-modes';
import { pickComboWaveTargets } from '@/lib/combo-merge';

const GLOW_DURATION = 250;
const COLLAPSE_DURATION = 350;
const RESOLVE_DURATION = 300;
const CHAIN_PAUSE = 200;

interface GameState {
  gameMode: GameMode;
  board: Board;
  currentPiece: Piece | null;
  score: number;
  bestScore: number;
  turnNumber: number;
  phase: GamePhase;
  scoreEvents: ScoreEvent[];
  tierLabelEvents: TierLabelEvent[];
  mergeAnimation: MergeAnimationState | null;
  resolvingCells: Position[];
  dragPreviewPosition: Position | null;

  placePiece: (position: Position) => void;
  rotatePiece: () => void;
  resetGame: () => void;
  setGameMode: (mode: GameMode) => void;
  setDragPreviewPosition: (position: Position | null) => void;
  dismissScoreEvent: (id: string) => void;
  dismissTierLabelEvent: (id: string) => void;
}

let mergeTimers: ReturnType<typeof setTimeout>[] = [];
let pendingScore = 0;

function clearMergeTimers() {
  mergeTimers.forEach(clearTimeout);
  mergeTimers = [];
}

function getRules(mode: GameMode): GameRules {
  return getModeInfo(mode).rules;
}

function loadBestScore(mode: GameMode): number {
  if (typeof window === 'undefined') return 0;
  const key = getBestScoreKey(mode);
  const stored = localStorage.getItem(key);
  if (stored) return parseInt(stored, 10);
  // Migrate legacy single-key best score into Classic
  if (mode === 'classic') {
    const legacy = localStorage.getItem('pipz-best-score');
    if (legacy) {
      localStorage.setItem(key, legacy);
      return parseInt(legacy, 10);
    }
  }
  return 0;
}

function saveBestScore(mode: GameMode, score: number) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(getBestScoreKey(mode), score.toString());
}

function samePosition(a: Position, b: Position): boolean {
  return a.row === b.row && a.col === b.col;
}

function getClassicMergeTarget(group: MergeGroup, recentPlacements: Position[]): Position {
  for (let i = recentPlacements.length - 1; i >= 0; i--) {
    const recent = recentPlacements[i];
    const matchingCell = group.cells.find(cell => samePosition(cell, recent));
    if (matchingCell) return matchingCell;
  }
  return group.targetCell;
}

function buildMergeAnimations(
  board: Board,
  mergeGroups: MergeGroup[],
  recentPlacements: Position[],
  rules: GameRules
): MergeGroupAnimation[] {
  const comboTargets = rules.useComboTargets
    ? pickComboWaveTargets(board, mergeGroups, recentPlacements, rules)
    : null;

  return mergeGroups.map((group, index) => {
    const target = comboTargets
      ? comboTargets[index]
      : getClassicMergeTarget(group, recentPlacements);

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

function buildTierLabels(
  groups: MergeGroupAnimation[]
): TierLabelEvent[] {
  const now = Date.now();
  return groups.map((group, i) => ({
    id: `tier-${now}-${i}-${group.target.row}-${group.target.col}`,
    fromValue: group.value,
    toValue: group.isExplosion ? 'boom' : ((group.value + 1) as TierLabelEvent['toValue']),
    position: group.target,
    timestamp: now,
  }));
}

function startMergeSequence(
  set: SetFn,
  get: GetFn,
  chainLink: number,
  recentPlacements: Position[]
) {
  let nextRecentPlacements = recentPlacements;
  const rules = getRules(get().gameMode);

  mergeTimers.push(
    setTimeout(() => {
      const anim = get().mergeAnimation;
      if (!anim) return;

      const isCombo = get().gameMode === 'combo';
      const newTierLabels = isCombo ? buildTierLabels(anim.groups) : [];

      set({
        mergeAnimation: { ...anim, phase: 'collapse' },
        tierLabelEvents: isCombo
          ? [...get().tierLabelEvents, ...newTierLabels]
          : get().tierLabelEvents,
      });
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

        const points = calculateMergeScore(mergeGroup, chainLink, rules.mergeMin);
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

      const { gameMode, bestScore } = get();
      let newBestScore = bestScore;
      if (pendingScore > newBestScore) {
        newBestScore = pendingScore;
        saveBestScore(gameMode, newBestScore);
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
      const { board, gameMode } = get();
      set({ resolvingCells: [] });

      const modeRules = getRules(gameMode);
      const nextMergeGroups = getNextMergeGroups(board, modeRules);

      if (nextMergeGroups.length > 0) {
        const lastPlaced = nextRecentPlacements[nextRecentPlacements.length - 1];
        const nextChainLink = chainLink + 1;
        const nextAnimations = buildMergeAnimations(
          board,
          nextMergeGroups,
          nextRecentPlacements,
          modeRules
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
  const { board, turnNumber, gameMode } = get();
  const rules = getRules(gameMode);
  const newTurn = turnNumber + 1;
  const nextPiece = generatePiece(newTurn, rules);

  let newBestScore = get().bestScore;
  if (pendingScore > newBestScore) {
    newBestScore = pendingScore;
    saveBestScore(gameMode, newBestScore);
  }

  const isGameOver = !checkCanPlacePiece(board, nextPiece, rules);

  set({
    score: pendingScore,
    bestScore: newBestScore,
    turnNumber: newTurn,
    currentPiece: nextPiece,
    phase: isGameOver ? 'gameover' : 'playing',
    mergeAnimation: null,
    resolvingCells: [],
    dragPreviewPosition: null,
    tierLabelEvents: [],
  });
}

function startNewGame(set: SetFn, mode: GameMode) {
  clearMergeTimers();
  const rules = getRules(mode);
  const firstPiece = generatePiece(1, rules);
  set({
    gameMode: mode,
    board: createEmptyBoard(rules),
    currentPiece: firstPiece,
    score: 0,
    turnNumber: 1,
    phase: 'playing',
    scoreEvents: [],
    tierLabelEvents: [],
    mergeAnimation: null,
    resolvingCells: [],
    dragPreviewPosition: null,
    bestScore: loadBestScore(mode),
  });
}

export const useGameStore = create<GameState>((set, get) => ({
  gameMode: DEFAULT_GAME_MODE,
  board: createEmptyBoard(getRules(DEFAULT_GAME_MODE)),
  currentPiece: null,
  score: 0,
  bestScore: 0,
  turnNumber: 1,
  phase: 'playing',
  scoreEvents: [],
  tierLabelEvents: [],
  mergeAnimation: null,
  resolvingCells: [],
  dragPreviewPosition: null,

  placePiece: (position: Position) => {
    const { board, currentPiece, score, turnNumber, gameMode } = get();
    if (!currentPiece || get().phase !== 'playing') return;

    const rules = getRules(gameMode);
    if (!canPlacePieceAt(board, currentPiece, position, rules)) return;

    const { board: newBoard, placedPositions } = placePieceOnBoard(
      board,
      currentPiece,
      position
    );

    playPlaceSound();

    const mergeGroups = getNextMergeGroups(newBoard, rules);

    if (mergeGroups.length > 0) {
      pendingScore = score;
      const animations = buildMergeAnimations(
        newBoard,
        mergeGroups,
        placedPositions,
        rules
      );
      const lastPlaced = placedPositions[placedPositions.length - 1];

      set({
        board: newBoard,
        currentPiece: null,
        phase: 'merging',
        dragPreviewPosition: null,
        tierLabelEvents: [],
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
      const nextPiece = generatePiece(newTurn, rules);

      let newBestScore = get().bestScore;
      if (score > newBestScore) {
        newBestScore = score;
        saveBestScore(gameMode, newBestScore);
      }

      const isGameOver = !checkCanPlacePiece(newBoard, nextPiece, rules);

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
    if (!currentPiece || currentPiece.type === 'single') return;
    playRotateSound();

    if (currentPiece.type === 'domino') {
      set({
        currentPiece: {
          ...currentPiece,
          orientation: rotateDominoOrientation(currentPiece.orientation),
        },
      });
      return;
    }

    set({
      currentPiece: {
        ...currentPiece,
        orientation: rotateTriominoOrientation(currentPiece.orientation),
      },
    });
  },

  resetGame: () => {
    startNewGame(set, get().gameMode);
  },

  setGameMode: (mode: GameMode) => {
    if (mode === get().gameMode) return;
    startNewGame(set, mode);
  },

  setDragPreviewPosition: (position: Position | null) => {
    set({ dragPreviewPosition: position });
  },

  dismissScoreEvent: (id: string) => {
    set({
      scoreEvents: get().scoreEvents.filter(e => e.id !== id),
    });
  },

  dismissTierLabelEvent: (id: string) => {
    set({
      tierLabelEvents: get().tierLabelEvents.filter(e => e.id !== id),
    });
  },
}));
