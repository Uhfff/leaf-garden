# Листопад (Leaf Garden)

An idle garden game: plant trees, watch them grow, and let them earn currency
for you. The core idea is simple — a tree's income isn't fixed, it grows the
longer the tree has been alive. A sapling barely pays for itself; a
centuries-old oak becomes a real source of income. The currency is leaves.

## How it works

- **Five tree species** (Birch → Maple → Oak → Willow → Sakura), each with a
  different cost, base income, and growth rate. Rarer species unlock as your
  lifetime earnings grow.
- **Income scales with age.** Every planted tree's income follows
  `base * (1 + growthRate * sqrt(age))` — always increasing, but with
  diminishing returns, so there's no single "best" tree to spam forever.
- **Runs while you're away.** A tree's age is derived from its plant
  timestamp, not from a running clock, so the exact income earned while the
  tab was closed is computed with a closed-form integral on reload — no
  tick-by-tick simulation, no drift, no reward for leaving multiple tabs open.
- **Garden plots.** Start with 6, expand up to 15 by spending leaves.
- **Local-only.** Progress is saved to `localStorage`. No backend, no
  accounts.

## Stack

React + TypeScript + Vite. No state library — a single custom hook
(`useGarden`) owns the game state, the tick loop, and persistence. All tree
art is inline SVG generated from a few parameters (trunk color, two foliage
colors, growth stage), not image assets.

```
src/
  types.ts            Domain types: TreeSpecies, PlantedTree, GameState
  data/species.ts      The five tree species and their stats
  game/economy.ts       Pure math: income rate, the closed-form earnings
                         integral, cost scaling, number/duration formatting
  game/useGarden.ts     Game state, save/load + offline catch-up, tick loop
  components/           TreeSprite (SVG), Plot, Garden, Shop modal, HUD,
                         LeafParticles (ambient falling-leaf effect)
```

## Running locally

```bash
npm install
npm run dev
```
