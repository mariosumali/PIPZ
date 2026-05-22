'use client';

import { useGameStore } from '@/store/game-store';
import { GAME_MODES, GameMode } from '@/lib/game-modes';

export default function ModeSelector() {
  const { gameMode, setGameMode, phase } = useGameStore();
  const disabled = phase === 'merging';

  return (
    <div
      className="w-full max-w-[min(85vw,400px)] flex justify-center -mt-1 mb-0.5"
      role="tablist"
      aria-label="Game mode"
    >
      <div className="inline-flex items-center gap-1">
        {GAME_MODES.map((mode, index) => {
          const selected = gameMode === mode.id;
          return (
            <span key={mode.id} className="inline-flex items-center gap-1">
              {index > 0 && (
                <span className="text-[#d4cbc0] select-none" aria-hidden>
                  ·
                </span>
              )}
              <button
                type="button"
                role="tab"
                aria-selected={selected}
                disabled={disabled}
                onClick={() => setGameMode(mode.id as GameMode)}
                className={`
                  px-1 py-0.5 text-[10px] tracking-wide uppercase transition-colors
                  ${selected
                    ? 'text-[#8b7d6f] font-medium'
                    : 'text-[#c4b8a8] hover:text-[#a89a8c]'
                  }
                  ${disabled ? 'opacity-40 cursor-not-allowed' : ''}
                `}
              >
                {mode.shortLabel}
              </button>
            </span>
          );
        })}
      </div>
    </div>
  );
}
