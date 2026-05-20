'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/game-store';
import DiceFace from './DiceFace';
import { DieValue, Position } from '@/types/game';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const GLOW_COLORS: Record<number, string> = {
  1: 'rgba(196, 184, 168, 0.6)',
  2: 'rgba(92, 138, 106, 0.6)',
  3: 'rgba(179, 152, 96, 0.6)',
  4: 'rgba(139, 115, 85, 0.6)',
  5: 'rgba(196, 92, 92, 0.6)',
  6: 'rgba(160, 48, 48, 0.7)',
};

interface CellMergeInfo {
  isTarget: boolean;
  target: Position;
  value: DieValue;
  isExplosion: boolean;
}

export default function GameBoard() {
  const {
    board,
    currentPiece,
    phase,
    placePiece,
    mergeAnimation,
    resolvingCells,
  } = useGameStore();

  const boardRef = useRef<HTMLDivElement>(null);
  const [hoverPos, setHoverPos] = useState<Position | null>(null);
  const [cellPitch, setCellPitch] = useState(0);

  useEffect(() => {
    const compute = () => {
      if (!boardRef.current) return;
      const style = getComputedStyle(boardRef.current);
      const rect = boardRef.current.getBoundingClientRect();
      const padding = parseFloat(style.paddingLeft) || 12;
      const gap = parseFloat(style.gap) || 6;
      // rect.width is border-box, so subtract the border too — otherwise the
      // computed cell pitch is slightly too large and collapsing tiles drift
      // past the merge target.
      const border = parseFloat(style.borderLeftWidth) || 0;
      const cellWidth = (rect.width - 2 * border - 2 * padding - 5 * gap) / 6;
      setCellPitch(cellWidth + gap);
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);

  const isValidPlacement = useCallback(
    (pos: Position): boolean => {
      if (!currentPiece || phase !== 'playing') return false;
      if (currentPiece.type === 'single') {
        return board[pos.row][pos.col] === null;
      }
      const secondPos =
        currentPiece.orientation === 'horizontal'
          ? { row: pos.row, col: pos.col + 1 }
          : { row: pos.row + 1, col: pos.col };
      return (
        secondPos.row < 6 &&
        secondPos.col < 6 &&
        board[pos.row][pos.col] === null &&
        board[secondPos.row][secondPos.col] === null
      );
    },
    [board, currentPiece, phase]
  );

  const handleCellClick = useCallback(
    (row: number, col: number) => {
      if (phase !== 'playing' || !currentPiece) return;
      const pos = { row, col };
      if (isValidPlacement(pos)) {
        placePiece(pos);
        setHoverPos(null);
      }
    },
    [phase, currentPiece, isValidPlacement, placePiece]
  );

  const handleCellHover = useCallback(
    (row: number, col: number) => {
      const pos = { row, col };
      if (isValidPlacement(pos)) {
        setHoverPos(pos);
      } else {
        setHoverPos(null);
      }
    },
    [isValidPlacement]
  );

  const getCellFromTouch = useCallback(
    (clientX: number, clientY: number): Position | null => {
      if (!boardRef.current) return null;
      const rect = boardRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const cellWidth = rect.width / 6;
      const cellHeight = rect.height / 6;
      const col = Math.floor(x / cellWidth);
      const row = Math.floor(y / cellHeight);
      if (row < 0 || row >= 6 || col < 0 || col >= 6) return null;
      return { row, col };
    },
    []
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const pos = getCellFromTouch(e.clientX, e.clientY);
      if (pos && isValidPlacement(pos)) {
        setHoverPos(pos);
      } else {
        setHoverPos(null);
      }
    },
    [getCellFromTouch, isValidPlacement]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const pos = getCellFromTouch(e.clientX, e.clientY);
      if (pos && isValidPlacement(pos)) {
        placePiece(pos);
      }
      setHoverPos(null);
    },
    [getCellFromTouch, isValidPlacement, placePiece]
  );

  const handleDragLeave = useCallback(() => {
    setHoverPos(null);
  }, []);

  const getMergeInfo = useCallback(
    (row: number, col: number): CellMergeInfo | null => {
      if (!mergeAnimation) return null;
      for (const group of mergeAnimation.groups) {
        if (group.cells.some(c => c.row === row && c.col === col)) {
          return {
            isTarget: group.target.row === row && group.target.col === col,
            target: group.target,
            value: group.value,
            isExplosion: group.isExplosion,
          };
        }
      }
      return null;
    },
    [mergeAnimation]
  );

  const isResolving = useCallback(
    (row: number, col: number): boolean => {
      return resolvingCells.some(c => c.row === row && c.col === col);
    },
    [resolvingCells]
  );

  const isGhostCell = (row: number, col: number): DieValue | null => {
    if (!hoverPos || !currentPiece) return null;
    if (currentPiece.type === 'single') {
      if (row === hoverPos.row && col === hoverPos.col) return currentPiece.value;
    } else {
      if (row === hoverPos.row && col === hoverPos.col) return currentPiece.values[0];
      const secondPos =
        currentPiece.orientation === 'horizontal'
          ? { row: hoverPos.row, col: hoverPos.col + 1 }
          : { row: hoverPos.row + 1, col: hoverPos.col };
      if (row === secondPos.row && col === secondPos.col) return currentPiece.values[1];
    }
    return null;
  };

  return (
    <div
      ref={boardRef}
      className="grid grid-cols-6 gap-1.5 p-3 bg-[#e8e2d8] rounded-2xl border-2 border-[#3d3832] aspect-square w-full max-w-[min(85vw,400px)] shadow-sm"
      style={{ perspective: 800 }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {board.map((row, rowIdx) =>
        row.map((cell, colIdx) => {
          const ghostValue = isGhostCell(rowIdx, colIdx);
          const mergeInfo = getMergeInfo(rowIdx, colIdx);
          const resolving = isResolving(rowIdx, colIdx);
          const animPhase = mergeAnimation?.phase;

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let cellAnimate: any = { scale: 1, opacity: 1, x: 0, y: 0 };
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let cellTransition: any = { duration: 0.15 };
          let extraStyle: React.CSSProperties = {};

          if (mergeInfo && animPhase) {
            const glowColor = GLOW_COLORS[mergeInfo.value] || GLOW_COLORS[4];

            if (animPhase === 'glow') {
              cellAnimate = {
                scale: [1, 1.06, 0.97, 1.04, 1],
                opacity: 1,
                x: 0,
                y: 0,
              };
              cellTransition = { duration: 0.25, ease: 'easeInOut' };
              extraStyle = {
                boxShadow: `0 0 14px 5px ${glowColor}`,
                zIndex: 10,
              };
            } else if (animPhase === 'collapse') {
              if (mergeInfo.isExplosion) {
                cellAnimate = {
                  scale: [1.1, 1.4, 0],
                  opacity: [1, 0.8, 0],
                  x: 0,
                  y: 0,
                };
                cellTransition = { duration: 0.35, ease: 'easeIn' };
                extraStyle = {
                  boxShadow: `0 0 20px 8px ${glowColor}`,
                  zIndex: 10,
                };
              } else if (!mergeInfo.isTarget) {
                const dx = (mergeInfo.target.col - colIdx) * cellPitch;
                const dy = (mergeInfo.target.row - rowIdx) * cellPitch;
                cellAnimate = { x: dx, y: dy, scale: 0.2, opacity: 0 };
                cellTransition = {
                  type: 'spring',
                  stiffness: 300,
                  damping: 25,
                  mass: 0.8,
                };
                extraStyle = { zIndex: 10 };
              } else {
                cellAnimate = {
                  scale: [1, 1.12, 1.06],
                  opacity: 1,
                  x: 0,
                  y: 0,
                };
                cellTransition = { duration: 0.35, ease: 'easeOut' };
                extraStyle = {
                  boxShadow: `0 0 18px 7px ${glowColor}`,
                  zIndex: 20,
                };
              }
            } else if (animPhase === 'resolve') {
              if (mergeInfo.isTarget && !mergeInfo.isExplosion) {
                cellAnimate = { scale: 1, opacity: 1, x: 0, y: 0 };
                cellTransition = { duration: 0.05 };
                extraStyle = { zIndex: 20 };
              } else {
                cellAnimate = { x: 0, y: 0, scale: 0, opacity: 0 };
                cellTransition = { duration: 0 };
              }
            }
          }

          return (
            <motion.div
              key={`${rowIdx}-${colIdx}`}
              className={`
                aspect-square rounded-lg cursor-pointer relative
                ${
                  cell === null && !ghostValue
                    ? `bg-[#e2dbd0] border border-[#d4cbc0] ${phase === 'playing' ? 'hover:bg-[#d9d1c5] hover:border-[#b8ad9e]' : ''}`
                    : ''
                }
                ${ghostValue ? 'ring-2 ring-[#8b7355]/40 bg-[#d9d1c5]' : ''}
              `}
              style={{
                ...extraStyle,
                transformStyle: 'preserve-3d',
                overflow: 'visible',
              }}
              onClick={() => handleCellClick(rowIdx, colIdx)}
              onMouseEnter={() => handleCellHover(rowIdx, colIdx)}
              onMouseLeave={() => setHoverPos(null)}
              animate={cellAnimate}
              transition={cellTransition}
            >
              <AnimatePresence mode="popLayout">
                {cell !== null && (
                  <motion.div
                    key={`cell-${rowIdx}-${colIdx}-${cell}`}
                    initial={
                      resolving
                        ? { scale: 0, opacity: 0, rotateY: -90 }
                        : { scale: 0.5, opacity: 0 }
                    }
                    animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={
                      resolving
                        ? {
                            duration: 0.3,
                            scale: {
                              duration: 0.3,
                              ease: [0.34, 1.56, 0.64, 1],
                            },
                            rotateY: { duration: 0.25, ease: 'easeOut' },
                          }
                        : { type: 'spring', stiffness: 300, damping: 20 }
                    }
                    className="w-full h-full"
                  >
                    <DiceFace value={cell} size="sm" />
                  </motion.div>
                )}
                {cell === null && ghostValue && (
                  <motion.div
                    key={`ghost-${rowIdx}-${colIdx}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.5 }}
                    exit={{ opacity: 0 }}
                    className="w-full h-full"
                  >
                    <DiceFace value={ghostValue} size="sm" className="opacity-50" />
                  </motion.div>
                )}
              </AnimatePresence>

              {resolving && (
                <motion.div
                  key={`shockwave-${rowIdx}-${colIdx}-${mergeAnimation?.chainLink}`}
                  className="absolute inset-0 rounded-lg border-2 border-[#8b7355] pointer-events-none"
                  initial={{ scale: 0.8, opacity: 0.7 }}
                  animate={{ scale: 2.2, opacity: 0 }}
                  transition={{ duration: 0.45, ease: 'easeOut' }}
                  style={{ zIndex: 30 }}
                />
              )}

              {mergeInfo?.isExplosion && animPhase === 'collapse' && (
                <ExplosionParticles
                  row={rowIdx}
                  col={colIdx}
                  chainLink={mergeAnimation?.chainLink || 0}
                />
              )}
            </motion.div>
          );
        })
      )}
    </div>
  );
}

function ExplosionParticles({
  row,
  col,
  chainLink,
}: {
  row: number;
  col: number;
  chainLink: number;
}) {
  const particles = useMemo(() => {
    return Array.from({ length: 10 }, (_, i) => {
      const seed = row * 67 + col * 31 + i * 17 + chainLink * 7;
      const angle = (Math.PI * 2 * i) / 10 + ((seed % 10) / 10) * 0.5 - 0.25;
      const distance = 20 + (seed % 25);
      const size = 3 + (seed % 5);
      return { id: i, angle, distance, size, delay: (i % 4) * 0.025 };
    });
  }, [row, col, chainLink]);

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ overflow: 'visible' }}
    >
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-sm bg-[#c45c5c]"
          style={{
            width: p.size,
            height: p.size,
            left: '50%',
            top: '50%',
            marginLeft: -p.size / 2,
            marginTop: -p.size / 2,
          }}
          initial={{ scale: 1, opacity: 1 }}
          animate={{
            x: Math.cos(p.angle) * p.distance,
            y: Math.sin(p.angle) * p.distance,
            scale: 0,
            opacity: 0,
            rotate: (p.angle * 180) / Math.PI,
          }}
          transition={{ duration: 0.4, delay: p.delay, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}
