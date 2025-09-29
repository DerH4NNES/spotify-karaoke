// PKCE OAuth helpers and token management

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID as string
const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI as string || window.location.origin + '/callback'
const TOKEN_PROXY = import.meta.env.VITE_TOKEN_EXCHANGE_URL as string || ''

const STORAGE_KEY = 'spotify:session'

type TokenRecord = {
  access_token: string
  refresh_token?: string
  expires_at: number
}

function base64UrlEncode(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
  const b64 = btoa(binary)
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export async function generateCodeVerifier(){
  const array = new Uint8Array(64)
  crypto.getRandomValues(array)
  // base64url encode random bytes
  let binary = ''
  for (let i = 0; i < array.byteLength; i++) binary += String.fromCharCode(array[i])
  const b64 = btoa(binary)
  return b64.replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')
}

export async function generateCodeChallenge(verifier:string){
  const enc = new TextEncoder().encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', enc)
  return base64UrlEncode(digest)
}

export async function authorize(){
  const verifier = await generateCodeVerifier()
  const challenge = await generateCodeChallenge(verifier)
  sessionStorage.setItem('pkce_verifier', verifier)
  const scope = encodeURIComponent(['streaming','user-read-email','user-read-private','playlist-read-private','user-read-playback-state','user-modify-playback-state','user-read-currently-playing'].join(' '))
  const url = `https://accounts.spotify.com/authorize?response_type=code&client_id=${encodeURIComponent(CLIENT_ID)}&scope=${scope}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&code_challenge_method=S256&code_challenge=${encodeURIComponent(challenge)}`
  window.location.href = url
}

async function exchangeViaProxy(code:string, verifier:string){
  const url = TOKEN_PROXY
  const res = await fetch(url, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ code, code_verifier: verifier, redirect_uri: REDIRECT_URI, client_id: CLIENT_ID })})
  if(!res.ok) throw new Error('proxy exchange failed: '+res.status)
  return res.json()
}

async function refreshViaProxy(refresh_token:string){
  const url = TOKEN_PROXY + '/refresh'
  const res = await fetch(url, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ refresh_token, client_id: CLIENT_ID })})
  if(!res.ok) throw new Error('proxy refresh failed')
  return res.json()
}

export async function exchangeCodeForToken(code:string){
  const verifier = sessionStorage.getItem('pkce_verifier') || ''
  let data: any
  if(TOKEN_PROXY){
    data = await exchangeViaProxy(code, verifier)
  }else{
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      client_id: CLIENT_ID,
      code_verifier: verifier
    })
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString()
    })
    if(!res.ok) throw new Error('token exchange failed: '+res.status)
    data = await res.json()
  }

  const rec: TokenRecord = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + (data.expires_in * 1000) - 5000
  }
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(rec))
  return rec
}

export async function refreshToken(){
  const stored = sessionStorage.getItem(STORAGE_KEY)
  if(!stored) throw new Error('no tokens')
  const rec = JSON.parse(stored) as TokenRecord
  if(!rec.refresh_token) throw new Error('no refresh token')
  let data: any
  if(TOKEN_PROXY){
    data = await refreshViaProxy(rec.refresh_token)
  }else{
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: rec.refresh_token,
      client_id: CLIENT_ID
    })
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST', headers: {'Content-Type':'application/x-www-form-urlencoded'}, body: body.toString()
    })
    if(!res.ok) throw new Error('refresh failed')
    data = await res.json()
  }
  const updated: TokenRecord = {
    access_token: data.access_token,
    refresh_token: data.refresh_token || rec.refresh_token,
    expires_at: Date.now() + (data.expires_in * 1000) - 5000
  }
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  return updated
}

export async function getAccessToken(){
  const stored = sessionStorage.getItem(STORAGE_KEY)
  if(!stored) throw new Error('not_authenticated')
  const rec = JSON.parse(stored) as TokenRecord
  if(Date.now() > rec.expires_at){
    const updated = await refreshToken()
    return updated.access_token
  }
  return rec.access_token
}

// ensureToken: return true if token available (and refreshed if expired), false otherwise
export async function ensureToken(): Promise<boolean>{
  const stored = sessionStorage.getItem(STORAGE_KEY)
  if(!stored) return false
  const rec = JSON.parse(stored) as TokenRecord
  if(Date.now() > rec.expires_at){
    try{ await refreshToken() }catch(e){ return false }
  }
  return true
}

export function logout(){ sessionStorage.removeItem(STORAGE_KEY) }
