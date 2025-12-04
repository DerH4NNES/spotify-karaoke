import React, { useRef, useState } from 'react';
import { addPlaylist } from '../spotify/playlistService';
import { useTranslation } from 'react-i18next';

interface PlaylistCreateBoxProps {
  onCreated?: () => void;
  disabled?: boolean;
}

export default function PlaylistCreateBox({ onCreated, disabled }: PlaylistCreateBoxProps) {
  const [isActive, setIsActive] = useState(false);
  const [playlistName, setPlaylistName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  async function handleCreate(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!playlistName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      addPlaylist(playlistName.trim());
      setPlaylistName('');
      setIsActive(false);
      if (onCreated) onCreated();
    } catch (e: any) {
      setError(String(e?.message || e));
    }
    setCreating(false);
  }

  return (
    <>
      <button
        type="button"
        className="back-btn"
        style={{ marginBottom: 0, minWidth: 180, fontWeight: 600 }}
        onClick={() => setIsActive(true)}
        disabled={disabled}
      >
        <span style={{ fontSize: 18, marginRight: 8, verticalAlign: 'middle' }}>+</span>
        <span style={{ verticalAlign: 'middle' }}>{t('addPlaylist')}</span>
      </button>
      {isActive && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.7)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            paddingTop: 120,
          }}
        >
          <form
            onSubmit={handleCreate}
            style={{
              minWidth: 350,
              maxWidth: 500,
              background: '#222',
              borderRadius: 8,
              boxShadow: '0 2px 16px #000',
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <input
              ref={inputRef}
              type="text"
              className="form-control mb-2"
              placeholder={t('playlistName')}
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              disabled={creating}
              maxLength={50}
              autoFocus
            />
            {error && <div className="small text-danger mb-2">{error}</div>}
            <div className="d-flex gap-2">
              <button
                type="submit"
                className="back-btn flex-grow-1"
                disabled={creating || !playlistName.trim()}
              >
                {creating ? t('creating') : t('create')}
              </button>
              <button
                type="button"
                className="btn btn-outline-light flex-grow-1"
                onClick={() => {
                  setIsActive(false);
                  setPlaylistName('');
                  setError(null);
                }}
              >
                {t('cancel')}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
