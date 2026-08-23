import { useMemo, useRef, useState } from 'react';
import { CASES, dropChance, rollCaseSpecies } from '../data/cases';
import { SPECIES_MAP } from '../data/species';
import { formatLeaves } from '../game/economy';
import type { TreeSpecies } from '../types';
import { TreeSprite } from './TreeSprite';

interface Props {
  leaves: number;
  onOpen: (caseId: string) => { speciesId: string; speciesName: string } | null;
  onSell: (speciesId: string) => number | null;
  onClose: () => void;
}

const REEL_LENGTH = 24;
const ITEM_WIDTH = 64;
const VIEWPORT_WIDTH = 320;
const SPIN_MS = 3000;

function buildReel(caseId: string, winner: TreeSpecies): TreeSpecies[] {
  const caseDef = CASES.find((c) => c.id === caseId)!;
  const reel: TreeSpecies[] = [];
  for (let i = 0; i < REEL_LENGTH - 1; i++) reel.push(rollCaseSpecies(caseDef));
  reel.push(winner);
  return reel;
}

const LANDING_OFFSET = VIEWPORT_WIDTH / 2 - ((REEL_LENGTH - 1) * ITEM_WIDTH + ITEM_WIDTH / 2);

/** A plain color swatch instead of the full detailed TreeSprite — the reel
 *  moves ~24 of these at once, and a full multi-shape SVG per slot was too
 *  much for the browser to rasterize while animating (looked like a smear
 *  instead of trees). The real TreeSprite reappears once it lands. */
function ReelSwatch({ species }: { species: TreeSpecies }) {
  return (
    <div
      className="case-reel-swatch"
      style={{ background: `linear-gradient(135deg, ${species.foliage[0]}, ${species.foliage[1]})` }}
    />
  );
}

export function CaseModal({ leaves, onOpen, onSell, onClose }: Props) {
  const caseDef = CASES[0];
  const [reel, setReel] = useState<TreeSpecies[] | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [won, setWon] = useState<TreeSpecies | null>(null);
  const [sold, setSold] = useState<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canAfford = leaves >= caseDef.cost;
  const canOpen = canAfford && !spinning && !won;

  const sortedDrops = useMemo(
    () => caseDef.drops.slice().sort((a, b) => dropChance(caseDef, b.speciesId) - dropChance(caseDef, a.speciesId)),
    [caseDef],
  );

  const handleOpen = () => {
    if (!canOpen) return;
    const outcome = onOpen(caseDef.id);
    if (!outcome) return;
    const winner = SPECIES_MAP[outcome.speciesId];
    setWon(null);
    setSold(null);
    setSpinning(false);
    setReel(buildReel(caseDef.id, winner));
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setSpinning(true));
    });
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setSpinning(false);
      setWon(winner);
    }, SPIN_MS);
  };

  const handleSell = () => {
    if (!won) return;
    const payout = onSell(won.id);
    if (payout !== null) setSold(payout);
    setWon(null);
    setReel(null);
  };

  const handleKeep = () => {
    setWon(null);
    setReel(null);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{caseDef.icon} {caseDef.name}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Закрыть">×</button>
        </div>

        <div className="case-reel-viewport" style={{ width: VIEWPORT_WIDTH }}>
          <div className="case-reel-pointer" />
          {reel ? (
            <div
              className="case-reel-strip"
              style={{
                transform: `translateX(${spinning ? LANDING_OFFSET : 0}px)`,
                transition: spinning ? `transform ${SPIN_MS}ms cubic-bezier(0.12, 0.67, 0.22, 1)` : 'none',
              }}
            >
              {reel.map((species, i) => (
                <div key={i} className="case-reel-item" style={{ width: ITEM_WIDTH }}>
                  <ReelSwatch species={species} />
                </div>
              ))}
            </div>
          ) : (
            <div className="case-box-icon">{caseDef.icon}</div>
          )}
        </div>

        {won && !spinning && !sold && (
          <div className="case-reveal">
            <div className="case-reveal-icon">
              <TreeSprite species={won} stage={3} />
            </div>
            <p className="case-result">Выпало: <strong>{won.name}</strong>! 🎉</p>
            <div className="case-reveal-buttons">
              <button className="toolbar-secondary" onClick={handleSell}>
                Продать за {formatLeaves(won.cost)} 🍃
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
            {spinning ? 'Крутим…' : `Открыть за ${formatLeaves(caseDef.cost)} 🍃`}
          </button>
        )}

        <div className="case-drops">
          <span className="case-drops-title">Шансы выпадения</span>
          {sortedDrops.map((drop) => {
            const species = SPECIES_MAP[drop.speciesId];
            return (
              <div key={drop.speciesId} className="case-drop-row">
                <span className="case-drop-icon">
                  <TreeSprite species={species} stage={3} />
                </span>
                <span className="case-drop-name">{species.name}</span>
                <span className="case-drop-chance">{dropChance(caseDef, drop.speciesId).toFixed(1)}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
