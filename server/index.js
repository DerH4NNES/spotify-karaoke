// Simple token exchange proxy for Spotify PKCE flow
// Usage: set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in env (or use dotenv)

const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '.env') })
const express = require('express')
const app = express()
const port = process.env.PORT || 5174
const allowedOrigin = process.env.ALLOWED_ORIGIN || 'http://localhost:5173'

console.log('Token proxy starting. env file:', path.join(__dirname, '.env'), 'SPOTIFY_CLIENT_SECRET set?', !!process.env.SPOTIFY_CLIENT_SECRET)

app.use(express.json())
app.use((req,res,next)=>{
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin)
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  if(req.method === 'OPTIONS') return res.sendStatus(200)
  next()
})

app.post('/', async (req,res)=>{
  // exchange code for tokens
  const { code, code_verifier, redirect_uri, client_id } = req.body
  console.log('Exchange request received - hasCode:', !!code, 'hasVerifier:', !!code_verifier, 'client_id:', client_id)
  const client_secret = process.env.SPOTIFY_CLIENT_SECRET
  if(!client_secret) return res.status(500).json({ error: 'server_missing_secret' })
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri,
    code_verifier
  })
  const authHeader = 'Basic ' + Buffer.from(`${client_id}:${client_secret}`).toString('base64')
  try{
    const r = await fetch('https://accounts.spotify.com/api/token', { method: 'POST', headers: {'Content-Type':'application/x-www-form-urlencoded', 'Authorization': authHeader}, body: params.toString() })
    const data = await r.json()
    if(!r.ok){
      console.error('Spotify token endpoint error', { status: r.status, body: data })
      return res.status(r.status).json(data)
    }
    return res.json(data)
  }catch(e){
    console.error(e)
    res.status(500).json({ error: 'exchange_failed' })
  }
})

app.post('/refresh', async (req,res)=>{
  const { refresh_token, client_id } = req.body
  const client_secret = process.env.SPOTIFY_CLIENT_SECRET
  if(!client_secret) return res.status(500).json({ error: 'server_missing_secret' })
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token
  })
  const authHeader = 'Basic ' + Buffer.from(`${client_id}:${client_secret}`).toString('base64')
  try{
    const r = await fetch('https://accounts.spotify.com/api/token', { method: 'POST', headers: {'Content-Type':'application/x-www-form-urlencoded', 'Authorization': authHeader}, body: params.toString() })
    const data = await r.json()
    if(!r.ok){
      console.error('Spotify refresh endpoint error', { status: r.status, body: data })
      return res.status(r.status).json(data)
    }
    return res.json(data)
  }catch(e){
    console.error(e)
    res.status(500).json({ error: 'refresh_failed' })
  }
})

app.listen(port, ()=>{
  console.log(`Token proxy listening on http://localhost:${port} (allowing origin ${allowedOrigin})`)
})
