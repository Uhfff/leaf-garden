import { useState } from 'react';
import { UPGRADES, formatDuration, formatLeaves, pluralTrees, type BoostQuantity, type UpgradeType } from '../game/economy';
import { CASES } from '../data/cases';
import { ICONS } from '../icons';

export type ActionType = UpgradeType | 'delete';

const BOOST_QUANTITIES: BoostQuantity[] = [1, 10, 100, 'max'];

interface Props {
  action: ActionType | null;
  confirmingDelete: boolean;
  selectedCount: number;
  cost: number;
  levels: number;
  refund: number;
  leaves: number;
  boostQuantity: BoostQuantity;
  onSetBoostQuantity: (quantity: BoostQuantity) => void;
  onStart: (action: ActionType) => void;
  onApplyUpgrade: () => void;
  onRequestDeleteConfirm: () => void;
  onConfirmDelete: () => void;
  onCancel: () => void;
  onOpenCase: (caseId: string) => void;
  onOpenPromo: () => void;
  onOpenInvite: () => void;
}

export function SelectionToolbar({
  action,
  confirmingDelete,
  selectedCount,
  cost,
  levels,
  refund,
  leaves,
  boostQuantity,
  onSetBoostQuantity,
  onStart,
  onApplyUpgrade,
  onRequestDeleteConfirm,
  onConfirmDelete,
  onCancel,
  onOpenCase,
  onOpenPromo,
  onOpenInvite,
}: Props) {
  const [carePickerOpen, setCarePickerOpen] = useState(false);
  const [casePickerOpen, setCasePickerOpen] = useState(false);

  if (!action) {
    if (carePickerOpen) {
      return (
        <div className="toolbar-icons-split">
          <div className="toolbar-icons">
            <button className="toolbar-icon-btn" title="Назад" onClick={() => setCarePickerOpen(false)}>
              ←
            </button>
            {(Object.keys(UPGRADES) as UpgradeType[]).map((type) => (
              <button
                key={type}
                className="toolbar-icon-btn"
                title={UPGRADES[type].label}
                onClick={() => {
                  setCarePickerOpen(false);
                  onStart(type);
                }}
              >
                <img src={UPGRADES[type].image} alt={UPGRADES[type].label} className="toolbar-icon-img" />
              </button>
            ))}
          </div>
        </div>
      );
    }
    if (casePickerOpen) {
      return (
        <div className="toolbar-icons">
          <button className="toolbar-icon-btn" title="Назад" onClick={() => setCasePickerOpen(false)}>
            ←
          </button>
          {CASES.map((c) => (
            <button
              key={c.id}
              className="toolbar-icon-btn"
              title={c.name}
              onClick={() => {
                setCasePickerOpen(false);
                onOpenCase(c.id);
              }}
            >
              <img src={c.image} alt={c.name} className="toolbar-icon-img" />
            </button>
          ))}
        </div>
      );
    }
    return (
      <div className="toolbar-icons-split">
        <div className="toolbar-icons">
          <button className="toolbar-icon-btn" title="Уход за деревом (полить/удобрить/улучшить)" onClick={() => setCarePickerOpen(true)}>
            <img src={ICONS.careEntry} alt="" className="toolbar-icon-img" />
          </button>
          <button className="toolbar-icon-btn" title="Удалить деревья" onClick={() => onStart('delete')}>
            <img src={ICONS.delete} alt="" className="toolbar-icon-img" />
          </button>
        </div>
        <div className="toolbar-icons">
          <button className="toolbar-icon-btn" title="Кейсы" onClick={() => setCasePickerOpen(true)}>
            <img src={ICONS.casesEntry} alt="" className="toolbar-icon-img" />
          </button>
          <button className="toolbar-icon-btn" title="Промокод" onClick={onOpenPromo}>
            🎟
          </button>
          <button className="toolbar-icon-btn" title="Пригласить друзей" onClick={onOpenInvite}>
            👥
          </button>
        </div>
      </div>
    );
  }

  if (action === 'delete') {
    if (confirmingDelete) {
      return (
        <div className="toolbar-bar toolbar-confirm">
          <span>
            Удалить {selectedCount} {pluralTrees(selectedCount)}? Вернётся ~{formatLeaves(refund)} 🍃. Это нельзя
            отменить.
          </span>
          <div className="toolbar-buttons">
            <button className="toolbar-danger" onClick={onConfirmDelete}>Да, удалить</button>
            <button className="toolbar-secondary" onClick={onCancel}>Отмена</button>
          </div>
        </div>
      );
    }
    return (
      <div className="toolbar-bar">
        <span>Выберите деревья для удаления · выбрано {selectedCount}</span>
        <div className="toolbar-buttons">
          <button className="toolbar-danger" disabled={selectedCount === 0} onClick={onRequestDeleteConfirm}>
            Удалить ({selectedCount})
          </button>
          <button className="toolbar-secondary" onClick={onCancel}>Отмена</button>
        </div>
      </div>
    );
  }

  const def = UPGRADES[action];

  if (action === 'boost') {
    const canAfford = levels > 0 && leaves >= cost;
    return (
      <div className="toolbar-bar">
        <span>
          {def.icon} {def.label.toLowerCase()} навсегда · выбрано {selectedCount} · купится {levels}{' '}
          {pluralLevels(levels)} · стоимость {formatLeaves(cost)} 🍃
        </span>
        <div className="toolbar-buttons">
          <div className="toolbar-quantity">
            {BOOST_QUANTITIES.map((q) => (
              <button
                key={q}
                className={`toolbar-quantity-btn ${boostQuantity === q ? 'active' : ''}`}
                onClick={() => onSetBoostQuantity(q)}
              >
                {q === 'max' ? 'MAX' : `×${q}`}
              </button>
            ))}
          </div>
          <button className="toolbar-primary" disabled={!canAfford} onClick={onApplyUpgrade}>
            Применить
          </button>
          <button className="toolbar-secondary" onClick={onCancel}>Отмена</button>
        </div>
      </div>
    );
  }

  const canAfford = selectedCount > 0 && leaves >= cost;
  const durationHint = def.durationMs
    ? ` на ${formatDuration(def.durationMs / 1000)} (уже активным деревьям обновит таймер)`
    : '';
  return (
    <div className="toolbar-bar">
      <span>
        {def.icon} {def.label.toLowerCase()}{durationHint} · выбрано {selectedCount} · стоимость {formatLeaves(cost)}{' '}
        🍃
      </span>
      <div className="toolbar-buttons">
        <button className="toolbar-primary" disabled={!canAfford} onClick={onApplyUpgrade}>
          Применить ({selectedCount})
        </button>
        <button className="toolbar-secondary" onClick={onCancel}>Отмена</button>
      </div>
    </div>
  );
}

function pluralLevels(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'уровень';
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return 'уровня';
  return 'уровней';
}
