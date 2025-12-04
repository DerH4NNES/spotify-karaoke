import { SpotifyApi } from '@spotify/web-api-ts-sdk';

export const sdk = SpotifyApi.withUserAuthorization(
  import.meta.env.VITE_SPOTIFY_CLIENT_ID!,
  import.meta.env.VITE_REDIRECT_URI!,
  [
    'streaming',
    'user-read-email',
    'user-read-private',
    'playlist-read-private',
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
  ]
);
