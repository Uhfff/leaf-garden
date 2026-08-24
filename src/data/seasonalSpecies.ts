import type { TreeSpecies } from '../types';

/** Exclusive-case-only trees — never sold in the regular planting picker
 *  and never unlockable through normal lifetime earnings (unlockAt:
 *  Infinity is belt-and-suspenders; PlantModal simply never lists them
 *  unless inventory already holds one).
 *
 *  `cost` doubles as the case-modal sell price, so it's set to keep
 *  weight * cost constant (3T) across all six — every seasonal slot
 *  contributes the same expected value to the exclusive case regardless
 *  of its odds, scaled well past the 100B case cost so even the commonest
 *  seasonal drop is a windfall. */
export const SEASONAL_SPECIES: TreeSpecies[] = [
  {
    id: 'ice_birch',
    name: 'Ледяная берёза',
    description: 'Кора из чистого льда, не тает даже летом — самый доступный трофей кейса.',
    cost: 250_000_000_000,
    baseIncome: 5_000,
    growthRate: 2.3,
    unlockAt: Infinity,
    trunk: '#a8c4d4',
    foliage: ['#d8f0fa', '#f0fbff'],
  },
  {
    id: 'frost_pine',
    name: 'Морозная сосна',
    description: 'Сверкает инеем круглый год — трофей из эксклюзивного кейса.',
    cost: 500_000_000_000,
    baseIncome: 15_000,
    growthRate: 2.6,
    unlockAt: Infinity,
    trunk: '#5a6b7a',
    foliage: ['#bfe3f0', '#eaf7fb'],
  },
  {
    id: 'golden_maple',
    name: 'Золотой клён',
    description: 'Листва из чистого золота — не темнеет и не облетает.',
    cost: 1_000_000_000_000,
    baseIncome: 55_000,
    growthRate: 3.0,
    unlockAt: Infinity,
    trunk: '#8a6a2f',
    foliage: ['#f4c430', '#ffe066'],
  },
  {
    id: 'crystal_willow',
    name: 'Хрустальная ива',
    description: 'Ветви из чистого хрусталя со звоном на ветру.',
    cost: 2_000_000_000_000,
    baseIncome: 190_000,
    growthRate: 3.4,
    unlockAt: Infinity,
    trunk: '#8a8aa0',
    foliage: ['#9fd8e8', '#d6f3f7'],
  },
  {
    id: 'phoenix_tree',
    name: 'Дерево Феникса',
    description: 'Тлеет, но никогда не сгорает.',
    cost: 6_000_000_000_000,
    baseIncome: 650_000,
    growthRate: 3.8,
    unlockAt: Infinity,
    trunk: '#4a1f1f',
    foliage: ['#ff6b35', '#ffb703'],
  },
  {
    id: 'six_seven',
    name: '67',
    description: 'Никто толком не знает, что это значит, но оно существует — самый редкий и нелепый трофей кейса.',
    cost: 15_000_000_000_000,
    baseIncome: 2_200_000,
    growthRate: 4.2,
    unlockAt: Infinity,
    trunk: '#3a1f5c',
    foliage: ['#ff2fb0', '#00e5ff'],
  },
];

export const SEASONAL_SPECIES_MAP: Record<string, TreeSpecies> = Object.fromEntries(
  SEASONAL_SPECIES.map((s) => [s.id, s]),
);
