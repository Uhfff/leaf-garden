import { formatLeaves } from '../game/economy';

interface Props {
  leaves: number;
  incomePerSec: number;
}

export function HUD({ leaves, incomePerSec }: Props) {
  return (
    <header className="hud">
      <div className="hud-title">
        <span className="hud-emoji">🌳</span>
        <h1>Листопад</h1>
      </div>
      <div className="hud-stats">
        <div className="hud-stat">
          <span className="hud-value">{formatLeaves(leaves)} 🍃</span>
          <span className="hud-label">листьев</span>
        </div>
        <div className="hud-stat">
          <span className="hud-value">+{formatLeaves(incomePerSec)}/с</span>
          <span className="hud-label">доход</span>
        </div>
      </div>
    </header>
  );
}
