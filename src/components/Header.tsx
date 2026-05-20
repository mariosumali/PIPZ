'use client';

import { useGameStore } from '@/store/game-store';

export default function Header() {
  const { score, bestScore } = useGameStore();

  return (
    <header className="flex items-center justify-between px-4 py-3 w-full max-w-[min(85vw,400px)]">
      <h1 className="text-4xl font-black tracking-tight text-[#2d2926]">
        PIPZ
      </h1>
      <div className="flex gap-3">
        <div className="flex flex-col items-center px-3 py-1.5 rounded-lg bg-[#faf8f5] border border-[#c4b8a8] min-w-[70px]">
          <span className="text-[10px] uppercase tracking-wider text-[#8b7d6f]">Score</span>
          <span className="text-lg font-bold text-[#2d2926] tabular-nums">{score.toLocaleString()}</span>
        </div>
        <div className="flex flex-col items-center px-3 py-1.5 rounded-lg bg-[#faf8f5] border border-[#c4b8a8] min-w-[70px]">
          <span className="text-[10px] uppercase tracking-wider text-[#8b7d6f]">Best</span>
          <span className="text-lg font-bold text-[#8b7355] tabular-nums">{bestScore.toLocaleString()}</span>
        </div>
      </div>
    </header>
  );
}
