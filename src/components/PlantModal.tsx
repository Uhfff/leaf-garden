import { SPECIES } from '../data/species';
import type { PlantedTree } from '../types';
import { formatLeaves, nextCost } from '../game/economy';

interface Props {
  leaves: number;
  totalEarned: number;
  trees: (PlantedTree | null)[];
  onPick: (speciesId: string) => void;
  onClose: () => void;
}

export function PlantModal({ leaves, totalEarned, trees, onPick, onClose }: Props) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Выберите дерево</h2>
          <button className="modal-close" onClick={onClose} aria-label="Закрыть">×</button>
        </div>
        <div className="species-list">
          {SPECIES.map((species) => {
            const owned = trees.filter((t) => t?.speciesId === species.id).length;
            const cost = nextCost(species.cost, owned);
            const locked = totalEarned < species.unlockAt;
            const affordable = leaves >= cost;
            return (
              <button
                key={species.id}
                className={`species-card ${locked ? 'locked' : ''} ${!locked && !affordable ? 'unaffordable' : ''}`}
                disabled={locked || !affordable}
                onClick={() => onPick(species.id)}
              >
                <div className="species-swatch" style={{ background: `linear-gradient(135deg, ${species.foliage[0]}, ${species.foliage[1]})` }} />
                <div className="species-body">
                  <div className="species-title-row">
                    <span className="species-name">{species.name}</span>
                    <span className="species-cost">{formatLeaves(cost)} 🍃</span>
                  </div>
                  <p className="species-desc">{species.description}</p>
                  <span className="species-income">база {formatLeaves(species.baseIncome)}/с, растёт с возрастом</span>
                  {locked && <span className="species-locked-label">Откроется при {formatLeaves(species.unlockAt)} 🍃 заработано за игру</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
