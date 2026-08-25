import { forwardRef, memo } from 'react';
import type { PlantedTree } from '../types';
import { ALL_SPECIES_MAP } from '../data/allSpecies';
import { formatLeaves, incomeRate, STAGE_NAMES, growthStage, formatDuration, treeMultiplierAt, UPGRADES, MAX_BOOST_LEVEL } from '../game/economy';
import type { ActionType } from './SelectionToolbar';
import { TreeSprite } from './TreeSprite';

interface Props {
  tree: PlantedTree | null;
  now: number;
  // Whether this plot is currently on-screen (IntersectionObserver, see
  // Garden). A scrolled-off plot still owns state, but nobody is watching
  // its rate tick up or its tree sway — so it skips both.
  visible: boolean;
  action: ActionType | null;
  selected: boolean;
  onClickEmpty: () => void;
  onToggleSelect: () => void;
}

const PlotImpl = forwardRef<HTMLButtonElement, Props>(function PlotImpl(
  { tree, now, visible, action, selected, onClickEmpty, onToggleSelect },
  ref,
) {
  const selectMode = action !== null;

  if (!tree) {
    return (
      <button ref={ref} className="plot plot-empty" onClick={onClickEmpty} disabled={selectMode}>
        <span className="plot-empty-icon">+</span>
        <span className="plot-empty-label">Посадить</span>
      </button>
    );
  }

  const species = ALL_SPECIES_MAP[tree.speciesId];
  const ageSeconds = (now - tree.plantedAt) / 1000;
  const rate = incomeRate(species, ageSeconds, treeMultiplierAt(tree, now));
  const stage = growthStage(ageSeconds);

  const badges: { key: string; label: string }[] = [];
  if (tree.waterUntil > now) {
    badges.push({ key: 'water', label: `${UPGRADES.water.icon} ${formatDuration((tree.waterUntil - now) / 1000)}` });
  }
  if (tree.fertilizeUntil > now) {
    badges.push({
      key: 'fertilize',
      label: `${UPGRADES.fertilize.icon} ${formatDuration((tree.fertilizeUntil - now) / 1000)}`,
    });
  }
  if (tree.boostLevel > 0) {
    const maxed = tree.boostLevel >= MAX_BOOST_LEVEL;
    badges.push({ key: 'boost', label: `${UPGRADES.boost.icon}${tree.boostLevel}${maxed ? ' MAX' : ''}` });
  }

  // Outside select mode, show every badge. While picking trees to water/fertilize,
  // show only that buff's remaining time — it's the number relevant to the decision
  // of whether to refresh an already-active tree. Other select modes show none.
  const visibleBadges = !selectMode
    ? badges
    : action === 'water' || action === 'fertilize'
      ? badges.filter((b) => b.key === action)
      : [];

  return (
    <button
      ref={ref}
      type="button"
      className={`plot plot-filled ${visible ? '' : 'plot-offscreen'} ${
        selectMode ? `plot-selectable plot-action-${action}` : ''
      } ${selected ? 'plot-selected' : ''}`}
      title={`${species.name} · ${STAGE_NAMES[stage]} · возраст ${formatDuration(ageSeconds)}`}
      onClick={selectMode ? onToggleSelect : undefined}
    >
      <TreeSprite species={species} stage={stage} />
      <div className="plot-info">
        <span className="plot-name">{species.name}</span>
        <span className="plot-rate">+{formatLeaves(rate)}/с</span>
        {visibleBadges.length > 0 && (
          <span className="plot-badges">
            {visibleBadges.map((b) => (
              <span key={b.key} className="plot-badge">
                {b.label}
              </span>
            ))}
          </span>
        )}
      </div>
      {selectMode && <span className={`plot-checkbox ${selected ? 'checked' : ''}`}>{selected ? '✓' : ''}</span>}
    </button>
  );
});

// An empty plot never reads `now` — nothing there ages, so it never needs
// to re-render for a tick. A filled plot off-screen (scrolled out of view,
// or behind a modal — see `visible`) does age, but nobody's watching its
// rate count up, so it skips ticks too until it's back in view. Only a
// structural change (planting, watering, boosting — a new `tree` object)
// or an actual visibility change forces it to catch up.
export const Plot = memo(PlotImpl, (prev, next) => {
  if (prev.tree !== next.tree) return false;
  if (prev.action !== next.action || prev.selected !== next.selected) return false;
  if (prev.tree === null) return true;
  if (!prev.visible && !next.visible) return true;
  return prev.now === next.now && prev.visible === next.visible;
});
