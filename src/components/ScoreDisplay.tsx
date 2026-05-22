'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/game-store';
import { getModeInfo } from '@/lib/game-modes';
import { useEffect } from 'react';

export default function ScoreDisplay() {
  const { scoreEvents, dismissScoreEvent, gameMode } = useGameStore();
  const gridSize = getModeInfo(gameMode).rules.gridSize;

  useEffect(() => {
    const timers = scoreEvents.map(event =>
      setTimeout(() => dismissScoreEvent(event.id), 1500)
    );
    return () => timers.forEach(clearTimeout);
  }, [scoreEvents, dismissScoreEvent]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <AnimatePresence>
        {scoreEvents.map(event => (
          <motion.div
            key={event.id}
            className="absolute text-lg font-bold text-[#8b7355] drop-shadow-sm"
            style={{
              left: `${(event.position.col / gridSize) * 70 + 15}%`,
              top: `${(event.position.row / gridSize) * 50 + 20}%`,
            }}
            initial={{ opacity: 1, y: 0, scale: 0.5 }}
            animate={{ opacity: 0, y: -40, scale: 1.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          >
            +{event.points}
            {event.chainLink > 1 && (
              <span className="text-sm text-[#b39860] ml-1">
                x{event.chainLink}
              </span>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
