import { Board, MergeGroup, Position } from '@/types/game';
import { GameRules } from '@/lib/game-modes';
import { getNextMergeGroups, resolveMerge } from '@/lib/game-logic';

const MAX_CASCADE_STEPS = 24;

const cascadeScoreCache = new Map<string, number>();

function boardKey(board: Board): string {
  return board.map(row => row.map(c => (c === null ? '.' : c)).join('')).join(';');
}

function clearCascadeCache() {
  cascadeScoreCache.clear();
}

function groupKey(group: MergeGroup): string {
  return group.cells
    .map(c => `${c.row},${c.col}`)
    .sort()
    .join('|');
}

function cartesianProduct<T>(arrays: T[][]): T[][] {
  if (arrays.length === 0) return [[]];
  return arrays.reduce<T[][]>(
    (acc, curr) => acc.flatMap(prefix => curr.map(item => [...prefix, item])),
    [[]]
  );
}

function applyWave(
  board: Board,
  groups: MergeGroup[],
  targets: Position[]
): Board {
  let sim = board.map(row => [...row]);
  for (let i = 0; i < groups.length; i++) {
    sim = resolveMerge(sim, { ...groups[i], targetCell: targets[i] });
  }
  return sim;
}

function waveImmediateScore(groups: MergeGroup[]): number {
  return groups.reduce((sum, g) => {
    let s = g.cells.length * 20;
    if (g.value === 6) s += 800;
    return sum + s;
  }, 0);
}

/**
 * From `board`, greedily resolve each tier with the wave target combo that
 * maximizes total remaining cascade length (chain links to game over for this placement).
 */
function measureCascadeScore(board: Board, rules: GameRules): number {
  const key = boardKey(board);
  const cached = cascadeScoreCache.get(key);
  if (cached !== undefined) return cached;

  let sim = board.map(row => [...row]);
  let chainLinks = 0;
  let mergeCells = 0;

  for (let step = 0; step < MAX_CASCADE_STEPS; step++) {
    const groups = getNextMergeGroups(sim, rules);
    if (groups.length === 0) break;

    const targets = pickBestWaveTargets(sim, groups, rules);
    mergeCells += groups.reduce((n, g) => n + g.cells.length, 0);
    sim = applyWave(sim, groups, targets);
    chainLinks++;
  }

  const score = chainLinks * 100_000 + mergeCells * 50;
  cascadeScoreCache.set(key, score);
  return score;
}

/**
 * Brute-force all target combinations for this wave; pick the combo that
 * yields the longest cascade from the resulting board.
 */
function pickBestWaveTargets(
  board: Board,
  groups: MergeGroup[],
  rules: GameRules
): Position[] {
  if (groups.length === 0) return [];
  if (groups.length === 1) {
    return [pickBestSingleTarget(board, groups[0], rules)];
  }

  const choices = groups.map(g => g.cells);
  let bestTargets = groups.map(g => g.cells[0]);
  let bestScore = -Infinity;

  for (const targets of cartesianProduct(choices)) {
    const afterWave = applyWave(board, groups, targets);
    const score =
      waveImmediateScore(groups) + measureCascadeScore(afterWave, rules);

    if (score > bestScore) {
      bestScore = score;
      bestTargets = targets;
    }
  }

  return bestTargets;
}

function pickBestSingleTarget(
  board: Board,
  group: MergeGroup,
  rules: GameRules
): Position {
  let bestTarget = group.cells[0];
  let bestScore = -Infinity;

  for (const candidate of group.cells) {
    const afterWave = resolveMerge(board, { ...group, targetCell: candidate });
    const score =
      waveImmediateScore([group]) + measureCascadeScore(afterWave, rules);

    if (score > bestScore) {
      bestScore = score;
      bestTarget = candidate;
    }
  }

  return bestTarget;
}

/**
 * Optimal targets for every merge group in the current wave (joint optimization).
 */
export function pickComboWaveTargets(
  board: Board,
  groups: MergeGroup[],
  _recentPlacements: Position[],
  rules: GameRules
): Position[] {
  if (groups.length === 0) return [];
  clearCascadeCache();
  return pickBestWaveTargets(board, groups, rules);
}

/** @deprecated Use pickComboWaveTargets — kept for single-group callers */
export function pickComboMergeTarget(
  board: Board,
  group: MergeGroup,
  recentPlacements: Position[],
  rules: GameRules,
  waveGroups?: MergeGroup[]
): Position {
  const groups =
    waveGroups && waveGroups.length > 0 ? waveGroups : [group];
  const targets = pickComboWaveTargets(board, groups, recentPlacements, rules);
  const idx = groups.findIndex(g => groupKey(g) === groupKey(group));
  return targets[idx >= 0 ? idx : 0];
}
