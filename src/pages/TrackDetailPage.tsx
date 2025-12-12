import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Spinner } from 'react-bootstrap';
import { sdk } from '../spotify/api';
import '../scss/components/track-detail.scss';
import BackButton from '../components/BackButton';
import { useTranslation } from 'react-i18next';
import PageHeader from '../components/PageHeader';

export default function TrackDetailPage() {
  const { playlistId, trackId } = useParams();
  const navigate = useNavigate();
  const [track, setTrack] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    async function load() {
      if (!trackId) return;
      setLoading(true);
      setError(null);
      try {
        const t = await sdk.tracks.get(trackId);
        setTrack(t);
      } catch (e: any) {
        setError(String(e?.message || e));
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => {
      setLoading(false);
      setTrack(null);
      setError(null);
    };
  }, [trackId]);

  return (
    <>
      <PageHeader title={t('trackDetails')} buttons={<BackButton to="/playlists" />} />
      <section
        aria-labelledby="track-detail-head"
        className="track-detail-section"
        style={{ position: 'relative' }}
      >
        <div className="track-detail-wrapper">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1 id="track-detail-head" className="page-head track-detail-heading">
              {t('trackDetails')}
            </h1>
          </div>

          {loading ? (
            <div className="small text-center py-5">
              {t('loadingTrack')} <Spinner animation="border" size="sm" />
            </div>
          ) : error ? (
            <div className="small text-danger text-center py-5">
              {t('failedToLoadTrack', { error })}
            </div>
          ) : (
            track && (
              <div className="shadow-sm track-detail-card">
                <img
                  className="track-detail-image"
                  src={track?.album?.images?.[1]?.url || track?.album?.images?.[0]?.url}
                  alt={track?.name}
                />
                <div className="track-detail-content">
                  <div className="track-detail-title">{track?.name}</div>
                  <div className="track-detail-artist">
                    {(track?.artists || []).map((a: any) => a.name).join(', ')}
                  </div>
                  <div className="track-detail-duration">
                    {Math.round((track?.duration_ms || 0) / 1000)}&nbsp;{t('seconds')}
                  </div>
                  <div className="track-detail-meta">
                    {t('album')}: {track?.album?.name}
                  </div>
                  <div className="track-detail-meta mb-4">
                    {t('release')}: {track?.album?.release_date}
                  </div>
                </div>
                <div className="track-detail-buttons">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => navigate(`/playlists/${playlistId}/${trackId}/play`)}
                  >
                    ▶ {t('play')}
                  </Button>
                </div>
              </div>
            )
          )}
        </div>
      </section>
    </>
  );
}
