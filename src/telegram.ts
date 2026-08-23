interface TelegramWebApp {
  ready: () => void;
  expand: () => void;
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  disableVerticalSwipes?: () => void;
  isExpanded: boolean;
  platform: string;
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
