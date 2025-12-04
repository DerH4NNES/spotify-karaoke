import { useState } from 'react';
import { fetchLrc } from '../lyrics/lrclib';
import { LrcLine, parseLrc } from '../lyrics/parseLrc';

export default function useLyrics() {
  const [lines, setLines] = useState<LrcLine[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  async function preload(track?: { name?: string; artists?: any[]; duration_ms?: number }) {
    setLoading(true);
    setError(null);
    try {
      const artist = track?.artists?.[0]?.name || '';
      const title = track?.name || '';
      const duration = track?.duration_ms;
      const cached = await fetchLrc({ track: title, artist, duration });
      if (cached) {
        const parsed = parseLrc(cached);
        setLines(parsed);
      } else {
        setLines([]);
      }
    } catch (e: any) {
      setError(String(e?.message || e));
      setLines([]);
    } finally {
      setLoading(false);
    }
  }

  function clear() {
    setLines([]);
    setError(null);
    setLoading(false);
  }

  return { lines, loading, error, preload, clear };
}
