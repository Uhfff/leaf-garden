import type { PlantedTree, TreeSpecies } from '../types';

/** Instantaneous income per second for a tree of the given age. */
export function incomeRate(species: TreeSpecies, ageSeconds: number, multiplier = 1): number {
  const age = Math.max(ageSeconds, 0);
  return species.baseIncome * multiplier * (1 + species.growthRate * Math.sqrt(age / 60));
}

/**
 * Closed-form integral of incomeRate over [ageStart, ageEnd] for a constant
 * multiplier, so both the live tick loop and offline catch-up can use exact
 * math instead of approximating with many small steps.
 */
export function earningsBetween(species: TreeSpecies, ageStart: number, ageEnd: number, multiplier = 1): number {
  const a = Math.max(ageStart, 0);
  const b = Math.max(ageEnd, a);
  const linear = species.baseIncome * (b - a);
  const k = (species.baseIncome * species.growthRate) / Math.sqrt(60);
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
  icon: string;
  bonus: number;
  /** Present only for temporary, single-instance buffs (water, fertilize). */
  durationMs?: number;
  cost: (species: TreeSpecies, boostLevel: number) => number;
}

export const UPGRADES: Record<UpgradeType, UpgradeDef> = {
  water: {
    label: 'Полить',
    icon: '💧',
    bonus: 0.2,
    durationMs: 3 * 60 * 1000,
    cost: (species) => Math.max(1, Math.round(species.cost * 0.5)),
  },
  fertilize: {
    label: 'Удобрить',
    icon: '🌿',
    bonus: 0.4,
    durationMs: 8 * 60 * 1000,
    cost: (species) => Math.max(1, Math.round(species.cost * 1.5)),
  },
  boost: {
    label: 'Улучшить',
    icon: '⭐',
    bonus: 0.35,
    cost: (species, boostLevel) => Math.max(1, Math.round(species.cost * 4 * Math.pow(1.6, boostLevel))),
  },
};

/** Whether a tree can receive this upgrade right now — boost always can; a
 *  buff can only be (re)applied once its previous application has expired. */
export function isUpgradeEligible(tree: PlantedTree, type: UpgradeType, nowMs: number): boolean {
  if (type === 'water') return !tree.waterUntil || tree.waterUntil <= nowMs;
  if (type === 'fertilize') return !tree.fertilizeUntil || tree.fertilizeUntil <= nowMs;
  return true;
}

export function upgradeCost(type: UpgradeType, species: TreeSpecies, boostLevel: number): number {
  return UPGRADES[type].cost(species, boostLevel);
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
  if (h < 24) return `${h} ч ${m % 60} мин`;
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
