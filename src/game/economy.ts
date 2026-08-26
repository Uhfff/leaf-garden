import type { PlantedTree, TreeSpecies } from '../types';
import { ICONS } from '../icons';

/** The age term is measured in units of this many seconds — one full day —
 *  instead of one minute like the original formula did. Growth is still
 *  unbounded (a tree never stops getting more valuable the longer it's
 *  alive, by design), but the original per-minute pacing meant a tree left
 *  planted for a day or two already reached a multiplier in the hundreds,
 *  which is how a handful of players ended up with quadrillions of leaves
 *  within about a day. Measuring age in days instead means the same shape
 *  of growth now plays out over the course of days and weeks rather than
 *  hours — meaningful long-term progress, not a runaway within a session. */
const AGE_UNIT_SECONDS = 24 * 60 * 60;

/** Instantaneous income per second for a tree of the given age. Unbounded —
 *  there's still no single "best" tree that caps out, just diminishing
 *  returns per additional day alive. */
export function incomeRate(species: TreeSpecies, ageSeconds: number, multiplier = 1): number {
  if (species.flatIncome !== undefined) return species.flatIncome;
  const age = Math.max(ageSeconds, 0);
  return species.baseIncome * multiplier * (1 + species.growthRate * Math.sqrt(age / AGE_UNIT_SECONDS));
}

/**
 * Closed-form integral of incomeRate over [ageStart, ageEnd] for a constant
 * multiplier, so both the live tick loop and offline catch-up can use exact
 * math instead of approximating with many small steps.
 */
export function earningsBetween(species: TreeSpecies, ageStart: number, ageEnd: number, multiplier = 1): number {
  const a = Math.max(ageStart, 0);
  const b = Math.max(ageEnd, a);
  if (species.flatIncome !== undefined) return species.flatIncome * (b - a);
  const linear = species.baseIncome * (b - a);
  const k = (species.baseIncome * species.growthRate) / Math.sqrt(AGE_UNIT_SECONDS);
  const curved = k * (2 / 3) * (Math.pow(b, 1.5) - Math.pow(a, 1.5));
  return multiplier * (linear + curved);
}

export type GrowthStage = 0 | 1 | 2 | 3;

const STAGE_THRESHOLDS = [30, 180, 900];

export function growthStage(ageSeconds: number): GrowthStage {
  const stage = STAGE_THRESHOLDS.findIndex((t) => ageSeconds < t);
  return (stage === -1 ? 3 : stage) as GrowthStage;
}

export const STAGE_NAMES = ['саженец', 'молодое', 'взрослое', 'вековое'] as const;

export function nextCost(baseCost: number, owned: number, scale = 1.15): number {
  return Math.round(baseCost * Math.pow(scale, owned));
}

export type UpgradeType = 'water' | 'fertilize' | 'boost';

interface UpgradeDef {
  label: string;
  /** Emoji glyph — used where the icon sits inline in plain text (plot
   *  badges, the toolbar's upgrade-summary line), which a raster image
   *  can't do. */
  icon: string;
  /** Artwork for the standalone icon-only buttons (the care sub-menu). */
  image: string;
  bonus: number;
  /** Present only for temporary, single-instance buffs (water, fertilize). */
  durationMs?: number;
  cost: (species: TreeSpecies, boostLevel: number) => number;
}

export const UPGRADES: Record<UpgradeType, UpgradeDef> = {
  water: {
    label: 'Полить',
    icon: '💧',
    image: ICONS.water,
    bonus: 0.2,
    durationMs: 30 * 60 * 1000,
    cost: (species) => Math.max(1, Math.round(species.cost * 0.5)),
  },
  fertilize: {
    label: 'Удобрить',
    icon: '🌿',
    image: ICONS.fertilize,
    bonus: 0.4,
    durationMs: 60 * 60 * 1000,
    cost: (species) => Math.max(1, Math.round(species.cost * 1.5)),
  },
  boost: {
    label: 'Улучшить',
    icon: '⭐',
    image: ICONS.boost,
    bonus: 0.35,
    // At the old ×1.6/level, level 49 cost roughly 4.6×10^11 times a
    // tree's base cost — the stated 50-level cap was never actually
    // reachable, just a number on the label. ×1.15 keeps boosting a real,
    // escalating investment (~940x from level 0 to 49) without making the
    // cap fictional.
    cost: (species, boostLevel) => Math.max(1, Math.round(species.cost * 4 * Math.pow(1.15, boostLevel))),
  },
};

export function upgradeCost(type: UpgradeType, species: TreeSpecies, boostLevel: number): number {
  return UPGRADES[type].cost(species, boostLevel);
}

export const MAX_BOOST_LEVEL = 50;

/** Total cost of buying up to `count` consecutive boost levels starting from
 *  `fromLevel`, capped so the tree never exceeds its (species-specific, or
 *  the shared default) max boost level. */
export function costForLevels(species: TreeSpecies, fromLevel: number, count: number): number {
  const cap = species.maxBoostLevel ?? MAX_BOOST_LEVEL;
  const capped = Math.max(0, Math.min(count, cap - fromLevel));
  let total = 0;
  for (let k = 0; k < capped; k++) total += upgradeCost('boost', species, fromLevel + k);
  return total;
}

/** How many of the requested levels can actually be bought before hitting the cap. */
export function levelsWithinCap(species: TreeSpecies, fromLevel: number, requested: number): number {
  const cap = species.maxBoostLevel ?? MAX_BOOST_LEVEL;
  return Math.max(0, Math.min(requested, cap - fromLevel));
}

export type BoostQuantity = 1 | 10 | 100 | 'max';

/**
 * Greedily spends `budget` on the single cheapest next boost level available
 * across all entries, repeatedly, until nothing more is affordable or every
 * entry has hit MAX_BOOST_LEVEL. Correct because each entry's own cost only
 * ever increases, so the cheapest option globally is never made a better
 * buy by waiting.
 */
export function maxBoostAllocation(
  entries: { species: TreeSpecies; level: number }[],
  budget: number,
): { levels: number[]; totalCost: number } {
  const levels = entries.map(() => 0);
  let remaining = budget;
  while (true) {
    let bestIndex = -1;
    let bestCost = Infinity;
    for (let i = 0; i < entries.length; i++) {
      const cap = entries[i].species.maxBoostLevel ?? MAX_BOOST_LEVEL;
      if (entries[i].level + levels[i] >= cap) continue;
      const cost = upgradeCost('boost', entries[i].species, entries[i].level + levels[i]);
      if (cost < bestCost) {
        bestCost = cost;
        bestIndex = i;
      }
    }
    if (bestIndex === -1 || bestCost > remaining) break;
    remaining -= bestCost;
    levels[bestIndex]++;
  }
  return { levels, totalCost: budget - remaining };
}

/** Income multiplier for a tree at a specific point in time. */
export function treeMultiplierAt(tree: PlantedTree, atMs: number): number {
  const waterActive = !!tree.waterUntil && atMs < tree.waterUntil;
  const fertilizeActive = !!tree.fertilizeUntil && atMs < tree.fertilizeUntil;
  return (
    (waterActive ? 1 + UPGRADES.water.bonus : 1) *
    (fertilizeActive ? 1 + UPGRADES.fertilize.bonus : 1) *
    (1 + UPGRADES.boost.bonus * tree.boostLevel)
  );
}

/**
 * Earnings for one tree over [fromMs, toMs]. Water/fertilize can expire
 * mid-interval (including while the tab was closed), so the interval is
 * split at any buff-expiry timestamps it contains and each constant-
 * multiplier segment is integrated exactly with earningsBetween.
 */
export function earningsForTree(species: TreeSpecies, tree: PlantedTree, fromMs: number, toMs: number): number {
  if (toMs <= fromMs) return 0;
  const breakpoints = [tree.waterUntil, tree.fertilizeUntil]
    .filter((t): t is number => !!t && t > fromMs && t < toMs)
    .sort((a, b) => a - b);
  const points = [fromMs, ...breakpoints, toMs];
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const segStart = points[i];
    const segEnd = points[i + 1];
    const multiplier = treeMultiplierAt(tree, segStart);
    const ageStart = (segStart - tree.plantedAt) / 1000;
    const ageEnd = (segEnd - tree.plantedAt) / 1000;
    total += earningsBetween(species, ageStart, ageEnd, multiplier);
  }
  return total;
}

export const REFUND_RATE = 0.5;

export function formatLeaves(n: number): string {
  const sign = n < 0 ? '-' : '';
  const v = Math.abs(n);
  if (v < 1000) return sign + v.toFixed(v < 10 ? 1 : 0);
  const units = ['K', 'M', 'B', 'T'];
  let unit = -1;
  let val = v;
  while (val >= 1000 && unit < units.length - 1) {
    val /= 1000;
    unit++;
  }
  return `${sign}${val.toFixed(val < 10 ? 2 : 1)}${units[unit]}`;
}

export function formatDuration(seconds: number): string {
  const s = Math.floor(seconds);
  if (s < 60) return `${s} с`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} мин`;
  const h = Math.floor(m / 60);
  if (h < 24) return m % 60 === 0 ? `${h} ч` : `${h} ч ${m % 60} мин`;
  const d = Math.floor(h / 24);
  return `${d} д ${h % 24} ч`;
}

export function pluralTrees(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'дерево';
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return 'дерева';
  return 'деревьев';
}
