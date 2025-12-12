import React from 'react';
import { Button } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import Coverflow from './coverflow/Coverflow';
import { GiLoveSong } from 'react-icons/gi';

type Track = {
  id: string;
  name: string;
  album?: { images?: { url: string }[] };
  artists?: { name: string }[];
};

export default function CoverflowTracks({
  tracks,
  onSelectTrack,
  closeModal,
  playlistId: _playlistId,
  onDeleteTrack: _onDeleteTrack,
  onItemContextMenu,
  onRequestDelete,
  loop = true,
}: {
  tracks: Track[];
  // onSelectTrack is called when the user activates a track (for navigation/play handling)
  onSelectTrack: (t: Track) => void;
  closeModal: () => void;
  playlistId?: string;
  onDeleteTrack?: (trackId: string) => void;
  onItemContextMenu?: (e: React.MouseEvent, item: any) => void;
  onRequestDelete?: (track: any) => void;
  loop?: boolean;
}) {
  const { t } = useTranslation();
  const contextHandler = onItemContextMenu
    ? onItemContextMenu
    : onRequestDelete
      ? (e: React.MouseEvent, item: any) => {
          e.preventDefault();
          onRequestDelete(item);
        }
      : undefined;
  return (
    <Coverflow
      items={tracks as any}
      loop={loop}
      ariaLabel={t('tracks')}
      visibleRange={2}
      animationMs={230}
      onItemContextMenu={contextHandler}
      renderItem={(tRaw: any, idx, { isCenter }) => {
        const trackItem = tRaw as Track;
        return (
          <div className="track-card card p-2 d-flex flex-column align-items-center">
            {(() => {
              const imgUrl = trackItem.album?.images?.[1]?.url || trackItem.album?.images?.[0]?.url;
              if (imgUrl) {
                return (
                  <img
                    src={imgUrl}
                    alt={trackItem.name}
                    style={{
                      width: isCenter ? 180 : 120,
                      height: isCenter ? 180 : 120,
                      objectFit: 'cover',
                      borderRadius: 12,
                      display: 'block',
                    }}
                  />
                );
              }
              return (
                <div
                  style={{
                    width: isCenter ? 180 : 120,
                    height: isCenter ? 180 : 120,
                    position: 'relative',
                    borderRadius: 12,
                    overflow: 'hidden',
                    backgroundColor: '#333',
                  }}
                >
                  <GiLoveSong
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '140%',
                      height: '140%',
                      opacity: 0.06,
                      color: 'white',
                    }}
                    aria-hidden
                  />
                </div>
              );
            })()}
            <div className="mt-2 text-center">
              <div className="fw-bold text-truncate" style={{ maxWidth: 180 }}>
                {trackItem.name}
              </div>
              <div className="small text-muted text-truncate" style={{ maxWidth: 180 }}>
                {(trackItem.artists || []).map((a) => a.name).join(', ')}
              </div>
            </div>
            {isCenter && (
              <div className="mt-2">
                <Button
                  variant="primary"
                  onClick={() => {
                    // notify parent to navigate to track url /<provider>/<playlist>/<track>/play
                    onSelectTrack(trackItem);
                    closeModal();
                  }}
                >
                  ▶ {t('play')}
                </Button>
              </div>
            )}
          </div>
        );
      }}
    />
  );
}
