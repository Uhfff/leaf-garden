import { useEffect, useState } from 'react';
import { useGarden, MAX_PLOTS, plotCost } from './game/useGarden';
import { useNow } from './hooks/useNow';
import { HUD } from './components/HUD';
import { Garden } from './components/Garden';
import { PlantModal } from './components/PlantModal';
import { SelectionToolbar, type ActionType } from './components/SelectionToolbar';
import { formatLeaves, UPGRADES, type UpgradeType } from './game/economy';
import './App.css';

export default function App() {
  const { game, incomePerSec, offlineEarnings, plantTree, buyPlot, removeTrees, applyUpgrade, upgradeCostFor, refundFor } =
    useGarden();
  const now = useNow();
  const [openPlot, setOpenPlot] = useState<number | null>(null);
  const [action, setAction] = useState<ActionType | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [toast, setToast] = useState<string | null>(
    offlineEarnings > 1 ? `Пока вас не было, сад принёс ${formatLeaves(offlineEarnings)} 🍃` : null,
  );

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(id);
  }, [toast]);

  const exitSelection = () => {
    setAction(null);
    setConfirmingDelete(false);
    setSelected(new Set());
  };

  const toggleSelect = (index: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const confirmDelete = () => {
    const refund = removeTrees([...selected]);
    setToast(`Срублено, возвращено ${formatLeaves(refund)} 🍃`);
    exitSelection();
  };

  const confirmUpgrade = () => {
    if (action === 'delete' || !action) return;
    const applied = applyUpgrade(action as UpgradeType, [...selected]);
    if (applied) setToast(`Применено: ${UPGRADES[action].label.toLowerCase()}`);
    exitSelection();
  };

  const selectedIndices = [...selected];
  const cost = action && action !== 'delete' ? upgradeCostFor(action, selectedIndices) : 0;
  const refund = action === 'delete' ? refundFor(selectedIndices) : 0;

  return (
    <div className="app">
      <HUD leaves={game.leaves} incomePerSec={incomePerSec} />
      <main className="main">
        <div className="toolbar">
          <SelectionToolbar
            action={action}
            confirmingDelete={confirmingDelete}
            selectedCount={selected.size}
            cost={cost}
            refund={refund}
            leaves={game.leaves}
            onStart={setAction}
            onApplyUpgrade={confirmUpgrade}
            onRequestDeleteConfirm={() => setConfirmingDelete(true)}
            onConfirmDelete={confirmDelete}
            onCancel={exitSelection}
          />
        </div>
        <Garden
          trees={game.trees}
          now={now}
          plots={game.plots}
          maxPlots={MAX_PLOTS}
          expandCost={plotCost(game.plots)}
          leaves={game.leaves}
          action={action}
          selected={selected}
          onClickEmpty={setOpenPlot}
          onExpand={buyPlot}
          onToggleSelect={toggleSelect}
        />
      </main>
      {openPlot !== null && (
        <PlantModal
          leaves={game.leaves}
          totalEarned={game.totalEarned}
          trees={game.trees}
          onPick={(speciesId) => {
            plantTree(openPlot, speciesId);
            setOpenPlot(null);
          }}
          onClose={() => setOpenPlot(null)}
        />
      )}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
