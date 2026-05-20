# PIPZ

An endless high-score puzzle game where you drag single and double dice pieces onto a 6×6 grid. Match 3+ of the same number adjacently to merge them upward — chain reactions multiply your score, and merging 6s explodes them off the board for bonus points.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to play.

## How to Play

1. **Place pieces** — tap/click a grid cell to place the current piece
2. **Rotate dominoes** — press R or tap the rotate button
3. **Match 3+** — same numbers adjacent (up/down/left/right) merge into the next number
4. **Chain reactions** — merges can cascade for multiplied scores
5. **Explode 6s** — merging 6s clears them from the board (+500 bonus!)
6. **Game over** — board fills up with no valid placement

## Tech Stack

- Next.js 16 + React 19 + TypeScript
- Zustand (state management)
- Framer Motion (animations)
- Tailwind CSS (styling)

## Deployment

Deployed on Vercel. Push to main to deploy.
