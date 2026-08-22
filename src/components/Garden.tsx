import type { PlantedTree } from '../types';
import { Plot } from './Plot';
import type { ActionType } from './SelectionToolbar';
import { formatLeaves } from '../game/economy';

interface Props {
  trees: (PlantedTree | null)[];
  now: number;
  plots: number;
  maxPlots: number;
  expandCost: number;
  leaves: number;
  action: ActionType | null;
  selected: Set<number>;
  onClickEmpty: (index: number) => void;
  onExpand: () => void;
  onToggleSelect: (index: number) => void;
}

export function Garden({
  trees,
  now,
  plots,
  maxPlots,
  expandCost,
  leaves,
  action,
  selected,
  onClickEmpty,
  onExpand,
  onToggleSelect,
}: Props) {
  return (
    <div className="garden-grid">
      {trees.map((tree, i) => (
        <Plot
          key={tree ? tree.id : `empty-${i}`}
          tree={tree}
          now={now}
          action={action}
          selected={selected.has(i)}
          onClickEmpty={() => onClickEmpty(i)}
          onToggleSelect={() => onToggleSelect(i)}
        />
      ))}
      {plots < maxPlots && (
        <button className="plot plot-expand" disabled={leaves < expandCost || action !== null} onClick={onExpand}>
          <span className="plot-empty-icon">🌱</span>
          <span className="plot-empty-label">Новый участок</span>
          <span className="plot-expand-cost">{formatLeaves(expandCost)} 🍃</span>
        </button>
      )}
    </div>
  );
}
