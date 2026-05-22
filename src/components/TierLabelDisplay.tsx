'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/game-store';
import { getModeInfo } from '@/lib/game-modes';
import { useEffect } from 'react';

const TIER_COLORS: Record<number, string> = {
  1: '#8b7d6f',
  2: '#5c8a6a',
  3: '#8b7355',
  4: '#b39860',
  5: '#c45c5c',
  6: '#a03030',
};

function boardPercent(
  position: { row: number; col: number },
  gridSize: number
): { left: string; top: string } {
  const pad = 15;
  const span = 70;
  return {
    left: `${(position.col / gridSize) * span + pad}%`,
    top: `${(position.row / gridSize) * 50 + 20}%`,
  };
}

export default function TierLabelDisplay() {
  const { tierLabelEvents, dismissTierLabelEvent, gameMode } = useGameStore();
  const gridSize = getModeInfo(gameMode).rules.gridSize;

  useEffect(() => {
    const timers = tierLabelEvents.map(event =>
      setTimeout(() => dismissTierLabelEvent(event.id), 900)
    );
    return () => timers.forEach(clearTimeout);
  }, [tierLabelEvents, dismissTierLabelEvent]);

  if (gameMode !== 'combo') return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[45]">
      <AnimatePresence>
        {tierLabelEvents.map(event => {
          const { left, top } = boardPercent(event.position, gridSize);
          const color =
            event.toValue === 'boom'
              ? '#c45c5c'
              : TIER_COLORS[event.fromValue] ?? '#8b7355';
          const label =
            event.toValue === 'boom' ? '💥' : `→ ${event.toValue}`;

          return (
            <motion.div
              key={event.id}
              className="absolute text-base font-black drop-shadow-md"
              style={{ left, top, color }}
              initial={{ opacity: 0, y: 8, scale: 0.6 }}
              animate={{ opacity: 1, y: -8, scale: 1.1 }}
              exit={{ opacity: 0, y: -28, scale: 0.9 }}
              transition={{ duration: 0.75, ease: 'easeOut' }}
            >
              {label}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
