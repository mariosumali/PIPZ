export type GameMode = 'classic' | 'hardcore' | 'combo';

export interface GameRules {
  gridSize: number;
  mergeMin: number;
  useComboTargets: boolean;
  useTierMerges: boolean;
  allowTriominoes: boolean;
}

export interface ModeInfo {
  id: GameMode;
  label: string;
  shortLabel: string;
  description: string;
  rules: GameRules;
}

export const GAME_MODES: ModeInfo[] = [
  {
    id: 'classic',
    label: 'Classic',
    shortLabel: 'Classic',
    description: 'Standard 6×6 board. Match 3+ to merge.',
    rules: {
      gridSize: 6,
      mergeMin: 3,
      useComboTargets: false,
      useTierMerges: false,
      allowTriominoes: false,
    },
  },
  {
    id: 'hardcore',
    label: 'Hardcore',
    shortLabel: 'Hard',
    description: 'Tighter 5×5 board. You need 4+ matching dice to merge.',
    rules: {
      gridSize: 5,
      mergeMin: 4,
      useComboTargets: false,
      useTierMerges: false,
      allowTriominoes: false,
    },
  },
  {
    id: 'combo',
    label: 'Combo',
    shortLabel: 'Combo',
    description:
      'L-shaped triominos, tier merges (2→6), and chain-friendly merge targets.',
    rules: {
      gridSize: 6,
      mergeMin: 3,
      useComboTargets: true,
      useTierMerges: true,
      allowTriominoes: true,
    },
  },
];

export const DEFAULT_GAME_MODE: GameMode = 'classic';

export function getModeInfo(mode: GameMode): ModeInfo {
  return GAME_MODES.find(m => m.id === mode) ?? GAME_MODES[0];
}

export function getBestScoreKey(mode: GameMode): string {
  return `pipz-best-${mode}`;
}
