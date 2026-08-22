import type { PlantedTree } from '../types';
import { SPECIES_MAP } from '../data/species';
import { formatLeaves, incomeRate, STAGE_NAMES, growthStage, formatDuration } from '../game/economy';
import { TreeSprite } from './TreeSprite';
import { LeafParticles } from './LeafParticles';

interface Props {
  tree: PlantedTree | null;
  now: number;
  selectMode: boolean;
  selected: boolean;
  onClickEmpty: () => void;
  onToggleSelect: () => void;
}

export function Plot({ tree, now, selectMode, selected, onClickEmpty, onToggleSelect }: Props) {
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
  const rate = incomeRate(species, ageSeconds);
  const stage = growthStage(ageSeconds);

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
      </div>
      {selectMode && <span className={`plot-checkbox ${selected ? 'checked' : ''}`}>{selected ? '✓' : ''}</span>}
    </button>
  );
}
