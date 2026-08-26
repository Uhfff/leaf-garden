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
 *  it even one level cost trillions. `sellPrice` keeps its own
 *  weight-balanced values instead (weight * sellPrice = 1.5B across all
 *  six, unrelated to how good the tree actually is to keep planted) —
 *  scaled down from an original 3T alongside the exclusive case's own
 *  cost dropping from 100B to 50M, so the payout stays proportional to
 *  what the case itself costs to open. */
// The original six (ice_birch through six_seven) were retired from the
// exclusive case's drop table when it was re-themed — no longer
// obtainable from anywhere, but kept here so anyone who already owns one
// keeps it working (ALL_SPECIES_MAP still needs to resolve its id).
export const SEASONAL_SPECIES: TreeSpecies[] = [
  {
    id: 'ice_birch',
    name: 'Ледяная берёза',
    description: 'Кора из чистого льда, не тает даже летом — самый доступный трофей кейса.',
    cost: 1_400_000,
    sellPrice: 125_000_000,
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
    sellPrice: 250_000_000,
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
    sellPrice: 500_000_000,
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
    sellPrice: 1_000_000_000,
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
    sellPrice: 3_000_000_000,
    baseIncome: 70_000,
    growthRate: 3.8,
    unlockAt: Infinity,
    trunk: '#4a1f1f',
    foliage: ['#ff6b35', '#ffb703'],
  },
  {
    id: 'koch_brat',
    name: 'Коч Брат',
    description: 'Трофей за отдельный промокод, не из кейса — просто свой в доску.',
    cost: 60_000_000,
    sellPrice: 700_000_000,
    baseIncome: 777_000_000,
    growthRate: 0,
    flatIncome: 777_000_000,
    maxBoostLevel: 52,
    unlockAt: Infinity,
    trunk: '#2a2f3a',
    foliage: ['#3b4a63', '#6b87ad'],
  },
  {
    id: 'six_seven',
    name: '67',
    description: 'Никто толком не знает, что это значит, но оно существует — самый редкий и нелепый трофей кейса.',
    cost: 2_000_000_000,
    sellPrice: 7_500_000_000,
    baseIncome: 178_000,
    growthRate: 4.2,
    unlockAt: Infinity,
    trunk: '#3d6a86',
    foliage: ['#4fc3f7', '#b3e5fc'],
  },
];

// The current lineup for the re-themed exclusive case — same cost/income
// tiers as the retired set above (same balance, freshly re-skinned), a
// cosmic theme instead of the old ice/gold/phoenix one.
export const CURRENT_EXCLUSIVE_SPECIES: TreeSpecies[] = [
  {
    id: 'moon_birch',
    name: 'Лунная берёза',
    description: 'Кора отражает лунный свет — светится в темноте сада.',
    cost: 1_400_000,
    sellPrice: 125_000_000,
    baseIncome: 1_650,
    growthRate: 2.3,
    unlockAt: Infinity,
    trunk: '#9aa5b8',
    foliage: ['#dde5f2', '#f3f6fc'],
  },
  {
    id: 'comet_pine',
    name: 'Кометная сосна',
    description: 'Хвоя тянется огненным хвостом, будто за деревом летит комета.',
    cost: 6_000_000,
    sellPrice: 250_000_000,
    baseIncome: 4_200,
    growthRate: 2.6,
    unlockAt: Infinity,
    trunk: '#3a5a5e',
    foliage: ['#4fd1c5', '#a8f0e8'],
  },
  {
    id: 'starlight_maple',
    name: 'Звёздный клён',
    description: 'Листья мерцают, как звёзды в ясном небе.',
    cost: 25_000_000,
    sellPrice: 500_000_000,
    baseIncome: 10_800,
    growthRate: 3.0,
    unlockAt: Infinity,
    trunk: '#20264a',
    foliage: ['#6ea8fe', '#c9dbff'],
  },
  {
    id: 'nebula_willow',
    name: 'Туманная ива',
    description: 'Ветви окутаны туманностью — цвет меняется на глазах.',
    cost: 110_000_000,
    sellPrice: 1_000_000_000,
    baseIncome: 27_500,
    growthRate: 3.4,
    unlockAt: Infinity,
    trunk: '#4a2f5e',
    foliage: ['#c77dff', '#f3c4fb'],
  },
  {
    id: 'meteor_oak',
    name: 'Метеоритный дуб',
    description: 'Ствол испещрён метеоритными шрамами, но дерево живее всех живых.',
    cost: 470_000_000,
    sellPrice: 3_000_000_000,
    baseIncome: 70_000,
    growthRate: 3.8,
    unlockAt: Infinity,
    trunk: '#3a2f2f',
    foliage: ['#ff8c42', '#ffb37a'],
  },
  {
    id: 'supernova',
    name: 'Сверхновая',
    description: 'Вспышка в момент максимальной яркости — самый редкий трофей нового кейса.',
    cost: 2_000_000_000,
    sellPrice: 7_500_000_000,
    baseIncome: 178_000,
    growthRate: 4.2,
    unlockAt: Infinity,
    trunk: '#5a4a1f',
    foliage: ['#fff4b8', '#ffd23f'],
  },
];

/** Every exclusive-case-only species that could actually show up in a save
 *  — retired ones (still owned by whoever won them) plus the current
 *  lineup. Use this (not SEASONAL_SPECIES alone) anywhere that needs to
 *  resolve or list an owned exclusive tree regardless of when it dropped. */
export const ALL_SEASONAL_SPECIES: TreeSpecies[] = [...SEASONAL_SPECIES, ...CURRENT_EXCLUSIVE_SPECIES];

export const SEASONAL_SPECIES_MAP: Record<string, TreeSpecies> = Object.fromEntries(
  ALL_SEASONAL_SPECIES.map((s) => [s.id, s]),
);
