import { SPECIES_MAP } from './species';
import { SEASONAL_SPECIES_MAP } from './seasonalSpecies';
import type { TreeSpecies } from '../types';

/** Every species a planted/inventoried tree could actually be — regular
 *  shop trees plus exclusive-case-only seasonal ones. Game logic that
 *  resolves a tree by its speciesId (income, upgrades, selling, rendering)
 *  needs this, not the regular-only SPECIES_MAP, or a seasonal tree would
 *  resolve to undefined and crash. The regular shop (PlantModal) is the
 *  one place that intentionally keeps using SPECIES/SPECIES_MAP alone. */
export const ALL_SPECIES_MAP: Record<string, TreeSpecies> = {
  ...SPECIES_MAP,
  ...SEASONAL_SPECIES_MAP,
};
