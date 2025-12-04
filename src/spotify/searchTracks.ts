import { sdk } from './api';

export async function searchTracks(query: string) {
  if (!query.trim()) return [];
  const result = await sdk.search(query, ['track']);
  return result.tracks?.items?.slice(0, 10) || [];
}
