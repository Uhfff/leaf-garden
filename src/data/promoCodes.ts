export type PromoEffect =
  | { type: 'leaves'; amount: number }
  | { type: 'luckBoost'; percent: number; durationMs: number }
  | { type: 'freeCases'; caseId: string; count: number }
  | { type: 'trees'; speciesId: string; count: number };

export interface PromoCode {
  /** Normalized (trimmed, lowercased) — matching is case-insensitive. */
  code: string;
  effect: PromoEffect;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export const PROMO_CODES: PromoCode[] = [
  { code: 'luck35', effect: { type: 'luckBoost', percent: 35, durationMs: 2 * DAY_MS } },
  { code: 'newcases', effect: { type: 'freeCases', caseId: 'common', count: 50 } },
  { code: 'tree67x3', effect: { type: 'trees', speciesId: 'six_seven', count: 3 } },
  { code: 'luck67', effect: { type: 'luckBoost', percent: 67, durationMs: 2 * DAY_MS } },
];

export function normalizePromoCode(input: string): string {
  return input.trim().toLowerCase();
}

export function findPromoCode(input: string): PromoCode | null {
  const code = normalizePromoCode(input);
  return PROMO_CODES.find((p) => p.code === code) ?? null;
}
