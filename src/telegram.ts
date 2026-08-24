interface TelegramWebApp {
  ready: () => void;
  expand: () => void;
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  disableVerticalSwipes?: () => void;
  isExpanded: boolean;
  platform: string;
  initDataUnsafe?: { user?: { id: number } };
}

// A staging build points this at the test bot via VITE_BOT_USERNAME, so the
// invite link generated in that build matches the bot it'll actually be
// tested against instead of the live one.
export const BOT_USERNAME = import.meta.env.VITE_BOT_USERNAME || 'LeafSimulatorBot';

/** The Telegram user id behind this session, or null when the game is
 *  opened outside Telegram (a plain browser tab has no such identity) — the
 *  referral link is only meaningful inside the Mini App, since it's built
 *  from this id. */
export function getTelegramUserId(): number | null {
  return window.Telegram?.WebApp?.initDataUnsafe?.user?.id ?? null;
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

const APP_BG = '#060b14';

/** No-ops outside Telegram (e.g. the plain GitHub Pages URL in a normal
 *  browser), so the game works identically whether it's opened as a
 *  Telegram Mini App or as a regular website. */
export function initTelegram(): void {
  const webApp = window.Telegram?.WebApp;
  if (!webApp) return;

  webApp.ready();
  webApp.expand();
  webApp.setHeaderColor(APP_BG);
  webApp.setBackgroundColor(APP_BG);
  webApp.disableVerticalSwipes?.();
}
