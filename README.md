# Листопад (Leaf Garden)

An idle garden game: plant trees, watch them grow, and let them earn currency
for you. The core idea is simple — a tree's income isn't fixed, it grows the
longer the tree has been alive. A sapling barely pays for itself; a
centuries-old oak becomes a real source of income. The currency is leaves.

## How it works

- **Eight tree species** (Birch → Maple → Oak → Willow → Sakura → Spruce →
  Baobab → Sequoia), each with a different cost, base income, and growth
  rate. Rarer species unlock as your lifetime earnings grow.
- **Two cases**, picked from a toolbar submenu. The 2,000-leaf **common
  case** rolls any of the eight regular species, steeply weighted toward
  the cheap ones (a 50%/24%/12%/6%/4%/2.5%/1.2%/0.3% spread — the top prize
  is a genuine long shot, not a modest one). The 100-billion-leaf
  **exclusive case** rolls either one of 4 top regular species as a
  consolation prize or one of 5 **seasonal species that are never sold in
  the regular planting picker at any price** — the only way to ever own an
  Ice Birch, Frost Pine, Golden Maple, Crystal Willow, or Phoenix Tree.
  Both share the same mechanics: odds shown up front, opening spins a
  scrolling reel (drawn from that same weighted roll, ending in the real
  result, with a few more items rolled past it so the strip doesn't dead-end
  exactly at the pointer) that decelerates into place. The reel is
  positioned with `left: 0` inside its clipped viewport rather than
  flex-centered — a centered flex item wider than its container shifts by
  however much it overflows, which silently broke every distance the spin
  was calculated to travel and left most of the reel's trees permanently
  off-screen. Landing reveals the full tree art and a choice: sell it on
  the spot for its normal purchase price, or bank it. A banked tree goes to
  an inventory by species rather than straight into the ground; the
  planting picker shows a "free" price and how many you're holding when
  inventory covers a species (and, for seasonal species, only shows them
  at all once inventory does). Since nothing was spent on the tree itself,
  removing a case-won tree later refunds nothing either way.
- **Income scales with age.** Every planted tree's income follows
  `base * (1 + growthRate * sqrt(age))` — always increasing, but with
  diminishing returns, so there's no single "best" tree to spam forever.
- **Runs while you're away.** A tree's age is derived from its plant
  timestamp, not from a running clock, so the exact income earned while the
  tab was closed is computed with a closed-form integral on reload — no
  tick-by-tick simulation, no drift, no reward for leaving multiple tabs open.
- **Garden plots.** Start with 6, expand up to 30, each new one costing 2.2x
  the last (200 leaves for the first, into the billions by the last).
- **Upgrades.** Watering and fertilizing are temporary income buffs (30 min
  and 1 hour) that expire on their own — reapplying one before it expires
  just pays the cost again and refreshes the timer to full. While picking
  trees to water/fertilize, an already-active tree shows its remaining time
  right on the plot, so the choice to refresh it is an informed one. Boosting
  is the opposite: a permanent multiplier with its own escalating cost,
  stackable up to level 50, buyable ×1, ×10, ×100, or MAX (spends everything
  you have, greedily buying whichever selected tree's next level is cheapest
  until you're out or every selected tree is maxed). All three share one
  toolbar button (a picker for which of the three to run), and all three can
  be applied to several selected trees at once (same selection UI as
  removal); buff expiry survives being offline — a buff's exact contribution
  is integrated piecewise around its expiry timestamp, not just approximated.
- **Removing a tree refunds half of what you put into it** — purchase price
  plus every upgrade bought since — so experimenting isn't a dead loss.
- **Promo codes.** A code redeemed in-game applies its effect once per
  browser, using the same used-code ledger as gift links (just under a
  `promo:` prefix so the two can't collide). Matching is case-insensitive.
  Effects aren't limited to a flat leaf amount — a code can also grant a
  temporary luck boost (`luck35`: +35% weight on every non-top drop in a
  case for 2 days, stacking with the reel and odds display alike) or free
  case openings (`newcases`: 50 free pulls on the common case, tracked as
  per-case charges that get spent before any leaves are, and reflected in
  the case modal's "Открыть бесплатно" button).
- **Local-only.** Progress is saved to `localStorage`. No backend, no
  accounts.
- **Referral links, via the bot.** `/invite` in the Telegram bot returns a
  personal `t.me/...?start=ref<telegramId>` link. When someone opens the bot
  through it, the bot sends the referrer a gift button worth 5 trillion
  leaves — `?gift=ref:<referrerId>:<newUserId>`, so each invited friend is
  its own voucher (one payout per friend, replaying the same friend's link
  again pays nothing, same as any other gift link).
- **Playable as a Telegram Mini App.** Loads the Telegram Web App SDK and,
  when actually opened inside Telegram, expands to full height and matches
  the app's header/background to its own dark theme. Outside Telegram it's
  a no-op, so the same build works as a plain website too.

## Stack

React + TypeScript + Vite. No state library — a single custom hook
(`useGarden`) owns the game state, the tick loop, and persistence. All tree
art is inline SVG generated from a few parameters (trunk color, two foliage
colors, growth stage), not image assets.

```
src/
  types.ts            Domain types: TreeSpecies, PlantedTree, GameState
  data/species.ts      The eight regular tree species and their stats
  data/seasonalSpecies.ts  The five exclusive-case-only species
  data/allSpecies.ts    Combined species lookup used by game logic (regular
                         shop code deliberately keeps using species.ts alone)
  data/cases.ts         Case definitions and the weighted species roll
  data/promoCodes.ts     Promo code → leaf amount table
  game/economy.ts       Pure math: income rate, the closed-form earnings
                         integral, cost scaling, number/duration formatting
  game/useGarden.ts     Game state, save/load + offline catch-up, tick loop
  telegram.ts            Telegram Web App SDK init (ready/expand/theming),
                         a no-op outside Telegram
  components/           TreeSprite (SVG), Plot, Garden, Shop modal, HUD,
                         SelectionToolbar (multi-select upgrade/delete),
                         LeafParticles (ambient falling-leaf effect)
```

## Running locally

```bash
npm install
npm run dev
```
