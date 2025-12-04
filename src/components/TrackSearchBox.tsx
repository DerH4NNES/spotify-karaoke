import React, { useEffect, useRef, useState } from 'react';
import { Spinner } from 'react-bootstrap';
import { searchTracks } from '../spotify/searchTracks';
import { useTranslation } from 'react-i18next';

interface TrackSearchBoxProps {
  onSelectTrack: (track: any) => void;
  disabled?: boolean;
  excludeTrackIds?: string[];
}

export default function TrackSearchBox({
  onSelectTrack,
  disabled,
  excludeTrackIds = [],
}: TrackSearchBoxProps) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  const debounceRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }
    setSearchLoading(true);
    setSearchError(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      try {
        const results = await searchTracks(searchTerm);
        setSearchResults(results);
      } catch (err: any) {
        setSearchError(String(err?.message || err));
      }
      setSearchLoading(false);
    }, 400);
  }, [searchTerm]);

  // Schließe Overlay bei Klick außerhalb
  useEffect(() => {
    if (!isActive) return;
    function handleClick(e: MouseEvent) {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsActive(false);
        setSearchResults([]);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isActive]);

  // Fokus nach Auswahl wiederherstellen
  function handleSelect(track: any) {
    onSelectTrack(track);
    setSearchResults([]);
    setSearchTerm('');
    setIsActive(false);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
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
        <span style={{ verticalAlign: 'middle' }}>{t('addSong')}</span>
      </button>
      <div className="mb-3 position-relative" style={{ maxWidth: 400 }}>
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
            <div
              ref={resultsRef}
              style={{
                minWidth: 350,
                maxWidth: 500,
                background: '#222',
                borderRadius: 8,
                boxShadow: '0 2px 16px #000',
                padding: 16,
              }}
            >
              <input
                ref={inputRef}
                type="text"
                className="form-control mb-3"
                placeholder={t('searchTrack')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={disabled}
                style={searchLoading ? { paddingRight: 36 } : {}}
                autoComplete="off"
                autoFocus
              />
              {searchLoading && (
                <span style={{ position: 'absolute', right: 26, top: 26 }}>
                  <Spinner animation="border" size="sm" />
                </span>
              )}
              {searchError && <div className="small text-danger mb-2">{searchError}</div>}
              {searchResults.length > 0 && (
                <div className="list-group mb-2">
                  {searchResults.map((track) => (
                    <button
                      key={track.id}
                      type="button"
                      className="list-group-item list-group-item-action d-flex align-items-center"
                      onClick={() => handleSelect(track)}
                      disabled={excludeTrackIds.includes(track.id)}
                      style={{ background: '#222', color: '#fff' }}
                    >
                      <img
                        src={
                          track.album?.images?.[2]?.url ||
                          track.album?.images?.[0]?.url ||
                          '/favicon.ico'
                        }
                        alt="Cover"
                        style={{ width: 40, height: 40, objectFit: 'cover', marginRight: 12 }}
                      />
                      <span className="flex-grow-1">
                        {track.name}{' '}
                        <span className="text-muted">
                          {track.artists?.map((a: any) => a.name).join(', ')}
                        </span>
                      </span>
                      {excludeTrackIds.includes(track.id) && (
                        <span className="badge bg-secondary ms-2">{t('alreadyInPlaylist')}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
              <button
                type="button"
                className="btn btn-outline-light w-100"
                onClick={() => {
                  setIsActive(false);
                  setSearchResults([]);
                  setSearchTerm('');
                }}
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
