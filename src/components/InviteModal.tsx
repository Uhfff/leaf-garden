import { useState } from 'react';
import { BOT_USERNAME, getTelegramUserId } from '../telegram';
import { ICONS } from '../icons';

interface Props {
  onClose: () => void;
}

export function InviteModal({ onClose }: Props) {
  const userId = getTelegramUserId();
  const link = userId ? `https://t.me/${BOT_USERNAME}?start=ref${userId}` : null;
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!link) return;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2><img src={ICONS.invite} alt="" className="modal-icon-img" /> Пригласить друзей</h2>
          <button className="modal-close" onClick={onClose} aria-label="Закрыть">×</button>
        </div>
        {link ? (
          <>
            <p>За каждого друга, который откроет сад по вашей ссылке, вы получите 2.5 миллиарда 🍃.</p>
            <div className="promo-form">
              <input className="promo-input" type="text" value={link} readOnly onFocus={(e) => e.target.select()} />
              <button className="toolbar-primary" onClick={handleCopy}>
                {copied ? 'Скопировано!' : 'Копировать'}
              </button>
            </div>
          </>
        ) : (
          <p className="case-warning">
            Реферальная ссылка доступна только внутри Telegram-бота — откройте сад через{' '}
            <a href={`https://t.me/${BOT_USERNAME}`} target="_blank" rel="noreferrer">
              @{BOT_USERNAME}
            </a>
            , затем нажмите /invite или снова этот значок.
          </p>
        )}
      </div>
    </div>
  );
}
