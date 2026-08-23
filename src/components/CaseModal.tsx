import { useState } from 'react';
import { CASES, dropChance } from '../data/cases';
import { SPECIES_MAP } from '../data/species';
import { formatLeaves } from '../game/economy';
import { TreeSprite } from './TreeSprite';

interface Props {
  leaves: number;
  hasEmptyPlot: boolean;
  onOpen: (caseId: string) => { speciesName: string } | null;
  onClose: () => void;
}

export function CaseModal({ leaves, hasEmptyPlot, onOpen, onClose }: Props) {
  const caseDef = CASES[0];
  const [revealing, setRevealing] = useState(false);
  const [won, setWon] = useState<string | null>(null);

  const canAfford = leaves >= caseDef.cost;
  const canOpen = canAfford && hasEmptyPlot && !revealing;

  const handleOpen = () => {
    if (!canOpen) return;
    setRevealing(true);
    setWon(null);
    setTimeout(() => {
      const result = onOpen(caseDef.id);
      setRevealing(false);
      setWon(result ? result.speciesName : null);
    }, 700);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{caseDef.icon} {caseDef.name}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Закрыть">×</button>
        </div>

        <div className={`case-box ${revealing ? 'case-shaking' : ''}`}>
          <span className="case-box-icon">{caseDef.icon}</span>
        </div>

        {won && !revealing && <p className="case-result">Выпало: <strong>{won}</strong>! 🎉</p>}
        {!canAfford && <p className="case-warning">Не хватает листьев — нужно {formatLeaves(caseDef.cost)} 🍃</p>}
        {canAfford && !hasEmptyPlot && <p className="case-warning">Нет свободных участков для нового дерева</p>}

        <button className="case-open-btn" disabled={!canOpen} onClick={handleOpen}>
          {revealing ? 'Открываем…' : `Открыть за ${formatLeaves(caseDef.cost)} 🍃`}
        </button>

        <div className="case-drops">
          <span className="case-drops-title">Шансы выпадения</span>
          {caseDef.drops
            .slice()
            .sort((a, b) => dropChance(caseDef, b.speciesId) - dropChance(caseDef, a.speciesId))
            .map((drop) => {
              const species = SPECIES_MAP[drop.speciesId];
              return (
                <div key={drop.speciesId} className="case-drop-row">
                  <span className="case-drop-icon">
                    <TreeSprite species={species} stage={3} />
                  </span>
                  <span className="case-drop-name">{species.name}</span>
                  <span className="case-drop-chance">{dropChance(caseDef, drop.speciesId).toFixed(1)}%</span>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
