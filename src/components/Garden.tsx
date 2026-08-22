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
  onRemove: (index: number) => void;
}

export function Garden({ trees, now, plots, maxPlots, expandCost, leaves, onClickEmpty, onExpand, onRemove }: Props) {
  return (
    <div className="garden-grid">
      {trees.map((tree, i) => (
        <Plot
          key={tree ? tree.id : `empty-${i}`}
          tree={tree}
          now={now}
          onClickEmpty={() => onClickEmpty(i)}
          onRemove={() => onRemove(i)}
        />
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
