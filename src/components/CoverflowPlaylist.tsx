import React from 'react';
import CoverflowBase from './CoverflowBase';
// use centralized component SCSS
import '../scss/components/Coverflow.scss';

type Playlist = {
  id: string;
  name: string;
  images?: { url: string }[];
  tracks?: { total?: number };
  owner?: { display_name?: string };
};

type Props = {
  playlists: Playlist[];
  openAndLoadTracks: (pl: Playlist) => void;
  loop?: boolean;
};

export default function CoverflowFive({ playlists, openAndLoadTracks, loop = true }: Props) {
  return (
    <CoverflowBase
      items={playlists}
      loop={loop}
      ariaLabel="Playlists"
      renderItem={(pl, idx, { isCenter }) => (
        <div className="card playlist-card">
          <img
            alt={pl.name}
            className="card-img-top"
            src={pl.images?.[0]?.url || '/favicon.ico'}
            style={{ height: isCenter ? 240 : 180, objectFit: 'cover' }}
            loading="lazy"
          />
          <div className="card-body p-2">
            <div className="fw-bold text-truncate">{pl.name}</div>
            <div className="small text-muted text-truncate">
              {pl.tracks?.total ?? '—'} tracks • {pl.owner?.display_name ?? 'Lokal'}
            </div>
          </div>
        </div>
      )}
      onActivateCenter={openAndLoadTracks}
      visibleRange={2}
      animationMs={230}
    />
  );
}
