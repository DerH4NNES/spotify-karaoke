import { sdk } from './api';

export type InitPlayerParams = {
  PLAYER_NAME: string;
  setPlayer: (p: any) => void;
  setPlayerReady: (v: boolean) => void;
  setDeviceId: (id: string | null) => void;
  setIsPaused: (v: boolean) => void;
  setProgress: (pos: number) => void;
  setDuration: (d: number) => void;
  setShowEndOverlay: (v: boolean) => void;
};

export function initPlayer(params: InitPlayerParams) {
  const {
    PLAYER_NAME,
    setPlayer,
    setPlayerReady,
    setDeviceId,
    setIsPaused,
    setProgress,
    setDuration,
    setShowEndOverlay,
  } = params;

  // @ts-ignore
  if (!window.Spotify?.Player) {
    (window as any).onSpotifyWebPlaybackSDKReady = () => {
      _init();
    };
  } else {
    _init();
  }

  function _init() {
    sdk
      .getAccessToken()
      .then((spotifyToken) => {
        // build options as `any` to avoid TS/linters complaining about SDK typings
        const opts: any = {
          name: PLAYER_NAME,
          getOAuthToken: (cb: (token: string) => any) => cb(spotifyToken?.access_token!),
        };
        // @ts-ignore
        const player = new (window as any).Spotify.Player(opts);

        setPlayer(player);

        player.addListener('ready', ({ device_id }: { device_id: string }) => {
          console.log('Ready with Device ID', device_id);
          setPlayerReady(true);
          setDeviceId(device_id);
        });

        player.addListener('not_ready', ({ device_id }: { device_id: string }) => {
          console.log('Device ID has gone offline', device_id);
        });

        player.addListener('player_state_changed', (state: any) => {
          if (!state) return;
          setIsPaused(state.paused);
          setProgress(state.position);
          setDuration(state.duration);
          if (state.position >= state.duration - 500) setShowEndOverlay(true);
        });

        player.connect();
      })
      .catch((e) => {
        console.error('Failed to get access token for Spotify SDK', e);
      });
  }
}
