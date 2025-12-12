import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spinner } from 'react-bootstrap';
import CoverflowPlaylists from '../components/CoverflowPlaylist';
import ConfirmModal from '../components/ConfirmModal';
import { loadPlaylists, removePlaylist } from '../spotify/playlistService';
import PageHeader from '../components/PageHeader';
import BackButton from '../components/BackButton';
import PlaylistCreateBox from '../components/PlaylistCreateBox';
import { useTranslation } from 'react-i18next';

export default function PlaylistPage() {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<any | null>(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    function load() {
      setLoading(true);
      try {
        const playlists = loadPlaylists();
        setPlaylists(playlists);
      } catch (e: any) {
        setError(String(e?.message || e));
      }
      setLoading(false);
    }
    load();
    return () => {
      setLoading(false);
      setPlaylists([]);
    };
  }, []);

  if (loading)
    return (
      <div className="small">
        {t('loadingPlaylists')} <Spinner animation="border" size="sm" />
      </div>
    );
  if (error)
    return <div className="small text-danger">{t('failedToLoadPlaylists', { error })}</div>;
  return (
    <section aria-labelledby="playlists-head" style={{ position: 'relative' }}>
      <PageHeader
        title={t('playlists')}
        subtitle={t('choosePlaylist')}
        buttons={
          <>
            <PlaylistCreateBox onCreated={() => setPlaylists(loadPlaylists())} />
            <BackButton to="/" />
          </>
        }
      />
      <div className="mt-3">
        <CoverflowPlaylists
          playlists={playlists}
          openAndLoadTracks={(pl: any) => navigate(`/spotify/playlists/${pl.id}`)}
          onRequestDelete={(pl: any) => {
            setPendingDelete(pl);
            setConfirmOpen(true);
          }}
          onDelete={() => setPlaylists(loadPlaylists())}
        />
      </div>

      <ConfirmModal
        show={confirmOpen}
        title={
          pendingDelete ? t('confirm.deletePlaylistTitle', { name: pendingDelete.name }) : undefined
        }
        message={
          pendingDelete
            ? t('confirm.deletePlaylistMessage', { name: pendingDelete.name })
            : undefined
        }
        onConfirm={() => {
          if (pendingDelete) {
            removePlaylist(pendingDelete.id);
            setPlaylists(loadPlaylists());
          }
          setPendingDelete(null);
          setConfirmOpen(false);
        }}
        onCancel={() => {
          setPendingDelete(null);
          setConfirmOpen(false);
        }}
      />
    </section>
  );
}
