import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Spinner } from 'react-bootstrap';
import CoverflowTracks from '../components/CoverflowTracks';
import TrackSearchBox from '../components/TrackSearchBox';
import { addTrackToPlaylist, loadPlaylists } from '../spotify/playlistService';
import BackButton from '../components/BackButton';
import { useTranslation } from 'react-i18next';
import PageHeader from '../components/PageHeader';
import ConfirmModal from '../components/ConfirmModal';
import { removeTrackFromPlaylist } from '../spotify/playlistService';

export default function TrackPage() {
  const { playlistId } = useParams();
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<any | null>(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    function load() {
      if (!playlistId) return;
      setLoading(true);
      try {
        const playlists = loadPlaylists();
        const playlist = playlists.find((pl) => pl.id === playlistId);
        setTracks(playlist?.tracks || []);
      } catch (e: any) {
        setError(String(e?.message || e));
      }
      setLoading(false);
    }
    load();
    return () => {
      setTracks([]);
      setLoading(false);
      setError(null);
    };
  }, [playlistId]);

  function handleAddTrack(track: any) {
    if (!playlistId) return;
    const added = addTrackToPlaylist(playlistId, track);
    if (added) {
      setTracks((prev) => [...prev, track]);
    }
  }

  if (!playlistId) return <div className="small">{t('noPlaylistSelected')}</div>;
  if (loading)
    return (
      <div className="small">
        {t('loadingTracks')} <Spinner animation="border" size="sm" />
      </div>
    );
  if (error) return <div className="small text-danger">{t('failedToLoadTracks', { error })}</div>;

  return (
    <section aria-labelledby="tracks-head" style={{ position: 'relative' }}>
      <PageHeader
        title={t('tracks')}
        subtitle={t('chooseTrack')}
        buttons={
          <>
            <TrackSearchBox
              onSelectTrack={handleAddTrack}
              excludeTrackIds={tracks.map((t) => t.id)}
            />
            <BackButton to="/playlists" />
          </>
        }
      />
      <CoverflowTracks
        tracks={tracks}
        closeModal={() => {}}
        onSelectTrack={(t: any) => {
          if (!playlistId) return;
          navigate(`/playlists/${playlistId}/${t.id}`);
        }}
        playlistId={playlistId}
        onDeleteTrack={(trackId: string) =>
          setTracks((prev) => prev.filter((t) => t.id !== trackId))
        }
        onRequestDelete={(item: any) => {
          setPendingDelete(item);
          setConfirmOpen(true);
        }}
      />

      <ConfirmModal
        show={confirmOpen}
        title={
          pendingDelete ? t('confirm.deleteTrackTitle', { name: pendingDelete.name }) : undefined
        }
        message={
          pendingDelete ? t('confirm.deleteTrackMessage', { name: pendingDelete.name }) : undefined
        }
        onConfirm={() => {
          if (pendingDelete && playlistId) {
            const ok = removeTrackFromPlaylist(playlistId, pendingDelete.id);
            if (ok) setTracks((prev) => prev.filter((t) => t.id !== pendingDelete.id));
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
