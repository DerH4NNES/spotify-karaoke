// Service für das Laden und Speichern von Playlists im localStorage

export type Playlist = {
  id: string;
  name: string;
  tracks?: any[];
  // weitere Felder nach Bedarf
};

const STORAGE_KEY = 'playlists';

export function loadPlaylists(): Playlist[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    /* empty */
  }
  return [];
}

export function savePlaylists(playlists: Playlist[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(playlists));
}

export function addPlaylist(name: string): Playlist {
  const playlists = loadPlaylists();
  const newPlaylist: Playlist = {
    id: crypto.randomUUID(),
    name,
    // weitere Felder nach Bedarf
  };
  playlists.push(newPlaylist);
  savePlaylists(playlists);
  return newPlaylist;
}

export function addTrackToPlaylist(playlistId: string, track: any): boolean {
  const playlists = loadPlaylists();
  const idx = playlists.findIndex((pl) => pl.id === playlistId);
  if (idx === -1) return false;
  const playlist = playlists[idx];
  if (!playlist.tracks) playlist.tracks = [];
  if (playlist.tracks.some((t) => t.id === track.id)) return false; // Track schon vorhanden
  playlist.tracks.push(track);
  savePlaylists(playlists);
  return true;
}
