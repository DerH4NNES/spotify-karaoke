export async function fetchLrc(q:{track:string;artist:string;duration?:number}): Promise<string|null>{
  const key = `lrclib::${q.artist}::${q.track}::${q.duration||0}`
  const cached = localStorage.getItem(key)
  if(cached) return cached
  const params = new URLSearchParams({ track_name: q.track, artist_name: q.artist })
  if(q.duration) params.set('duration', String(Math.round(q.duration/1000)))
  const url = `https://lrclib.net/api/get?${params.toString()}`
  try{
    const res = await fetch(url)
    if(res.status === 404) return null
    if(!res.ok) return null
    const data = await res.json().catch(()=>null)
    if(!data) return null
    // lrclib response might have syncedLyrics or plainLyrics
    const text = data.syncedLyrics || data.plainLyrics || data.lyrics || null
    if(text){ localStorage.setItem(key, text); return text }
    return null
  }catch(e){ console.warn('lrclib fetch failed', e); return null }
}

