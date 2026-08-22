import { useState } from 'react';
import type { PlantedTree } from '../types';
import { SPECIES_MAP } from '../data/species';
import { formatLeaves, incomeRate, STAGE_NAMES, growthStage, formatDuration } from '../game/economy';
import { TreeSprite } from './TreeSprite';
import { LeafParticles } from './LeafParticles';

interface Props {
  tree: PlantedTree | null;
  now: number;
  onClickEmpty: () => void;
  onRemove: () => void;
}

export function Plot({ tree, now, onClickEmpty, onRemove }: Props) {
  const [confirming, setConfirming] = useState(false);

  if (!tree) {
    return (
      <button className="plot plot-empty" onClick={onClickEmpty}>
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
    <div className="plot plot-filled" title={`${species.name} · ${STAGE_NAMES[stage]} · возраст ${formatDuration(ageSeconds)}`}>
      <LeafParticles />
      <TreeSprite species={species} ageSeconds={ageSeconds} />
      <div className="plot-info">
        <span className="plot-name">{species.name}</span>
        <span className="plot-rate">+{formatLeaves(rate)}/с</span>
      </div>
      {!confirming && (
        <button className="plot-remove" title="Срубить дерево" onClick={() => setConfirming(true)}>
          ×
        </button>
      )}
      {confirming && (
        <div className="plot-confirm">
          <span>Срубить?</span>
          <div className="plot-confirm-buttons">
            <button className="plot-confirm-yes" onClick={onRemove}>Да</button>
            <button className="plot-confirm-no" onClick={() => setConfirming(false)}>Нет</button>
          </div>
        </div>
      )}
    </div>
  );
}
