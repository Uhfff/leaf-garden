import { useEffect, useMemo, useRef, useState } from 'react';
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

const SEQUENCE_LENGTH = 18;

/** The whole sequence — every species the flicker will show, ending in the
 *  real, already-decided winner — is drawn up front from the same weighted
 *  roll as the actual result, so nothing about the reveal is staged. */
function buildSequence(caseId: string, winner: TreeSpecies): TreeSpecies[] {
  const caseDef = CASES.find((c) => c.id === caseId)!;
  const sequence: TreeSpecies[] = [];
  for (let i = 0; i < SEQUENCE_LENGTH - 1; i++) sequence.push(rollCaseSpecies(caseDef));
  sequence.push(winner);
  return sequence;
}

/** Per-step delay, speeding up→slowing down like a real spin, without ever
 *  animating position — only one tree is ever on screen at a time, so
 *  there's nothing for the browser to smear while "spinning". */
function buildDelays(count: number): number[] {
  const delays: number[] = [];
  let d = 55;
  for (let i = 0; i < count; i++) {
    delays.push(Math.round(d));
    d = Math.min(d * 1.14, 230);
  }
  return delays;
}

export function CaseModal({ leaves, onOpen, onSell, onClose }: Props) {
  const caseDef = CASES[0];
  const [sequence, setSequence] = useState<TreeSpecies[] | null>(null);
  const [spinIndex, setSpinIndex] = useState<number | null>(null);
  const [won, setWon] = useState<TreeSpecies | null>(null);
  const [sold, setSold] = useState<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const spinning = sequence !== null && !won;
  const canAfford = leaves >= caseDef.cost;
  const canOpen = canAfford && !spinning;

  const sortedDrops = useMemo(
    () => caseDef.drops.slice().sort((a, b) => dropChance(caseDef, b.speciesId) - dropChance(caseDef, a.speciesId)),
    [caseDef],
  );

  const handleOpen = () => {
    if (!canOpen) return;
    const outcome = onOpen(caseDef.id);
    if (!outcome) return;
    const winner = SPECIES_MAP[outcome.speciesId];
    const seq = buildSequence(caseDef.id, winner);
    const delays = buildDelays(seq.length);

    setWon(null);
    setSold(null);
    setSequence(seq);
    setSpinIndex(0);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    let i = 0;
    const step = () => {
      i++;
      if (i >= seq.length) {
        setSpinIndex(seq.length - 1);
        setWon(winner);
        return;
      }
      setSpinIndex(i);
      timeoutRef.current = setTimeout(step, delays[i]);
    };
    timeoutRef.current = setTimeout(step, delays[0]);
  };

  const handleSell = () => {
    if (!won) return;
    const payout = onSell(won.id);
    if (payout !== null) setSold(payout);
    setWon(null);
    setSequence(null);
  };

  const handleKeep = () => {
    setWon(null);
    setSequence(null);
  };

  const displayed = won ?? (sequence && spinIndex !== null ? sequence[spinIndex] : null);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{caseDef.icon} {caseDef.name}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Закрыть">×</button>
        </div>

        <div className="case-spin-box">
          {displayed ? (
            <div key={spinIndex ?? 'won'} className={`case-spin-icon ${won ? 'case-spin-icon-won' : ''}`}>
              <TreeSprite species={displayed} stage={3} />
            </div>
          ) : (
            <span className="case-box-icon">{caseDef.icon}</span>
          )}
        </div>

        {won && (
          <div className="case-reveal">
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
