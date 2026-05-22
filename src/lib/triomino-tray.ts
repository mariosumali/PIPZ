import { TriominoOrientation } from '@/lib/triomino';

/** Grid slots (row, col) in a 2×2 tray for each L orientation. */
export function getTriominoTraySlots(
  orientation: TriominoOrientation
): { row: number; col: number; index: number }[] {
  switch (orientation) {
    case 0:
      return [
        { row: 0, col: 0, index: 0 },
        { row: 0, col: 1, index: 1 },
        { row: 1, col: 0, index: 2 },
      ];
    case 1:
      return [
        { row: 0, col: 0, index: 0 },
        { row: 1, col: 0, index: 1 },
        { row: 1, col: 1, index: 2 },
      ];
    case 2:
      return [
        { row: 0, col: 1, index: 0 },
        { row: 1, col: 0, index: 1 },
        { row: 1, col: 1, index: 2 },
      ];
    case 3:
      return [
        { row: 0, col: 0, index: 0 },
        { row: 0, col: 1, index: 1 },
        { row: 1, col: 1, index: 2 },
      ];
  }
}
