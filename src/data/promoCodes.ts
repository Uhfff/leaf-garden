export interface PromoCode {
  /** Normalized (trimmed, lowercased) — matching is case-insensitive. */
  code: string;
  amount: number;
}

export const PROMO_CODES: PromoCode[] = [
  { code: 'kirillpodor2t', amount: 2_000_000_000_000 },
];

export function normalizePromoCode(input: string): string {
  return input.trim().toLowerCase();
}

export function findPromoCode(input: string): PromoCode | null {
  const code = normalizePromoCode(input);
  return PROMO_CODES.find((p) => p.code === code) ?? null;
}
