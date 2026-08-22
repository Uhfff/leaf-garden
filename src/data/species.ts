import type { TreeSpecies } from '../types';

export const SPECIES: TreeSpecies[] = [
  {
    id: 'birch',
    name: 'Берёза',
    description: 'Приживается быстро, доход скромный, но с чего-то надо начинать.',
    cost: 10,
    baseIncome: 0.4,
    growthRate: 0.5,
    unlockAt: 0,
    trunk: '#d8c6a8',
    foliage: ['#8fbf6a', '#a9d987'],
  },
  {
    id: 'maple',
    name: 'Клён',
    description: 'Растёт увереннее берёзы, доход заметно выше.',
    cost: 60,
    baseIncome: 1.6,
    growthRate: 0.6,
    unlockAt: 80,
    trunk: '#a5744c',
    foliage: ['#e08a3c', '#d4671f'],
  },
  {
    id: 'oak',
    name: 'Дуб',
    description: 'Медленный старт, но с возрастом становится настоящей золотой жилой.',
    cost: 300,
    baseIncome: 5.5,
    growthRate: 0.85,
    unlockAt: 600,
    trunk: '#6b4a2f',
    foliage: ['#4f7a3d', '#3f6630'],
  },
  {
    id: 'willow',
    name: 'Ива',
    description: 'Много тонких ветвей и листвы — доход набирает обороты быстрее прочих.',
    cost: 1200,
    baseIncome: 15,
    growthRate: 1.1,
    unlockAt: 3000,
    trunk: '#8a7a5c',
    foliage: ['#7fae6b', '#a3cf8f'],
  },
  {
    id: 'sakura',
    name: 'Сакура',
    description: 'Редкое и дорогое дерево — но и самое щедрое из всех, что вы вырастите.',
    cost: 5000,
    baseIncome: 40,
    growthRate: 1.4,
    unlockAt: 15000,
    trunk: '#7a6653',
    foliage: ['#f6a8c0', '#f9cad9'],
  },
];

export const SPECIES_MAP: Record<string, TreeSpecies> = Object.fromEntries(
  SPECIES.map((s) => [s.id, s]),
);
