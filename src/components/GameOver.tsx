'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/game-store';
import { getModeInfo } from '@/lib/game-modes';

export default function GameOver() {
  const { phase, score, bestScore, resetGame, gameMode } = useGameStore();
  const modeLabel = getModeInfo(gameMode).label;

  const handleShare = async () => {
    const text = `PIPZ 🎲 ${modeLabel} — Score: ${score.toLocaleString()}${score >= bestScore ? ' (New Best!)' : ''}\nCan you beat me?`;
    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch {
        navigator.clipboard.writeText(text);
      }
    } else {
      navigator.clipboard.writeText(text);
    }
  };

  return (
    <AnimatePresence>
      {phase === 'gameover' && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#2d2926]/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-[#f7f3ed] border-2 border-[#3d3832] rounded-2xl p-8 mx-4 max-w-sm w-full text-center shadow-2xl"
            initial={{ scale: 0.8, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 50 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
          >
            <h2 className="text-3xl font-bold text-[#2d2926] mb-2">Game Over</h2>
            <p className="text-[#8b7d6f] mb-1">Board is full!</p>
            <p className="text-xs text-[#a89a8c] mb-6">{modeLabel} mode</p>

            <div className="space-y-3 mb-8">
              <div className="flex justify-between items-center px-4 py-3 bg-[#e8e2d8] rounded-lg border border-[#c4b8a8]">
                <span className="text-[#6b6259]">Score</span>
                <span className="text-2xl font-bold text-[#2d2926]">{score.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center px-4 py-3 bg-[#e8e2d8] rounded-lg border border-[#c4b8a8]">
                <span className="text-[#6b6259]">Best</span>
                <span className="text-2xl font-bold text-[#8b7355]">{bestScore.toLocaleString()}</span>
              </div>
              {score >= bestScore && score > 0 && (
                <motion.p
                  className="text-[#5c8a6a] font-semibold text-lg"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: 'spring' }}
                >
                  New Personal Best!
                </motion.p>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={resetGame}
                className="w-full py-3 px-6 rounded-xl bg-[#2d2926] hover:bg-[#3d3832] text-[#f7f3ed] font-semibold text-lg transition-colors"
              >
                Play Again
              </button>
              <button
                onClick={handleShare}
                className="w-full py-3 px-6 rounded-xl bg-[#e8e2d8] hover:bg-[#d9d1c5] text-[#3d3832] border border-[#c4b8a8] font-medium transition-colors"
              >
                Share Score
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
