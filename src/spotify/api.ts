import { getAccessToken } from '../auth/spotifyAuth'

async function call(path:string, opts:RequestInit={}){
  const token = await getAccessToken()
  const res = await fetch('https://api.spotify.com/v1'+path, {
    ...opts,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(opts.headers || {})
    }
  })
  if(res.status === 204) return null
  const text = await res.text().catch(()=>null)
  let data: any = null
  try{ data = text ? JSON.parse(text) : null }catch(e){ data = text }
  if(!res.ok){
    // include body in error for easier debugging (will show JSON or text)
    const body = data || text || ''
    console.error('Spotify API error', { path, status: res.status, body })
    throw new Error(`Spotify API error: ${res.status} ${JSON.stringify(body)}`)
  }
  return data
}

function extractOpenSpotifyUri(url:string){
  try{
    const u = new URL(url)
    if(u.hostname.includes('open.spotify.com')){
      const parts = u.pathname.split('/').filter(Boolean)
      // Skip possible locale segment like 'intl-de' or 'de' etc.
      if(parts.length > 0 && (parts[0].startsWith('intl-') || /^[a-z]{2}(?:-[a-z]{2})?$/.test(parts[0]))){
        parts.shift()
      }
      if(parts.length >= 2){
        const type = parts[0]
        const id = parts[1].split('?')[0]
        return `spotify:${type}:${id}`
      }
    }
  }catch(e){ /* not a url */ }
  return null
}

export async function play({uri, deviceId}:{uri?:string, deviceId?:string|null} = {}){
  const qs = deviceId? `?device_id=${encodeURIComponent(deviceId)}` : ''
  const normalized = uri?.trim() || ''

  // If no uri provided, resume playback with empty body
  if(!normalized){
    return call(`/me/player/play${qs}`, { method: 'PUT', body: JSON.stringify({}) })
  }

  // convert open.spotify.com links to spotify: URIs
  let norm = normalized
  if(norm.startsWith('http')){
    const converted = extractOpenSpotifyUri(norm)
    if(converted) norm = converted
  }

  let bodyObj: any = {}
  // If a track/episode URI use uris array, otherwise try context_uri (playlist/album/artist)
  if(norm.startsWith('spotify:track:') || norm.startsWith('spotify:episode:')){
    bodyObj = { uris: [norm] }
  }else if(norm.startsWith('spotify:')){
    // album, playlist, artist etc.
    bodyObj = { context_uri: norm }
  }else{
    // fallback: try as a track URI
    bodyObj = { uris: [norm] }
  }
  return call(`/me/player/play${qs}`, { method: 'PUT', body: JSON.stringify(bodyObj) })
}

export async function pause(){ return call('/me/player/pause', { method: 'PUT' }) }
export async function seek(positionMs:number){ return call(`/me/player/seek?position_ms=${Math.floor(positionMs)}`, { method: 'PUT' }) }
export async function getCurrentlyPlaying(){ return call('/me/player/currently-playing') }
export async function getMe(){ return call('/me') }
export async function getDevices(){ return call('/me/player/devices') }
export async function transferPlayback(deviceId:string, play:boolean = false){
  return call('/me/player', { method: 'PUT', body: JSON.stringify({ device_ids: [deviceId], play }) })
}

export async function setRepeat(state: 'off'|'context'|'track', deviceId?: string){
  // state must be one of 'off'|'context'|'track'
  const qs = deviceId ? `?state=${encodeURIComponent(state)}&device_id=${encodeURIComponent(deviceId)}` : `?state=${encodeURIComponent(state)}`
  return call(`/me/player/repeat${qs}`, { method: 'PUT' })
}

export async function setShuffle(state: boolean, deviceId?: string){
  const qs = deviceId ? `?state=${state}&device_id=${encodeURIComponent(deviceId)}` : `?state=${state}`
  return call(`/me/player/shuffle${qs}`, { method: 'PUT' })
}

export async function getMyPlaylists(limit = 50, offset = 0){
  return call(`/me/playlists?limit=${limit}&offset=${offset}`)
}

export async function getPlaylistTracks(playlistId: string, limit = 100, offset = 0){
  return call(`/playlists/${encodeURIComponent(playlistId)}/tracks?limit=${limit}&offset=${offset}`)
}
