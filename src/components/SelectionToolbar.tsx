import { UPGRADES, formatLeaves, pluralTrees, type UpgradeType } from '../game/economy';

export type ActionType = UpgradeType | 'delete';

interface Props {
  action: ActionType | null;
  confirmingDelete: boolean;
  selectedCount: number;
  cost: number;
  refund: number;
  leaves: number;
  onStart: (action: ActionType) => void;
  onApplyUpgrade: () => void;
  onRequestDeleteConfirm: () => void;
  onConfirmDelete: () => void;
  onCancel: () => void;
}

export function SelectionToolbar({
  action,
  confirmingDelete,
  selectedCount,
  cost,
  refund,
  leaves,
  onStart,
  onApplyUpgrade,
  onRequestDeleteConfirm,
  onConfirmDelete,
  onCancel,
}: Props) {
  if (!action) {
    return (
      <div className="toolbar-icons">
        {(Object.keys(UPGRADES) as UpgradeType[]).map((type) => (
          <button key={type} className="toolbar-icon-btn" title={UPGRADES[type].label} onClick={() => onStart(type)}>
            {UPGRADES[type].icon}
          </button>
        ))}
        <button className="toolbar-icon-btn" title="Удалить деревья" onClick={() => onStart('delete')}>
          🗑
        </button>
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
  const canAfford = selectedCount > 0 && leaves >= cost;
  return (
    <div className="toolbar-bar">
      <span>
        {def.icon} {def.label.toLowerCase()} · выбрано {selectedCount} · стоимость {formatLeaves(cost)} 🍃
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
