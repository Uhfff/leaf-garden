import { useCallback, useEffect, useRef, useState } from 'react';
import type { GameState, PlantedTree } from '../types';
import { SPECIES_MAP } from '../data/species';
import {
  costForLevels,
  earningsForTree,
  incomeRate,
  maxBoostAllocation,
  nextCost,
  REFUND_RATE,
  treeMultiplierAt,
  upgradeCost,
  UPGRADES,
  type BoostQuantity,
  type UpgradeType,
} from './economy';

const STORAGE_KEY = 'leaf-garden-save-v1';
const SAVE_INTERVAL_MS = 5000;
const OFFLINE_CAP_MS = 12 * 60 * 60 * 1000;

export const START_PLOTS = 6;
export const MAX_PLOTS = 30;
export const PLOT_BASE_COST = 200;
export const PLOT_SCALE = 2.2;

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

const GIFT_MAX = 1e15;

/** A `?gift=N` link adds N leaves to whoever opens it — a way to send a
 *  friend (or yourself, on another device) a pile of leaves without any
 *  server, since saves are purely local to each browser. */
function readGiftFromUrl(): number {
  if (typeof window === 'undefined') return 0;
  const raw = new URLSearchParams(window.location.search).get('gift');
  if (!raw) return 0;
  const value = Math.floor(Number(raw));
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.min(value, GIFT_MAX);
}

function clearGiftFromUrl() {
  const url = new URL(window.location.href);
  url.searchParams.delete('gift');
  window.history.replaceState({}, '', url.toString());
}

function loadSave(): { state: GameState; offlineEarnings: number; gift: number } {
  const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
  const gift = readGiftFromUrl();
  if (!raw) {
    const state = freshState();
    return { state: { ...state, leaves: state.leaves + gift, totalEarned: state.totalEarned + gift }, offlineEarnings: 0, gift };
  }
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
        leaves: parsed.leaves + earnings + gift,
        totalEarned: parsed.totalEarned + earnings + gift,
        lastTick: now,
      },
      offlineEarnings: earnings,
      gift,
    };
  } catch {
    const state = freshState();
    return { state: { ...state, leaves: state.leaves + gift, totalEarned: state.totalEarned + gift }, offlineEarnings: 0, gift };
  }
}

export function plotCost(currentPlots: number): number {
  return nextCost(PLOT_BASE_COST, currentPlots - START_PLOTS, PLOT_SCALE);
}

export function useGarden() {
  const initial = useRef(loadSave());
  const [game, setGame] = useState(initial.current.state);
  const [offlineEarnings] = useState(initial.current.offlineEarnings);
  const [gift] = useState(initial.current.gift);
  const [incomePerSec, setIncomePerSec] = useState(0);
  const gameRef = useRef(game);
  gameRef.current = game;

  useEffect(() => {
    if (gift > 0) clearGiftFromUrl();
  }, [gift]);

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
    const id = setInterval(tick, 500);
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

  /** Applies one upgrade to every selected tree, atomically (all or nothing). Reapplying
   *  water/fertilize to an already-buffed tree simply refreshes its duration. */
  const applyUpgrade = useCallback((type: UpgradeType, plotIndices: number[]): boolean => {
    const current = gameRef.current;
    const now = Date.now();
    const targets = plotIndices.filter((i) => current.trees[i]);
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
    return plotIndices.reduce((sum, i) => {
      const tree = current.trees[i];
      if (!tree) return sum;
      const species = SPECIES_MAP[tree.speciesId];
      return sum + upgradeCost(type, species, tree.boostLevel);
    }, 0);
  }, []);

  /**
   * Buys boost levels for every selected tree: a fixed quantity (1/10/100,
   * atomic — all trees get exactly that many or nothing happens), or 'max',
   * which spends all available leaves greedily across the whole selection.
   * Returns the levels bought and leaves spent, for the caller's toast/UI.
   */
  const applyBoost = useCallback(
    (plotIndices: number[], quantity: BoostQuantity): { levels: number; cost: number } | null => {
      const current = gameRef.current;
      const targets = plotIndices.filter((i) => current.trees[i]);
      if (targets.length === 0) return null;
      const entries = targets.map((i) => {
        const tree = current.trees[i]!;
        return { species: SPECIES_MAP[tree.speciesId], level: tree.boostLevel };
      });

      if (quantity === 'max') {
        const { levels, totalCost } = maxBoostAllocation(entries, current.leaves);
        const totalLevels = levels.reduce((a, b) => a + b, 0);
        if (totalLevels === 0) return null;
        setGame((prev) => {
          const trees = [...prev.trees];
          targets.forEach((i, idx) => {
            if (levels[idx] === 0) return;
            const tree = trees[i];
            if (!tree) return;
            const spent = costForLevels(entries[idx].species, tree.boostLevel, levels[idx]);
            trees[i] = { ...tree, boostLevel: tree.boostLevel + levels[idx], invested: tree.invested + spent };
          });
          return { ...prev, leaves: prev.leaves - totalCost, trees };
        });
        return { levels: totalLevels, cost: totalCost };
      }

      const costs = entries.map((e) => costForLevels(e.species, e.level, quantity));
      const total = costs.reduce((a, b) => a + b, 0);
      if (current.leaves < total) return null;
      setGame((prev) => {
        const trees = [...prev.trees];
        targets.forEach((i, idx) => {
          const tree = trees[i];
          if (!tree) return;
          trees[i] = { ...tree, boostLevel: tree.boostLevel + quantity, invested: tree.invested + costs[idx] };
        });
        return { ...prev, leaves: prev.leaves - total, trees };
      });
      return { levels: quantity * targets.length, cost: total };
    },
    [],
  );

  const boostCostFor = useCallback((plotIndices: number[], quantity: BoostQuantity): { cost: number; levels: number } => {
    const current = gameRef.current;
    const targets = plotIndices.filter((i) => current.trees[i]);
    const entries = targets.map((i) => {
      const tree = current.trees[i]!;
      return { species: SPECIES_MAP[tree.speciesId], level: tree.boostLevel };
    });
    if (quantity === 'max') {
      const { levels, totalCost } = maxBoostAllocation(entries, current.leaves);
      return { cost: totalCost, levels: levels.reduce((a, b) => a + b, 0) };
    }
    const cost = entries.reduce((sum, e) => sum + costForLevels(e.species, e.level, quantity), 0);
    return { cost, levels: quantity * targets.length };
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
    gift,
    plantTree,
    buyPlot,
    removeTrees,
    applyUpgrade,
    upgradeCostFor,
    applyBoost,
    boostCostFor,
    refundFor,
  };
}
