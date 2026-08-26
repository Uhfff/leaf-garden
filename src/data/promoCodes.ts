export type PromoEffect =
  | { type: 'leaves'; amount: number }
  // displayPercent lets a code understate its own strength in the UI —
  // omit it and the shown number matches the real one, as for every
  // existing luck code.
  | { type: 'luckBoost'; percent: number; displayPercent?: number; durationMs: number }
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
  { code: 'exclusive50', effect: { type: 'freeCases', caseId: 'exclusive', count: 50 } },
  {
    code: 'luck10',
    effect: { type: 'luckBoost', percent: 75, displayPercent: 10, durationMs: 15 * 60 * 1000 },
  },
  { code: 'bratbrat', effect: { type: 'trees', speciesId: 'koch_brat', count: 1 } },
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
