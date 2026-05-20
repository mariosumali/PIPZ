'use client';

import { useEffect } from 'react';
import { useGameStore } from '@/store/game-store';
import GameBoard from './GameBoard';
import PieceTray from './PieceTray';
import Header from './Header';
import GameOver from './GameOver';
import ScoreDisplay from './ScoreDisplay';

export default function Game() {
  const { currentPiece, resetGame, rotatePiece } = useGameStore();

  useEffect(() => {
    if (!currentPiece) {
      resetGame();
    }
  }, [currentPiece, resetGame]);

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
      <GameBoard />
      <PieceTray />
      <GameOver />
      <ScoreDisplay />
    </div>
  );
}
