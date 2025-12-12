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
  const [coverDataUrl, setCoverDataUrl] = useState<string | null>(null);
  const [coverFileName, setCoverFileName] = useState<string | null>(null);
  const textInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { t } = useTranslation();

  function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string | ArrayBuffer | null;
        if (typeof result === 'string') resolve(result);
        else reject(new Error('Unsupported file result'));
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  async function handleCreate(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!playlistName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      // pass cover base64 string if available
      addPlaylist(playlistName.trim(), coverDataUrl ?? undefined);
      setPlaylistName('');
      setCoverDataUrl(null);
      setCoverFileName(null);
      setIsActive(false);
      if (onCreated) onCreated();
    } catch (e: any) {
      setError(String(e?.message || e));
    }
    setCreating(false);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFileName(file.name);
    fileToDataUrl(file)
      .then((dataUrl) => setCoverDataUrl(dataUrl))
      .catch((err) => setError(String(err?.message || err)));
  }

  function clearCover() {
    setCoverDataUrl(null);
    setCoverFileName(null);
    // reset file input value
    if (fileInputRef.current) fileInputRef.current.value = '';
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
              ref={textInputRef}
              type="text"
              className="form-control mb-2"
              placeholder={t('playlistName')}
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              disabled={creating}
              maxLength={50}
              autoFocus
            />
            <div className="mb-2">
              <label className="small text-muted d-block mb-1">{t('coverImage')}</label>
              <input
                type="file"
                accept="image/*"
                className="form-control form-control-sm mb-1"
                onChange={handleFileChange}
                ref={fileInputRef}
                disabled={creating}
              />
              {coverDataUrl && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <img
                    src={coverDataUrl}
                    alt={coverFileName ?? 'cover'}
                    style={{
                      width: 72,
                      height: 72,
                      objectFit: 'cover',
                      borderRadius: 6,
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  />
                  <div>
                    <div className="small text-light">{coverFileName}</div>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-light mt-1"
                      onClick={clearCover}
                      disabled={creating}
                    >
                      {t('remove')}
                    </button>
                  </div>
                </div>
              )}
            </div>
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
                  clearCover();
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
