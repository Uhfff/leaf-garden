import { useCallback, useEffect, useRef, useState } from 'react';
import type { GameState, PlantedTree } from '../types';
import { ALL_SPECIES_MAP } from '../data/allSpecies';
import { CASE_MAP, rollCaseSpecies } from '../data/cases';
import { findPromoCode, normalizePromoCode, type PromoEffect } from '../data/promoCodes';
import { reportStats } from '../telegram';
import {
  costForLevels,
  earningsForTree,
  formatLeaves,
  incomeRate,
  levelsWithinCap,
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
// Each report is a KV write on the bot's side, and Cloudflare's free tier
// only allows 1,000 writes/day total across every player combined — a
// handful of people with the game open for a while at 60s each blew
// through half the day's quota. 10 minutes keeps the bot's /stats numbers
// reasonably fresh without risking the whole KV store (referrals, promo
// codes, broadcast all share it) going down for the rest of the day.
const STATS_INTERVAL_MS = 10 * 60_000;
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
    inventory: {},
    luckBoostUntil: 0,
    luckBoostPercent: 0,
    freeCaseCharges: {},
  };
}

/** Fills in fields that didn't exist in older saves, so old saves keep working. */
function normalizeTree(tree: PlantedTree | null): PlantedTree | null {
  if (!tree) return null;
  return {
    ...tree,
    invested: tree.invested ?? ALL_SPECIES_MAP[tree.speciesId]?.cost ?? 0,
    waterUntil: tree.waterUntil ?? 0,
    fertilizeUntil: tree.fertilizeUntil ?? 0,
    boostLevel: tree.boostLevel ?? 0,
  };
}

function earnForTrees(trees: (PlantedTree | null)[], fromMs: number, toMs: number): number {
  let total = 0;
  for (const tree of trees) {
    if (!tree) continue;
    const species = ALL_SPECIES_MAP[tree.speciesId];
    if (!species) continue;
    total += earningsForTree(species, tree, fromMs, toMs);
  }
  return total;
}

const GIFT_MAX = 1e15;
const USED_VOUCHERS_KEY = 'leaf-garden-used-vouchers';
const REFERRAL_BONUS = 5_000_000_000_000;

/** Applies any promo effect to a GameState — shared by the `?gift=` link
 *  path and the in-game code-entry modal, so a code pays out identically
 *  no matter which way it's redeemed. */
function applyPromoEffect(state: GameState, effect: PromoEffect): GameState {
  if (effect.type === 'leaves') {
    return { ...state, leaves: state.leaves + effect.amount, totalEarned: state.totalEarned + effect.amount };
  }
  if (effect.type === 'luckBoost') {
    // A currently-active, stronger boost isn't downgraded by a weaker code —
    // but its duration still extends either way.
    const currentPercent = state.luckBoostUntil > Date.now() ? state.luckBoostPercent : 0;
    return {
      ...state,
      luckBoostUntil: Math.max(state.luckBoostUntil, Date.now() + effect.durationMs),
      luckBoostPercent: Math.max(currentPercent, effect.percent),
    };
  }
  if (effect.type === 'freeCases') {
    return {
      ...state,
      freeCaseCharges: {
        ...state.freeCaseCharges,
        [effect.caseId]: (state.freeCaseCharges[effect.caseId] ?? 0) + effect.count,
      },
    };
  }
  return {
    ...state,
    inventory: {
      ...state.inventory,
      [effect.speciesId]: (state.inventory[effect.speciesId] ?? 0) + effect.count,
    },
  };
}

function describePromoEffect(effect: PromoEffect): string {
  if (effect.type === 'leaves') return `Начислено ${formatLeaves(effect.amount)} 🍃`;
  if (effect.type === 'luckBoost') {
    const days = Math.round(effect.durationMs / (24 * 60 * 60 * 1000));
    return `Удача на редкие деревья +${effect.percent}% активна на ${days} дн.!`;
  }
  if (effect.type === 'freeCases') {
    const caseName = CASE_MAP[effect.caseId]?.name ?? effect.caseId;
    return `Начислено ${effect.count} бесплатных открытий: ${caseName}`;
  }
  const speciesName = ALL_SPECIES_MAP[effect.speciesId]?.name ?? effect.speciesId;
  return `Начислено ${effect.count} × ${speciesName} в инвентарь`;
}

/** A `?gift=N` link applies N leaves to whoever opens it — a way to send a
 *  friend (or yourself, on another device) a pile of leaves without any
 *  server, since saves are purely local to each browser. The raw string is
 *  also the voucher's identity: once redeemed in a browser, that exact code
 *  won't pay out again there, so re-opening a saved/bookmarked link is a
 *  no-op instead of free leaves every time.
 *
 *  `?gift=` also accepts a named promo code (e.g. from the bot's chat
 *  reply) instead of a raw number, for any promo effect — resolved through
 *  the same promo table and filed under the same `promo:` key the in-game
 *  code-entry modal uses, so redeeming a code via the bot link and via
 *  typing it in-game are the same redemption, not two.
 *
 *  `?gift=ref:<referrerId>:<newUserId>` is how the bot pays out a referral
 *  bonus: the pair of Telegram ids makes each referral its own voucher, so
 *  a referrer inviting several friends gets paid for each of them, while
 *  the same friend's link can't be replayed for a second bonus. */
function readVoucherFromUrl(): { code: string; effect: PromoEffect } | null {
  if (typeof window === 'undefined') return null;
  const raw = new URLSearchParams(window.location.search).get('gift');
  if (!raw) return null;
  if (/^\d+$/.test(raw.trim())) {
    const value = Math.floor(Number(raw));
    if (!Number.isFinite(value) || value <= 0) return null;
    return { code: raw, effect: { type: 'leaves', amount: Math.min(value, GIFT_MAX) } };
  }
  if (/^ref:\d+:\d+$/.test(raw.trim())) {
    return { code: raw, effect: { type: 'leaves', amount: REFERRAL_BONUS } };
  }
  const promo = findPromoCode(raw);
  if (!promo) return null;
  return { code: `promo:${normalizePromoCode(raw)}`, effect: promo.effect };
}

function isVoucherUsed(code: string): boolean {
  try {
    const raw = localStorage.getItem(USED_VOUCHERS_KEY);
    const used: string[] = raw ? JSON.parse(raw) : [];
    return used.includes(code);
  } catch {
    return false;
  }
}

function markVoucherUsed(code: string) {
  try {
    const raw = localStorage.getItem(USED_VOUCHERS_KEY);
    const used: string[] = raw ? JSON.parse(raw) : [];
    if (!used.includes(code)) localStorage.setItem(USED_VOUCHERS_KEY, JSON.stringify([...used, code]));
  } catch {
    /* storage unavailable — voucher just won't be remembered as used */
  }
}

function clearGiftFromUrl() {
  const url = new URL(window.location.href);
  url.searchParams.delete('gift');
  window.history.replaceState({}, '', url.toString());
}

function loadSave(): {
  state: GameState;
  offlineEarnings: number;
  giftMessage: string | null;
  giftCode: string | null;
} {
  const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
  const voucher = readVoucherFromUrl();
  const giftCode = voucher ? voucher.code : null;
  const applyGift = !!voucher && !isVoucherUsed(voucher.code);
  const giftMessage = applyGift ? describePromoEffect(voucher!.effect) : null;
  const finalize = (state: GameState): GameState =>
    applyGift ? applyPromoEffect(state, voucher!.effect) : state;

  if (!raw) {
    return { state: finalize(freshState()), offlineEarnings: 0, giftMessage, giftCode };
  }
  try {
    const parsed = JSON.parse(raw) as GameState;
    const trees = parsed.trees.map(normalizeTree);
    const now = Date.now();
    const from = Math.max(parsed.lastTick, now - OFFLINE_CAP_MS);
    const earnings = earnForTrees(trees, from, now);
    const state: GameState = {
      ...parsed,
      trees,
      inventory: parsed.inventory ?? {},
      luckBoostUntil: parsed.luckBoostUntil ?? 0,
      // Older saves could have an active boost with no stored percent — 35
      // was the only strength that ever existed before per-code percents.
      luckBoostPercent: parsed.luckBoostPercent ?? 35,
      freeCaseCharges: parsed.freeCaseCharges ?? {},
      leaves: parsed.leaves + earnings,
      totalEarned: parsed.totalEarned + earnings,
      lastTick: now,
    };
    return { state: finalize(state), offlineEarnings: earnings, giftMessage, giftCode };
  } catch {
    return { state: finalize(freshState()), offlineEarnings: 0, giftMessage, giftCode };
  }
}

export type PromoRedeemResult = { ok: true; message: string } | { ok: false; reason: 'used' | 'invalid' };

export function plotCost(currentPlots: number): number {
  return nextCost(PLOT_BASE_COST, currentPlots - START_PLOTS, PLOT_SCALE);
}

export function useGarden() {
  const initial = useRef(loadSave());
  const [game, setGame] = useState(initial.current.state);
  const [offlineEarnings] = useState(initial.current.offlineEarnings);
  const [giftMessage] = useState(initial.current.giftMessage);
  const [giftCode] = useState(initial.current.giftCode);
  const [incomePerSec, setIncomePerSec] = useState(0);
  const gameRef = useRef(game);
  gameRef.current = game;
  const incomePerSecRef = useRef(0);

  useEffect(() => {
    if (!giftCode) return;
    if (giftMessage) markVoucherUsed(giftCode);
    clearGiftFromUrl();
  }, [giftMessage, giftCode]);

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
        const species = ALL_SPECIES_MAP[tree.speciesId];
        if (!species) return sum;
        return sum + incomeRate(species, (now - tree.plantedAt) / 1000, treeMultiplierAt(tree, now));
      }, 0);
      incomePerSecRef.current = rate;
      setIncomePerSec(rate);
    };

    // A backgrounded tab or minimized Mini App can keep its timers running
    // for a long time (Telegram's WebView especially) — ticking every
    // second forever, screen off or not, is real battery drain for no
    // visible benefit. earnForTrees integrates over any elapsed gap
    // exactly, so pausing here loses nothing: resuming just runs one tick
    // covering however long the app was hidden, same as a normal offline
    // catch-up.
    let id: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (id !== null) return;
      tick();
      id = setInterval(tick, 1000);
    };
    const stop = () => {
      if (id === null) return;
      clearInterval(id);
      id = null;
    };
    const handleVisibility = () => (document.hidden ? stop() : start());

    start();
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  useEffect(() => {
    const report = () => {
      if (document.hidden) return;
      const current = gameRef.current;
      reportStats({
        leaves: current.leaves,
        totalEarned: current.totalEarned,
        incomePerSec: incomePerSecRef.current,
        trees: current.trees.filter((t): t is PlantedTree => t !== null).map((t) => t.speciesId),
      });
    };
    report();
    const id = setInterval(report, STATS_INTERVAL_MS);
    document.addEventListener('visibilitychange', report);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', report);
    };
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

  /** Plants a tree. A free copy in inventory (won from a case) is used first —
   *  and bypasses the species' normal unlock requirement, same as winning it
   *  did — otherwise it's bought normally at the usual scaling cost. */
  const plantTree = useCallback((plotIndex: number, speciesId: string) => {
    setGame((prev) => {
      if (prev.trees[plotIndex]) return prev;
      const species = ALL_SPECIES_MAP[speciesId];
      if (!species) return prev;
      const free = prev.inventory[speciesId] ?? 0;
      let cost = 0;
      let inventory = prev.inventory;
      if (free > 0) {
        inventory = { ...prev.inventory, [speciesId]: free - 1 };
      } else {
        if (prev.totalEarned < species.unlockAt) return prev;
        const owned = prev.trees.filter((t) => t?.speciesId === speciesId).length;
        cost = nextCost(species.cost, owned);
        if (prev.leaves < cost) return prev;
      }
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
      return { ...prev, leaves: prev.leaves - cost, trees, inventory };
    });
  }, []);

  /** Opens a case: rolls a random species (independent of that species'
   *  normal unlock requirement — that's the appeal of a lucky pull) and
   *  banks it in the inventory as a free tree, ready to plant whenever a
   *  plot opens up. A banked free-case charge is spent before leaves are
   *  ever charged, and an active luck boost applies to the actual roll —
   *  not just the odds display — so it isn't just cosmetic. */
  const openCase = useCallback((caseId: string): { speciesId: string; speciesName: string } | null => {
    const current = gameRef.current;
    const caseDef = CASE_MAP[caseId];
    if (!caseDef) return null;
    const freeAvailable = current.freeCaseCharges[caseId] ?? 0;
    const usingFree = freeAvailable > 0;
    if (!usingFree && current.leaves < caseDef.cost) return null;
    const boostPercent = current.luckBoostUntil > Date.now() ? current.luckBoostPercent : 0;
    const species = rollCaseSpecies(caseDef, boostPercent);
    setGame((prev) => ({
      ...prev,
      leaves: usingFree ? prev.leaves : prev.leaves - caseDef.cost,
      freeCaseCharges: usingFree
        ? { ...prev.freeCaseCharges, [caseId]: (prev.freeCaseCharges[caseId] ?? 0) - 1 }
        : prev.freeCaseCharges,
      inventory: { ...prev.inventory, [species.id]: (prev.inventory[species.id] ?? 0) + 1 },
    }));
    return { speciesId: species.id, speciesName: species.name };
  }, []);

  /** Sells one free (case-won) tree straight out of inventory, without
   *  ever planting it. Returns the payout. */
  const sellInventoryTree = useCallback((speciesId: string): number | null => {
    const current = gameRef.current;
    const have = current.inventory[speciesId] ?? 0;
    const species = ALL_SPECIES_MAP[speciesId];
    if (have <= 0 || !species) return null;
    const payout = species.sellPrice ?? species.cost;
    setGame((prev) => ({
      ...prev,
      leaves: prev.leaves + payout,
      inventory: { ...prev.inventory, [speciesId]: (prev.inventory[speciesId] ?? 0) - 1 },
    }));
    return payout;
  }, []);

  /** Promo codes reuse the exact same one-per-browser used-code ledger as
   *  gift links, just under a "promo:" prefix so a numeric gift code and an
   *  alphabetic promo code can never collide. */
  const redeemPromoCode = useCallback((rawCode: string): PromoRedeemResult => {
    const promo = findPromoCode(rawCode);
    if (!promo) return { ok: false, reason: 'invalid' };
    const key = `promo:${normalizePromoCode(rawCode)}`;
    if (isVoucherUsed(key)) return { ok: false, reason: 'used' };
    markVoucherUsed(key);
    setGame((prev) => applyPromoEffect(prev, promo.effect));
    return { ok: true, message: describePromoEffect(promo.effect) };
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
      const species = ALL_SPECIES_MAP[tree.speciesId];
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
      const species = ALL_SPECIES_MAP[tree.speciesId];
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
        return { species: ALL_SPECIES_MAP[tree.speciesId], level: tree.boostLevel };
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

      const grantedLevels = entries.map((e) => levelsWithinCap(e.level, quantity));
      const costs = entries.map((e, idx) => costForLevels(e.species, e.level, grantedLevels[idx]));
      const total = costs.reduce((a, b) => a + b, 0);
      const totalLevels = grantedLevels.reduce((a, b) => a + b, 0);
      if (totalLevels === 0 || current.leaves < total) return null;
      setGame((prev) => {
        const trees = [...prev.trees];
        targets.forEach((i, idx) => {
          const tree = trees[i];
          if (!tree || grantedLevels[idx] === 0) return;
          trees[i] = { ...tree, boostLevel: tree.boostLevel + grantedLevels[idx], invested: tree.invested + costs[idx] };
        });
        return { ...prev, leaves: prev.leaves - total, trees };
      });
      return { levels: totalLevels, cost: total };
    },
    [],
  );

  const boostCostFor = useCallback((plotIndices: number[], quantity: BoostQuantity): { cost: number; levels: number } => {
    const current = gameRef.current;
    const targets = plotIndices.filter((i) => current.trees[i]);
    const entries = targets.map((i) => {
      const tree = current.trees[i]!;
      return { species: ALL_SPECIES_MAP[tree.speciesId], level: tree.boostLevel };
    });
    if (quantity === 'max') {
      const { levels, totalCost } = maxBoostAllocation(entries, current.leaves);
      return { cost: totalCost, levels: levels.reduce((a, b) => a + b, 0) };
    }
    const cost = entries.reduce((sum, e) => sum + costForLevels(e.species, e.level, quantity), 0);
    const levels = entries.reduce((sum, e) => sum + levelsWithinCap(e.level, quantity), 0);
    return { cost, levels };
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
    giftMessage,
    plantTree,
    openCase,
    sellInventoryTree,
    redeemPromoCode,
    buyPlot,
    removeTrees,
    applyUpgrade,
    upgradeCostFor,
    applyBoost,
    boostCostFor,
    refundFor,
  };
}
