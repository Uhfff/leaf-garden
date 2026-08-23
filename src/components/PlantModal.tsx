import { SPECIES } from '../data/species';
import type { PlantedTree } from '../types';
import { formatLeaves, nextCost } from '../game/economy';
import { TreeSprite } from './TreeSprite';

interface Props {
  leaves: number;
  totalEarned: number;
  trees: (PlantedTree | null)[];
  inventory: Record<string, number>;
  onPick: (speciesId: string) => void;
  onClose: () => void;
}

export function PlantModal({ leaves, totalEarned, trees, inventory, onPick, onClose }: Props) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Выберите дерево</h2>
          <button className="modal-close" onClick={onClose} aria-label="Закрыть">×</button>
        </div>
        <div className="species-list">
          {SPECIES.map((species) => {
            const free = inventory[species.id] ?? 0;
            const owned = trees.filter((t) => t?.speciesId === species.id).length;
            const cost = free > 0 ? 0 : nextCost(species.cost, owned);
            const locked = free === 0 && totalEarned < species.unlockAt;
            const affordable = free > 0 || leaves >= cost;
            return (
              <button
                key={species.id}
                className={`species-card ${locked ? 'locked' : ''} ${!locked && !affordable ? 'unaffordable' : ''}`}
                disabled={locked || !affordable}
                onClick={() => onPick(species.id)}
              >
                <div className="species-swatch">
                  <TreeSprite species={species} stage={3} />
                </div>
                <div className="species-body">
                  <div className="species-title-row">
                    <span className="species-name">{species.name}</span>
                    <span className="species-cost">
                      {free > 0 ? 'Бесплатно' : `${formatLeaves(cost)} 🍃`}
                    </span>
                  </div>
                  <p className="species-desc">{species.description}</p>
                  <span className="species-income">база {formatLeaves(species.baseIncome)}/с, растёт с возрастом</span>
                  {free > 0 && <span className="species-free-label">Бесплатных из кейсов: {free}</span>}
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
