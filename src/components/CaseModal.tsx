import { useMemo, useRef, useState } from 'react';
import { CASE_MAP, dropChance, rollCaseSpecies, type CaseDef } from '../data/cases';
import { ALL_SPECIES_MAP } from '../data/allSpecies';
import { formatDuration, formatLeaves } from '../game/economy';
import type { TreeSpecies } from '../types';
import { TreeSprite } from './TreeSprite';

interface Props {
  caseId: string;
  leaves: number;
  luckBoostUntil: number;
  luckBoostPercent: number;
  freeCharges: number;
  onOpen: (caseId: string) => { speciesId: string; speciesName: string } | null;
  onSell: (speciesId: string) => number | null;
  onClose: () => void;
}

const REEL_LENGTH = 22;
// How many extra items keep going past the winner, so the reel doesn't end
// exactly at the pointer — without these the strip has nothing left to
// show right of center once it lands, just bare viewport background.
const TRAILING_ITEMS = 5;
const WINNER_INDEX = REEL_LENGTH - 1 - TRAILING_ITEMS;
const ITEM_WIDTH = 72;
const VIEWPORT_WIDTH = 320;
const SPIN_MS = 3200;

/** Every tree the reel scrolls past — ending in the real, already-decided
 *  winner, with a few more rolled after it — is drawn from the same
 *  weighted roll as the actual result, so nothing about what flies past is
 *  staged. */
function buildReel(caseDef: CaseDef, winner: TreeSpecies, boostPercent: number): TreeSpecies[] {
  const reel: TreeSpecies[] = [];
  for (let i = 0; i < WINNER_INDEX; i++) reel.push(rollCaseSpecies(caseDef, boostPercent));
  reel.push(winner);
  for (let i = 0; i < TRAILING_ITEMS; i++) reel.push(rollCaseSpecies(caseDef, boostPercent));
  return reel;
}

// Distance to translate the strip so the winner's item (not necessarily the
// last one — see TRAILING_ITEMS) lands centered under the pointer. The
// strip itself must start flush at the viewport's left edge
// (position: absolute; left: 0) for this to line up — centering it with
// flexbox instead silently shifts the whole strip by however much it
// overflows, which is what broke this the first time: the translated strip
// ended up mostly off-screen, showing empty space instead of trees.
const LANDING_OFFSET = VIEWPORT_WIDTH / 2 - (WINNER_INDEX * ITEM_WIDTH + ITEM_WIDTH / 2);

export function CaseModal({ caseId, leaves, luckBoostUntil, luckBoostPercent, freeCharges, onOpen, onSell, onClose }: Props) {
  const caseDef = CASE_MAP[caseId];
  const [reel, setReel] = useState<TreeSpecies[] | null>(null);
  const [moved, setMoved] = useState(false);
  const [won, setWon] = useState<TreeSpecies | null>(null);
  const [sold, setSold] = useState<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const boosted = luckBoostUntil > Date.now();
  const boostPercent = boosted ? luckBoostPercent : 0;
  const spinning = reel !== null && !won;
  const canAfford = freeCharges > 0 || leaves >= caseDef.cost;
  const canOpen = canAfford && !spinning;

  const sortedDrops = useMemo(
    () =>
      caseDef.drops
        .slice()
        .sort((a, b) => dropChance(caseDef, b.speciesId, boostPercent) - dropChance(caseDef, a.speciesId, boostPercent)),
    [caseDef, boostPercent],
  );

  const handleOpen = () => {
    if (!canOpen) return;
    const outcome = onOpen(caseDef.id);
    if (!outcome) return;
    const winner = ALL_SPECIES_MAP[outcome.speciesId];

    setWon(null);
    setSold(null);
    setMoved(false);
    setReel(buildReel(caseDef, winner, boostPercent));

    // A brief timeout instead of requestAnimationFrame — the strip needs to
    // actually paint at rest (transform: none) for one frame before the
    // transition-enabled move starts, or the browser can collapse both
    // style changes into one and skip the animation entirely.
    setTimeout(() => setMoved(true), 20);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setWon(winner), SPIN_MS);
  };

  const handleSell = () => {
    if (!won) return;
    const payout = onSell(won.id);
    if (payout !== null) setSold(payout);
    setWon(null);
    setReel(null);
    setMoved(false);
  };

  const handleKeep = () => {
    setWon(null);
    setReel(null);
    setMoved(false);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2><img src={caseDef.image} alt="" className="modal-icon-img" /> {caseDef.name}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Закрыть">×</button>
        </div>

        {boosted && (
          <p className="case-luck-banner">
            🍀 Удача +{luckBoostPercent}% на редкие деревья ещё {formatDuration((luckBoostUntil - Date.now()) / 1000)}
          </p>
        )}
        {freeCharges > 0 && (
          <p className="case-luck-banner">🎫 Бесплатных открытий: {freeCharges}</p>
        )}

        <div className="case-reel-viewport" style={{ width: VIEWPORT_WIDTH }}>
          {reel ? (
            <>
              <div className="case-reel-pointer" />
              <div
                className="case-reel-strip"
                style={{
                  transform: `translate(${moved ? LANDING_OFFSET : 0}px, -50%)`,
                  transition: moved ? `transform ${SPIN_MS}ms cubic-bezier(0.12, 0.67, 0.22, 1)` : 'none',
                }}
              >
                {reel.map((species, i) => (
                  <div key={i} className="case-reel-item" style={{ width: ITEM_WIDTH }}>
                    <TreeSprite species={species} stage={3} />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <img src={caseDef.image} alt={caseDef.name} className="case-box-icon" />
          )}
        </div>

        {won && (
          <div className="case-reveal">
            <p className="case-result">Выпало: <strong>{won.name}</strong>! 🎉</p>
            <div className="case-reveal-buttons">
              <button className="toolbar-secondary" onClick={handleSell}>
                Продать за {formatLeaves(won.sellPrice ?? won.cost)} 🍃
              </button>
              <button className="toolbar-primary" onClick={handleKeep}>
                Оставить в инвентаре
              </button>
            </div>
          </div>
        )}
        {sold !== null && <p className="case-result">Продано за {formatLeaves(sold)} 🍃</p>}
        {!canAfford && !won && <p className="case-warning">Не хватает листьев — нужно {formatLeaves(caseDef.cost)} 🍃</p>}

        {!won && (
          <button className="case-open-btn" disabled={!canOpen} onClick={handleOpen}>
            {spinning
              ? 'Крутим…'
              : freeCharges > 0
                ? 'Открыть бесплатно'
                : `Открыть за ${formatLeaves(caseDef.cost)} 🍃`}
          </button>
        )}

        <div className="case-drops">
          <span className="case-drops-title">Шансы выпадения</span>
          {sortedDrops.map((drop) => {
            const species = ALL_SPECIES_MAP[drop.speciesId];
            return (
              <div key={drop.speciesId} className="case-drop-row">
                <span className="case-drop-icon">
                  <TreeSprite species={species} stage={3} />
                </span>
                <span className="case-drop-name">{species.name}</span>
                <span className="case-drop-chance">{dropChance(caseDef, drop.speciesId, boostPercent).toFixed(1)}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
