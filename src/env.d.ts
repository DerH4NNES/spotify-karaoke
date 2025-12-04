/// <reference types="vite/client" />

declare interface ImportMetaEnv {
  readonly VITE_SPOTIFY_CLIENT_ID?: string;
  readonly VITE_REDIRECT_URI?: string;
  readonly VITE_TOKEN_EXCHANGE_URL?: string;
  // add other env keys here as needed
}
