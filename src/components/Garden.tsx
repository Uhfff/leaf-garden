import type { PlantedTree } from '../types';
import { Plot } from './Plot';
import { formatLeaves } from '../game/economy';

interface Props {
  trees: (PlantedTree | null)[];
  now: number;
  plots: number;
  maxPlots: number;
  expandCost: number;
  leaves: number;
  onClickEmpty: (index: number) => void;
  onExpand: () => void;
}

export function Garden({ trees, now, plots, maxPlots, expandCost, leaves, onClickEmpty, onExpand }: Props) {
  return (
    <div className="garden-grid">
      {trees.map((tree, i) => (
        <Plot key={i} tree={tree} now={now} onClickEmpty={() => onClickEmpty(i)} />
      ))}
      {plots < maxPlots && (
        <button className="plot plot-expand" disabled={leaves < expandCost} onClick={onExpand}>
          <span className="plot-empty-icon">🌱</span>
          <span className="plot-empty-label">Новый участок</span>
          <span className="plot-expand-cost">{formatLeaves(expandCost)} 🍃</span>
        </button>
      )}
    </div>
  );
}
