import { Position } from '@/types/game';

const GRID_SIZE = 6;

export function getBoardPositionFromPoint(
  boardElement: HTMLElement,
  clientX: number,
  clientY: number
): Position | null {
  const rect = boardElement.getBoundingClientRect();
  const style = getComputedStyle(boardElement);

  const borderLeft = parseFloat(style.borderLeftWidth) || 0;
  const borderTop = parseFloat(style.borderTopWidth) || 0;
  const borderRight = parseFloat(style.borderRightWidth) || 0;
  const borderBottom = parseFloat(style.borderBottomWidth) || 0;
  const paddingLeft = parseFloat(style.paddingLeft) || 0;
  const paddingTop = parseFloat(style.paddingTop) || 0;
  const paddingRight = parseFloat(style.paddingRight) || 0;
  const paddingBottom = parseFloat(style.paddingBottom) || 0;
  const columnGap = parseFloat(style.columnGap || style.gap) || 0;
  const rowGap = parseFloat(style.rowGap || style.gap) || 0;

  const innerLeft = rect.left + borderLeft + paddingLeft;
  const innerTop = rect.top + borderTop + paddingTop;
  const innerWidth =
    rect.width - borderLeft - borderRight - paddingLeft - paddingRight;
  const innerHeight =
    rect.height - borderTop - borderBottom - paddingTop - paddingBottom;

  const x = clientX - innerLeft;
  const y = clientY - innerTop;
  if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) return null;

  const cellWidth = (innerWidth - columnGap * (GRID_SIZE - 1)) / GRID_SIZE;
  const cellHeight = (innerHeight - rowGap * (GRID_SIZE - 1)) / GRID_SIZE;
  const colPitch = cellWidth + columnGap;
  const rowPitch = cellHeight + rowGap;
  const col = Math.floor(x / colPitch);
  const row = Math.floor(y / rowPitch);

  if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) return null;
  if (x - col * colPitch > cellWidth || y - row * rowPitch > cellHeight) {
    return null;
  }

  return { row, col };
}
