karaoke-spotify
================

A small Vite + React + TypeScript karaoke helper that uses the Spotify Web Playback SDK and Spotify Web API to render synchronized lyrics (LRC) and control playback on your devices.

This README explains how to set up the token-exchange proxy, run the dev environment, and common troubleshooting tips.

Features
- Browse and start playback via the Spotify Web Playback SDK (requires a Spotify Premium account).
- Render synchronized lyrics (LRC) with an adjustable offset.
- Device chooser to transfer playback to a device without auto-starting playback.
- Right-side playback controls (Play/Pause toggle, seek +/-5s) which are only visible when a track is loaded.
- Keyboard shortcuts for quick control.

Requirements
- Node.js (LTS recommended)
- A Spotify Developer application (Client ID) and a Spotify account with Premium

Important: Spotify SDK and the Web API require a token exchange. This repository contains a small server-side token proxy (server/index.js) that requires a Spotify Client Secret to exchange PKCE codes.

Quick start (development)

1. Install dependencies

```bash
npm install
```

2. Configure the token proxy

Create a file at `server/.env` (not committed) with at least the Spotify client secret:

```
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
# optional:
ALLOWED_ORIGIN=http://localhost:5173
PORT=5174
```

- `ALLOWED_ORIGIN` should match the origin your Vite dev server runs on (default: `http://localhost:5173`).
- `PORT` is the port the token proxy listens on (default 5174). The token proxy exposes two endpoints used by the frontend: `POST /` for code exchange and `POST /refresh` to refresh tokens.

3. Configure your Spotify Developer application

- In the Spotify developer dashboard, create or open an app.
- Add a redirect URI matching your local app, for example: `http://localhost:5173` (or `http://localhost:5173/callback` depending on your auth implementation). Make sure the redirect in the app matches what the frontend expects.
- Copy your Client ID (you will need it for the frontend).

4. Start the token proxy server

```bash
npm run server
```

This runs `server/index.js`. It reads `server/.env` (via dotenv). The server will log the listening port and allowed origin.

5. Start the frontend dev server

```bash
npm run dev
```

Open the URL shown by Vite (default: `http://localhost:5173`).

Authentication notes
- The frontend uses a PKCE + server-side token exchange flow. The server expects a Spotify client secret to exchange authorization codes.
- If you need to change how the frontend finds the token proxy URL or the client id, check the auth helper in `src/auth/spotifyAuth`.

Usage notes
- Device selection: the device chooser shows available devices. Selecting a device will transfer playback without auto-starting it (the server calls the Spotify transfer API with play=false).
- If the device shown is already the current device, clicking it once more will now still confirm the selection and continue the play flow (this behavior was adjusted in `src/components/DeviceSelector.tsx`).
- Play/Pause and seek buttons (+5s/-5s) are only visible when a track is loaded (to avoid confusing controls when nothing is playing).

Keyboard shortcuts
- Space: toggle play/pause
- f: toggle fullscreen
- ArrowLeft / ArrowRight: seek -5s / +5s
- ArrowUp / ArrowDown: adjust lyric offset (+100 / -100 ms)

Build / Preview

```bash
npm run build
npm run preview
```

Run tests

```bash
npm test
```

Troubleshooting
- "Not authenticated" / auth errors:
  - Make sure your Client ID (frontend) and Client Secret (server) are configured correctly.
  - Ensure the redirect URI configured in Spotify Dashboard exactly matches the URI used by the app.
  - Check the dev server console and the token proxy console for errors when exchanging codes.

- Device transfer fails:
  - The transfer call intentionally uses `play=false` to avoid automatically resuming playback on the target device. If you want to auto-start, change the call in `src/spotify/api.ts` or `src/components/DeviceSelector.tsx`.
  - If you get authorization errors, check that the token exchange succeeded and that scopes provided include playback control scopes (e.g., `user-modify-playback-state`, `user-read-playback-state`, `user-read-currently-playing`).

- No devices found:
  - Ensure a Spotify client is active (Spotify desktop or mobile app logged in and active under the same account). The Web Playback SDK will only show devices that are available to your account.

Development notes / pointers
- Frontend entry: `src/main.tsx`, primary UI: `src/App.tsx`.
- Player integration: `src/spotify/player` and `src/spotify/api.ts`.
- Lyrics: `src/lyrics/*` contains parsing and fetching helpers.
- Device chooser: `src/components/DeviceSelector.tsx` (clicking the already-current device now confirms selection rather than silently returning).

If you want further changes (for example: auto-start on transfer, different default redirect URI, or adding a tiny smoke test), tell me which behavior you'd prefer and I can implement it.

License
- MIT-style permissive use (adapt as you like).
