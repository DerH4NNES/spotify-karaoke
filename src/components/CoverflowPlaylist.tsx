import React from 'react';
import Coverflow from './coverflow/Coverflow';
// use centralized component SCSS
import '../scss/components/Coverflow.scss';
import { GiLoveSong } from 'react-icons/gi';

type Playlist = {
  id: string;
  name: string;
  images?: { url: string }[];
  tracks?: { total?: number };
  owner?: { display_name?: string };
  cover?: string;
};

type Props = {
  playlists: Playlist[];
  openAndLoadTracks: (pl: Playlist) => void;
  onRequestDelete?: (pl: Playlist) => void; // notify parent to request deletion (show modal)
  loop?: boolean;
};

export default function CoverflowFive({
  playlists,
  openAndLoadTracks,
  onRequestDelete,
  loop = true,
}: Props) {
  return (
    <Coverflow
      items={playlists}
      loop={loop}
      ariaLabel="Playlists"
      visibleRange={2}
      animationMs={230}
      onItemContextMenu={(e, item) => {
        e.preventDefault();
        const pl = item as Playlist;
        if (onRequestDelete) onRequestDelete(pl);
      }}
      renderItem={(pl, idx, { isCenter }) => (
        <div className="card playlist-card">
          <div
            className="card-img-top"
            style={{
              height: isCenter ? 240 : 180,
              position: 'relative',
              overflow: 'hidden',
              display: 'block',
              backgroundColor: '#333',
            }}
          >
            {pl.images?.[0]?.url || pl?.cover ? (
              <img
                alt={pl.name}
                src={pl.images?.[0]?.url || pl?.cover || '/favicon.ico'}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                loading="lazy"
              />
            ) : (
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
            )}
          </div>

          <div className="card-body p-2">
            <div className="fw-bold text-truncate">{pl.name}</div>
            <div className="small text-muted text-truncate">
              {pl.tracks?.total ?? '—'} tracks • {pl.owner?.display_name ?? 'Lokal'}
            </div>
          </div>
        </div>
      )}
      onActivateCenter={openAndLoadTracks}
    />
  );
}
