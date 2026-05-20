'use client';

import { DieValue } from '@/types/game';

interface DiceFaceProps {
  value: DieValue;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const pipPositions: Record<DieValue, string[]> = {
  1: ['top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'],
  2: ['top-[20%] right-[20%]', 'bottom-[20%] left-[20%]'],
  3: ['top-[20%] right-[20%]', 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2', 'bottom-[20%] left-[20%]'],
  4: ['top-[20%] left-[20%]', 'top-[20%] right-[20%]', 'bottom-[20%] left-[20%]', 'bottom-[20%] right-[20%]'],
  5: ['top-[20%] left-[20%]', 'top-[20%] right-[20%]', 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2', 'bottom-[20%] left-[20%]', 'bottom-[20%] right-[20%]'],
  6: ['top-[20%] left-[20%]', 'top-[20%] right-[20%]', 'top-1/2 left-[20%] -translate-y-1/2', 'top-1/2 right-[20%] -translate-y-1/2', 'bottom-[20%] left-[20%]', 'bottom-[20%] right-[20%]'],
};

const valueBorders: Record<DieValue, string> = {
  1: 'border-[#c4b8a8]',
  2: 'border-[#5c8a6a]',
  3: 'border-[#b39860]',
  4: 'border-[#8b7355]',
  5: 'border-[#c45c5c]',
  6: 'border-[#a03030]',
};

const pipColors: Record<DieValue, string> = {
  1: 'bg-[#2d2926]',
  2: 'bg-[#2d2926]',
  3: 'bg-[#2d2926]',
  4: 'bg-[#2d2926]',
  5: 'bg-[#8b3a3a]',
  6: 'bg-[#8b3a3a]',
};

const pipSizes: Record<string, string> = {
  sm: 'w-1.5 h-1.5',
  md: 'w-2 h-2',
  lg: 'w-2.5 h-2.5',
};

export default function DiceFace({ value, size = 'md', className = '' }: DiceFaceProps) {
  const positions = pipPositions[value];
  const border = valueBorders[value];
  const pipColor = pipColors[value];
  const pipSize = pipSizes[size];

  return (
    <div className={`relative w-full h-full rounded-md bg-[#faf8f5] border-2 ${border} ${className}`}>
      {/* <span className="absolute top-0.5 left-1 text-[7px] font-medium text-[#6b6259]/60 leading-none">{value}</span> */}
      {positions.map((pos, i) => (
        <span
          key={i}
          className={`absolute ${pos} ${pipSize} rounded-full ${pipColor}`}
        />
      ))}
    </div>
  );
}
