import type { TreeSpecies } from '../types';
import { ALL_SPECIES_MAP } from './allSpecies';
import { SEASONAL_SPECIES_MAP } from './seasonalSpecies';
import { ICONS } from '../icons';

export interface CaseDrop {
  speciesId: string;
  weight: number;
}

export interface CaseDef {
  id: string;
  name: string;
  image: string;
  cost: number;
  drops: CaseDrop[];
}

export const CASES: CaseDef[] = [
  {
    id: 'common',
    name: 'Обычный кейс',
    image: ICONS.caseCommon,
    cost: 2000,
    // Steep, casino-style drop-off: common species are very common, the
    // top prize is a genuine long shot instead of a modest 1-in-150 chance.
    drops: [
      { speciesId: 'birch', weight: 50 },
      { speciesId: 'maple', weight: 24 },
      { speciesId: 'oak', weight: 12 },
      { speciesId: 'willow', weight: 6 },
      { speciesId: 'sakura', weight: 4 },
      { speciesId: 'spruce', weight: 2.5 },
      { speciesId: 'baobab', weight: 1.2 },
      { speciesId: 'sequoia', weight: 0.3 },
    ],
  },
  {
    id: 'exclusive',
    name: 'Звёздный кейс',
    image: ICONS.caseExclusive,
    // Was 100B, calibrated for the old runaway income formula (see
    // economy.ts) where that was reachable within a day or so. Under the
    // fixed, day-paced curve it would have been effectively unreachable —
    // 50M sits at roughly 150x the top regular tree's own cost (sequoia,
    // 320K), a real but attainable next-tier goal instead of a wall.
    cost: 50_000_000,
    // Re-themed lineup: same 4 top-tier regular "consolation" species, but
    // the 6 exclusive-only slots now point at CURRENT_EXCLUSIVE_SPECIES
    // (cosmic-themed) instead of the original ice/gold/phoenix set, which
    // was retired — see seasonalSpecies.ts. Same weights as before, so the
    // odds feel unchanged even though the prizes are new.
    drops: [
      { speciesId: 'sakura', weight: 30 },
      { speciesId: 'spruce', weight: 22 },
      { speciesId: 'baobab', weight: 15 },
      { speciesId: 'sequoia', weight: 10 },
      { speciesId: 'moon_birch', weight: 12 },
      { speciesId: 'comet_pine', weight: 6 },
      { speciesId: 'starlight_maple', weight: 3 },
      { speciesId: 'nebula_willow', weight: 1.5 },
      { speciesId: 'meteor_oak', weight: 0.5 },
      { speciesId: 'supernova', weight: 0.2 },
    ],
  },
];

export const CASE_MAP: Record<string, CaseDef> = Object.fromEntries(CASES.map((c) => [c.id, c]));

/** A luck boost only touches actual rare trophies — the seasonal species
 *  that never sell in the regular shop at any price — leaving the regular
 *  "consolation" species (sakura, spruce, baobab, sequoia in the exclusive
 *  case) at their normal odds. Weight alone doesn't identify "rare" here:
 *  some seasonal trees (e.g. ice_birch) have a *higher* raw weight than a
 *  regular consolation slot (sequoia), so the boost keys off the seasonal
 *  species table itself, not a weight threshold. The percent comes from
 *  whichever promo code activated it (see PromoEffect 'luckBoost'), not a
 *  fixed constant, so different codes can grant different strengths. */
function effectiveDrops(caseDef: CaseDef, boostPercent: number): CaseDrop[] {
  if (boostPercent <= 0) return caseDef.drops;
  return caseDef.drops.map((d) =>
    SEASONAL_SPECIES_MAP[d.speciesId] ? { ...d, weight: d.weight * (1 + boostPercent / 100) } : d,
  );
}

export function dropChance(caseDef: CaseDef, speciesId: string, boostPercent = 0): number {
  const drops = effectiveDrops(caseDef, boostPercent);
  const total = drops.reduce((sum, d) => sum + d.weight, 0);
  const drop = drops.find((d) => d.speciesId === speciesId);
  return drop ? (drop.weight / total) * 100 : 0;
}

/** A tree's species doesn't need to be unlocked to drop from a case —
 *  landing a rare species early is the whole point of opening one. */
export function rollCaseSpecies(caseDef: CaseDef, boostPercent = 0): TreeSpecies {
  const drops = effectiveDrops(caseDef, boostPercent);
  const total = drops.reduce((sum, d) => sum + d.weight, 0);
  let r = Math.random() * total;
  for (const drop of drops) {
    if (r < drop.weight) return ALL_SPECIES_MAP[drop.speciesId];
    r -= drop.weight;
  }
  return ALL_SPECIES_MAP[drops[drops.length - 1].speciesId];
}
