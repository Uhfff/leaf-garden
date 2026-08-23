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
- **Garden plots.** Start with 6, expand up to 30, each new one costing 1.8x
  the last (200 leaves for the first, into the hundreds of millions by the
  last).
- **Upgrades.** Watering and fertilizing are temporary income buffs (30 min
  and 1 hour) that expire on their own — reapplying one before it expires
  just pays the cost again and refreshes the timer to full. While picking
  trees to water/fertilize, an already-active tree shows its remaining time
  right on the plot, so the choice to refresh it is an informed one. Boosting
  is the opposite: a permanent,
  endlessly stackable multiplier with its own escalating cost, buyable ×1,
  ×10, ×100, or MAX (spends everything you have, greedily buying whichever
  selected tree's next level is cheapest until you're out). All three can be
  applied to several selected trees at once (same selection UI as removal),
  and buff expiry survives being offline — a buff's exact contribution is
  integrated piecewise around its expiry timestamp, not just approximated.
- **Removing a tree refunds half of what you put into it** — purchase price
  plus every upgrade bought since — so experimenting isn't a dead loss.
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
                         SelectionToolbar (multi-select upgrade/delete),
                         LeafParticles (ambient falling-leaf effect)
```

## Running locally

```bash
npm install
npm run dev
```
