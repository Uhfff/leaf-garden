import type { TreeSpecies } from '../types';

/** Instantaneous income per second for a tree of the given age. */
export function incomeRate(species: TreeSpecies, ageSeconds: number): number {
  const age = Math.max(ageSeconds, 0);
  return species.baseIncome * (1 + species.growthRate * Math.sqrt(age / 60));
}

/**
 * Closed-form integral of incomeRate over [ageStart, ageEnd], so both the
 * live tick loop and offline catch-up can use the same exact calculation
 * instead of approximating with many small steps.
 */
export function earningsBetween(species: TreeSpecies, ageStart: number, ageEnd: number): number {
  const a = Math.max(ageStart, 0);
  const b = Math.max(ageEnd, a);
  const linear = species.baseIncome * (b - a);
  const k = (species.baseIncome * species.growthRate) / Math.sqrt(60);
  const curved = k * (2 / 3) * (Math.pow(b, 1.5) - Math.pow(a, 1.5));
  return linear + curved;
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
