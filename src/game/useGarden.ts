import { useCallback, useEffect, useRef, useState } from 'react';
import type { GameState, PlantedTree } from '../types';
import { SPECIES_MAP } from '../data/species';
import { earningsBetween, incomeRate, nextCost } from './economy';

const STORAGE_KEY = 'leaf-garden-save-v1';
const SAVE_INTERVAL_MS = 5000;
const OFFLINE_CAP_MS = 12 * 60 * 60 * 1000;

export const START_PLOTS = 6;
export const MAX_PLOTS = 15;
export const PLOT_BASE_COST = 200;
export const PLOT_SCALE = 1.8;

function freshState(): GameState {
  return {
    leaves: 20,
    totalEarned: 20,
    plots: START_PLOTS,
    trees: Array(START_PLOTS).fill(null),
    lastTick: Date.now(),
  };
}

function earnForTrees(trees: (PlantedTree | null)[], fromMs: number, toMs: number): number {
  let total = 0;
  for (const tree of trees) {
    if (!tree) continue;
    const species = SPECIES_MAP[tree.speciesId];
    if (!species) continue;
    const ageStart = (fromMs - tree.plantedAt) / 1000;
    const ageEnd = (toMs - tree.plantedAt) / 1000;
    total += earningsBetween(species, ageStart, ageEnd);
  }
  return total;
}

function loadSave(): { state: GameState; offlineEarnings: number } {
  const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
  if (!raw) return { state: freshState(), offlineEarnings: 0 };
  try {
    const parsed = JSON.parse(raw) as GameState;
    const now = Date.now();
    const from = Math.max(parsed.lastTick, now - OFFLINE_CAP_MS);
    const earnings = earnForTrees(parsed.trees, from, now);
    return {
      state: {
        ...parsed,
        leaves: parsed.leaves + earnings,
        totalEarned: parsed.totalEarned + earnings,
        lastTick: now,
      },
      offlineEarnings: earnings,
    };
  } catch {
    return { state: freshState(), offlineEarnings: 0 };
  }
}

export function plotCost(currentPlots: number): number {
  return nextCost(PLOT_BASE_COST, currentPlots - START_PLOTS, PLOT_SCALE);
}

export function useGarden() {
  const initial = useRef(loadSave());
  const [game, setGame] = useState(initial.current.state);
  const [offlineEarnings] = useState(initial.current.offlineEarnings);
  const [incomePerSec, setIncomePerSec] = useState(0);
  const gameRef = useRef(game);
  gameRef.current = game;

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      setGame((prev) => {
        const gained = earnForTrees(prev.trees, prev.lastTick, now);
        return gained === 0 && prev.lastTick === now
          ? prev
          : { ...prev, leaves: prev.leaves + gained, totalEarned: prev.totalEarned + gained, lastTick: now };
      });
      const rate = gameRef.current.trees.reduce((sum, tree) => {
        if (!tree) return sum;
        const species = SPECIES_MAP[tree.speciesId];
        if (!species) return sum;
        return sum + incomeRate(species, (now - tree.plantedAt) / 1000);
      }, 0);
      setIncomePerSec(rate);
    };
    tick();
    const id = setInterval(tick, 200);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const save = () => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(gameRef.current));
      } catch {
        /* storage unavailable — progress just won't persist */
      }
    };
    const interval = setInterval(save, SAVE_INTERVAL_MS);
    window.addEventListener('beforeunload', save);
    document.addEventListener('visibilitychange', save);
    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', save);
      document.removeEventListener('visibilitychange', save);
      save();
    };
  }, []);

  const plantTree = useCallback((plotIndex: number, speciesId: string) => {
    setGame((prev) => {
      if (prev.trees[plotIndex]) return prev;
      const species = SPECIES_MAP[speciesId];
      if (!species || prev.totalEarned < species.unlockAt) return prev;
      const owned = prev.trees.filter((t) => t?.speciesId === speciesId).length;
      const cost = nextCost(species.cost, owned);
      if (prev.leaves < cost) return prev;
      const trees = [...prev.trees];
      trees[plotIndex] = { id: crypto.randomUUID(), speciesId, plantedAt: Date.now() };
      return { ...prev, leaves: prev.leaves - cost, trees };
    });
  }, []);

  const buyPlot = useCallback(() => {
    setGame((prev) => {
      if (prev.plots >= MAX_PLOTS) return prev;
      const cost = plotCost(prev.plots);
      if (prev.leaves < cost) return prev;
      return { ...prev, leaves: prev.leaves - cost, plots: prev.plots + 1, trees: [...prev.trees, null] };
    });
  }, []);

  const removeTrees = useCallback((plotIndices: number[]) => {
    setGame((prev) => {
      if (plotIndices.length === 0) return prev;
      const trees = [...prev.trees];
      for (const index of plotIndices) trees[index] = null;
      return { ...prev, trees };
    });
  }, []);

  return { game, incomePerSec, offlineEarnings, plantTree, buyPlot, removeTrees };
}
