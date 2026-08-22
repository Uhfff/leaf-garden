import { useCallback, useEffect, useRef, useState } from 'react';
import type { GameState, PlantedTree } from '../types';
import { SPECIES_MAP } from '../data/species';
import {
  earningsForTree,
  incomeRate,
  isUpgradeEligible,
  nextCost,
  REFUND_RATE,
  treeMultiplierAt,
  upgradeCost,
  UPGRADES,
  type UpgradeType,
} from './economy';

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

/** Fills in fields that didn't exist in older saves, so old saves keep working. */
function normalizeTree(tree: PlantedTree | null): PlantedTree | null {
  if (!tree) return null;
  return {
    ...tree,
    invested: tree.invested ?? SPECIES_MAP[tree.speciesId]?.cost ?? 0,
    waterUntil: tree.waterUntil ?? 0,
    fertilizeUntil: tree.fertilizeUntil ?? 0,
    boostLevel: tree.boostLevel ?? 0,
  };
}

function earnForTrees(trees: (PlantedTree | null)[], fromMs: number, toMs: number): number {
  let total = 0;
  for (const tree of trees) {
    if (!tree) continue;
    const species = SPECIES_MAP[tree.speciesId];
    if (!species) continue;
    total += earningsForTree(species, tree, fromMs, toMs);
  }
  return total;
}

function loadSave(): { state: GameState; offlineEarnings: number } {
  const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
  if (!raw) return { state: freshState(), offlineEarnings: 0 };
  try {
    const parsed = JSON.parse(raw) as GameState;
    const trees = parsed.trees.map(normalizeTree);
    const now = Date.now();
    const from = Math.max(parsed.lastTick, now - OFFLINE_CAP_MS);
    const earnings = earnForTrees(trees, from, now);
    return {
      state: {
        ...parsed,
        trees,
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
        return sum + incomeRate(species, (now - tree.plantedAt) / 1000, treeMultiplierAt(tree, now));
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
      trees[plotIndex] = {
        id: crypto.randomUUID(),
        speciesId,
        plantedAt: Date.now(),
        invested: cost,
        waterUntil: 0,
        fertilizeUntil: 0,
        boostLevel: 0,
      };
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

  /** Returns the amount refunded, so the caller can show it in a toast. */
  const removeTrees = useCallback((plotIndices: number[]): number => {
    const current = gameRef.current;
    const refund = plotIndices.reduce((sum, i) => {
      const tree = current.trees[i];
      return tree ? sum + Math.round(tree.invested * REFUND_RATE) : sum;
    }, 0);
    if (plotIndices.length === 0) return 0;
    setGame((prev) => {
      const trees = [...prev.trees];
      for (const index of plotIndices) trees[index] = null;
      return { ...prev, trees, leaves: prev.leaves + refund };
    });
    return refund;
  }, []);

  /** Applies one upgrade to every eligible selected tree, atomically (all or nothing). */
  const applyUpgrade = useCallback((type: UpgradeType, plotIndices: number[]): boolean => {
    const current = gameRef.current;
    const now = Date.now();
    const targets = plotIndices.filter((i) => {
      const tree = current.trees[i];
      return !!tree && isUpgradeEligible(tree, type, now);
    });
    if (targets.length === 0) return false;
    const costs = targets.map((i) => {
      const tree = current.trees[i]!;
      const species = SPECIES_MAP[tree.speciesId];
      return upgradeCost(type, species, tree.boostLevel);
    });
    const total = costs.reduce((a, b) => a + b, 0);
    if (current.leaves < total) return false;
    setGame((prev) => {
      const trees = [...prev.trees];
      targets.forEach((i, idx) => {
        const tree = trees[i];
        if (!tree) return;
        const invested = tree.invested + costs[idx];
        if (type === 'boost') {
          trees[i] = { ...tree, boostLevel: tree.boostLevel + 1, invested };
        } else if (type === 'water') {
          trees[i] = { ...tree, waterUntil: now + UPGRADES.water.durationMs!, invested };
        } else {
          trees[i] = { ...tree, fertilizeUntil: now + UPGRADES.fertilize.durationMs!, invested };
        }
      });
      return { ...prev, leaves: prev.leaves - total, trees };
    });
    return true;
  }, []);

  const upgradeCostFor = useCallback((type: UpgradeType, plotIndices: number[]): number => {
    const current = gameRef.current;
    const now = Date.now();
    return plotIndices.reduce((sum, i) => {
      const tree = current.trees[i];
      if (!tree || !isUpgradeEligible(tree, type, now)) return sum;
      const species = SPECIES_MAP[tree.speciesId];
      return sum + upgradeCost(type, species, tree.boostLevel);
    }, 0);
  }, []);

  const refundFor = useCallback((plotIndices: number[]): number => {
    const current = gameRef.current;
    return plotIndices.reduce((sum, i) => {
      const tree = current.trees[i];
      return tree ? sum + Math.round(tree.invested * REFUND_RATE) : sum;
    }, 0);
  }, []);

  return {
    game,
    incomePerSec,
    offlineEarnings,
    plantTree,
    buyPlot,
    removeTrees,
    applyUpgrade,
    upgradeCostFor,
    refundFor,
  };
}
