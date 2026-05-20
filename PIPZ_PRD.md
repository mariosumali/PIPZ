# PIPZ — Product Requirements Document
**Version:** 1.0  
**Date:** May 2026  
**Platform:** Web (mobile-first, desktop-supported)

---

## 1. Overview

PIPZ is an endless high-score puzzle game where players drag single and double dice pieces onto a 6×6 grid. When 3 or more of the same number are adjacent, they merge into the next number up — chaining reactions, chasing 6s, and competing for a top score.

---

## 2. Name

**Primary:** PIPZ (dice pips; short, app-store friendly, memorable)  
**Alternates:** ROLLUP, SIXER, DOTCHAIN

---

## 3. Core Concept

- Place dice pieces on a grid one at a time
- Match 3+ of the same number adjacently to merge them into the next number
- Merging 6s explodes them off the board for a big point bonus
- Chain reactions multiply your score
- Board fills up → game over

---

## 4. Game Board

- **Size:** 6×6 grid (36 cells)
- **Cell state:** empty or occupied by a single die face (1–6)
- **Visibility:** entire board visible at once, no scrolling
- **Game over condition:** board is full and the current piece cannot be placed anywhere

---

## 5. Pieces

### 5.1 Single Block
- One cell, showing a die face value (1–6)
- No rotation needed

### 5.2 Domino Block
- Two cells joined, each showing an independent die face value (1–6, can be same or different)
- Values on each half are independent
- **Rotation:** player can tap/click the piece to rotate it 90° clockwise; unlimited rotations before placement
- Orientations: horizontal-left, horizontal-right, vertical-up, vertical-down (effectively 4 snap states)

### 5.3 Piece Progression
- **Early game (turns 1–20):** heavily weighted toward singles (~85% singles, 15% dominoes)
- **Mid game (turns 21–60):** transitions toward a mix (~50/50)
- **Late game (turn 61+):** slightly domino-weighted (~35% singles, 65% dominoes)
- Values on pieces skew lower early (1s and 2s dominant) and shift upward as score increases

---

## 6. Placement

- Player sees only the **current piece** to place (no queue preview)
- Piece is shown in a tray at the bottom of the screen
- **Input:** drag the piece from the tray onto the grid
- **Constraint:** pieces can only be placed on **empty cells**
  - Single: any single empty cell
  - Domino: any two adjacent empty cells (horizontal or vertical), matching current rotation
- Piece snaps to valid cells during drag; invalid positions give visual rejection feedback
- **Domino orphan rule:** if one half of a placed domino later merges or explodes away, the remaining half becomes a free-floating single in its cell

---

## 7. Merge Mechanic

### 7.1 Trigger
After any piece is placed, the game scans for groups of **3 or more** cells containing the same number that are **adjacently connected** (4-directional: up/down/left/right). Shape is irrelevant — L, T, straight, irregular all count as long as all cells are connected through the chain.

### 7.2 Resolution
1. All cells in the merge group animate simultaneously (pulse/glow effect)
2. They collapse into the **last-placed cell** in the group with a flip animation (dice tumble)
3. That cell's value increments by 1 (e.g. three 3s → one 4)
4. All other cells in the group become empty
5. The new value is immediately scanned for further merges (**chain reaction**)

### 7.3 Chain Reactions
- After a merge resolves, the board is rescanned
- If the new value creates a new group of 3+, that merge triggers automatically
- Each chain link animates sequentially (previous merge completes before next begins)
- Chains can theoretically cascade the full value ladder (1→2→3→4→5→6→explode)

### 7.4 The 6 Explosion
- When a merge would produce a 7, the group instead **explodes**
- Animation: die faces flip to 6, then burst apart (particle/shockwave effect)
- All cells in the group become empty
- Awards a flat **+500 point bonus** (in addition to base merge points)
- Does not affect neighboring cells

---

## 8. Scoring

### 8.1 Base Points
Every merge awards points equal to the **sum of the values of all cells merged**.  
Example: merging four 2s → 4 × 2 = **8 points**

### 8.2 Chain Multiplier
Each consecutive chain reaction in a single placement increments a multiplier:
- Placement merge (link 1): **1×**
- Second merge in chain (link 2): **1.5×**
- Third merge (link 3): **2×**
- Each additional link: +**0.5×**

The multiplier applies to each merge's base points at the time it triggers.  
Example: link 1 scores 9 pts at 1×; link 2 scores 12 pts at 1.5× = 18 pts

### 8.3 Size Bonus
Merging 4 or more cells (instead of the minimum 3) adds a flat **+50%** to that specific merge's base points before the chain multiplier is applied.

### 8.4 Six Explosion Bonus
Flat **+500 points**, not affected by chain multiplier or size bonus.

### 8.5 Score Display
- Running score shown prominently at top of screen
- On each merge, a floating score delta animates out of the merge point (+12, +27×2, etc.)
- Personal best stored locally; shown as a comparison at game over

---

## 9. Game Over

- Triggered when the board is full **and** the current piece has no valid placement
- Full-screen game over overlay with: final score, personal best, delta vs PB
- Options: **Play Again** (resets board, keeps PB), **Share Score** (copy/native share)

---

## 10. UI & Visual Design

### 10.2 Layout (Mobile Portrait — Primary)
```
┌─────────────────────┐
│  PIPZ    SCORE: 0   │  ← header: logo + score
│         BEST: 0     │
├─────────────────────┤
│                     │
│   6×6 GAME GRID     │  ← main game area, square, centered
│                     │
├─────────────────────┤
│  [CURRENT PIECE]    │  ← piece tray: shows piece + rotate button
│  [↺ ROTATE]         │
└─────────────────────┘
```

### 10.3 Layout (Desktop)
Grid centered, piece tray below or to the side. Keyboard shortcut: R to rotate.

### 10.4 Animations
| Event | Animation |
|---|---|
| Piece drag | Ghost preview snaps to valid cells |
| Invalid placement | Red flash + shake |
| Merge trigger | Cells pulse/glow, then collapse to target |
| Merge resolve | Die-flip (3D CSS rotation) on target cell |
| Chain reaction | Brief pause between links, then next merge begins |
| 6 explosion | Cells flip to 6, burst particle effect, cells fade to empty |
| Score delta | Float-up number fades out from merge point |
| Game over | Board dims, overlay slides up |

---

## 11. Technical Stack

- **Framework:** Next.js 15 + React 19 + TypeScript
- **State:** Zustand
- **Animations:** Framer Motion
- **Styling:** Tailwind CSS (utility) + CSS Modules for game-specific styles
- **Storage:** localStorage (score persistence only, no backend)
- **Deployment:** Vercel

---

## 12. Out of Scope (v1)

- Leaderboards / multiplayer
- Undo button
- Power-ups or special tiles
- ~~Sound effects~~ *(added — Web Audio API synthesized SFX for place, merge, and explosion)*
- Accounts / cloud sync
- Level mode / objectives

---

## 13. Open Questions

- **Piece value distribution:** should higher numbers (4, 5) be gated until a score threshold, or purely time-based?
- **Seeding:** should a seed be optionally shareable so two players can compare on the same run?
- **Rotate UX:** tap piece to rotate, or a dedicated button? (button is safer on mobile)
