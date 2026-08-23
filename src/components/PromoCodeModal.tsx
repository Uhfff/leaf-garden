import { useState } from 'react';
import { formatLeaves } from '../game/economy';
import type { PromoRedeemResult } from '../game/useGarden';

interface Props {
  onRedeem: (code: string) => PromoRedeemResult;
  onClose: () => void;
}

export function PromoCodeModal({ onRedeem, onClose }: Props) {
  const [value, setValue] = useState('');
  const [result, setResult] = useState<PromoRedeemResult | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    setResult(onRedeem(value));
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🎟 Промокод</h2>
          <button className="modal-close" onClick={onClose} aria-label="Закрыть">×</button>
        </div>
        <form className="promo-form" onSubmit={handleSubmit}>
          <input
            className="promo-input"
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setResult(null);
            }}
            placeholder="Введите код"
            autoFocus
          />
          <button className="toolbar-primary" type="submit" disabled={!value.trim()}>
            Применить
          </button>
        </form>
        {result?.ok && <p className="case-result">Готово! Начислено {formatLeaves(result.amount)} 🍃</p>}
        {result && !result.ok && result.reason === 'used' && (
          <p className="case-warning">Этот код уже был использован на этом устройстве</p>
        )}
        {result && !result.ok && result.reason === 'invalid' && (
          <p className="case-warning">Такого промокода не существует</p>
        )}
      </div>
    </div>
  );
}
