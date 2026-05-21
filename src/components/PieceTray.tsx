'use client';

import { useGameStore } from '@/store/game-store';
import DiceFace from './DiceFace';
import { getBoardPositionFromPoint } from '@/lib/board-position';
import { useRef, useCallback, type PointerEvent } from 'react';

export default function PieceTray() {
  const { currentPiece, rotatePiece, phase, placePiece, setDragPreviewPosition } =
    useGameStore();
  const pieceRef = useRef<HTMLDivElement>(null);
  const didDrag = useRef(false);
  const pointerDrag = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    dragging: boolean;
  } | null>(null);

  const handleClick = useCallback(() => {
    if (didDrag.current) {
      didDrag.current = false;
      return;
    }
    rotatePiece();
  }, [rotatePiece]);

  const getTouchedBoardPosition = useCallback((clientX: number, clientY: number) => {
    const boardElement = document.querySelector<HTMLElement>('[data-game-board]');
    if (!boardElement) return null;
    return getBoardPositionFromPoint(boardElement, clientX, clientY);
  }, []);

  const handlePointerDown = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (e.pointerType === 'mouse' || phase !== 'playing' || !currentPiece) return;
      pointerDrag.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        dragging: false,
      };
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [currentPiece, phase]
  );

  const handlePointerMove = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      const drag = pointerDrag.current;
      if (!drag || drag.pointerId !== e.pointerId) return;

      const distance = Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY);
      if (!drag.dragging && distance < 8) return;

      drag.dragging = true;
      didDrag.current = true;
      e.preventDefault();
      setDragPreviewPosition(getTouchedBoardPosition(e.clientX, e.clientY));
    },
    [getTouchedBoardPosition, setDragPreviewPosition]
  );

  const handlePointerUp = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      const drag = pointerDrag.current;
      if (!drag || drag.pointerId !== e.pointerId) return;

      if (drag.dragging) {
        e.preventDefault();
        const pos = getTouchedBoardPosition(e.clientX, e.clientY);
        if (pos) {
          placePiece(pos);
        }
        setDragPreviewPosition(null);
        window.setTimeout(() => {
          didDrag.current = false;
        }, 0);
      }

      pointerDrag.current = null;
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    },
    [getTouchedBoardPosition, placePiece, setDragPreviewPosition]
  );

  const handlePointerCancel = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      const drag = pointerDrag.current;
      if (!drag || drag.pointerId !== e.pointerId) return;
      pointerDrag.current = null;
      didDrag.current = false;
      setDragPreviewPosition(null);
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    },
    [setDragPreviewPosition]
  );

  if (phase === 'gameover') return null;

  const isDomino = currentPiece?.type === 'domino';
  const isHorizontal =
    currentPiece?.type === 'domino' && currentPiece.orientation === 'horizontal';

  return (
    <div className="flex flex-col items-center gap-3 pt-4 pb-2">
      <div className="flex items-center gap-3">
        {/* Fixed-size container reserves space so the page doesn't reflow when
            the piece is briefly absent during a merge animation (or rotation). */}
        <div className="flex items-center justify-center w-[120px] h-[120px] sm:w-[140px] sm:h-[140px]">
          {currentPiece && (
            <div
              ref={pieceRef}
              draggable
              onClick={handleClick}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerCancel}
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
                touch-none hover:scale-105 active:scale-95 transition-transform
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
          )}
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
