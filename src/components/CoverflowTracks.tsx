import React from 'react';
import { Button } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import CoverflowBase from './CoverflowBase';

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
  loop = true,
}: {
  tracks: Track[];
  // onSelectTrack is called when the user activates a track (for navigation/play handling)
  onSelectTrack: (t: Track) => void;
  closeModal: () => void;
  loop?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <CoverflowBase
      items={tracks as any}
      loop={loop}
      ariaLabel={t('tracks')}
      renderItem={(tRaw: any, idx, { isCenter }) => {
        const trackItem = tRaw as Track;
        return (
          <div className="track-card card p-2 d-flex flex-column align-items-center">
            <img
              src={trackItem.album?.images?.[1]?.url || trackItem.album?.images?.[0]?.url}
              alt={trackItem.name}
              style={{
                width: isCenter ? 180 : 120,
                height: isCenter ? 180 : 120,
                objectFit: 'cover',
                borderRadius: 12,
              }}
            />
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
      // do NOT pass onActivateCenter to avoid auto-playing on Enter/Click center
      visibleRange={2}
      animationMs={230}
    />
  );
}
