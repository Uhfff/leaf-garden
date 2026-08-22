function pluralTrees(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'дерево';
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return 'дерева';
  return 'деревьев';
}

interface Props {
  selectMode: boolean;
  confirming: boolean;
  selectedCount: number;
  onStart: () => void;
  onRequestConfirm: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteToolbar({
  selectMode,
  confirming,
  selectedCount,
  onStart,
  onRequestConfirm,
  onConfirm,
  onCancel,
}: Props) {
  if (!selectMode) {
    return (
      <button className="toolbar-trash" title="Удалить деревья" onClick={onStart}>
        🗑
      </button>
    );
  }

  if (confirming) {
    return (
      <div className="toolbar-bar toolbar-confirm">
        <span>
          Удалить {selectedCount} {pluralTrees(selectedCount)}? Это нельзя отменить.
        </span>
        <div className="toolbar-buttons">
          <button className="toolbar-danger" onClick={onConfirm}>Да, удалить</button>
          <button className="toolbar-secondary" onClick={onCancel}>Отмена</button>
        </div>
      </div>
    );
  }

  return (
    <div className="toolbar-bar">
      <span>Выберите деревья для удаления · выбрано {selectedCount}</span>
      <div className="toolbar-buttons">
        <button className="toolbar-danger" disabled={selectedCount === 0} onClick={onRequestConfirm}>
          Удалить ({selectedCount})
        </button>
        <button className="toolbar-secondary" onClick={onCancel}>Отмена</button>
      </div>
    </div>
  );
}
