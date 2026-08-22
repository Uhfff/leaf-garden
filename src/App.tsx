import { useEffect, useState } from 'react';
import { useGarden, MAX_PLOTS, plotCost } from './game/useGarden';
import { useNow } from './hooks/useNow';
import { HUD } from './components/HUD';
import { Garden } from './components/Garden';
import { PlantModal } from './components/PlantModal';
import { DeleteToolbar } from './components/DeleteToolbar';
import { formatLeaves } from './game/economy';
import './App.css';

export default function App() {
  const { game, incomePerSec, offlineEarnings, plantTree, buyPlot, removeTrees } = useGarden();
  const now = useNow();
  const [openPlot, setOpenPlot] = useState<number | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [confirming, setConfirming] = useState(false);
  const [toast, setToast] = useState<string | null>(
    offlineEarnings > 1 ? `Пока вас не было, сад принёс ${formatLeaves(offlineEarnings)} 🍃` : null,
  );

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(id);
  }, [toast]);

  const exitSelectMode = () => {
    setSelectMode(false);
    setConfirming(false);
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
    removeTrees([...selected]);
    exitSelectMode();
  };

  return (
    <div className="app">
      <HUD leaves={game.leaves} incomePerSec={incomePerSec} />
      <main className="main">
        <div className="toolbar">
          <DeleteToolbar
            selectMode={selectMode}
            confirming={confirming}
            selectedCount={selected.size}
            onStart={() => setSelectMode(true)}
            onRequestConfirm={() => setConfirming(true)}
            onConfirm={confirmDelete}
            onCancel={exitSelectMode}
          />
        </div>
        <Garden
          trees={game.trees}
          now={now}
          plots={game.plots}
          maxPlots={MAX_PLOTS}
          expandCost={plotCost(game.plots)}
          leaves={game.leaves}
          selectMode={selectMode}
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
