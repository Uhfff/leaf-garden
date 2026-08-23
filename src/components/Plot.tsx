import type { PlantedTree } from '../types';
import { SPECIES_MAP } from '../data/species';
import { formatLeaves, incomeRate, STAGE_NAMES, growthStage, formatDuration, treeMultiplierAt, UPGRADES } from '../game/economy';
import type { ActionType } from './SelectionToolbar';
import { TreeSprite } from './TreeSprite';
import { LeafParticles } from './LeafParticles';

interface Props {
  tree: PlantedTree | null;
  now: number;
  action: ActionType | null;
  selected: boolean;
  onClickEmpty: () => void;
  onToggleSelect: () => void;
}

export function Plot({ tree, now, action, selected, onClickEmpty, onToggleSelect }: Props) {
  const selectMode = action !== null;

  if (!tree) {
    return (
      <button className="plot plot-empty" onClick={onClickEmpty} disabled={selectMode}>
        <span className="plot-empty-icon">+</span>
        <span className="plot-empty-label">Посадить</span>
      </button>
    );
  }

  const species = SPECIES_MAP[tree.speciesId];
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
    badges.push({ key: 'boost', label: `${UPGRADES.boost.icon}${tree.boostLevel}` });
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
      type="button"
      className={`plot plot-filled ${selectMode ? 'plot-selectable' : ''} ${selected ? 'plot-selected' : ''}`}
      title={`${species.name} · ${STAGE_NAMES[stage]} · возраст ${formatDuration(ageSeconds)}`}
      onClick={selectMode ? onToggleSelect : undefined}
    >
      <LeafParticles />
      <TreeSprite species={species} ageSeconds={ageSeconds} />
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
}
