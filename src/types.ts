export interface TreeSpecies {
  id: string;
  name: string;
  description: string;
  cost: number;
  baseIncome: number;
  growthRate: number;
  unlockAt: number;
  trunk: string;
  foliage: [string, string];
}

export interface PlantedTree {
  id: string;
  speciesId: string;
  plantedAt: number;
  /** Total leaves spent on this tree: purchase price plus every upgrade bought since. */
  invested: number;
  /** Epoch ms when the water/fertilize buff expires; 0 or absent = inactive. */
  waterUntil: number;
  fertilizeUntil: number;
  boostLevel: number;
}

export interface GameState {
  leaves: number;
  totalEarned: number;
  plots: number;
  trees: (PlantedTree | null)[];
  lastTick: number;
  /** Free trees won from cases, banked by species until planted. */
  inventory: Record<string, number>;
  /** Epoch ms until which case rolls are luck-boosted; 0 or past = inactive. */
  luckBoostUntil: number;
  /** Free case opens banked by case id, spent before leaves are charged. */
  freeCaseCharges: Record<string, number>;
}
