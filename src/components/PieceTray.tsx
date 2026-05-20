'use client';

import { motion } from 'framer-motion';
import { useGameStore } from '@/store/game-store';
import DiceFace from './DiceFace';
import { useRef, useCallback } from 'react';

export default function PieceTray() {
  const { currentPiece, rotatePiece, phase } = useGameStore();
  const pieceRef = useRef<HTMLDivElement>(null);
  const didDrag = useRef(false);

  const handleClick = useCallback(() => {
    if (didDrag.current) {
      didDrag.current = false;
      return;
    }
    rotatePiece();
  }, [rotatePiece]);

  if (!currentPiece || phase === 'gameover') return null;

  const isDomino = currentPiece.type === 'domino';
  const isHorizontal = isDomino && currentPiece.orientation === 'horizontal';

  return (
    <div className="flex flex-col items-center gap-3 pt-4 pb-2">
      <div className="flex items-center gap-3">
        {/* Fixed-size container prevents layout shift on rotation */}
        <div className="flex items-center justify-center w-[120px] h-[120px] sm:w-[140px] sm:h-[140px]">
          <div
            ref={pieceRef}
            draggable
            onClick={handleClick}
            onDragStart={(e) => {
              didDrag.current = true;
              e.dataTransfer.setData('text/plain', 'piece');
              e.dataTransfer.effectAllowed = 'move';
              if (pieceRef.current) {
                const rect = pieceRef.current.getBoundingClientRect();
                e.dataTransfer.setDragImage(pieceRef.current, rect.width / 2, rect.height / 2);
              }
            }}
            className={`
              cursor-pointer
              grid gap-1 p-1 rounded-lg bg-[#faf8f5] border-2 border-[#3d3832] shadow-sm
              hover:scale-105 active:scale-95 transition-transform
              ${isDomino
                ? isHorizontal ? 'grid-cols-2 grid-rows-1' : 'grid-cols-1 grid-rows-2'
                : 'grid-cols-1 grid-rows-1'
              }
            `}
          >
            {currentPiece.type === 'single' ? (
              <div className="w-12 h-12 sm:w-14 sm:h-14">
                <DiceFace value={currentPiece.value} size="lg" />
              </div>
            ) : (
              <>
                <div className="w-12 h-12 sm:w-14 sm:h-14">
                  <DiceFace value={currentPiece.values[0]} size="lg" />
                </div>
                <div className="w-12 h-12 sm:w-14 sm:h-14">
                  <DiceFace value={currentPiece.values[1]} size="lg" />
                </div>
              </>
            )}
          </div>
        </div>

        {/* {isDomino && (
          <motion.button
            onClick={rotatePiece}
            className="flex items-center justify-center w-11 h-11 rounded-lg bg-slate-700/60 border border-slate-600/40 text-slate-300 hover:text-white hover:bg-slate-600/60 transition-colors shadow-lg shadow-black/10"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.85, rotate: 90 }}
            title="Rotate (R)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
            </svg>
          </motion.button>
        )} */}
      </div>
    </div>
  );
}
