'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/game-store';
import { getChainMultiplier } from '@/lib/game-logic';

export default function ComboMeter() {
  const { gameMode, phase, mergeAnimation } = useGameStore();

  if (gameMode !== 'combo') return null;

  const visible = phase === 'merging' && mergeAnimation;
  const tierValue = mergeAnimation?.groups[0]?.value;
  const isExplosion = mergeAnimation?.groups.some(g => g.isExplosion) ?? false;
  const chainLink = mergeAnimation?.chainLink ?? 1;
  const multiplier = getChainMultiplier(chainLink);

  const resultLabel = isExplosion
    ? '💥'
    : tierValue && tierValue < 6
      ? String(tierValue + 1)
      : null;

  // Fixed-height slot under the grid — content fades in place, no layout shift
  return (
    <div
      className="relative h-9 w-full max-w-[min(85vw,400px)] shrink-0"
      aria-live="polite"
      aria-atomic
    >
      <AnimatePresence>
        {visible && tierValue && (
          <motion.div
            key={`combo-meter-${chainLink}-${tierValue}`}
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2d2926]/8 border border-[#c4b8a8]/60">
              <span className="text-[10px] uppercase tracking-wider text-[#8b7d6f]">
                Tier
              </span>
              <span className="text-sm font-bold text-[#2d2926] tabular-nums">
                {tierValue}
                <span className="mx-1 text-[#a89a8c] font-normal">→</span>
                <span className={isExplosion ? 'text-[#c45c5c]' : 'text-[#5c8a6a]'}>
                  {resultLabel}
                </span>
              </span>
              <span className="w-px h-3 bg-[#c4b8a8]" aria-hidden />
              <span className="text-[10px] uppercase tracking-wider text-[#8b7d6f]">
                Chain
              </span>
              <span className="text-sm font-bold text-[#8b7355] tabular-nums">
                ×{multiplier % 1 === 0 ? multiplier.toFixed(0) : multiplier.toFixed(1)}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
