import { useEffect, useState } from 'react';
import { useGarden, MAX_PLOTS, plotCost } from './game/useGarden';
import { useNow } from './hooks/useNow';
import { HUD } from './components/HUD';
import { Garden } from './components/Garden';
import { PlantModal } from './components/PlantModal';
import { CaseModal } from './components/CaseModal';
import { PromoCodeModal } from './components/PromoCodeModal';
import { SelectionToolbar, type ActionType } from './components/SelectionToolbar';
import { formatLeaves, UPGRADES, type BoostQuantity, type UpgradeType } from './game/economy';
import './App.css';

export default function App() {
  const {
    game,
    incomePerSec,
    offlineEarnings,
    giftMessage,
    plantTree,
    openCase,
    sellInventoryTree,
    redeemPromoCode,
    buyPlot,
    removeTrees,
    applyUpgrade,
    upgradeCostFor,
    applyBoost,
    boostCostFor,
    refundFor,
  } = useGarden();
  const now = useNow();
  const [openPlot, setOpenPlot] = useState<number | null>(null);
  const [caseModalId, setCaseModalId] = useState<string | null>(null);
  const [promoModalOpen, setPromoModalOpen] = useState(false);
  const [action, setAction] = useState<ActionType | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [boostQuantity, setBoostQuantity] = useState<BoostQuantity>(1);
  const [toast, setToast] = useState<string | null>(
    giftMessage
      ? `🎁 ${giftMessage}`
      : offlineEarnings > 1
        ? `Пока вас не было, сад принёс ${formatLeaves(offlineEarnings)} 🍃`
        : null,
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
    setBoostQuantity(1);
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
    if (!action || action === 'delete') return;
    if (action === 'boost') {
      const result = applyBoost([...selected], boostQuantity);
      if (result) setToast(`Улучшено на ${result.levels} ур. за ${formatLeaves(result.cost)} 🍃`);
      exitSelection();
      return;
    }
    const applied = applyUpgrade(action as UpgradeType, [...selected]);
    if (applied) setToast(`Применено: ${UPGRADES[action].label.toLowerCase()}`);
    exitSelection();
  };

  const selectedIndices = [...selected];
  const boostPreview = action === 'boost' ? boostCostFor(selectedIndices, boostQuantity) : null;
  const cost = boostPreview
    ? boostPreview.cost
    : action && action !== 'delete'
      ? upgradeCostFor(action, selectedIndices)
      : 0;
  const levels = boostPreview?.levels ?? 0;
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
            levels={levels}
            refund={refund}
            leaves={game.leaves}
            boostQuantity={boostQuantity}
            onSetBoostQuantity={setBoostQuantity}
            onStart={setAction}
            onApplyUpgrade={confirmUpgrade}
            onRequestDeleteConfirm={() => setConfirmingDelete(true)}
            onConfirmDelete={confirmDelete}
            onCancel={exitSelection}
            onOpenCase={(caseId) => setCaseModalId(caseId)}
            onOpenPromo={() => setPromoModalOpen(true)}
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
          inventory={game.inventory}
          onPick={(speciesId) => {
            plantTree(openPlot, speciesId);
            setOpenPlot(null);
          }}
          onClose={() => setOpenPlot(null)}
        />
      )}
      {caseModalId && (
        <CaseModal
          caseId={caseModalId}
          leaves={game.leaves}
          luckBoostUntil={game.luckBoostUntil}
          freeCharges={game.freeCaseCharges[caseModalId] ?? 0}
          onOpen={openCase}
          onSell={sellInventoryTree}
          onClose={() => setCaseModalId(null)}
        />
      )}
      {promoModalOpen && (
        <PromoCodeModal onRedeem={redeemPromoCode} onClose={() => setPromoModalOpen(false)} />
      )}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
