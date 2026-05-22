'use client';

import { useEffect } from 'react';
import { useGameStore } from '@/store/game-store';
import GameBoard from './GameBoard';
import PieceTray from './PieceTray';
import Header from './Header';
import GameOver from './GameOver';
import ScoreDisplay from './ScoreDisplay';
import ModeSelector from './ModeSelector';
import ComboMeter from './ComboMeter';
import TierLabelDisplay from './TierLabelDisplay';

export default function Game() {
  const { currentPiece, phase, resetGame, rotatePiece } = useGameStore();

  // Initialize the game on first load only. The store intentionally clears
  // `currentPiece` while a merge animation plays (phase === 'merging'), so we
  // must NOT treat a null piece during a merge as "needs a new game".
  useEffect(() => {
    if (!currentPiece && phase === 'playing') {
      resetGame();
    }
  }, [currentPiece, phase, resetGame]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        rotatePiece();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [rotatePiece]);

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh px-4 py-6 gap-2 select-none">
      <Header />
      <ModeSelector />
      <GameBoard />
      <ComboMeter />
      <PieceTray />
      <GameOver />
      <ScoreDisplay />
      <TierLabelDisplay />
    </div>
  );
}
