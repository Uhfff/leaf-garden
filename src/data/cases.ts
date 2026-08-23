import type { TreeSpecies } from '../types';
import { SPECIES_MAP } from './species';

export interface CaseDrop {
  speciesId: string;
  weight: number;
}

export interface CaseDef {
  id: string;
  name: string;
  icon: string;
  cost: number;
  drops: CaseDrop[];
}

export const CASES: CaseDef[] = [
  {
    id: 'common',
    name: 'Обычный кейс',
    icon: '🎁',
    cost: 2000,
    drops: [
      { speciesId: 'birch', weight: 35 },
      { speciesId: 'maple', weight: 25 },
      { speciesId: 'oak', weight: 18 },
      { speciesId: 'willow', weight: 10 },
      { speciesId: 'sakura', weight: 6 },
      { speciesId: 'spruce', weight: 3.5 },
      { speciesId: 'baobab', weight: 1.8 },
      { speciesId: 'sequoia', weight: 0.7 },
    ],
  },
];

export const CASE_MAP: Record<string, CaseDef> = Object.fromEntries(CASES.map((c) => [c.id, c]));

export function dropChance(caseDef: CaseDef, speciesId: string): number {
  const total = caseDef.drops.reduce((sum, d) => sum + d.weight, 0);
  const drop = caseDef.drops.find((d) => d.speciesId === speciesId);
  return drop ? (drop.weight / total) * 100 : 0;
}

/** A tree's species doesn't need to be unlocked to drop from a case —
 *  landing a rare species early is the whole point of opening one. */
export function rollCaseSpecies(caseDef: CaseDef): TreeSpecies {
  const total = caseDef.drops.reduce((sum, d) => sum + d.weight, 0);
  let r = Math.random() * total;
  for (const drop of caseDef.drops) {
    if (r < drop.weight) return SPECIES_MAP[drop.speciesId];
    r -= drop.weight;
  }
  return SPECIES_MAP[caseDef.drops[caseDef.drops.length - 1].speciesId];
}
