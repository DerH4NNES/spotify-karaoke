import { useEffect, useState } from 'react';
import { sdk } from './api';

export const useSpotifyAccessToken = () => {
  const [spotifyToken, setSpotifyToken] = useState<any>(null);

  useEffect(() => {
    if (!spotifyToken) {
      sdk.getAccessToken().then((token) => setSpotifyToken(token));
    }
  }, []);
  return spotifyToken;
};
