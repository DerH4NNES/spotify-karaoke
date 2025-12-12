import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, ProgressBar, Spinner, Modal } from 'react-bootstrap';
import LyricRenderer from '../components/LyricRenderer';
import useLyrics from '../hooks/useLyrics';
import { sdk } from '../spotify/api';
import { Track } from '@spotify/web-api-ts-sdk';
import { initPlayer } from '../spotify/initPlayer';
import { FaBackward, FaForward, FaPauseCircle, FaPlay } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import PageHeader from '../components/PageHeader';

const PLAYER_NAME = import.meta.env.VITE_PLAYER_NAME || 'Karaokify';
const PLAYER_COUNTDOWN_SECONDS = 5;

export default function SpotifyPlayPage() {
  const { trackId } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [track, setTrack] = useState<Track | null>(null);
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [showLyrics, setShowLyrics] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showEndOverlay, setShowEndOverlay] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [deviceError, setDeviceError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [player, setPlayer] = useState<any>(null);
  const [playerReady, setPlayerReady] = useState<boolean>(false);
  const { lines, preload, clear } = useLyrics();
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Track laden
  useEffect(() => {
    (async () => {
      if (!trackId) return;
      setLoading(true);
      setError(null);
      try {
        const t = await sdk.tracks.get(trackId);
        setTrack(t);
        try {
          await preload(t);
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) {
          /* ignore */
        }
      } catch (e: any) {
        setError(String(e?.message || e));
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      clear();
    };
  }, [trackId]);

  // Use shared initializer so the player appears both on direct load and when navigating
  useEffect(() => {
    initPlayer({
      PLAYER_NAME,
      setPlayer,
      setPlayerReady,
      setDeviceId,
      setIsPaused,
      setProgress,
      setDuration,
      setShowEndOverlay,
    });
  }, []);

  // Fortschritt aktualisieren (Lyrics & Progressbar)
  useEffect(() => {
    if (!hasStarted || isPaused || showEndOverlay) return;
    const id = setInterval(async () => {
      if (player) {
        const state = await player.getCurrentState();
        if (state) {
          setProgress(state.position);
          setDuration(state.duration);
          if (state.position >= state.duration - 500) setShowEndOverlay(true);
        }
      } else {
        console.log('No player available');
      }
    }, 50);
    return () => clearInterval(id);
  }, [hasStarted, isPaused, showEndOverlay, duration, player, playerReady]);

  // Countdown-Logik
  useEffect(() => {
    if (!showCountdown) return;
    setCountdown(PLAYER_COUNTDOWN_SECONDS);
    const id = window.setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(id);
          setShowCountdown(false);
          setShowLyrics(true);
          setIsPaused(false);
          setHasStarted(true);
          // Play auf dem eigenen Player
          if (player && track?.uri && deviceId) {
            sdk.player.startResumePlayback(deviceId, undefined, [track.uri], undefined, 0);
          }
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [showCountdown, track, deviceId]);

  // Pause Overlay
  const handlePause = async () => {
    setIsPaused(true);
    if (player) await player.pause();
  };

  const handleUnPause = async () => {
    setIsPaused(false);
    if (player) await player.resume();
  };

  // Wiederholen/Navigation handlers for end overlay
  const handleRepeat = async () => {
    try {
      // Try to seek to 0 and resume on the SDK player
      if (player) {
        await player.seek(0);
        await player.resume();
      } else if (deviceId && track?.uri) {
        await sdk.player.startResumePlayback(deviceId, undefined, [track.uri], undefined, 0);
      }
      setProgress(0);
      setIsPaused(false);
      setShowEndOverlay(false);
      setHasStarted(true);
    } catch (e) {
      console.error('Failed to repeat track', e);
    }
  };

  const handleGoToPlaylistOverview = () => {
    setShowEndOverlay(false);
    // navigate to spotify playlists overview
    navigate('/playlists');
  };

  // Seek Controls
  const handleSeek = async (delta: number) => {
    const newPos = Math.max(0, progress + delta);
    if (player) {
      await player.seek(newPos);
      // Nach dem Seek sofort den aktuellen State abfragen und Progress aktualisieren
      const state = await player.getCurrentState();
      if (state) {
        setProgress(state.position);
        setDuration(state.duration);
      }
    }
  };

  // UI
  return (
    <section aria-labelledby="play-head" className="d-flex flex-column vh-100">
      <PageHeader
        title={track ? track.name : ''}
        subtitle={track ? track.artists?.map((a) => a.name).join(', ') : ''}
        buttons={null}
      >
        {track && (
          <div className="mt-2">
            <img
              src={track.album.images?.[1]?.url || track.album.images?.[0]?.url}
              alt={track.name}
              style={{ width: 160, height: 160, objectFit: 'cover', borderRadius: 24 }}
            />
          </div>
        )}
      </PageHeader>
      <div className="container-fluid flex-grow-1 overflow-hidden">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-6 d-flex flex-column">
            {loading ? (
              <div className="small">
                {t('loadingTrack')} <Spinner animation="border" size="sm" />
              </div>
            ) : error ? (
              <div className="small text-danger">{t('failedToLoadTrack', { error })}</div>
            ) : (
              track && (
                <>
                  {!hasStarted && (
                    <div className="d-flex flex-column align-items-center mt-4">
                      <Button size="lg" variant="success" onClick={() => setShowCountdown(true)}>
                        {t('play')}
                      </Button>
                    </div>
                  )}
                  {deviceError && (
                    <div
                      className="end-overlay"
                      style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        background: 'rgba(0,0,0,0.85)',
                        zIndex: 2000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                      }}
                    >
                      <div className="text-white fs-1 mb-4">
                        {t('deviceError')}: {deviceError}
                      </div>
                      <Button size="lg" variant="primary" onClick={() => setDeviceError(null)}>
                        {t('close')}
                      </Button>
                    </div>
                  )}
                  {showCountdown && (
                    <div
                      className="countdown-overlay"
                      style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        background: 'rgba(0,0,0,0.85)',
                        zIndex: 1500,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <div
                        className="countdown-number"
                        style={{
                          color: '#fff',
                          fontSize: '8rem',
                          fontWeight: 700,
                          textShadow: '0 4px 32px #000',
                          letterSpacing: '0.1em',
                        }}
                      >
                        {countdown}
                      </div>
                    </div>
                  )}
                  {showLyrics && (
                    <div className="mt-4">
                      <LyricRenderer
                        lines={lines}
                        currentPositionMs={progress}
                        offsetMs={200}
                        initialProgressMs={0}
                      />
                    </div>
                  )}
                  {/* End overlay modal: ask to go back to playlists or repeat song */}
                  <Modal show={showEndOverlay} centered onHide={() => setShowEndOverlay(false)}>
                    <Modal.Header closeButton>
                      <Modal.Title>{t('endOverlay.title')}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>{t('endOverlay.body')}</Modal.Body>
                    <Modal.Footer>
                      <Button variant="secondary" onClick={handleGoToPlaylistOverview}>
                        {t('endOverlay.goToPlaylists')}
                      </Button>
                      <Button variant="primary" onClick={handleRepeat}>
                        {t('endOverlay.repeatSong')}
                      </Button>
                    </Modal.Footer>
                  </Modal>
                </>
              )
            )}
          </div>
        </div>
      </div>
      {track && showLyrics && (
        <footer className="py-2 fixed-bottom border-top">
          <div className="container">
            <ProgressBar now={progress} max={track.duration_ms} className="mb-2" />
            <div className="d-flex justify-content-between small">
              <span>
                {Math.floor(progress / 1000)} {t('seconds')}
              </span>
              <span>
                {Math.floor(track.duration_ms / 1000)} {t('seconds')}
              </span>
            </div>
            <div className="mt-2 d-flex justify-content-center gap-4">
              <Button variant="primary" size="sm" onClick={() => handleSeek(-10000)}>
                <FaBackward />
              </Button>
              {!isPaused && (
                <Button variant="primary" size="sm" onClick={handlePause}>
                  <FaPauseCircle />
                </Button>
              )}
              {isPaused && (
                <Button variant="primary" size="sm" onClick={handleUnPause}>
                  <FaPlay />
                </Button>
              )}
              <Button variant="primary" size="sm" onClick={() => handleSeek(10000)}>
                <FaForward />
              </Button>
            </div>
          </div>
        </footer>
      )}
    </section>
  );
}
