export interface TreeSpecies {
  id: string;
  name: string;
  description: string;
  /** Basis for planting price, water/fertilize/boost cost, and refund
   *  tracking — for seasonal species this is deliberately much smaller
   *  than what they're worth, since they're never actually purchased with
   *  it. See `sellPrice` for what they're actually worth. */
  cost: number;
  /** What selling this species pays out — falls back to `cost` when
   *  absent, so only seasonal species (won from the exclusive case, worth
   *  far more than their `cost` basis) need to set this separately. */
  sellPrice?: number;
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
  /** Weight bonus applied while luckBoostUntil is active — meaningless once it lapses. */
  luckBoostPercent: number;
  /** Free case opens banked by case id, spent before leaves are charged. */
  freeCaseCharges: Record<string, number>;
}
