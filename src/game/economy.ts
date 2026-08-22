import type { PlantedTree, TreeSpecies } from '../types';

/** Instantaneous income per second for a tree of the given age. */
export function incomeRate(species: TreeSpecies, ageSeconds: number, multiplier = 1): number {
  const age = Math.max(ageSeconds, 0);
  return species.baseIncome * multiplier * (1 + species.growthRate * Math.sqrt(age / 60));
}

/**
 * Closed-form integral of incomeRate over [ageStart, ageEnd], so both the
 * live tick loop and offline catch-up can use the same exact calculation
 * instead of approximating with many small steps. `multiplier` is assumed
 * constant across the interval, which holds because it can only change
 * through a user action, and the user can't act while the game is closed.
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
export type UpgradeLevelField = 'waterLevel' | 'fertilizeLevel' | 'boostLevel';

interface UpgradeDef {
  label: string;
  icon: string;
  costFactor: number;
  scale: number;
  bonusPerLevel: number;
}

export const UPGRADES: Record<UpgradeType, UpgradeDef> = {
  water: { label: 'Полить', icon: '💧', costFactor: 0.5, scale: 1.3, bonusPerLevel: 0.1 },
  fertilize: { label: 'Удобрить', icon: '🌿', costFactor: 1.5, scale: 1.4, bonusPerLevel: 0.2 },
  boost: { label: 'Улучшить', icon: '⭐', costFactor: 4, scale: 1.6, bonusPerLevel: 0.35 },
};

export function levelField(type: UpgradeType): UpgradeLevelField {
  return `${type}Level` as UpgradeLevelField;
}

export function upgradeCost(type: UpgradeType, species: TreeSpecies, currentLevel: number): number {
  const def = UPGRADES[type];
  return Math.max(1, Math.round(species.cost * def.costFactor * Math.pow(def.scale, currentLevel)));
}

export function treeMultiplier(tree: Pick<PlantedTree, 'waterLevel' | 'fertilizeLevel' | 'boostLevel'>): number {
  return (
    (1 + UPGRADES.water.bonusPerLevel * tree.waterLevel) *
    (1 + UPGRADES.fertilize.bonusPerLevel * tree.fertilizeLevel) *
    (1 + UPGRADES.boost.bonusPerLevel * tree.boostLevel)
  );
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
