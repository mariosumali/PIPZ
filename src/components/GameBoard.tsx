'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/game-store';
import DiceFace from './DiceFace';
import { DieValue, Position } from '@/types/game';
import { useCallback, useRef, useState } from 'react';

export default function GameBoard() {
  const { board, currentPiece, phase, placePiece, mergingCells, explodingCells } = useGameStore();
  const boardRef = useRef<HTMLDivElement>(null);
  const [hoverPos, setHoverPos] = useState<Position | null>(null);

  const isValidPlacement = useCallback((pos: Position): boolean => {
    if (!currentPiece || phase !== 'playing') return false;
    if (currentPiece.type === 'single') {
      return board[pos.row][pos.col] === null;
    }
    const secondPos = currentPiece.orientation === 'horizontal'
      ? { row: pos.row, col: pos.col + 1 }
      : { row: pos.row + 1, col: pos.col };
    return (
      secondPos.row < 6 && secondPos.col < 6 &&
      board[pos.row][pos.col] === null &&
      board[secondPos.row][secondPos.col] === null
    );
  }, [board, currentPiece, phase]);

  const handleCellClick = useCallback((row: number, col: number) => {
    if (phase !== 'playing' || !currentPiece) return;
    const pos = { row, col };
    if (isValidPlacement(pos)) {
      placePiece(pos);
      setHoverPos(null);
    }
  }, [phase, currentPiece, isValidPlacement, placePiece]);

  const handleCellHover = useCallback((row: number, col: number) => {
    const pos = { row, col };
    if (isValidPlacement(pos)) {
      setHoverPos(pos);
    } else {
      setHoverPos(null);
    }
  }, [isValidPlacement]);

  const getCellFromTouch = useCallback((clientX: number, clientY: number): Position | null => {
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
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const pos = getCellFromTouch(e.clientX, e.clientY);
    if (pos && isValidPlacement(pos)) {
      setHoverPos(pos);
    } else {
      setHoverPos(null);
    }
  }, [getCellFromTouch, isValidPlacement]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const pos = getCellFromTouch(e.clientX, e.clientY);
    if (pos && isValidPlacement(pos)) {
      placePiece(pos);
    }
    setHoverPos(null);
  }, [getCellFromTouch, isValidPlacement, placePiece]);

  const handleDragLeave = useCallback(() => {
    setHoverPos(null);
  }, []);

  const isMerging = (row: number, col: number) =>
    mergingCells.some(c => c.row === row && c.col === col);

  const isExploding = (row: number, col: number) =>
    explodingCells.some(c => c.row === row && c.col === col);

  const isGhostCell = (row: number, col: number): DieValue | null => {
    if (!hoverPos || !currentPiece) return null;
    if (currentPiece.type === 'single') {
      if (row === hoverPos.row && col === hoverPos.col) return currentPiece.value;
    } else {
      if (row === hoverPos.row && col === hoverPos.col) return currentPiece.values[0];
      const secondPos = currentPiece.orientation === 'horizontal'
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
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {board.map((row, rowIdx) =>
        row.map((cell, colIdx) => {
          const ghostValue = isGhostCell(rowIdx, colIdx);
          const merging = isMerging(rowIdx, colIdx);
          const exploding = isExploding(rowIdx, colIdx);

          return (
            <motion.div
              key={`${rowIdx}-${colIdx}`}
              className={`
                aspect-square rounded-lg cursor-pointer transition-all duration-150
                ${cell === null && !ghostValue ? 'bg-[#e2dbd0] border border-[#d4cbc0] hover:bg-[#d9d1c5] hover:border-[#b8ad9e]' : ''}
                ${ghostValue ? 'ring-2 ring-[#8b7355]/40 bg-[#d9d1c5]' : ''}
              `}
              onClick={() => handleCellClick(rowIdx, colIdx)}
              onMouseEnter={() => handleCellHover(rowIdx, colIdx)}
              onMouseLeave={() => setHoverPos(null)}
              animate={
                exploding
                  ? { scale: [1, 1.3, 0], opacity: [1, 1, 0] }
                  : merging
                  ? { scale: [1, 1.15, 1] }
                  : { scale: 1, opacity: 1 }
              }
              transition={{ duration: 0.4 }}
            >
              <AnimatePresence mode="popLayout">
                {cell !== null && (
                  <motion.div
                    key={`cell-${rowIdx}-${colIdx}-${cell}`}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
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
            </motion.div>
          );
        })
      )}
    </div>
  );
}
