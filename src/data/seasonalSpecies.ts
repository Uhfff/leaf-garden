import type { TreeSpecies } from '../types';

/** Exclusive-case-only trees — never sold in the regular planting picker
 *  and never unlockable through normal lifetime earnings (unlockAt:
 *  Infinity is belt-and-suspenders; PlantModal simply never lists them
 *  unless inventory already holds one).
 *
 *  `cost` continues the regular species' own progression (roughly ×4.3
 *  cost and ×2.55 income per tier, the ratios the last few regular species
 *  already converge to) rather than being derived from `sellPrice` —
 *  using the sell price as the upgrade/income basis was the actual bug:
 *  a tree costing hundreds of billions to "plant" against a few thousand
 *  leaves of base income had a payback measured in months, and boosting
 *  it even one level cost trillions. `sellPrice` keeps the large,
 *  weight-balanced values instead (weight * sellPrice = 3T across all
 *  six, unrelated to how good the tree actually is to keep planted). */
export const SEASONAL_SPECIES: TreeSpecies[] = [
  {
    id: 'ice_birch',
    name: 'Ледяная берёза',
    description: 'Кора из чистого льда, не тает даже летом — самый доступный трофей кейса.',
    cost: 1_400_000,
    sellPrice: 250_000_000_000,
    baseIncome: 1_650,
    growthRate: 2.3,
    unlockAt: Infinity,
    trunk: '#a8c4d4',
    foliage: ['#d8f0fa', '#f0fbff'],
  },
  {
    id: 'frost_pine',
    name: 'Морозная сосна',
    description: 'Сверкает инеем круглый год — трофей из эксклюзивного кейса.',
    cost: 6_000_000,
    sellPrice: 500_000_000_000,
    baseIncome: 4_200,
    growthRate: 2.6,
    unlockAt: Infinity,
    trunk: '#5a6b7a',
    foliage: ['#bfe3f0', '#eaf7fb'],
  },
  {
    id: 'golden_maple',
    name: 'Золотой клён',
    description: 'Листва из чистого золота — не темнеет и не облетает.',
    cost: 25_000_000,
    sellPrice: 1_000_000_000_000,
    baseIncome: 10_800,
    growthRate: 3.0,
    unlockAt: Infinity,
    trunk: '#8a6a2f',
    foliage: ['#f4c430', '#ffe066'],
  },
  {
    id: 'crystal_willow',
    name: 'Хрустальная ива',
    description: 'Ветви из чистого хрусталя со звоном на ветру.',
    cost: 110_000_000,
    sellPrice: 2_000_000_000_000,
    baseIncome: 27_500,
    growthRate: 3.4,
    unlockAt: Infinity,
    trunk: '#8a8aa0',
    foliage: ['#9fd8e8', '#d6f3f7'],
  },
  {
    id: 'phoenix_tree',
    name: 'Дерево Феникса',
    description: 'Тлеет, но никогда не сгорает.',
    cost: 470_000_000,
    sellPrice: 6_000_000_000_000,
    baseIncome: 70_000,
    growthRate: 3.8,
    unlockAt: Infinity,
    trunk: '#4a1f1f',
    foliage: ['#ff6b35', '#ffb703'],
  },
  {
    id: 'six_seven',
    name: '67',
    description: 'Никто толком не знает, что это значит, но оно существует — самый редкий и нелепый трофей кейса.',
    cost: 2_000_000_000,
    sellPrice: 15_000_000_000_000,
    baseIncome: 178_000,
    growthRate: 4.2,
    unlockAt: Infinity,
    trunk: '#3d6a86',
    foliage: ['#4fc3f7', '#b3e5fc'],
  },
];

export const SEASONAL_SPECIES_MAP: Record<string, TreeSpecies> = Object.fromEntries(
  SEASONAL_SPECIES.map((s) => [s.id, s]),
);
