# PIPZ

An endless high-score puzzle game built around dice. Place single and double pieces on a 6×6 grid, merge matching numbers, chain reactions for bigger scores, and chase sixes until the board fills up.

## How It Works

Each turn you get one piece — either a single die or a domino (two dice joined together). Drag it onto empty cells. Dominoes can be rotated before you place them.

Once a piece lands, the board looks for groups of **3 or more** matching numbers connected up, down, left, or right. Those cells merge into the next value up. Merges can cascade into chain reactions, and each link in a chain boosts your score multiplier.

When a merge would go past 6, the group **explodes** instead — clearing those cells and awarding a big bonus.

The run ends when the board is full and the current piece has nowhere left to go.

## How to Play

1. **Place pieces** — drag from the tray onto empty grid cells
2. **Rotate dominoes** — tap the rotate button (or press R on desktop)
3. **Match 3+** — same numbers adjacent merge into the next value
4. **Chain reactions** — one placement can trigger multiple merges in a row
5. **Explode 6s** — merging past 6 clears the group for +500 bonus points
6. **Beat your best** — your personal high score is saved locally

## Scoring

- **Base points** — sum of every die value in a merge (four 2s = 8 points)
- **Chain multiplier** — each link in a chain adds +0.5× (1× → 1.5× → 2× …)
- **Size bonus** — merging 4+ cells at once earns +50% on that merge
- **Six explosion** — flat +500, on top of everything else

## Built With

Next.js, React, TypeScript, Zustand, Framer Motion, and Tailwind CSS.
