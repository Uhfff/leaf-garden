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
}

export interface GameState {
  leaves: number;
  totalEarned: number;
  plots: number;
  trees: (PlantedTree | null)[];
  lastTick: number;
}
