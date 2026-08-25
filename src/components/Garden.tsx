import { useCallback, useEffect, useRef, useState } from 'react';
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
  // Tracks which plots are actually scrolled into view, so Plot can skip
  // both its per-second re-render and its tree's CSS animation for the
  // rest that the player can't currently see (see the plot-offscreen rule
  // in App.css and the comparator on Plot).
  const [visible, setVisible] = useState<Set<number>>(() => new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const indexByNode = useRef(new Map<Element, number>());
  const plotRefs = useRef(new Map<number, (node: HTMLButtonElement | null) => void>());

  const getObserver = () => {
    if (!observerRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          setVisible((prev) => {
            let changed = false;
            const next = new Set(prev);
            for (const entry of entries) {
              const index = indexByNode.current.get(entry.target);
              if (index === undefined) continue;
              if (entry.isIntersecting) {
                if (!next.has(index)) {
                  next.add(index);
                  changed = true;
                }
              } else if (next.has(index)) {
                next.delete(index);
                changed = true;
              }
            }
            return changed ? next : prev;
          });
        },
        // A little slack above/below the viewport so a plot's rate and
        // animation resume just before it's scrolled fully into view,
        // not one frame after.
        { rootMargin: '200px 0px' },
      );
    }
    return observerRef.current;
  };

  useEffect(() => () => observerRef.current?.disconnect(), []);

  // One stable ref-callback per plot index, cached so Plot's DOM node is
  // observed/unobserved exactly once across mount/unmount — not on every
  // tick's re-render, which would defeat the point.
  const getPlotRef = useCallback((index: number) => {
    let fn = plotRefs.current.get(index);
    if (!fn) {
      fn = (node: HTMLButtonElement | null) => {
        const observer = getObserver();
        if (node) {
          indexByNode.current.set(node, index);
          observer.observe(node);
        } else {
          for (const [el, i] of indexByNode.current) {
            if (i === index) {
              indexByNode.current.delete(el);
              observer.unobserve(el);
              break;
            }
          }
        }
      };
      plotRefs.current.set(index, fn);
    }
    return fn;
  }, []);

  return (
    <div className="garden-grid">
      {trees.map((tree, i) => (
        <Plot
          key={tree ? tree.id : `empty-${i}`}
          ref={getPlotRef(i)}
          tree={tree}
          now={now}
          visible={visible.has(i)}
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
