import { useEffect, useState } from 'react';
import { useGarden, MAX_PLOTS, plotCost } from './game/useGarden';
import { useNow } from './hooks/useNow';
import { HUD } from './components/HUD';
import { Garden } from './components/Garden';
import { PlantModal } from './components/PlantModal';
import { formatLeaves } from './game/economy';
import './App.css';

export default function App() {
  const { game, incomePerSec, offlineEarnings, plantTree, buyPlot } = useGarden();
  const now = useNow();
  const [openPlot, setOpenPlot] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(
    offlineEarnings > 1 ? `Пока вас не было, сад принёс ${formatLeaves(offlineEarnings)} 🍃` : null,
  );

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(id);
  }, [toast]);

  return (
    <div className="app">
      <HUD leaves={game.leaves} incomePerSec={incomePerSec} />
      <main className="main">
        <Garden
          trees={game.trees}
          now={now}
          plots={game.plots}
          maxPlots={MAX_PLOTS}
          expandCost={plotCost(game.plots)}
          leaves={game.leaves}
          onClickEmpty={setOpenPlot}
          onExpand={buyPlot}
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
